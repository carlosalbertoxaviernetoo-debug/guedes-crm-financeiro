'use server'

import { createClient } from '@/lib/supabase/server'
import {
  getMesAtual,
  getAnoAtual,
  getStartOfMonth,
  getEndOfMonth,
} from '@/lib/utils'
import type { DashboardMetrics } from '@/types'
import { getProgressoMeta } from './metas'

type ActionResult<T> = { data: T | null; error: string | null }

/**
 * Build the complete dashboard metrics object in one shot.
 * All heavy lifting is done with targeted Supabase queries.
 */
export async function getDashboardMetrics(): Promise<
  ActionResult<DashboardMetrics>
> {
  const supabase = await createClient()

  const mesAtual = getMesAtual()
  const anoAtual = getAnoAtual()
  const mesStart = getStartOfMonth(mesAtual, anoAtual)
  const mesEnd = getEndOfMonth(mesAtual, anoAtual)

  // ── 1. All-time totals ─────────────────────────────────────
  const { data: allTimeVendas, error: allTimeError } = await supabase
    .from('vendas')
    .select('valor_total, lucro, quantidade')

  if (allTimeError) return { data: null, error: allTimeError.message }

  let faturamento_bruto = 0
  let lucro_liquido = 0
  let total_vendas = (allTimeVendas ?? []).length
  let produtos_vendidos = 0

  for (const row of allTimeVendas ?? []) {
    faturamento_bruto += row.valor_total as number
    lucro_liquido += row.lucro as number
    produtos_vendidos += row.quantidade as number
  }

  // ── 2. Current month metrics ───────────────────────────────
  const { data: mesVendas, error: mesError } = await supabase
    .from('vendas')
    .select('valor_total, lucro, quantidade, created_at')
    .gte('created_at', mesStart)
    .lte('created_at', mesEnd)

  if (mesError) return { data: null, error: mesError.message }

  let lucro_mes = 0
  let vendas_mes = (mesVendas ?? []).length

  for (const row of mesVendas ?? []) {
    lucro_mes += row.lucro as number
  }

  // ── 3. Estoque total invested ──────────────────────────────
  const { data: estoqueProdutos, error: estoqueError } = await supabase
    .from('produtos')
    .select('custo, estoque, preco_venda, nome')

  if (estoqueError) return { data: null, error: estoqueError.message }

  let total_investido = 0
  for (const p of estoqueProdutos ?? []) {
    total_investido += (p.custo as number) * (p.estoque as number)
  }

  // ── 4. Ticket médio ────────────────────────────────────────
  const ticket_medio =
    total_vendas > 0
      ? Math.round((faturamento_bruto / total_vendas) * 100) / 100
      : 0

  // ── 5. Clientes: total + recorrentes (>1 compra) ───────────
  const { count: clientes_cadastrados, error: clientesError } = await supabase
    .from('clientes')
    .select('id', { count: 'exact', head: true })

  if (clientesError) return { data: null, error: clientesError.message }

  // Count clients that appear more than once in vendas
  const { data: clienteVendasRaw, error: clienteVendasError } = await supabase
    .from('vendas')
    .select('cliente_id')
    .not('cliente_id', 'is', null)

  if (clienteVendasError) return { data: null, error: clienteVendasError.message }

  const clienteCount = new Map<string, number>()
  for (const row of clienteVendasRaw ?? []) {
    if (row.cliente_id) {
      clienteCount.set(row.cliente_id, (clienteCount.get(row.cliente_id) ?? 0) + 1)
    }
  }
  let clientes_recorrentes = 0
  for (const count of clienteCount.values()) {
    if (count > 1) clientes_recorrentes++
  }

  // ── 6. Produto mais vendido & mais lucrativo ───────────────
  const { data: vendaStats, error: vendaStatsError } = await supabase
    .from('vendas')
    .select('produto_id, quantidade, lucro')

  if (vendaStatsError) return { data: null, error: vendaStatsError.message }

  const prodQtd = new Map<string, number>()
  const prodLucro = new Map<string, number>()

  for (const row of vendaStats ?? []) {
    const pid = row.produto_id as string
    prodQtd.set(pid, (prodQtd.get(pid) ?? 0) + (row.quantidade as number))
    prodLucro.set(pid, (prodLucro.get(pid) ?? 0) + (row.lucro as number))
  }

  let maisVendidoId: string | null = null
  let maisVendidoQtd = 0
  for (const [pid, qtd] of prodQtd) {
    if (qtd > maisVendidoQtd) {
      maisVendidoQtd = qtd
      maisVendidoId = pid
    }
  }

  let maisLucrativoId: string | null = null
  let maisLucrativoVal = -Infinity
  for (const [pid, luc] of prodLucro) {
    if (luc > maisLucrativoVal) {
      maisLucrativoVal = luc
      maisLucrativoId = pid
    }
  }

  // Resolve product names
  const produtoIdsToFetch = Array.from(
    new Set([maisVendidoId, maisLucrativoId].filter(Boolean) as string[])
  )

  let produto_mais_vendido: string | undefined
  let produto_mais_lucrativo: string | undefined

  if (produtoIdsToFetch.length > 0) {
    const { data: nomesData } = await supabase
      .from('produtos')
      .select('id, nome')
      .in('id', produtoIdsToFetch)

    const nomeMap = new Map((nomesData ?? []).map((p) => [p.id, p.nome]))
    if (maisVendidoId) produto_mais_vendido = nomeMap.get(maisVendidoId)
    if (maisLucrativoId) produto_mais_lucrativo = nomeMap.get(maisLucrativoId)
  }

  // ── 7. Estoque baixo (estoque <= 5) ───────────────────────
  const { count: estoque_baixo, error: estoqueBaixoError } = await supabase
    .from('produtos')
    .select('id', { count: 'exact', head: true })
    .lte('estoque', 5)

  if (estoqueBaixoError) return { data: null, error: estoqueBaixoError.message }

  // ── 8. Vendas por dia — last 30 days ──────────────────────
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const { data: ultimas30, error: ultimas30Error } = await supabase
    .from('vendas')
    .select('created_at, valor_total, lucro')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  if (ultimas30Error) return { data: null, error: ultimas30Error.message }

  // Build a map keyed by date string YYYY-MM-DD
  const diaMap = new Map<string, { vendas: number; lucro: number }>()
  for (const row of ultimas30 ?? []) {
    const dia = (row.created_at as string).slice(0, 10)
    const existing = diaMap.get(dia) ?? { vendas: 0, lucro: 0 }
    diaMap.set(dia, {
      vendas: existing.vendas + 1,
      lucro: existing.lucro + (row.lucro as number),
    })
  }

  // Fill in all 30 days (including zeros)
  const vendas_por_dia: { data: string; vendas: number; lucro: number }[] = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    const entry = diaMap.get(key) ?? { vendas: 0, lucro: 0 }
    vendas_por_dia.push({ data: key, vendas: entry.vendas, lucro: entry.lucro })
  }

  // ── 9. Top 5 produtos por lucro ────────────────────────────
  const prodLucroArr = Array.from(prodLucro.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const top5Ids = prodLucroArr.map(([id]) => id)

  let vendas_por_produto: { nome: string; quantidade: number; lucro: number }[] =
    []

  if (top5Ids.length > 0) {
    const { data: top5Nomes } = await supabase
      .from('produtos')
      .select('id, nome')
      .in('id', top5Ids)

    const nomeMap = new Map((top5Nomes ?? []).map((p) => [p.id, p.nome]))

    vendas_por_produto = prodLucroArr.map(([id, luc]) => ({
      nome: nomeMap.get(id) ?? id,
      quantidade: prodQtd.get(id) ?? 0,
      lucro: luc,
    }))
  }

  // ── 10. Evolução dos últimos 6 meses ──────────────────────
  const evolucao_mensal: { mes: string; faturamento: number; lucro: number }[] =
    []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(anoAtual, mesAtual - 1 - i, 1)
    const m = d.getMonth() + 1
    const a = d.getFullYear()
    const s = getStartOfMonth(m, a)
    const e = getEndOfMonth(m, a)

    const { data: mRows } = await supabase
      .from('vendas')
      .select('valor_total, lucro')
      .gte('created_at', s)
      .lte('created_at', e)

    let fat = 0
    let luc = 0
    for (const row of mRows ?? []) {
      fat += row.valor_total as number
      luc += row.lucro as number
    }

    const nomeMes = d.toLocaleString('pt-BR', { month: 'short' })
    evolucao_mensal.push({
      mes: `${nomeMes} ${a}`,
      faturamento: Math.round(fat * 100) / 100,
      lucro: Math.round(luc * 100) / 100,
    })
  }

  // ── 11. Meta mensal atual ──────────────────────────────────
  const { data: progresso, error: progressoError } = await getProgressoMeta(
    mesAtual,
    anoAtual
  )

  if (progressoError) return { data: null, error: progressoError }

  // ── Assemble final metrics object ─────────────────────────
  const metrics: DashboardMetrics = {
    faturamento_bruto: Math.round(faturamento_bruto * 100) / 100,
    lucro_liquido: Math.round(lucro_liquido * 100) / 100,
    total_vendas,
    produtos_vendidos,
    total_investido: Math.round(total_investido * 100) / 100,
    ticket_medio,
    clientes_cadastrados: clientes_cadastrados ?? 0,
    clientes_recorrentes,
    produto_mais_vendido,
    produto_mais_lucrativo,
    estoque_baixo: estoque_baixo ?? 0,
    meta_mensal: progresso?.meta ?? undefined,
    meta_atingida_percent: progresso?.percentual ?? 0,
    lucro_mes: Math.round(lucro_mes * 100) / 100,
    vendas_mes,
    vendas_por_dia,
    vendas_por_produto,
    evolucao_mensal,
  }

  return { data: metrics, error: null }
}
