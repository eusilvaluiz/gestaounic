ALTER TABLE public.broker_settings
  ADD COLUMN IF NOT EXISTS usd_withdrawal_rate numeric NOT NULL DEFAULT 5.00;