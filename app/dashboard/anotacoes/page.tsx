import { getAnotacoes } from '@/lib/actions/anotacoes'
import { AnotacoesClient } from '@/components/anotacoes/anotacoes-client'

export const dynamic = 'force-dynamic'

export default async function AnotacoesPage() {
  const { data: anotacoes } = await getAnotacoes()
  return <AnotacoesClient initialAnotacoes={anotacoes ?? []} />
}
