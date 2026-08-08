create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('ggr-sync-hourly') where exists (select 1 from cron.job where jobname = 'ggr-sync-hourly');

select cron.schedule(
  'ggr-sync-hourly',
  '5 * * * *',
  $$
  select net.http_post(
    url := 'https://jrydfyhkeqhovbqbmdqf.supabase.co/functions/v1/ggr-sync',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);