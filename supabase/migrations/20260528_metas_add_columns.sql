-- Migration: add observacoes, data_inicio, data_fim to metas table
ALTER TABLE metas ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE metas ADD COLUMN IF NOT EXISTS data_inicio DATE;
ALTER TABLE metas ADD COLUMN IF NOT EXISTS data_fim DATE;

-- Update tipo constraint to include 'periodo'
ALTER TABLE metas DROP CONSTRAINT IF EXISTS metas_tipo_check;
ALTER TABLE metas ADD CONSTRAINT metas_tipo_check CHECK (tipo IN ('mensal', 'anual', 'periodo'));
