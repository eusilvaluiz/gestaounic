-- Drop existing public policies from daily_data
DROP POLICY IF EXISTS "Allow public delete access" ON public.daily_data;
DROP POLICY IF EXISTS "Allow public insert access" ON public.daily_data;
DROP POLICY IF EXISTS "Allow public read access" ON public.daily_data;
DROP POLICY IF EXISTS "Allow public update access" ON public.daily_data;

-- Drop existing public policies from finance_data
DROP POLICY IF EXISTS "Allow public delete access" ON public.finance_data;
DROP POLICY IF EXISTS "Allow public insert access" ON public.finance_data;
DROP POLICY IF EXISTS "Allow public read access" ON public.finance_data;
DROP POLICY IF EXISTS "Allow public update access" ON public.finance_data;

-- Create new authenticated-only policies for daily_data
CREATE POLICY "Authenticated users can view daily_data" 
ON public.daily_data 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert daily_data" 
ON public.daily_data 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update daily_data" 
ON public.daily_data 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete daily_data" 
ON public.daily_data 
FOR DELETE 
TO authenticated
USING (true);

-- Create new authenticated-only policies for finance_data
CREATE POLICY "Authenticated users can view finance_data" 
ON public.finance_data 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert finance_data" 
ON public.finance_data 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update finance_data" 
ON public.finance_data 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete finance_data" 
ON public.finance_data 
FOR DELETE 
TO authenticated
USING (true);