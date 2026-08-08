ALTER TABLE public.broker_settings
  ADD COLUMN IF NOT EXISTS wallet_balance_brl numeric NOT NULL DEFAULT 0;

UPDATE public.broker_settings
SET wallet_balance_brl = 25772.05
WHERE broker = '3x';