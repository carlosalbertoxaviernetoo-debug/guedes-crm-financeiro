'use server'

import { createClient } from '@/lib/supabase/server'
import {
  getMesAtual,
  getAnoAtual,
  getStartOfMonth,
  getEndOfMonth,
} from '@/lib/utils'
import type { DashboardMetrics, TopCliente, PeriodoProdutoStats } from '@/types'
import { getProgressoMeta } from './metas'
import { getCurrentPeriodo } from './periodos'

type ActionResult<T> = { data: T | null; error: string | null }

/**
 * Build the complete dashboard metrics object.
 * Period-based metrics (faturamento, lucro, vendas, ticket, top produtos/clientes)
 * are filtered from the current period's inicio_em.
 * Always-on metrics (clientes, investido, estoque) are never filtered by period.
 */
export async function getDashboardMetrics(): Promise<ActionResult<DashboardMetrics>> {
  const supabase = await createClient()

  const mesAtual = getMesAtual()
  const anoAtual = getAnoAtual()
  const mesStart = getStartOfMonth(mesAtual, anoAtual)
  const mesEnd   = getEndOfMonth(mesAtual, anoAtual)

  // ── 0. Current period ─────────────────────────────────────
  const { data: periodo } = await getCurrentPeriodo()
  // If no period, use epoch (all-time) so all data is included
  const periodoStart = periodo?.inicio_em ?? new Date(0).toISOString()

  // ── 1. Period totals ──────────────────────────────────────
  const { data: periodoVendas, error: periodoError } = await supabase
    .from('vendas')
    .select('valor_total, lucro, quantidade, cliente_id, produto_id')
    .gte('created_at', periodoStart)

  if (periodoError) return { data: null, error: periodoError.message }

  let faturamento_bruto = 0
  let lucro_liquido = 0
  let total_vendas = (periodoVendas ?? []).length
  let produtos_vendidos = 0

  const clienteGasto    = new Map<string, number>()
  const clienteCompras  = new Map<string, number>()
  const prodQtd         = new Map<string, number>()
  const prodLucro       = new Map<string, number>()

  for (const row of periodoVendas ?? []) {
    faturamento_bruto += row.valor_total as number
    lucro_liquido     += row.lucro as number
    produtos_vendidos += row.quantidade as number

    // For top clientes
    if (row.cliente_id) {
      const cid = row.cliente_id as string
      clienteGasto.set(cid, (clienteGasto.get(cid) ?? 0) + (row.valor_total as number))
      clienteCompras.set(cid, (clienteCompras.get(cid) ?? 0) + 1)
    }

    // For top produtos
    if (row.produto_id) {
      const pid = row.produto_id as string
      prodQtd.set(pid, (prodQtd.get(pid) ?? 0) + (row.quantidade as number))
      prodLucro.set(pid, (prodLucro.get(pid) ?? 0) + (row.lucro as number))
    }
  }

  // ── 2. Ticket médio ────────────────────────────────────────
  const ticket_medio =
    total_vendas > 0
      ? Math.round((faturamento_bruto / total_vendas) * 100) / 100
      : 0

  // ── 3. Top clientes (period) ────────────────────────────────
  const topClienteEntries = Array.from(clienteGasto.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  let top_clientes: TopCliente[] = []

  if (topClienteEntries.length > 0) {
    const { data: clienteNomes } = await supabase
      .from('clientes')
      .select('id, nome')
      .in('id', topClienteEntries.map(([id]) => id))

    const nomeMap = new Map((clienteNomes ?? []).map((c) => [c.id, c.nome]))
    top_clientes = topClienteEntries.map(([id, gasto]) => ({
      id,
      nome: nomeMap.get(id) ?? 'Cliente',
      total_gasto: Math.round(gasto * 100) / 100,
      total_compras: clienteCompras.get(id) ?? 1,
    }))
  }

  // ── 4. Most sold & most profitable product (period) ─────────
  let maisVendidoId: string | null = null
  let maisVendidoQtd = 0
  for (const [pid, qtd] of prodQtd) {
    if (qtd > maisVendidoQtd) { maisVendidoQtd = qtd; maisVendidoId = pid }
  }

  let maisLucrativoId: string | null = null
  let maisLucrativoVal = -Infinity
  for (const [pid, luc] of prodLucro) {
    if (luc > maisLucrativoVal) { maisLucrativoVal = luc; maisLucrativoId = pid }
  }

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
    if (maisVendidoId)    produto_mais_vendido    = nomeMap.get(maisVendidoId)
    if (maisLucrativoId)  produto_mais_lucrativo  = nomeMap.get(maisLucrativoId)
  }

  // ── 5. Top 5 produtos por lucro (period) ──────────────────
  const prodLucroArr = Array.from(prodLucro.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  let vendas_por_produto: PeriodoProdutoStats[] = []

  if (prodLucroArr.length > 0) {
    const { data: top5Data } = await supabase
      .from('produtos')
      .select('id, nome, custo, preco_venda, imagem_url')
      .in('id', prodLucroArr.map(([id]) => id))

    const prodDataMap = new Map(
      (top5Data ?? []).map((p) => [p.id as string, p as { id: string; nome: string; custo: number; preco_venda: number; imagem_url: string | null }])
    )
    vendas_por_produto = prodLucroArr.map(([id, luc]) => {
      const p = prodDataMap.get(id)
      return {
        nome:       p?.nome       ?? id,
        quantidade: prodQtd.get(id) ?? 0,
        lucro:      Math.round(luc * 100) / 100,
        custo:      p?.custo,
        preco_venda: p?.preco_venda,
        imagem_url:  p?.imagem_url,
      }
    })
  }

  // ── 6. Current month metrics (for meta progress) ───────────
  const { data: mesVendas, error: mesError } = await supabase
    .from('vendas')
    .select('valor_total, lucro')
    .gte('created_at', mesStart)
    .lte('created_at', mesEnd)

  if (mesError) return { data: null, error: mesError.message }

  let lucro_mes   = 0
  let vendas_mes  = (mesVendas ?? []).length
  for (const row of mesVendas ?? []) lucro_mes += row.lucro as number

  // ── 7. Always-on: estoque ─────────────────────────────────
  const { data: estoqueProdutos, error: estoqueError } = await supabase
    .from('produtos')
    .select('custo, estoque')

  if (estoqueError) return { data: null, error: estoqueError.message }

  let total_investido = 0
  for (const p of estoqueProdutos ?? [])
    total_investido += (p.custo as number) * (p.estoque as number)

  // ── 8. Always-on: clientes ────────────────────────────────
  const { count: clientes_cadastrados, error: clientesError } = await supabase
    .from('clientes')
    .select('id', { count: 'exact', head: true })

  if (clientesError) return { data: null, error: clientesError.message }

  // Recorrentes: clients with >1 all-time purchase
  const { data: allClienteVendas } = await supabase
    .from('vendas')
    .select('cliente_id')
    .not('cliente_id', 'is', null)

  const clienteAllCount = new Map<string, number>()
  for (const row of allClienteVendas ?? []) {
    if (row.cliente_id)
      clienteAllCount.set(row.cliente_id, (clienteAllCount.get(row.cliente_id) ?? 0) + 1)
  }
  let clientes_recorrentes = 0
  for (const cnt of clienteAllCount.values()) if (cnt > 1) clientes_recorrentes++

  // ── 9. Always-on: estoque baixo ───────────────────────────
  const { count: estoque_baixo, error: estoqueBaixoError } = await supabase
    .from('produtos')
    .select('id', { count: 'exact', head: true })
    .lte('estoque', 5)

  if (estoqueBaixoError) return { data: null, error: estoqueBaixoError.message }

  // ── 10. Vendas por dia — last 30 days (context chart) ─────
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const { data: ultimas30, error: ultimas30Error } = await supabase
    .from('vendas')
    .select('created_at, valor_total, lucro')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  if (ultimas30Error) return { data: null, error: ultimas30Error.message }

  const diaMap = new Map<string, { vendas: number; lucro: number }>()
  for (const row of ultimas30 ?? []) {
    const dia = (row.created_at as string).slice(0, 10)
    const ex  = diaMap.get(dia) ?? { vendas: 0, lucro: 0 }
    diaMap.set(dia, { vendas: ex.vendas + 1, lucro: ex.lucro + (row.lucro as number) })
  }

  const vendas_por_dia: { data: string; vendas: number; lucro: number }[] = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    const entry = diaMap.get(key) ?? { vendas: 0, lucro: 0 }
    vendas_por_dia.push({ data: key, ...entry })
  }

  // ── 11. Evolução financeira — last 6 months ───────────────
  const evolucao_mensal: { mes: string; faturamento: number; lucro: number }[] = []

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

    let fat = 0, luc = 0
    for (const row of mRows ?? []) {
      fat += row.valor_total as number
      luc += row.lucro as number
    }

    evolucao_mensal.push({
      mes: d.toLocaleString('pt-BR', { month: 'short' }) + ` ${a}`,
      faturamento: Math.round(fat * 100) / 100,
      lucro: Math.round(luc * 100) / 100,
    })
  }

  // ── 12. Meta mensal ───────────────────────────────────────
  const { data: progresso, error: progressoError } = await getProgressoMeta(mesAtual, anoAtual)
  if (progressoError) return { data: null, error: progressoError }

  // ── Assemble ──────────────────────────────────────────────
  const metrics: DashboardMetrics = {
    // Period-based
    faturamento_bruto:    Math.round(faturamento_bruto * 100) / 100,
    lucro_liquido:        Math.round(lucro_liquido * 100) / 100,
    total_vendas,
    produtos_vendidos,
    ticket_medio,
    produto_mais_vendido,
    produto_mais_lucrativo,
    top_clientes,
    periodo_inicio_em:    periodo?.inicio_em,
    // Always-on
    total_investido:      Math.round(total_investido * 100) / 100,
    clientes_cadastrados: clientes_cadastrados ?? 0,
    clientes_recorrentes,
    estoque_baixo:        estoque_baixo ?? 0,
    // Meta & charts
    meta_mensal:          progresso?.meta ?? undefined,
    meta_atingida_percent: progresso?.percentual ?? 0,
    lucro_mes:            Math.round(lucro_mes * 100) / 100,
    vendas_mes,
    vendas_por_dia,
    vendas_por_produto,
    evolucao_mensal,
  }

  return { data: metrics, error: null }
}
