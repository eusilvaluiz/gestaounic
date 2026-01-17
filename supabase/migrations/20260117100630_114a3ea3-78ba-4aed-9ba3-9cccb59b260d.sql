-- Recalcula sort_order para TODAS as linhas baseado na data cronológica
-- Isso elimina duplicatas e garante sequência 1..N
WITH ordered_data AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      ORDER BY 
        CASE 
          WHEN data ~ '^\d{2}/\d{2}/\d{2}$' THEN 
            TO_DATE(data, 'DD/MM/YY')
          WHEN data ~ '^\d{2}/\d{2}/\d{4}$' THEN 
            TO_DATE(data, 'DD/MM/YYYY')
          ELSE NULL
        END ASC NULLS LAST,
        created_at ASC
    ) as new_sort_order
  FROM daily_data
)
UPDATE daily_data d
SET sort_order = o.new_sort_order
FROM ordered_data o
WHERE d.id = o.id;