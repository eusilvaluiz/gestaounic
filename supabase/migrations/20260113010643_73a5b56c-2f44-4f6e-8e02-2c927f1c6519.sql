UPDATE public.daily_data
SET data = 
  split_part(data, '/', 1) || '/' || 
  split_part(data, '/', 2) || '/' || 
  RIGHT(split_part(data, '/', 3), 2)
WHERE length(split_part(data, '/', 3)) = 4;