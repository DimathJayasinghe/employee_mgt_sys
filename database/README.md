# Database initialization

The application expects these Supabase tables:

- `users`
- `leave_balances`
- `daily_work_entries`
- `leave_requests`
- `auth_otps`

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
