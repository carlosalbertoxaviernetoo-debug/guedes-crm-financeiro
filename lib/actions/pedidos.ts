'use server'

import { createClient } from '@/lib/supabase/server'
import type { Pedido, PedidoForm, PedidoItem } from '@/types'

type ActionResult<T> = { data: T | null; error: string | null }

export async function createPedido(form: PedidoForm): Promise<ActionResult<Pedido>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  if (!form.items || form.items.length === 0)
    return { data: null, error: 'Nenhum item informado.' }

  const pedidoId = crypto.randomUUID()
  const rows: Record<string, unknown>[] = []
  const stockUpdates: { id: string; novoEstoque: number }[] = []

  for (const item of form.items) {
    const qtd = Number(item.quantidade)
    if (!Number.isInteger(qtd) || qtd < 1)
      return { data: null, error: 'Quantidade inválida em um dos itens.' }

    let preco_unitario = item.preco_unitario
    let custo_unitario = item.custo_unitario
    let nome_item      = item.nome_item ?? null

    if (item.produto_id) {
      const { data: prod, error: pe } = await supabase
        .from('produtos')
        .select('id, nome, preco_venda, custo, estoque')
        .eq('id', item.produto_id)
        .single()

      if (pe || !prod) return { data: null, error: 'Produto não encontrado.' }

      if (!preco_unitario) preco_unitario = prod.preco_venda
      if (!custo_unitario) custo_unitario = prod.custo
      if (!nome_item)      nome_item      = prod.nome

      if (!Number.isFinite(preco_unitario) || !Number.isFinite(custo_unitario))
        return { data: null, error: 'Preços do produto inválidos.' }

      if (prod.estoque < qtd)
        return { data: null, error: `Estoque insuficiente para "${prod.nome}". Disponível: ${prod.estoque}.` }

      stockUpdates.push({ id: prod.id, novoEstoque: prod.estoque - qtd })
    }

    if (!Number.isFinite(preco_unitario) || !Number.isFinite(custo_unitario))
      return { data: null, error: 'Preço ou custo inválido em um dos itens.' }

    const valor_total = Math.round(preco_unitario * qtd * 100) / 100
    const lucro       = Math.round((preco_unitario - custo_unitario) * qtd * 100) / 100

    rows.push({
      pedido_id:      pedidoId,
      produto_id:     item.produto_id ?? null,
      nome_item,
      nome_comprador: form.nome_comprador?.trim().slice(0, 120) ?? null,
      cliente_id:     form.cliente_id ?? null,
      quantidade:     qtd,
      preco_unitario,
      custo_unitario,
      valor_total,
      lucro,
      observacoes:    form.observacoes?.trim().slice(0, 300) ?? null,
    })
  }

  const { error: insertError } = await supabase.from('vendas').insert(rows)
  if (insertError) return { data: null, error: 'Erro ao registrar pedido.' }

  for (const su of stockUpdates) {
    await supabase.from('produtos').update({ estoque: su.novoEstoque }).eq('id', su.id)
  }

  const items: PedidoItem[] = rows.map((r, i) => ({
    id:             `tmp-${i}`,
    produto_id:     r.produto_id as string | null,
    nome_item:      r.nome_item  as string | null,
    quantidade:     r.quantidade as number,
    preco_unitario: r.preco_unitario as number,
    custo_unitario: r.custo_unitario as number,
    valor_total:    r.valor_total    as number,
    lucro:          r.lucro          as number,
  }))

  const pedido: Pedido = {
    pedido_id:      pedidoId,
    cliente_id:     form.cliente_id ?? null,
    nome_comprador: form.nome_comprador ?? null,
    created_at:     new Date().toISOString(),
    items,
    valor_total: items.reduce((s, i) => s + i.valor_total, 0),
    custo_total: items.reduce((s, i) => s + i.custo_unitario * i.quantidade, 0),
    lucro_total: items.reduce((s, i) => s + i.lucro, 0),
  }

  return { data: pedido, error: null }
}

export async function getPedidosRecentes(
  limit: number = 20,
  since?: string,
): Promise<ActionResult<Pedido[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  let query = supabase
    .from('vendas')
    .select(`
      id, pedido_id, produto_id, nome_item, nome_comprador, cliente_id,
      quantidade, preco_unitario, custo_unitario, valor_total, lucro, created_at,
      produto:produto_id(id, nome, imagem_url, categoria),
      cliente:cliente_id(id, nome)
    `)
    .not('pedido_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 100) * 6)

  if (since) {
    const sinceDate = new Date(since)
    if (!isNaN(sinceDate.getTime())) query = query.gte('created_at', sinceDate.toISOString())
  }

  const { data: raw, error } = await query
  if (error) return { data: null, error: 'Erro ao buscar pedidos.' }

  const map = new Map<string, Pedido>()
  for (const row of (raw ?? [])) {
    const pid = row.pedido_id as string
    if (!map.has(pid)) {
      map.set(pid, {
        pedido_id:      pid,
        cliente_id:     row.cliente_id,
        nome_comprador: row.nome_comprador,
        created_at:     row.created_at,
        items:          [],
        valor_total:    0,
        custo_total:    0,
        lucro_total:    0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cliente: row.cliente as any,
      })
    }
    const pedido = map.get(pid)!
    const item: PedidoItem = {
      id:             row.id,
      produto_id:     row.produto_id,
      nome_item:      row.nome_item,
      quantidade:     row.quantidade,
      preco_unitario: row.preco_unitario,
      custo_unitario: row.custo_unitario,
      valor_total:    row.valor_total,
      lucro:          row.lucro,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      produto: row.produto as any,
    }
    pedido.items.push(item)
    pedido.valor_total += row.valor_total
    pedido.custo_total += row.custo_unitario * row.quantidade
    pedido.lucro_total += row.lucro
  }

  return { data: Array.from(map.values()).slice(0, Math.min(limit, 100)), error: null }
}

export async function deletePedido(pedido_id: string): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const { data: items, error: fetchError } = await supabase
    .from('vendas').select('produto_id, quantidade').eq('pedido_id', pedido_id)

  if (fetchError) return { data: null, error: 'Erro ao buscar itens do pedido.' }

  const { error: delError } = await supabase.from('vendas').delete().eq('pedido_id', pedido_id)
  if (delError) return { data: null, error: 'Erro ao excluir pedido.' }

  for (const item of (items ?? [])) {
    if (!item.produto_id) continue
    const { data: prod } = await supabase
      .from('produtos').select('estoque').eq('id', item.produto_id).single()
    if (prod) {
      await supabase.from('produtos')
        .update({ estoque: prod.estoque + item.quantidade }).eq('id', item.produto_id)
    }
  }

  return { data: null, error: null }
}
