# Database initialization

The application expects these Supabase tables:

- `users`
- `leave_balances`
- `daily_work_entries`
- `leave_requests`
- `auth_otps`
- `email_events`

Run `database/schema.sql` in the Supabase SQL Editor for the project configured by `SUPABASE_URL` in `backend_emp/.env`.

For local or staging testing, run `database/seed.sql` after the schema migration. It creates these demo employee accounts:

- `demo.employee@pwholdings.lk` / `DemoEmployee@123`
- `demo.employee2@pwholdings.lk` / `DemoEmployee2@123`

These are employee accounts, not administrator accounts, and must not be used in production.

Then verify the API locally:

```bash
npm run dev --prefix backend_emp
curl http://localhost:5000/api/health
```

The server should log `Connected to Supabase Database successfully.` after the schema exists.

The migration enables Row Level Security without public policies. The backend uses the Supabase service-role key and is the only intended database access path. Do not put the service-role or secret key in frontend environment variables.

## Email delivery

Deploy `supabase/functions/process-email-outbox` as a Supabase Edge Function. Configure these Edge Function secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, and `CRON_SECRET`.

Deploy the function with JWT verification disabled because the function uses its own `x-cron-secret` check:

```bash
supabase functions deploy process-email-outbox --no-verify-jwt
```

Schedule the function once per minute with Supabase `pg_cron` and `pg_net`. Store the project URL and cron secret in Supabase Vault; do not paste secrets directly into a committed SQL file. The function retries failed messages up to five times.
