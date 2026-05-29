-- Migration: create anotacoes table
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS anotacoes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo     text        NOT NULL,
  conteudo   text        NOT NULL DEFAULT '',
  tipo       text        NOT NULL DEFAULT 'observacao'
             CHECK (tipo IN ('observacao','produto','investimento','ideia','tarefa','outro')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anotacoes_created_at ON anotacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anotacoes_tipo       ON anotacoes(tipo);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION trg_set_anotacoes_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_anotacoes_updated_at ON anotacoes;
CREATE TRIGGER set_anotacoes_updated_at
  BEFORE UPDATE ON anotacoes
  FOR EACH ROW EXECUTE FUNCTION trg_set_anotacoes_updated_at();
