'use server'

import { createClient } from '@/lib/supabase/server'
import { getStartOfMonth, getEndOfMonth } from '@/lib/utils'
import type { Venda, VendaForm } from '@/types'

type ActionResult<T> = { data: T | null; error: string | null }

/**
 * Fetch sales for a given period (defaults to current month).
 * Joins produto and cliente via the vw_vendas_completas view.
 */
export async function getVendas(
  mes?: number,
  ano?: number
): Promise<ActionResult<Venda[]>> {
  const supabase = await createClient()

  const start = getStartOfMonth(mes, ano)
  const end = getEndOfMonth(mes, ano)

  const { data, error } = await supabase
    .from('vw_vendas_completas')
    .select('*')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  // Map the flat view columns back to the nested Venda shape
  const vendas: Venda[] = (data ?? []).map((row) => ({
    id: row.id,
    produto_id: row.produto_id,
    cliente_id: row.cliente_id,
    quantidade: row.quantidade,
    preco_unitario: row.preco_unitario,
    custo_unitario: row.custo_unitario,
    valor_total: row.valor_total,
    lucro: row.lucro,
    observacoes: row.observacoes,
    created_at: row.created_at,
    produto: row.produto_id
      ? {
          id: row.produto_id,
          nome: row.produto_nome,
          imagem_url: row.produto_imagem_url,
          categoria: row.produto_categoria,
          custo: row.custo_unitario,
          preco_venda: row.preco_unitario,
          estoque: 0,
          created_at: '',
          updated_at: '',
        }
      : undefined,
    cliente: row.cliente_id
      ? {
          id: row.cliente_id,
          nome: row.cliente_nome,
          telefone: row.cliente_telefone,
          cidade: row.cliente_cidade,
          created_at: '',
        }
      : undefined,
  }))

  return { data: vendas, error: null }
}

/**
 * Create a new sale atomically:
 *  1. Fetch the product to get current price/cost and stock.
 *  2. Calculate all monetary fields.
 *  3. Insert the venda record.
 *  4. Decrement the product stock.
 */
export async function createVenda(
  formData: VendaForm
): Promise<ActionResult<Venda>> {
  const supabase = await createClient()

  // Step 1: Fetch produto
  const { data: produto, error: prodError } = await supabase
    .from('produtos')
    .select('id, preco_venda, custo, estoque')
    .eq('id', formData.produto_id)
    .single()

  if (prodError || !produto) {
    return { data: null, error: prodError?.message ?? 'Produto não encontrado.' }
  }

  if (produto.estoque < formData.quantidade) {
    return {
      data: null,
      error: `Estoque insuficiente. Disponível: ${produto.estoque} unidade(s).`,
    }
  }

  // Step 2: Precise calculations using integer arithmetic (cents)
  const precoCents = Math.round(produto.preco_venda * 100)
  const custoCents = Math.round(produto.custo * 100)
  const qtd = formData.quantidade

  const preco_unitario = precoCents / 100
  const custo_unitario = custoCents / 100
  const valor_total = Math.round(precoCents * qtd) / 100
  const lucro = Math.round((precoCents - custoCents) * qtd) / 100

  // Step 3: Insert venda
  const { data: venda, error: vendaError } = await supabase
    .from('vendas')
    .insert({
      produto_id: formData.produto_id,
      cliente_id: formData.cliente_id ?? null,
      quantidade: qtd,
      preco_unitario,
      custo_unitario,
      valor_total,
      lucro,
      observacoes: formData.observacoes ?? null,
    })
    .select()
    .single()

  if (vendaError) return { data: null, error: vendaError.message }

  // Step 4: Decrement estoque
  const { error: estoqueError } = await supabase
    .from('produtos')
    .update({ estoque: produto.estoque - qtd })
    .eq('id', formData.produto_id)

  if (estoqueError) {
    // Rollback the inserted venda to keep data consistent
    await supabase.from('vendas').delete().eq('id', venda.id)
    return {
      data: null,
      error: `Erro ao atualizar estoque: ${estoqueError.message}`,
    }
  }

  return { data: venda as Venda, error: null }
}

/**
 * Delete a sale and restore the product stock.
 */
export async function deleteVenda(
  id: string
): Promise<ActionResult<boolean>> {
  const supabase = await createClient()

  // Fetch the venda first so we know how much stock to restore
  const { data: venda, error: fetchError } = await supabase
    .from('vendas')
    .select('produto_id, quantidade')
    .eq('id', id)
    .single()

  if (fetchError || !venda) {
    return { data: null, error: fetchError?.message ?? 'Venda não encontrada.' }
  }

  // Delete the venda record
  const { error: deleteError } = await supabase
    .from('vendas')
    .delete()
    .eq('id', id)

  if (deleteError) return { data: null, error: deleteError.message }

  // Restore product stock
  const { data: produto, error: prodFetchError } = await supabase
    .from('produtos')
    .select('estoque')
    .eq('id', venda.produto_id)
    .single()

  if (!prodFetchError && produto) {
    await supabase
      .from('produtos')
      .update({ estoque: produto.estoque + venda.quantidade })
      .eq('id', venda.produto_id)
  }

  return { data: true, error: null }
}

/**
 * Fetch the N most recent sales joined with produto and cliente.
 */
export async function getVendasRecentes(
  limit: number = 10
): Promise<ActionResult<Venda[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vw_vendas_completas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: null, error: error.message }

  const vendas: Venda[] = (data ?? []).map((row) => ({
    id: row.id,
    produto_id: row.produto_id,
    cliente_id: row.cliente_id,
    quantidade: row.quantidade,
    preco_unitario: row.preco_unitario,
    custo_unitario: row.custo_unitario,
    valor_total: row.valor_total,
    lucro: row.lucro,
    observacoes: row.observacoes,
    created_at: row.created_at,
    produto: row.produto_id
      ? {
          id: row.produto_id,
          nome: row.produto_nome,
          imagem_url: row.produto_imagem_url,
          categoria: row.produto_categoria,
          custo: row.custo_unitario,
          preco_venda: row.preco_unitario,
          estoque: 0,
          created_at: '',
          updated_at: '',
        }
      : undefined,
    cliente: row.cliente_id
      ? {
          id: row.cliente_id,
          nome: row.cliente_nome,
          telefone: row.cliente_telefone,
          cidade: row.cliente_cidade,
          created_at: '',
        }
      : undefined,
  }))

  return { data: vendas, error: null }
}
