'use server'

import { createClient } from '@/lib/supabase/server'
import type { DashboardPeriodo, TopCliente, PeriodoProdutoStats } from '@/types'

type ActionResult<T> = { data: T | null; error: string | null }

// ─── Get active period (fim_em IS NULL) ───────────────────────────────────────

export async function getCurrentPeriodo(): Promise<ActionResult<DashboardPeriodo | null>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }
  try {
    const { data, error } = await supabase
      .from('dashboard_periodos')
      .select('*')
      .is('fim_em', null)
      .order('inicio_em', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) return { data: null, error: null }
    return { data: data as DashboardPeriodo | null, error: null }
  } catch {
    return { data: null, error: null }
  }
}

// ─── Reset dashboard ──────────────────────────────────────────────────────────
// 1. Closes the current period with a full rich snapshot (dados_json)
// 2. Creates a new period starting now

export async function resetDashboard(): Promise<ActionResult<DashboardPeriodo>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }
  const now = new Date().toISOString()

  const { data: current } = await getCurrentPeriodo()

  if (current) {
    // Fetch all vendas in this period with full detail
    const { data: vendas } = await supabase
      .from('vendas')
      .select('valor_total, lucro, quantidade, cliente_id, produto_id')
      .gte('created_at', current.inicio_em)

    let fat = 0, luc = 0, qtd = 0, cnt = 0
    const clienteGasto   = new Map<string, number>()
    const clienteCompras = new Map<string, number>()
    const prodQtd        = new Map<string, number>()
    const prodLucro      = new Map<string, number>()

    for (const v of vendas ?? []) {
      fat += v.valor_total as number
      luc += v.lucro as number
      qtd += v.quantidade as number
      cnt++
      if (v.cliente_id) {
        const cid = v.cliente_id as string
        clienteGasto.set(cid,   (clienteGasto.get(cid)   ?? 0) + (v.valor_total as number))
        clienteCompras.set(cid, (clienteCompras.get(cid) ?? 0) + 1)
      }
      if (v.produto_id) {
        const pid = v.produto_id as string
        prodQtd.set(pid,   (prodQtd.get(pid)   ?? 0) + (v.quantidade as number))
        prodLucro.set(pid, (prodLucro.get(pid) ?? 0) + (v.lucro as number))
      }
    }

    // ── Top clientes ────────────────────────────────────────
    const topClienteEntries = Array.from(clienteGasto.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    let top_clientes: TopCliente[] = []
    if (topClienteEntries.length > 0) {
      const { data: clienteNomes } = await supabase
        .from('clientes')
        .select('id, nome')
        .in('id', topClienteEntries.map(([id]) => id))

      const nomeMap = new Map(
        (clienteNomes ?? []).map((c: { id: string; nome: string }) => [c.id, c.nome])
      )
      top_clientes = topClienteEntries.map(([id, gasto]) => ({
        id,
        nome:          nomeMap.get(id) ?? 'Cliente',
        total_gasto:   Math.round(gasto * 100) / 100,
        total_compras: clienteCompras.get(id) ?? 1,
      }))
    }

    // ── Produtos vendidos (full list, sorted by lucro desc) ──
    const prodLucroArr = Array.from(prodLucro.entries()).sort((a, b) => b[1] - a[1])
    let vendas_por_produto: PeriodoProdutoStats[] = []

    if (prodLucroArr.length > 0) {
      const { data: prodData } = await supabase
        .from('produtos')
        .select('id, nome, custo, preco_venda, imagem_url')
        .in('id', prodLucroArr.map(([id]) => id))

      const prodDataMap = new Map(
        (prodData ?? []).map((p: { id: string; nome: string; custo: number; preco_venda: number; imagem_url: string | null }) => [p.id, p])
      )
      vendas_por_produto = prodLucroArr.map(([id, lucTotal]) => {
        const p = prodDataMap.get(id)
        return {
          nome:        p?.nome        ?? id,
          quantidade:  prodQtd.get(id) ?? 0,
          lucro:       Math.round(lucTotal * 100) / 100,
          custo:       p?.custo,
          preco_venda: p?.preco_venda,
          imagem_url:  p?.imagem_url,
        }
      })
    }

    // ── Mais vendido / mais lucrativo ─────────────────────────
    let produto_mais_vendido:   string | undefined
    let produto_mais_lucrativo: string | undefined

    if (prodQtd.size > 0) {
      const maisVendidoId    = [...prodQtd.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
      const maisLucrativoId  = [...prodLucro.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
      const idsToFetch = Array.from(new Set([maisVendidoId, maisLucrativoId].filter(Boolean) as string[]))

      if (idsToFetch.length > 0) {
        const { data: nomesData } = await supabase.from('produtos').select('id, nome').in('id', idsToFetch)
        const nomeMap = new Map(
          (nomesData ?? []).map((p: { id: string; nome: string }) => [p.id, p.nome])
        )
        if (maisVendidoId)   produto_mais_vendido   = nomeMap.get(maisVendidoId)
        if (maisLucrativoId) produto_mais_lucrativo = nomeMap.get(maisLucrativoId)
      }
    }

    // ── Always-on snapshot ───────────────────────────────────
    const { data: estoqueProdutos } = await supabase.from('produtos').select('custo, estoque')
    let total_investido = 0
    for (const p of estoqueProdutos ?? [])
      total_investido += (p.custo as number) * (p.estoque as number)

    const { count: clientes_cadastrados } = await supabase
      .from('clientes').select('id', { count: 'exact', head: true })

    const { data: allClienteVendas } = await supabase
      .from('vendas').select('cliente_id').not('cliente_id', 'is', null)
    const clienteAllCount = new Map<string, number>()
    for (const row of allClienteVendas ?? []) {
      if (row.cliente_id)
        clienteAllCount.set(row.cliente_id, (clienteAllCount.get(row.cliente_id) ?? 0) + 1)
    }
    let clientes_recorrentes = 0
    for (const c of clienteAllCount.values()) if (c > 1) clientes_recorrentes++

    const margem = fat > 0 ? ((luc / fat) * 100).toFixed(1) : '0.0'

    // ── Save period snapshot ─────────────────────────────────
    const dados_json = {
      top_clientes,
      vendas_por_produto,
      produto_mais_vendido,
      produto_mais_lucrativo,
      clientes_cadastrados: clientes_cadastrados ?? 0,
      clientes_recorrentes,
      total_investido:      Math.round(total_investido * 100) / 100,
      margem,
    }

    await supabase
      .from('dashboard_periodos')
      .update({
        fim_em:            now,
        faturamento_bruto: Math.round(fat * 100) / 100,
        lucro_liquido:     Math.round(luc * 100) / 100,
        total_vendas:      cnt,
        ticket_medio:      cnt > 0 ? Math.round((fat / cnt) * 100) / 100 : 0,
        produtos_vendidos: qtd,
        dados_json,
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: null }
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
