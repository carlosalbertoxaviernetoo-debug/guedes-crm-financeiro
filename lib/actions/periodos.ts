'use server'

import { createClient } from '@/lib/supabase/server'
import type { DashboardPeriodo } from '@/types'

type ActionResult<T> = { data: T | null; error: string | null }

// ─── Get active period (fim_em IS NULL) ───────────────────────────────────────

export async function getCurrentPeriodo(): Promise<ActionResult<DashboardPeriodo | null>> {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('dashboard_periodos')
      .select('*')
      .is('fim_em', null)
      .order('inicio_em', { ascending: false })
      .limit(1)
      .maybeSingle()

    // If error (e.g. table doesn't exist yet), return null gracefully
    if (error) return { data: null, error: null }
    return { data: data as DashboardPeriodo | null, error: null }
  } catch {
    return { data: null, error: null }
  }
}

// ─── Reset dashboard ──────────────────────────────────────────────────────────
// 1. Closes the current period with a metrics snapshot
// 2. Creates a new period starting now

export async function resetDashboard(): Promise<ActionResult<DashboardPeriodo>> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  // Close current period (if any) with a snapshot
  const { data: current } = await getCurrentPeriodo()
  if (current) {
    const { data: vendas } = await supabase
      .from('vendas')
      .select('valor_total, lucro, quantidade')
      .gte('created_at', current.inicio_em)

    let fat = 0, luc = 0, qtd = 0, cnt = 0
    for (const v of vendas ?? []) {
      fat += v.valor_total as number
      luc += v.lucro as number
      qtd += v.quantidade as number
      cnt++
    }

    await supabase
      .from('dashboard_periodos')
      .update({
        fim_em: now,
        faturamento_bruto: Math.round(fat * 100) / 100,
        lucro_liquido:     Math.round(luc * 100) / 100,
        total_vendas:      cnt,
        ticket_medio:      cnt > 0 ? Math.round((fat / cnt) * 100) / 100 : 0,
        produtos_vendidos: qtd,
      })
      .eq('id', current.id)
  }

  // Create new period
  const { data: newPeriodo, error } = await supabase
    .from('dashboard_periodos')
    .insert({ inicio_em: now })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: newPeriodo as DashboardPeriodo, error: null }
}

// ─── Get all closed periods (for Histórico page) ──────────────────────────────

export async function getPeriodosHistorico(): Promise<ActionResult<DashboardPeriodo[]>> {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase
      .from('dashboard_periodos')
      .select('*')
      .not('fim_em', 'is', null)
      .order('fim_em', { ascending: false })

    if (error) return { data: [], error: null }
    return { data: (data ?? []) as DashboardPeriodo[], error: null }
  } catch {
    return { data: [], error: null }
  }
}
