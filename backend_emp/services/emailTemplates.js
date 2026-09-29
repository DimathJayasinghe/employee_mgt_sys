function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderEmail({ title, preheader, greeting, content }) {
  return {
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#1e293b">
    <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div>
    <main style="max-width:560px;margin:32px auto;padding:0 16px">
      <section style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <header style="background:#022851;padding:24px 28px;color:#ffffff">
          <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:.8">P W Holdings</div>
          <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25">${escapeHtml(title)}</h1>
        </header>
        <div style="padding:28px">
          <p style="margin:0 0 16px">Hello ${escapeHtml(greeting)},</p>
          ${content}
          <p style="margin:28px 0 0;color:#64748b;font-size:13px">Employee Management Portal</p>
        </div>
      </section>
      <p style="margin:16px 0;text-align:center;color:#64748b;font-size:12px">This is an automated message. Please do not reply.</p>
    </main>
  </body>
</html>`
  };
}

function otpEmail({ code, type }) {
  const title = type === 'register' ? 'Verify your account' : 'Reset your password';
  const subject = type === 'register' ? 'Verify your Employee Portal account' : 'Employee Portal password reset code';
  const content = `<p style="margin:0 0 20px">Use the verification code below. It expires in 10 minutes.</p>
    <div style="padding:18px;text-align:center;background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px">
      <strong style="font-size:32px;letter-spacing:8px;color:#022851;font-family:monospace">${escapeHtml(code)}</strong>
    </div>`;
  return {
    subject,
    text: `Your Employee Portal verification code is ${code}. It expires in 10 minutes.`,
    ...renderEmail({ title, preheader: 'Your Employee Portal verification code', greeting: 'there', content })
  };
}

function leaveDecisionEmail({ employeeName, leaveType, startDate, endDate, status }) {
  const decision = status === 'Approved' ? 'approved' : 'rejected';
  const title = `Leave request ${decision}`;
  const subject = `Leave request ${decision}`;
  const range = startDate === endDate ? startDate : `${startDate} to ${endDate}`;
  const content = `<p style="margin:0 0 18px">Your leave request has been <strong>${decision}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:8px 0;color:#64748b">Leave type</td><td style="padding:8px 0;text-align:right"><strong>${escapeHtml(leaveType)}</strong></td></tr>
      <tr><td style="padding:8px 0;color:#64748b">Dates</td><td style="padding:8px 0;text-align:right"><strong>${escapeHtml(range)}</strong></td></tr>
    </table>`;
  return {
    subject,
    text: `Hello ${employeeName}, your ${leaveType} request for ${range} was ${decision}.`,
    ...renderEmail({ title, preheader: `Your leave request was ${decision}`, greeting: employeeName, content })
  };
}

module.exports = { otpEmail, leaveDecisionEmail };
