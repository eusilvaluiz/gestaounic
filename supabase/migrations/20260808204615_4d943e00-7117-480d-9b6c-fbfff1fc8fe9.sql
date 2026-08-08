ALTER TABLE public.broker_settings
  ADD COLUMN IF NOT EXISTS wallet_balance_usd numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wallet_baseline_deposits_brl numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wallet_baseline_withdrawals_brl numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wallet_baseline_ggr_brl numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wallet_baseline_at timestamptz;

UPDATE public.broker_settings s
SET wallet_balance_usd = 5154.41,
    wallet_baseline_deposits_brl = t.d,
    wallet_baseline_withdrawals_brl = t.s,
    wallet_baseline_ggr_brl = t.g,
    wallet_baseline_at = now()
FROM (SELECT COALESCE(sum(valor_depositos),0) d, COALESCE(sum(saque),0) s, COALESCE(sum(rev10),0) g FROM public.daily_data) t
WHERE s.broker = '3x';