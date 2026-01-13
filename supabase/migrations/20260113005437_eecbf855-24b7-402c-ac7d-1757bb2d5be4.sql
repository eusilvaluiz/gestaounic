-- Atualizar os dados existentes para incluir o ano
-- Registros de novembro/dezembro são de 2024
-- Registros de janeiro são de 2025
UPDATE daily_data 
SET data = data || '/2024'
WHERE CAST(SPLIT_PART(data, '/', 2) AS INTEGER) >= 11
  AND LENGTH(data) <= 5;

UPDATE daily_data 
SET data = data || '/2025'
WHERE CAST(SPLIT_PART(data, '/', 2) AS INTEGER) <= 1
  AND LENGTH(data) <= 5;