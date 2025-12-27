# Deployment Guide for A2Z Creative Profile

This guide will help you deploy your business profile and set up the database on Cloudflare.

## Prerequisites
- Node.js installed (you already have this).
- A Cloudflare account.

## Steps

### 1. Login to Cloudflare
Open your terminal in the `a2zcreative-profile` directory:
```bash
cd a2zcreative-profile
npx wrangler login
```
Follow the browser prompts to authorize.

### 2. Create the Database
Run the following command to create your D1 database:
```bash
npx wrangler d1 create client-a2zcreative-profile
```

**IMPORTANT**: 
The command output will show a `database_id` (a long UUID string). 
1. Copy this ID.
2. Open `wrangler.toml` in your editor.
3. Replace `REPLACE_WITH_YOUR_DB_ID` with the actual ID you copied.

### 3. Initialize the Database Schema
Apply the table structure from `schema.sql`:
```bash
npx wrangler d1 execute client-a2zcreative-profile --file=./schema.sql --remote
```

### 4. Deploy the Project
Deploy your worker and frontend:
```bash
npx wrangler deploy
```

### 5. Verify
The output of the deploy command will give you a URL (e.g., `https://a2zcreative-profile.<your-subdomain>.workers.dev`).
Open this URL on your phone or computer to test the form.

## Troubleshooting
- If you see "TB" (Table) errors, ensure you ran step 3 correctly.
- If assets are not loading, ensure the `[assets]` block is in `wrangler.toml` and you have the latest version of wrangler.
