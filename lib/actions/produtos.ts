'use server'

import { createClient } from '@/lib/supabase/server'
import type { Produto, ProdutoForm } from '@/types'

type ActionResult<T> = { data: T | null; error: string | null }

/**
 * Fetch all products ordered by name.
 */
export async function getProdutos(): Promise<ActionResult<Produto[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .order('nome', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data as Produto[], error: null }
}

/**
 * Insert a new product.
 */
export async function createProduto(
  formData: ProdutoForm
): Promise<ActionResult<Produto>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('produtos')
    .insert({
      nome: formData.nome,
      imagem_url: formData.imagem_url ?? null,
      custo: formData.custo,
      preco_venda: formData.preco_venda,
      estoque: formData.estoque,
      categoria: formData.categoria ?? null,
      descricao: formData.descricao ?? null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Produto, error: null }
}

/**
 * Update a product by id.
 */
export async function updateProduto(
  id: string,
  formData: Partial<ProdutoForm>
): Promise<ActionResult<Produto>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('produtos')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Produto, error: null }
}

/**
 * Delete a product by id.
 * Refuses if there are existing sales referencing this product.
 */
export async function deleteProduto(
  id: string
): Promise<ActionResult<boolean>> {
  const supabase = await createClient()

  // Verify no sales exist for this product
  const { count, error: countError } = await supabase
    .from('vendas')
    .select('id', { count: 'exact', head: true })
    .eq('produto_id', id)

  if (countError) return { data: null, error: countError.message }

  if ((count ?? 0) > 0) {
    return {
      data: null,
      error:
        'Não é possível excluir este produto pois existem vendas vinculadas a ele.',
    }
  }

  const { error } = await supabase.from('produtos').delete().eq('id', id)

  if (error) return { data: null, error: error.message }
  return { data: true, error: null }
}

/**
 * Fetch all products with aggregated sales stats:
 * total_vendido (total units sold) and lucro_total (total profit).
 */
export async function getProdutosComStats(): Promise<
  ActionResult<
    (Produto & { total_vendido: number; lucro_total: number })[]
  >
> {
  const supabase = await createClient()

  // Fetch products
  const { data: produtos, error: prodError } = await supabase
    .from('produtos')
    .select('*')
    .order('nome', { ascending: true })

  if (prodError) return { data: null, error: prodError.message }

  // Fetch aggregated sales per product
  const { data: statsRaw, error: statsError } = await supabase
    .from('vendas')
    .select('produto_id, quantidade, lucro')

  if (statsError) return { data: null, error: statsError.message }

  // Aggregate in JS to avoid relying on PostgREST grouping
  const statsMap = new Map<
    string,
    { total_vendido: number; lucro_total: number }
  >()

  for (const row of statsRaw ?? []) {
    const existing = statsMap.get(row.produto_id) ?? {
      total_vendido: 0,
      lucro_total: 0,
    }
    statsMap.set(row.produto_id, {
      total_vendido: existing.total_vendido + (row.quantidade as number),
      lucro_total: existing.lucro_total + (row.lucro as number),
    })
  }

  const result = (produtos as Produto[]).map((p) => {
    const s = statsMap.get(p.id) ?? { total_vendido: 0, lucro_total: 0 }
    return {
      ...p,
      total_vendido: s.total_vendido,
      lucro_total: s.lucro_total,
    }
  })

  return { data: result, error: null }
}
