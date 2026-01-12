-- Create daily_data table for marketing data
CREATE TABLE public.daily_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data TEXT NOT NULL,
  investimento NUMERIC NOT NULL DEFAULT 0,
  cliques INTEGER NOT NULL DEFAULT 0,
  landing_page INTEGER NOT NULL DEFAULT 0,
  lead_telegram INTEGER NOT NULL DEFAULT 0,
  saida_telegram INTEGER NOT NULL DEFAULT 0,
  cadastros INTEGER NOT NULL DEFAULT 0,
  ftd INTEGER NOT NULL DEFAULT 0,
  valor_ftd NUMERIC NOT NULL DEFAULT 0,
  depositos INTEGER NOT NULL DEFAULT 0,
  valor_depositos NUMERIC NOT NULL DEFAULT 0,
  rev10 NUMERIC NOT NULL DEFAULT 0,
  vendas INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create finance_data table for financial summary
CREATE TABLE public.finance_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investimento NUMERIC NOT NULL DEFAULT 0,
  deposito NUMERIC NOT NULL DEFAULT 0,
  taxa NUMERIC NOT NULL DEFAULT 0,
  saque NUMERIC NOT NULL DEFAULT 0,
  expert NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.daily_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_data ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for now)
CREATE POLICY "Allow public read access" ON public.daily_data FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.daily_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.daily_data FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.daily_data FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.finance_data FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.finance_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.finance_data FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.finance_data FOR DELETE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_daily_data_updated_at
BEFORE UPDATE ON public.daily_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_finance_data_updated_at
BEFORE UPDATE ON public.finance_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();