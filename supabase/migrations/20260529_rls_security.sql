-- ─────────────────────────────────────────────────────────────────────────────
-- Security patch: enable RLS on tables created without it
-- ─────────────────────────────────────────────────────────────────────────────

-- dashboard_periodos
ALTER TABLE dashboard_periodos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all_dashboard_periodos"
  ON dashboard_periodos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- anotacoes
ALTER TABLE anotacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all_anotacoes"
  ON anotacoes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
