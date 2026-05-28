'use server'

import { createClient } from '@/lib/supabase/server'
import type { Cliente, ClienteForm } from '@/types'

type ActionResult<T> = { data: T | null; error: string | null }

/**
 * Fetch all clients with computed stats from the view.
 * Stats include total_compras, total_gasto, ultima_compra.
 */
export async function getClientes(): Promise<ActionResult<Cliente[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vw_cliente_stats')
    .select('*')
    .order('nome', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data as Cliente[], error: null }
}

/**
 * Insert a new client.
 */
export async function createCliente(
  formData: ClienteForm
): Promise<ActionResult<Cliente>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nome: formData.nome,
      telefone: formData.telefone ?? null,
      cpf: formData.cpf ?? null,
      instagram: formData.instagram ?? null,
      cidade: formData.cidade ?? null,
      observacoes: formData.observacoes ?? null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Cliente, error: null }
}

/**
 * Update a client by id.
 */
export async function updateCliente(
  id: string,
  formData: Partial<ClienteForm>
): Promise<ActionResult<Cliente>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clientes')
    .update(formData)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Cliente, error: null }
}

/**
 * Delete a client by id.
 * Sales with this client_id will have cliente_id set to NULL (on delete set null).
 */
export async function deleteCliente(
  id: string
): Promise<ActionResult<boolean>> {
  const supabase = await createClient()

  const { error } = await supabase.from('clientes').delete().eq('id', id)

  if (error) return { data: null, error: error.message }
  return { data: true, error: null }
}
