'use server'

import { createClient } from '@/lib/supabase/server'
import { getMesAtual, getAnoAtual, getStartOfMonth, getEndOfMonth } from '@/lib/utils'
import type { Meta, MetaForm } from '@/types'

type ActionResult<T> = { data: T | null; error: string | null }

/**
 * Fetch the monthly goal for a given month/year, or null if not set.
 */
export async function getMetaMensal(
  mes: number,
  ano: number
): Promise<ActionResult<Meta | null>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('metas')
    .select('*')
    .eq('tipo', 'mensal')
    .eq('mes', mes)
    .eq('ano', ano)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: (data as Meta) ?? null, error: null }
}

/**
 * Fetch the annual goal for a given year, or null if not set.
 */
export async function getMetaAnual(
  ano: number
): Promise<ActionResult<Meta | null>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('metas')
    .select('*')
    .eq('tipo', 'anual')
    .eq('ano', ano)
    .is('mes', null)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: (data as Meta) ?? null, error: null }
}

/**
 * Insert or update a goal (upsert based on the unique constraint).
 * For tipo='mensal': unique on (tipo, mes, ano)
 * For tipo='anual':  unique on (tipo, mes=null, ano) — handled via onConflict
 */
export async function upsertMeta(
  formData: MetaForm
): Promise<ActionResult<Meta>> {
  const supabase = await createClient()

  const payload = {
    tipo: formData.tipo,
    valor: formData.valor,
    mes: formData.mes ?? null,
    ano: formData.ano,
  }

  const { data, error } = await supabase
    .from('metas')
    .upsert(payload, {
      onConflict: 'tipo,mes,ano',
      ignoreDuplicates: false,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Meta, error: null }
}

/**
 * Returns the current month's goal progress:
 * { meta, realizado, percentual, restante }
 */
export async function getProgressoMeta(
  mes?: number,
  ano?: number
): Promise<
  ActionResult<{
    meta: number | null
    realizado: number
    percentual: number
    restante: number
  }>
> {
  const supabase = await createClient()

  const m = mes ?? getMesAtual()
  const a = ano ?? getAnoAtual()

  // Fetch the monthly goal
  const { data: metaData, error: metaError } = await getMetaMensal(m, a)
  if (metaError) return { data: null, error: metaError }

  // Sum faturamento for the period
  const start = getStartOfMonth(m, a)
  const end = getEndOfMonth(m, a)

  const { data: vendasRaw, error: vendasError } = await supabase
    .from('vendas')
    .select('valor_total')
    .gte('created_at', start)
    .lte('created_at', end)

  if (vendasError) return { data: null, error: vendasError.message }

  const realizado = (vendasRaw ?? []).reduce(
    (acc, row) => acc + (row.valor_total as number),
    0
  )
  const metaValor = metaData?.valor ?? null
  const percentual =
    metaValor && metaValor > 0
      ? Math.min(Math.round((realizado / metaValor) * 10000) / 100, 100)
      : 0
  const restante = metaValor ? Math.max(metaValor - realizado, 0) : 0

  return {
    data: { meta: metaValor, realizado, percentual, restante },
    error: null,
  }
}
