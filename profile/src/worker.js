export default {
  async fetch(request, env) {
    // 1. CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // 4. Handle DATA FETCH - Protected
    // Renamed to avoid static file conflicts and moved logic up if needed.
    const url = new URL(request.url);
    if (url.pathname.includes("/fetch-clients")) {

      // Allow both GET and POST for now to be safe, but we use POST from frontend
      if (request.method === "OPTIONS") { return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } }); }

      const authHeader = request.headers.get("Authorization");

      if (!authHeader || authHeader !== `Bearer ${env.ADMIN_PASSWORD}`) {
        return new Response("Unauthorized", { status: 401 });
      }

      try {
        const result = await env.DB.prepare("SELECT * FROM clients ORDER BY created_at DESC").all();
        return new Response(JSON.stringify(result.results), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    if (request.method === 'POST') {
      try {
        const data = await request.json();

        // 2. Save to Database
        const query = `INSERT INTO clients (name, location, phone) VALUES (?, ?, ?)`;
        await env.DB.prepare(query)
          .bind(data.name, data.location, data.phone)
          .run();

        // 3. Send WhatsApp via Twilio
        await sendWhatsapp(env, data);

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }
    return new Response(`Not Found: ${request.url}`, { status: 404 });
  }
};

async function sendWhatsapp(env, data) {
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const fromNumber = env.TWILIO_FROM_NUMBER; // e.g., 'whatsapp:+14155238886'
  const toNumber = env.MY_PHONE_NUMBER;      // e.g., 'whatsapp:+60123834821'

  const messageBody = `New Lead!\nName: ${data.name}\nLocation: ${data.location}\nPhone: ${data.phone}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const formData = new URLSearchParams();
  formData.append('To', toNumber);
  formData.append('From', fromNumber);
  formData.append('Body', messageBody);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Twilio Error:", text);
    // We don't throw here to ensure the client still gets a "Success" response for the DB save.
  }
}