'use server'

import { createClient } from '@/lib/supabase/server'
import {
  getMesAtual,
  getAnoAtual,
  getStartOfMonth,
  getEndOfMonth,
} from '@/lib/utils'
import type { HistoricoMensal } from '@/types'

type ActionResult<T> = { data: T | null; error: string | null }

/**
 * Fetch all monthly history records ordered by year ascending, then month ascending.
 */
export async function getHistoricoMensal(): Promise<ActionResult<HistoricoMensal[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('historico_mensal')
    .select('*')
    .order('ano', { ascending: true })
    .order('mes', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data as HistoricoMensal[], error: null }
}

/**
 * Compute a live snapshot for a given month and upsert it into historico_mensal.
 * Existing vendas records are never touched — this is purely aggregate + store.
 */
export async function saveHistoricoMes(
  mes: number,
  ano: number
): Promise<ActionResult<HistoricoMensal>> {
  const supabase = await createClient()

  const start = getStartOfMonth(mes, ano)
  const end = getEndOfMonth(mes, ano)

  // Sum sales data
  const { data: vendas, error: vendasError } = await supabase
    .from('vendas')
    .select('valor_total, lucro, quantidade')
    .gte('created_at', start)
    .lte('created_at', end)

  if (vendasError) return { data: null, error: vendasError.message }

  const rows = vendas ?? []
  const total_vendas = rows.length
  const faturamento_bruto =
    Math.round(rows.reduce((s, r) => s + (r.valor_total as number), 0) * 100) / 100
  const lucro_liquido =
    Math.round(rows.reduce((s, r) => s + (r.lucro as number), 0) * 100) / 100
  const produtos_vendidos = rows.reduce((s, r) => s + (r.quantidade as number), 0)

  // Monthly goal
  const { data: metaRow } = await supabase
    .from('metas')
    .select('valor')
    .eq('tipo', 'mensal')
    .eq('mes', mes)
    .eq('ano', ano)
    .maybeSingle()

  const meta_mensal: number | null = metaRow?.valor ?? null
  const meta_atingida: boolean | null =
    meta_mensal !== null ? faturamento_bruto >= meta_mensal : null

  const dados_json = {
    snapshot_at: new Date().toISOString(),
    total_vendas,
    faturamento_bruto,
    lucro_liquido,
    produtos_vendidos,
    meta_mensal,
    meta_atingida,
  }

  const { data, error } = await supabase
    .from('historico_mensal')
    .upsert(
      {
        mes,
        ano,
        faturamento_bruto,
        lucro_liquido,
        total_vendas,
        produtos_vendidos,
        meta_mensal,
        meta_atingida,
        dados_json,
      },
      { onConflict: 'mes,ano' }
    )
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as HistoricoMensal, error: null }
}

/** Convenience: snapshot the current calendar month. */
export async function salvarMesAtual(): Promise<ActionResult<HistoricoMensal>> {
  return saveHistoricoMes(getMesAtual(), getAnoAtual())
}
