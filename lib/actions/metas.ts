'use server'

import { createClient } from '@/lib/supabase/server'
import { getMesAtual, getAnoAtual, getStartOfMonth, getEndOfMonth } from '@/lib/utils'
import type { Meta, MetaForm } from '@/types'

type ActionResult<T> = { data: T | null; error: string | null }

/** Checks if the error is a missing-column error (pre-migration or schema cache miss). */
function isColumnMissing(e: { code?: string; message?: string } | null): boolean {
  if (!e) return false
  return (
    e.code === '42703' ||
    e.code === 'PGRST204' ||
    (e.message?.includes('schema cache') ?? false)
  )
}

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
 * Fetch all custom period goals, ordered by most recent.
 */
export async function getMetasPeriodo(): Promise<ActionResult<Meta[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('metas')
    .select('*')
    .eq('tipo', 'periodo')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: (data as Meta[]) ?? [], error: null }
}

/**
 * Insert or update a goal (upsert based on the unique constraint).
 * For tipo='mensal': unique on (tipo, mes, ano)
 * For tipo='anual':  unique on (tipo, mes=null, ano)
 * For tipo='periodo': always insert new
 */
export async function upsertMeta(
  formData: MetaForm
): Promise<ActionResult<Meta>> {
  const supabase = await createClient()

  // Period goals always create new rows
  if (formData.tipo === 'periodo') {
    const payload: Record<string, unknown> = {
      tipo: formData.tipo,
      valor: formData.valor,
      mes: null,
      ano: formData.ano,
    }
    // Only include new columns when they have values (requires migration)
    if (formData.data_inicio) payload.data_inicio = formData.data_inicio
    if (formData.data_fim)    payload.data_fim    = formData.data_fim
    if (formData.observacoes) payload.observacoes = formData.observacoes

    // Try with new fields; if column missing, retry without them
    let { data: d1, error: e1 } = await supabase.from('metas').insert(payload).select().single()
    if (isColumnMissing(e1)) {
      const safe = { tipo: payload.tipo, valor: payload.valor, mes: null, ano: payload.ano }
      const r2 = await supabase.from('metas').insert(safe).select().single()
      d1 = r2.data; e1 = r2.error
    }
    if (e1) return { data: null, error: e1.message }
    return { data: d1 as Meta, error: null }
  }

  const payload: Record<string, unknown> = {
    tipo: formData.tipo,
    valor: formData.valor,
    mes: formData.mes ?? null,
    ano: formData.ano,
  }
  // Only include new columns if they have values (safe before migration runs)
  if (formData.observacoes) payload.observacoes = formData.observacoes

  // Try upsert; if column missing, retry without new fields
  let { data, error } = await supabase.from('metas').upsert(payload, {
    onConflict: 'tipo,mes,ano',
    ignoreDuplicates: false,
  }).select().single()

  if (isColumnMissing(error)) {
    const safe = { tipo: payload.tipo, valor: payload.valor, mes: payload.mes, ano: payload.ano }
    const r2 = await supabase.from('metas').upsert(safe, { onConflict: 'tipo,mes,ano', ignoreDuplicates: false }).select().single()
    data = r2.data; error = r2.error
  }

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

/**
 * Returns progress for a custom period goal (data_inicio to data_fim).
 */
export async function getProgressoPeriodo(
  dataInicio: string,
  dataFim: string
): Promise<
  ActionResult<{
    realizado: number
  }>
> {
  const supabase = await createClient()

  const start = new Date(dataInicio).toISOString()
  const end = new Date(dataFim + 'T23:59:59.999Z').toISOString()

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

  return { data: { realizado }, error: null }
}

/**
 * Delete a goal by ID.
 */
export async function deleteMeta(id: string): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from('metas').delete().eq('id', id)
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
