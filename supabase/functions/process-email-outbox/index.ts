const RESEND_API_URL = 'https://api.resend.com/emails';
const MAX_ATTEMPTS = 5;

type EmailEvent = {
  id: number;
  recipient: string;
  event_type: string;
  payload: Record<string, unknown>;
  attempts: number;
};

const config = {
  supabaseUrl: Deno.env.get('SUPABASE_URL'),
  serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  resendApiKey: Deno.env.get('RESEND_API_KEY'),
  emailFrom: Deno.env.get('EMAIL_FROM'),
  cronSecret: Deno.env.get('CRON_SECRET')
};

function assertConfig() {
  if (Object.values(config).some(value => !value)) {
    throw new Error('Email outbox function is not configured');
  }
}

function escapeHtml(value: unknown) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function messageFor(event: EmailEvent) {
  const name = String(event.payload.employeeName || 'Employee');
  const leaveType = String(event.payload.leaveType || 'leave');
  const startDate = String(event.payload.startDate || '');
  const endDate = String(event.payload.endDate || '');
  const range = startDate === endDate ? startDate : `${startDate} to ${endDate}`;
  const approved = event.event_type === 'leave_approved';
  const status = approved ? 'approved' : 'rejected';
  const text = `Hello ${name}, your ${leaveType} request for ${range} was ${status}.`;
  const html = `<!doctype html>
<html lang="en"><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#1e293b">
  <main style="max-width:560px;margin:32px auto;padding:0 16px">
    <section style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
      <header style="background:#022851;padding:24px 28px;color:#ffffff">
        <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:.8">P W Holdings</div>
        <h1 style="margin:8px 0 0;font-size:24px">${escapeHtml(approved ? 'Leave request approved' : 'Leave request rejected')}</h1>
      </header>
      <div style="padding:28px"><p>Hello ${escapeHtml(name)},</p><p>Your leave request has been <strong>${status}</strong>.</p>
        <p><strong>Leave type:</strong> ${escapeHtml(leaveType)}<br><strong>Dates:</strong> ${escapeHtml(range)}</p>
        <p style="margin-top:28px;color:#64748b;font-size:13px">Employee Management Portal</p>
      </div>
    </section>
    <p style="text-align:center;color:#64748b;font-size:12px">This is an automated message. Please do not reply.</p>
  </main>
</body></html>`;
  return {
    subject: approved ? 'Leave request approved' : 'Leave request rejected',
    text,
    html
  };
}

async function supabaseRequest(path: string, options: RequestInit = {}) {
  return fetch(`${config.supabaseUrl}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: config.serviceRoleKey!,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
}

async function claimEvents(): Promise<EmailEvent[]> {
  const response = await supabaseRequest('/rpc/claim_email_events', {
    method: 'POST',
    body: JSON.stringify({ batch_size: 20 })
  });
  if (!response.ok) throw new Error(`Unable to claim email events: ${await response.text()}`);
  return response.json();
}

async function updateEvent(id: number, update: Record<string, unknown>) {
  const response = await supabaseRequest(`/email_events?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(update)
  });
  if (!response.ok) throw new Error(`Unable to update email event ${id}: ${await response.text()}`);
}

async function sendEvent(event: EmailEvent) {
  const message = messageFor(event);
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: config.emailFrom, to: [event.recipient], ...message })
  });
  if (!response.ok) throw new Error(`Resend rejected event ${event.id}: ${await response.text()}`);
}

Deno.serve(async request => {
  try {
    assertConfig();
    if (request.headers.get('x-cron-secret') !== config.cronSecret) {
      return new Response('Unauthorized', { status: 401 });
    }

    const events = await claimEvents();
    const results = await Promise.allSettled(events.map(async event => {
      try {
        await sendEvent(event);
        await updateEvent(event.id, { status: 'sent', sent_at: new Date().toISOString(), locked_at: null });
        return { id: event.id, status: 'sent' };
      } catch (error) {
        const attempts = event.attempts || 1;
        await updateEvent(event.id, {
          status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
          next_attempt_at: new Date(Date.now() + Math.min(60 * 60 * 1000, 2 ** attempts * 60 * 1000)).toISOString(),
          last_error: error instanceof Error ? error.message : String(error),
          locked_at: null
        });
        throw error;
      }
    }));

    return Response.json({
      processed: results.length,
      failed: results.filter(result => result.status === 'rejected').length
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Email outbox processing failed' }, { status: 500 });
  }
});
