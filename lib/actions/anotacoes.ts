'use server'

import { createClient } from '@/lib/supabase/server'
import type { Anotacao, AnotacaoForm, AnotacaoTipo } from '@/types'

type ActionResult<T> = { data: T | null; error: string | null }

const TIPOS_VALIDOS: AnotacaoTipo[] = ['observacao', 'produto', 'investimento', 'ideia', 'tarefa', 'outro']

export async function getAnotacoes(): Promise<ActionResult<Anotacao[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const { data, error } = await supabase
    .from('anotacoes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: 'Erro ao buscar anotações.' }
  return { data: data as Anotacao[], error: null }
}

export async function createAnotacao(form: AnotacaoForm): Promise<ActionResult<Anotacao>> {
  if (!form.titulo?.trim()) return { data: null, error: 'Título é obrigatório.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const tipo: AnotacaoTipo = TIPOS_VALIDOS.includes(form.tipo as AnotacaoTipo)
    ? (form.tipo as AnotacaoTipo)
    : 'observacao'

  const { data, error } = await supabase
    .from('anotacoes')
    .insert({
      titulo:   form.titulo.trim().slice(0, 120),
      conteudo: form.conteudo?.trim().slice(0, 2000) ?? '',
      tipo,
    })
    .select()
    .single()

  if (error) return { data: null, error: 'Erro ao criar anotação.' }
  return { data: data as Anotacao, error: null }
}

export async function updateAnotacao(
  id: string,
  form: AnotacaoForm,
): Promise<ActionResult<Anotacao>> {
  if (!form.titulo?.trim()) return { data: null, error: 'Título é obrigatório.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const tipo: AnotacaoTipo = TIPOS_VALIDOS.includes(form.tipo as AnotacaoTipo)
    ? (form.tipo as AnotacaoTipo)
    : 'observacao'

  const { data, error } = await supabase
    .from('anotacoes')
    .update({
      titulo:   form.titulo.trim().slice(0, 120),
      conteudo: form.conteudo?.trim().slice(0, 2000) ?? '',
      tipo,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: 'Erro ao atualizar anotação.' }
  return { data: data as Anotacao, error: null }
}

export async function deleteAnotacao(id: string): Promise<ActionResult<null>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Não autorizado.' }

  const { error } = await supabase.from('anotacoes').delete().eq('id', id)
  if (error) return { data: null, error: 'Erro ao excluir anotação.' }
  return { data: null, error: null }
}
