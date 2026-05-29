'use server'

import { createClient } from '@/lib/supabase/server'
import type { Cliente, ClienteForm } from '@/types'

type ActionResult<T> = { data: T | null; error: string | null }

/**
 * Fetch all clients with computed stats from the view.
 */
export async function getClientes(): Promise<ActionResult<Cliente[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const { data, error } = await supabase
    .from('vw_cliente_stats')
    .select('*')
    .order('nome', { ascending: true })

  if (error) return { data: null, error: 'Erro ao buscar clientes.' }
  return { data: data as Cliente[], error: null }
}

/**
 * Insert a new client.
 */
export async function createCliente(
  formData: ClienteForm
): Promise<ActionResult<Cliente>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nome:        formData.nome?.trim().slice(0, 120) ?? '',
      telefone:    formData.telefone?.trim().slice(0, 20)    ?? null,
      cpf:         formData.cpf?.trim().slice(0, 14)         ?? null,
      instagram:   formData.instagram?.trim().slice(0, 60)   ?? null,
      cidade:      formData.cidade?.trim().slice(0, 80)      ?? null,
      observacoes: formData.observacoes?.trim().slice(0, 500) ?? null,
    })
    .select()
    .single()

  if (error) return { data: null, error: 'Erro ao criar cliente.' }
  return { data: data as Cliente, error: null }
}

/**
 * Update a client by id — explicit field whitelist (prevents mass assignment).
 */
export async function updateCliente(
  id: string,
  formData: Partial<ClienteForm>
): Promise<ActionResult<Cliente>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  // Explicit whitelist — never spread formData directly
  const payload: Record<string, unknown> = {}
  if (formData.nome        !== undefined) payload.nome        = formData.nome?.trim().slice(0, 120)
  if (formData.telefone    !== undefined) payload.telefone    = formData.telefone?.trim().slice(0, 20)    ?? null
  if (formData.cpf         !== undefined) payload.cpf         = formData.cpf?.trim().slice(0, 14)         ?? null
  if (formData.instagram   !== undefined) payload.instagram   = formData.instagram?.trim().slice(0, 60)   ?? null
  if (formData.cidade      !== undefined) payload.cidade      = formData.cidade?.trim().slice(0, 80)      ?? null
  if (formData.observacoes !== undefined) payload.observacoes = formData.observacoes?.trim().slice(0, 500) ?? null

  const { data, error } = await supabase
    .from('clientes')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: 'Erro ao atualizar cliente.' }
  return { data: data as Cliente, error: null }
}

/**
 * Delete a client by id.
 */
export async function deleteCliente(
  id: string
): Promise<ActionResult<boolean>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const { error } = await supabase.from('clientes').delete().eq('id', id)

  if (error) return { data: null, error: 'Erro ao excluir cliente.' }
  return { data: true, error: null }
}
