CREATE TABLE public.broker_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker text NOT NULL UNIQUE,
  currency text NOT NULL DEFAULT 'BRL',
  usd_rate numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.broker_settings TO authenticated;
GRANT ALL ON public.broker_settings TO service_role;

ALTER TABLE public.broker_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view broker_settings"
  ON public.broker_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert broker_settings"
  ON public.broker_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update broker_settings"
  ON public.broker_settings FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER update_broker_settings_updated_at
  BEFORE UPDATE ON public.broker_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.broker_settings (broker, currency, usd_rate) VALUES
  ('unic', 'BRL', 1),
  ('3x', 'USD', 5.20);