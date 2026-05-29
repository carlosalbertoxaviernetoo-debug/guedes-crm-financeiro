'use server'

import { createClient } from '@/lib/supabase/server'
import type { Anotacao, AnotacaoForm } from '@/types'

type ActionResult<T> = { data: T | null; error: string | null }

export async function getAnotacoes(): Promise<ActionResult<Anotacao[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('anotacoes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data as Anotacao[], error: null }
}

export async function createAnotacao(form: AnotacaoForm): Promise<ActionResult<Anotacao>> {
  if (!form.titulo?.trim()) return { data: null, error: 'Título é obrigatório.' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('anotacoes')
    .insert({
      titulo:   form.titulo.trim(),
      conteudo: form.conteudo?.trim() ?? '',
      tipo:     form.tipo ?? 'observacao',
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Anotacao, error: null }
}

export async function updateAnotacao(
  id: string,
  form: AnotacaoForm,
): Promise<ActionResult<Anotacao>> {
  if (!form.titulo?.trim()) return { data: null, error: 'Título é obrigatório.' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('anotacoes')
    .update({
      titulo:   form.titulo.trim(),
      conteudo: form.conteudo?.trim() ?? '',
      tipo:     form.tipo ?? 'observacao',
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Anotacao, error: null }
}

export async function deleteAnotacao(id: string): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const { error } = await supabase.from('anotacoes').delete().eq('id', id)
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}
