'use server'

import { createClient } from '@/lib/supabase/server'
import { getStartOfMonth, getEndOfMonth } from '@/lib/utils'
import type { Venda, VendaForm } from '@/types'

type ActionResult<T> = { data: T | null; error: string | null }

export async function getVendas(
  mes?: number,
  ano?: number
): Promise<ActionResult<Venda[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const start = getStartOfMonth(mes, ano)
  const end   = getEndOfMonth(mes, ano)

  const { data, error } = await supabase
    .from('vw_vendas_completas')
    .select('*')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: 'Erro ao buscar vendas.' }

  const vendas: Venda[] = (data ?? []).map((row) => ({
    id:             row.id,
    produto_id:     row.produto_id,
    cliente_id:     row.cliente_id,
    quantidade:     row.quantidade,
    preco_unitario: row.preco_unitario,
    custo_unitario: row.custo_unitario,
    valor_total:    row.valor_total,
    lucro:          row.lucro,
    observacoes:    row.observacoes,
    created_at:     row.created_at,
    produto: row.produto_id ? {
      id:          row.produto_id,
      nome:        row.produto_nome,
      imagem_url:  row.produto_imagem_url,
      categoria:   row.produto_categoria,
      custo:       row.custo_unitario,
      preco_venda: row.preco_unitario,
      estoque:     0,
      created_at:  '',
      updated_at:  '',
    } : undefined,
    cliente: row.cliente_id ? {
      id:        row.cliente_id,
      nome:      row.cliente_nome,
      telefone:  row.cliente_telefone,
      cidade:    row.cliente_cidade,
      created_at: '',
    } : undefined,
  }))

  return { data: vendas, error: null }
}

export async function createVenda(
  formData: VendaForm
): Promise<ActionResult<Venda>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const qtd = Number(formData.quantidade)
  if (!Number.isInteger(qtd) || qtd < 1) return { data: null, error: 'Quantidade inválida.' }

  const { data: produto, error: prodError } = await supabase
    .from('produtos')
    .select('id, preco_venda, custo, estoque')
    .eq('id', formData.produto_id)
    .single()

  if (prodError || !produto)
    return { data: null, error: 'Produto não encontrado.' }

  if (produto.estoque < qtd)
    return { data: null, error: `Estoque insuficiente. Disponível: ${produto.estoque} unidade(s).` }

  const precoCents = Math.round(produto.preco_venda * 100)
  const custoCents = Math.round(produto.custo * 100)

  const preco_unitario = precoCents / 100
  const custo_unitario = custoCents / 100
  const valor_total    = Math.round(precoCents * qtd) / 100
  const lucro          = Math.round((precoCents - custoCents) * qtd) / 100

  const { data: venda, error: vendaError } = await supabase
    .from('vendas')
    .insert({
      produto_id:     formData.produto_id,
      cliente_id:     formData.cliente_id ?? null,
      quantidade:     qtd,
      preco_unitario,
      custo_unitario,
      valor_total,
      lucro,
      observacoes:    formData.observacoes?.trim().slice(0, 300) ?? null,
    })
    .select()
    .single()

  if (vendaError) return { data: null, error: 'Erro ao registrar venda.' }

  const { error: estoqueError } = await supabase
    .from('produtos')
    .update({ estoque: produto.estoque - qtd })
    .eq('id', formData.produto_id)

  if (estoqueError) {
    await supabase.from('vendas').delete().eq('id', venda.id)
    return { data: null, error: 'Erro ao atualizar estoque. Venda cancelada.' }
  }

  return { data: venda as Venda, error: null }
}

export async function deleteVenda(
  id: string
): Promise<ActionResult<boolean>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const { data: venda, error: fetchError } = await supabase
    .from('vendas')
    .select('produto_id, quantidade')
    .eq('id', id)
    .single()

  if (fetchError || !venda)
    return { data: null, error: 'Venda não encontrada.' }

  const { error: deleteError } = await supabase.from('vendas').delete().eq('id', id)
  if (deleteError) return { data: null, error: 'Erro ao excluir venda.' }

  const { data: produto } = await supabase
    .from('produtos')
    .select('estoque')
    .eq('id', venda.produto_id)
    .single()

  if (produto) {
    await supabase
      .from('produtos')
      .update({ estoque: produto.estoque + venda.quantidade })
      .eq('id', venda.produto_id)
  }

  return { data: true, error: null }
}

export async function getVendasRecentes(
  limit: number = 10
): Promise<ActionResult<Venda[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const { data, error } = await supabase
    .from('vw_vendas_completas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 100))

  if (error) return { data: null, error: 'Erro ao buscar vendas recentes.' }

  const vendas: Venda[] = (data ?? []).map((row) => ({
    id:             row.id,
    produto_id:     row.produto_id,
    cliente_id:     row.cliente_id,
    quantidade:     row.quantidade,
    preco_unitario: row.preco_unitario,
    custo_unitario: row.custo_unitario,
    valor_total:    row.valor_total,
    lucro:          row.lucro,
    observacoes:    row.observacoes,
    created_at:     row.created_at,
    produto: row.produto_id ? {
      id:          row.produto_id,
      nome:        row.produto_nome,
      imagem_url:  row.produto_imagem_url,
      categoria:   row.produto_categoria,
      custo:       row.custo_unitario,
      preco_venda: row.preco_unitario,
      estoque:     0,
      created_at:  '',
      updated_at:  '',
    } : undefined,
    cliente: row.cliente_id ? {
      id:         row.cliente_id,
      nome:       row.cliente_nome,
      telefone:   row.cliente_telefone,
      cidade:     row.cliente_cidade,
      created_at: '',
    } : undefined,
  }))

  return { data: vendas, error: null }
}
