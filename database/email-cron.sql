-- Configure Supabase Vault before running this file:
-- select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
-- select vault.create_secret('replace-with-a-random-secret', 'cron_secret');
-- Never commit real secret values to this file.

-- Enable these extensions first. If your project disallows this statement,
-- enable pg_cron and pg_net from Supabase Dashboard > Database > Extensions.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid)
from cron.job
where jobname = 'process-email-outbox';

select cron.schedule(
  'process-email-outbox',
  '* * * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'project_url'
    ) || '/functions/v1/process-email-outbox',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_secret'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);