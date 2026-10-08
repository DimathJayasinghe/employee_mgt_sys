-- Demo accounts for local/staging testing only.
-- Run database/schema.sql before this file.
-- Do not use these accounts in production.

insert into public.users (name, department, email, password, initials, status, role)
values
  ('Demo Employee', 'IT', 'demo.employee@pwholdings.lk', '$2b$12$nRKCvHUVF4FhGjaNOfrfFuwd56z/PXD3BLpMMkOzuryT7LlAAecu6', 'DE', 'Working', 'Employee'),
  ('Demo Employee Two', 'Finance', 'demo.employee2@pwholdings.lk', '$2b$12$Oa1wG0LI4MbdAskA5.UkieEknE3aPUWOx3KouIvsidc4cRxPN1Bde', 'D2', 'Working', 'Employee')
on conflict (email) do nothing;

insert into public.leave_balances (user_id, total_days, used_days)
select id, 24, 0
from public.users
where email in ('demo.employee@pwholdings.lk', 'demo.employee2@pwholdings.lk')
on conflict (user_id) do nothing;
