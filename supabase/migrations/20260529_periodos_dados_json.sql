-- Add dados_json column to dashboard_periodos for rich period snapshot
ALTER TABLE dashboard_periodos
  ADD COLUMN IF NOT EXISTS dados_json jsonb;
