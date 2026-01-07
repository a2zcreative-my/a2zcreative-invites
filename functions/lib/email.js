/**
 * Email Helper using Resend
 * Sends transactional emails via Resend API
 */
export async function sendEmail(env, to, subject, html) {
    // Check for API key
    if (!env.RESEND_API_KEY) {
        console.warn('⚠️ RESEND_API_KEY missing. Email not sent to:', to);
        return { success: false, error: 'Configuration error: RESEND_API_KEY missing' };
    }

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: env.EMAIL_FROM || 'A2Z Creative <noreply@a2zcreative.my>',
                to,
                subject,
                html
            })
        });

        const data = await res.json();

        if (!res.ok) {
            console.error('Resend API Error:', data);
            return { success: false, error: data.message || 'Failed to send email' };
        }

        console.log(`✅ Email sent to ${to}: ${data.id}`);
        return { success: true, id: data.id };
    } catch (e) {
        console.error('Email send failed:', e);
        return { success: false, error: e.message };
    }
}
