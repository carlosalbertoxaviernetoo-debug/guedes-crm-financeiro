'use server'

import { createClient } from '@/lib/supabase/server'
import { getMesAtual, getAnoAtual, getStartOfMonth, getEndOfMonth } from '@/lib/utils'
import type { Meta, MetaForm } from '@/types'

type ActionResult<T> = { data: T | null; error: string | null }

function isColumnMissing(e: { code?: string; message?: string } | null): boolean {
  if (!e) return false
  return e.code === '42703' || e.code === 'PGRST204' || (e.message?.includes('schema cache') ?? false)
}

export async function getMetaMensal(mes: number, ano: number): Promise<ActionResult<Meta | null>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const { data, error } = await supabase
    .from('metas').select('*')
    .eq('tipo', 'mensal').eq('mes', mes).eq('ano', ano).maybeSingle()

  if (error) return { data: null, error: 'Erro ao buscar meta.' }
  return { data: (data as Meta) ?? null, error: null }
}

export async function getMetaAnual(ano: number): Promise<ActionResult<Meta | null>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const { data, error } = await supabase
    .from('metas').select('*')
    .eq('tipo', 'anual').eq('ano', ano).is('mes', null).maybeSingle()

  if (error) return { data: null, error: 'Erro ao buscar meta anual.' }
  return { data: (data as Meta) ?? null, error: null }
}

export async function getMetasPeriodo(): Promise<ActionResult<Meta[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const { data, error } = await supabase
    .from('metas').select('*')
    .eq('tipo', 'periodo').order('created_at', { ascending: false })

  if (error) return { data: null, error: 'Erro ao buscar metas de período.' }
  return { data: (data as Meta[]) ?? [], error: null }
}

export async function upsertMeta(formData: MetaForm): Promise<ActionResult<Meta>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const valor = Number(formData.valor)
  if (!Number.isFinite(valor) || valor <= 0) return { data: null, error: 'Valor de meta inválido.' }

  const mes = Number(formData.mes)
  const ano = Number(formData.ano)
  if (formData.mes !== undefined && formData.mes !== null && (mes < 1 || mes > 12)) {
    return { data: null, error: 'Mês inválido (1-12).' }
  }
  if (!Number.isInteger(ano) || ano < 2020 || ano > 2100) {
    return { data: null, error: 'Ano inválido.' }
  }

  if (formData.tipo === 'periodo') {
    const payload: Record<string, unknown> = { tipo: formData.tipo, valor, mes: null, ano }
    if (formData.data_inicio) payload.data_inicio = formData.data_inicio
    if (formData.data_fim)    payload.data_fim    = formData.data_fim
    if (formData.observacoes) payload.observacoes = formData.observacoes?.slice(0, 300)

    let { data: d1, error: e1 } = await supabase.from('metas').insert(payload).select().single()
    if (isColumnMissing(e1)) {
      const safe = { tipo: payload.tipo, valor: payload.valor, mes: null, ano: payload.ano }
      const r2 = await supabase.from('metas').insert(safe).select().single()
      d1 = r2.data; e1 = r2.error
    }
    if (e1) return { data: null, error: 'Erro ao salvar meta.' }
    return { data: d1 as Meta, error: null }
  }

  const payload: Record<string, unknown> = {
    tipo: formData.tipo, valor,
    mes: formData.mes ?? null, ano,
  }
  if (formData.observacoes) payload.observacoes = formData.observacoes?.slice(0, 300)

  let { data, error } = await supabase
    .from('metas').upsert(payload, { onConflict: 'tipo,mes,ano', ignoreDuplicates: false })
    .select().single()

  if (isColumnMissing(error)) {
    const safe = { tipo: payload.tipo, valor: payload.valor, mes: payload.mes, ano: payload.ano }
    const r2 = await supabase.from('metas').upsert(safe, { onConflict: 'tipo,mes,ano', ignoreDuplicates: false }).select().single()
    data = r2.data; error = r2.error
  }

  if (error) return { data: null, error: 'Erro ao salvar meta.' }
  return { data: data as Meta, error: null }
}

export async function getProgressoMeta(
  mes?: number, ano?: number
): Promise<ActionResult<{ meta: number | null; realizado: number; percentual: number; restante: number }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const m = mes ?? getMesAtual()
  const a = ano ?? getAnoAtual()

  const { data: metaData, error: metaError } = await getMetaMensal(m, a)
  if (metaError) return { data: null, error: metaError }

  const start = getStartOfMonth(m, a)
  const end   = getEndOfMonth(m, a)

  const { data: vendasRaw, error: vendasError } = await supabase
    .from('vendas').select('valor_total')
    .gte('created_at', start).lte('created_at', end)

  if (vendasError) return { data: null, error: 'Erro ao calcular progresso.' }

  const realizado = (vendasRaw ?? []).reduce((acc, row) => acc + (row.valor_total as number), 0)
  const metaValor = metaData?.valor ?? null
  const percentual = metaValor && metaValor > 0
    ? Math.min(Math.round((realizado / metaValor) * 10000) / 100, 100) : 0
  const restante = metaValor ? Math.max(metaValor - realizado, 0) : 0

  return { data: { meta: metaValor, realizado, percentual, restante }, error: null }
}

export async function getProgressoPeriodo(
  dataInicio: string, dataFim: string
): Promise<ActionResult<{ realizado: number }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const startDate = new Date(dataInicio)
  const endDate   = new Date(dataFim + 'T23:59:59.999Z')
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { data: null, error: 'Datas inválidas.' }
  }

  const { data: vendasRaw, error: vendasError } = await supabase
    .from('vendas').select('valor_total')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  if (vendasError) return { data: null, error: 'Erro ao calcular progresso do período.' }

  const realizado = (vendasRaw ?? []).reduce((acc, row) => acc + (row.valor_total as number), 0)
  return { data: { realizado }, error: null }
}

export async function deleteMeta(id: string): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const { error } = await supabase.from('metas').delete().eq('id', id)
  if (error) return { data: null, error: 'Erro ao excluir meta.' }
  return { data: null, error: null }
}
