ALTER TABLE public.daily_data ADD COLUMN IF NOT EXISTS manual_fields text[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.daily_data_manual_lock()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE r text := coalesce(auth.role(), current_user);
BEGIN
  IF r = 'authenticated' THEN
    IF NEW.investimento IS DISTINCT FROM OLD.investimento AND NOT ('investimento' = ANY(NEW.manual_fields)) THEN
      NEW.manual_fields := array_append(NEW.manual_fields, 'investimento');
    END IF;
    IF NEW.lead_telegram IS DISTINCT FROM OLD.lead_telegram AND NOT ('lead_telegram' = ANY(NEW.manual_fields)) THEN
      NEW.manual_fields := array_append(NEW.manual_fields, 'lead_telegram');
    END IF;
  ELSE
    IF 'investimento' = ANY(OLD.manual_fields) THEN NEW.investimento := OLD.investimento; END IF;
    IF 'lead_telegram' = ANY(OLD.manual_fields) THEN NEW.lead_telegram := OLD.lead_telegram; END IF;
    NEW.manual_fields := OLD.manual_fields;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_daily_data_manual_lock ON public.daily_data;
CREATE TRIGGER trg_daily_data_manual_lock BEFORE UPDATE ON public.daily_data
FOR EACH ROW EXECUTE FUNCTION public.daily_data_manual_lock();