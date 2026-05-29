'use server'

import { createClient } from '@/lib/supabase/server'
import type { Produto, ProdutoForm } from '@/types'

type ActionResult<T> = { data: T | null; error: string | null }

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

/**
 * Fetch all products ordered by name.
 */
export async function getProdutos(): Promise<ActionResult<Produto[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .order('nome', { ascending: true })

  if (error) return { data: null, error: 'Erro ao buscar produtos.' }
  return { data: data as Produto[], error: null }
}

/**
 * Insert a new product.
 */
export async function createProduto(
  formData: ProdutoForm
): Promise<ActionResult<Produto>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const custo = Number(formData.custo)
  const preco = Number(formData.preco_venda)
  const estoque = Number(formData.estoque)

  if (!Number.isFinite(custo) || custo < 0)        return { data: null, error: 'Custo inválido.' }
  if (!Number.isFinite(preco) || preco < 0)         return { data: null, error: 'Preço inválido.' }
  if (!Number.isInteger(estoque) || estoque < 0)    return { data: null, error: 'Estoque inválido.' }

  const { data, error } = await supabase
    .from('produtos')
    .insert({
      nome:        formData.nome?.trim().slice(0, 120) ?? '',
      imagem_url:  formData.imagem_url ?? null,
      custo,
      preco_venda: preco,
      estoque,
      categoria:   formData.categoria?.trim().slice(0, 60)   ?? null,
      descricao:   formData.descricao?.trim().slice(0, 500)  ?? null,
    })
    .select()
    .single()

  if (error) return { data: null, error: 'Erro ao criar produto.' }
  return { data: data as Produto, error: null }
}

/**
 * Update a product by id — explicit field whitelist (prevents mass assignment).
 */
export async function updateProduto(
  id: string,
  formData: Partial<ProdutoForm>
): Promise<ActionResult<Produto>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  // Explicit whitelist — never spread formData directly
  const payload: Record<string, unknown> = {}
  if (formData.nome        !== undefined) payload.nome        = formData.nome?.trim().slice(0, 120)
  if (formData.imagem_url  !== undefined) payload.imagem_url  = formData.imagem_url ?? null
  if (formData.categoria   !== undefined) payload.categoria   = formData.categoria?.trim().slice(0, 60)  ?? null
  if (formData.descricao   !== undefined) payload.descricao   = formData.descricao?.trim().slice(0, 500) ?? null

  if (formData.custo !== undefined) {
    const v = Number(formData.custo)
    if (!Number.isFinite(v) || v < 0) return { data: null, error: 'Custo inválido.' }
    payload.custo = v
  }
  if (formData.preco_venda !== undefined) {
    const v = Number(formData.preco_venda)
    if (!Number.isFinite(v) || v < 0) return { data: null, error: 'Preço inválido.' }
    payload.preco_venda = v
  }
  if (formData.estoque !== undefined) {
    const v = Number(formData.estoque)
    if (!Number.isInteger(v) || v < 0) return { data: null, error: 'Estoque inválido.' }
    payload.estoque = v
  }

  const { data, error } = await supabase
    .from('produtos')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: 'Erro ao atualizar produto.' }
  return { data: data as Produto, error: null }
}

/**
 * Delete a product by id.
 */
export async function deleteProduto(
  id: string
): Promise<ActionResult<boolean>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const { count, error: countError } = await supabase
    .from('vendas')
    .select('id', { count: 'exact', head: true })
    .eq('produto_id', id)

  if (countError) return { data: null, error: 'Erro ao verificar vendas vinculadas.' }

  if ((count ?? 0) > 0) {
    return {
      data: null,
      error: 'Não é possível excluir este produto pois existem vendas vinculadas a ele.',
    }
  }

  const { error } = await supabase.from('produtos').delete().eq('id', id)

  if (error) return { data: null, error: 'Erro ao excluir produto.' }
  return { data: true, error: null }
}

/**
 * Fetch all products with aggregated sales stats.
 */
export async function getProdutosComStats(): Promise<
  ActionResult<(Produto & { total_vendido: number; lucro_total: number })[]>
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const { data: produtos, error: prodError } = await supabase
    .from('produtos')
    .select('*')
    .order('nome', { ascending: true })

  if (prodError) return { data: null, error: 'Erro ao buscar produtos.' }

  const { data: statsRaw, error: statsError } = await supabase
    .from('vendas')
    .select('produto_id, quantidade, lucro')

  if (statsError) return { data: null, error: 'Erro ao buscar estatísticas.' }

  const statsMap = new Map<string, { total_vendido: number; lucro_total: number }>()
  for (const row of statsRaw ?? []) {
    const existing = statsMap.get(row.produto_id) ?? { total_vendido: 0, lucro_total: 0 }
    statsMap.set(row.produto_id, {
      total_vendido: existing.total_vendido + (row.quantidade as number),
      lucro_total:   existing.lucro_total   + (row.lucro       as number),
    })
  }

  const result = (produtos as Produto[]).map((p) => {
    const s = statsMap.get(p.id) ?? { total_vendido: 0, lucro_total: 0 }
    return { ...p, ...s }
  })

  return { data: result, error: null }
}

/**
 * Upload a product image to Supabase Storage.
 * Validates MIME type against an explicit allowlist.
 */
export async function uploadProdutoImagem(
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { url: null, error: 'Não autorizado.' }

  const file = formData.get('file') as File | null

  if (!file || file.size === 0)         return { url: null, error: 'Nenhum arquivo selecionado.' }
  if (file.size > 5 * 1024 * 1024)     return { url: null, error: 'Imagem muito grande (máx 5 MB).' }
  if (!ALLOWED_MIME.has(file.type))     return { url: null, error: 'Formato inválido. Use JPEG, PNG, WebP ou GIF.' }

  // Use a safe extension derived from the validated MIME type (not from filename)
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png':  'png',
    'image/webp': 'webp',
    'image/gif':  'gif',
  }
  const ext  = mimeToExt[file.type] ?? 'jpg'
  const path = `produtos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from('produto-imagens')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) return { url: null, error: 'Erro ao fazer upload da imagem.' }

  const { data: urlData } = supabase.storage
    .from('produto-imagens')
    .getPublicUrl(data.path)

  return { url: urlData.publicUrl, error: null }
}
