import { Suspense } from 'react'
import { getProdutosComStats } from '@/lib/actions/produtos'
import { ProdutosClient } from '@/components/produtos/produtos-client'

export const dynamic = 'force-dynamic'

export default async function ProdutosPage() {
  return (
    <Suspense fallback={<ProdutosSkeleton />}>
      <ProdutosContent />
    </Suspense>
  )
}

async function ProdutosContent() {
  const { data: produtos, error } = await getProdutosComStats()

  if (error || !produtos) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Erro ao carregar produtos. Tente recarregar a página.
        </p>
      </div>
    )
  }

  return <ProdutosClient initialProdutos={produtos} />
}

function ProdutosSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 rounded-xl bg-white/5" />
        <div className="h-10 w-36 rounded-xl bg-white/5" />
      </div>
      <div className="h-10 rounded-xl bg-white/5" />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-72 rounded-2xl bg-white/3" style={{ border: '1px solid rgba(255,255,255,0.05)' }} />
        ))}
      </div>
    </div>
  )
}
