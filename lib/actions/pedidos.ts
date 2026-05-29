'use server'

import { createClient } from '@/lib/supabase/server'
import type { Pedido, PedidoForm, PedidoItem } from '@/types'

type ActionResult<T> = { data: T | null; error: string | null }

/**
 * Create an order with one or more items.
 * - Items with produto_id: decrements stock, uses product's stored price/cost
 * - Items without produto_id: manual entry (nome_item + custom price/cost)
 * - Cliente: either by cliente_id or nome_comprador (free text)
 */
export async function createPedido(form: PedidoForm): Promise<ActionResult<Pedido>> {
  const supabase = await createClient()

  if (!form.items || form.items.length === 0) {
    return { data: null, error: 'Nenhum item informado.' }
  }

  // Generate a shared pedido_id for all items in this order
  const pedidoId = crypto.randomUUID()

  // Validate and enrich items with produto data
  const rows: Record<string, unknown>[] = []
  const stockUpdates: { id: string; novoEstoque: number }[] = []

  for (const item of form.items) {
    let preco_unitario = item.preco_unitario
    let custo_unitario = item.custo_unitario
    let nome_item = item.nome_item ?? null

    if (item.produto_id) {
      // Fetch product to get up-to-date stock
      const { data: prod, error: pe } = await supabase
        .from('produtos')
        .select('id, nome, preco_venda, custo, estoque')
        .eq('id', item.produto_id)
        .single()

      if (pe || !prod) return { data: null, error: `Produto não encontrado: ${item.produto_id}` }

      // Use product's stored price/cost if caller didn't override
      if (!preco_unitario) preco_unitario = prod.preco_venda
      if (!custo_unitario) custo_unitario = prod.custo
      if (!nome_item)      nome_item      = prod.nome

      if (prod.estoque < item.quantidade) {
        return {
          data: null,
          error: `Estoque insuficiente para "${prod.nome}". Disponível: ${prod.estoque}.`,
        }
      }
      stockUpdates.push({ id: prod.id, novoEstoque: prod.estoque - item.quantidade })
    }

    const qtd = item.quantidade
    const valor_total = Math.round(preco_unitario * qtd * 100) / 100
    const lucro       = Math.round((preco_unitario - custo_unitario) * qtd * 100) / 100

    rows.push({
      pedido_id:      pedidoId,
      produto_id:     item.produto_id ?? null,
      nome_item,
      nome_comprador: form.nome_comprador ?? null,
      cliente_id:     form.cliente_id ?? null,
      quantidade:     qtd,
      preco_unitario,
      custo_unitario,
      valor_total,
      lucro,
      observacoes:    form.observacoes ?? null,
    })
  }

  // Insert all items
  const { error: insertError } = await supabase.from('vendas').insert(rows)
  if (insertError) return { data: null, error: insertError.message }

  // Decrement stock for products
  for (const su of stockUpdates) {
    await supabase.from('produtos').update({ estoque: su.novoEstoque }).eq('id', su.id)
  }

  // Return the order summary
  const items: PedidoItem[] = rows.map((r, i) => ({
    id: `tmp-${i}`,
    produto_id: r.produto_id as string | null,
    nome_item:  r.nome_item  as string | null,
    quantidade: r.quantidade as number,
    preco_unitario: r.preco_unitario as number,
    custo_unitario: r.custo_unitario as number,
    valor_total:    r.valor_total    as number,
    lucro:          r.lucro          as number,
  }))

  const pedido: Pedido = {
    pedido_id:     pedidoId,
    cliente_id:    form.cliente_id ?? null,
    nome_comprador: form.nome_comprador ?? null,
    created_at:    new Date().toISOString(),
    items,
    valor_total: items.reduce((s, i) => s + i.valor_total, 0),
    custo_total: items.reduce((s, i) => s + i.custo_unitario * i.quantidade, 0),
    lucro_total: items.reduce((s, i) => s + i.lucro, 0),
  }

  return { data: pedido, error: null }
}

/**
 * Fetch recent orders grouped by pedido_id.
 * Returns them newest-first.
 * @param limit  Max number of distinct orders to return
 * @param since  Optional ISO timestamp — only return orders created at or after this time
 */
export async function getPedidosRecentes(
  limit: number = 20,
  since?: string,
): Promise<ActionResult<Pedido[]>> {
  const supabase = await createClient()

  // Get the most recent pedido_ids
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
    .limit(limit * 6) // fetch extra since we'll group

  if (since) query = query.gte('created_at', since)

  const { data: raw, error } = await query

  if (error) return { data: null, error: error.message }

  // Group by pedido_id
  const map = new Map<string, Pedido>()
  for (const row of (raw ?? [])) {
    const pid = row.pedido_id as string
    if (!map.has(pid)) {
      map.set(pid, {
        pedido_id:     pid,
        cliente_id:    row.cliente_id,
        nome_comprador: row.nome_comprador,
        created_at:    row.created_at,
        items:         [],
        valor_total:   0,
        custo_total:   0,
        lucro_total:   0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cliente:       row.cliente as any,
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
      produto:        row.produto as any,
    }
    pedido.items.push(item)
    pedido.valor_total  += row.valor_total
    pedido.custo_total  += row.custo_unitario * row.quantidade
    pedido.lucro_total  += row.lucro
  }

  // Keep only the first `limit` distinct pedidos
  const pedidos = Array.from(map.values()).slice(0, limit)
  return { data: pedidos, error: null }
}

/**
 * Delete an entire order (all items) and restore stock.
 */
export async function deletePedido(pedido_id: string): Promise<ActionResult<null>> {
  const supabase = await createClient()

  // Fetch items to restore stock
  const { data: items, error: fetchError } = await supabase
    .from('vendas')
    .select('produto_id, quantidade')
    .eq('pedido_id', pedido_id)

  if (fetchError) return { data: null, error: fetchError.message }

  // Delete items
  const { error: delError } = await supabase
    .from('vendas').delete().eq('pedido_id', pedido_id)
  if (delError) return { data: null, error: delError.message }

  // Restore stock
  for (const item of (items ?? [])) {
    if (!item.produto_id) continue
    const { data: prod } = await supabase
      .from('produtos').select('estoque').eq('id', item.produto_id).single()
    if (prod) {
      await supabase.from('produtos')
        .update({ estoque: prod.estoque + item.quantidade })
        .eq('id', item.produto_id)
    }
  }

  return { data: null, error: null }
}
