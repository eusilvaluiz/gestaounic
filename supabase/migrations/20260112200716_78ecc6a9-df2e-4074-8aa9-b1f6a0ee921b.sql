-- Add sort_order column to daily_data table
ALTER TABLE daily_data ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Update existing records with order based on date
UPDATE daily_data SET sort_order = subquery.row_num
FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY data ASC) as row_num FROM daily_data) AS subquery
WHERE daily_data.id = subquery.id;