# Manual Cloudflare Setup Guide

Since I cannot run commands on your computer (Node.js/Wrangler is missing), you can set this up manually using the **Cloudflare Dashboard**.

### Step 1: Create the Database (D1)
1.  Go to **Cloudflare Dashboard** -> **Workers & Pages** -> **D1 SQL Database**.
2.  Click **Create**.
3.  Name it `client-a2zcreative-profile`.
4.  Click **Create**.
5.  Once created, go to the **Console** tab of the database.
6.  Paste the following SQL and click **Execute**:
    ```sql
    CREATE TABLE clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        phone TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    ```

### Step 2: Create the Backend (Worker)
1.  Go to **Workers & Pages** -> **Overview**.
2.  Click **Create application** -> **Create Worker**.
3.  Name it `a2zcreative-worker`.
4.  Click **Deploy**.
5.  Now click **Edit code**.
6.  Delete the existing code and paste the code from `src/worker.js` (see file in your project folder).
    *   *Note: Remove the `assets` part at the bottom since we will host frontend separately.*
    *   **Or simpler**: Just use this code for the worker:
    ```javascript
    export default {
      async fetch(request, env) {
        // Handle CORS (allow your frontend to talk to this worker)
        if (request.method === "OPTIONS") {
          return new Response(null, {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          });
        }

        if (request.method === 'POST') {
          try {
            const data = await request.json();
            
            // Insert into D1
            const query = `INSERT INTO clients (name, location, phone) VALUES (?, ?, ?)`;
            await env.DB.prepare(query)
              .bind(data.name, data.location, data.phone)
              .run();

            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { 
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*" 
              }
            });

          } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
              status: 500,
              headers: { 
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*"
              }
            });
          }
        }
        
        return new Response("Not Found", { status: 404 });
      }
    };
    ```
7.  **Save and Deploy**.

### Step 3: Connect Database to Worker
1.  Go back to the Worker's **Settings** tab -> **Variables** (or **Bindings**).
2.  Add a **D1 Database Binding**.
    *   Variable name: `DB`
    *   Database: `client-a2zcreative-profile`
3.  **Deploy** (Settings changes require a re-deploy).

### Step 4: Host the Frontend
1.  Go to **Workers & Pages** -> **Overview**.
2.  Click **Create application** -> **Pages** -> **Upload assets**.
3.  Upload the `a2zcreative-profile/public` folder.
4.  Once deployed, you will get a URL (e.g., `https://a2z-profile.pages.dev`).

### Step 5: Connect Frontend to Backend
1.  Get your **Worker URL** (from Step 2, e.g., `https://a2zcreative-worker.yourname.workers.dev`).
2.  Open `a2zcreative-profile/public/script.js` on your computer.
3.  Update the `API_URL` line:
    ```javascript
    const API_URL = 'https://a2zcreative-worker.yourname.workers.dev'; 
    ```
4.  Re-upload the `public` folder to Cloudflare Pages (create a new deployment).

Now your form on the Pages site will save data to your D1 database!
