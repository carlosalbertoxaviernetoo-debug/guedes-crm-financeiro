-- Migration: create dashboard_periodos table for period-based metrics
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS dashboard_periodos (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  inicio_em         timestamptz NOT NULL DEFAULT now(),
  fim_em            timestamptz,
  faturamento_bruto numeric(12,2) DEFAULT 0,
  lucro_liquido     numeric(12,2) DEFAULT 0,
  total_vendas      integer       DEFAULT 0,
  ticket_medio      numeric(12,2) DEFAULT 0,
  produtos_vendidos integer       DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_periodos_inicio_em ON dashboard_periodos(inicio_em DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_periodos_fim_em    ON dashboard_periodos(fim_em DESC);
