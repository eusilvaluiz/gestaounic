CREATE TABLE public.broker_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  external_id text NOT NULL,
  event_date text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_type, external_id)
);

ALTER TABLE public.broker_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view broker_events"
  ON public.broker_events FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_broker_events_date ON public.broker_events (event_date);