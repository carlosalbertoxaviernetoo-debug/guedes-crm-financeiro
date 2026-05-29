import { Suspense } from 'react'
import { getClientes } from '@/lib/actions/clientes'
import { ClientesClient } from '@/components/clientes/clientes-client'

export const dynamic = 'force-dynamic'

export default async function ClientesPage() {
  return (
    <Suspense fallback={<ClientesSkeleton />}>
      <ClientesContent />
    </Suspense>
  )
}

async function ClientesContent() {
  const { data: clientes, error } = await getClientes()

  if (error || !clientes) {
    return (
      <div
        className="flex items-center justify-center h-64 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Erro ao carregar clientes. Tente recarregar a página.
        </p>
      </div>
    )
  }

  return <ClientesClient initialClientes={clientes} />
}

function ClientesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded-xl bg-white/5" />
        <div className="h-10 w-36 rounded-xl bg-white/5" />
      </div>
      <div className="h-10 rounded-xl bg-white/5" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-56 rounded-2xl bg-white/3"
            style={{ border: '1px solid rgba(255,255,255,0.05)' }} />
        ))}
      </div>
    </div>
  )
}
