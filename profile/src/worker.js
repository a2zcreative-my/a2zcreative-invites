export default {
  async fetch(request, env) {
    // 1. CORS
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
    return new Response("Not Found", { status: 404 });
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