const RESEND_API_URL = 'https://api.resend.com/emails';

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    const error = new Error('Email service is not configured');
    error.status = 503;
    throw error;
  }
  return { apiKey, from };
}

async function sendEmail({ to, subject, text, html }) {
  const { apiKey, from } = getEmailConfig();
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text, html })
  });
  if (!response.ok) {
    const details = await response.text();
    const message = details.includes('domain is not verified')
      ? 'The EMAIL_FROM domain is not verified in Resend. Verify the sender domain at https://resend.com/domains, then update EMAIL_FROM.'
      : `Email provider rejected the message: ${details}`;
    const error = new Error(message);
    error.status = 502;
    throw error;
  }
  return response.json();
}

module.exports = { sendEmail };