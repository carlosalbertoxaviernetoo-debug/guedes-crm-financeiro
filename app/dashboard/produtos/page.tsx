import { Suspense } from 'react'
import { Package, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react'
import { getProdutosComStats } from '@/lib/actions/produtos'
import { ProdutosClient } from '@/components/produtos/produtos-client'
import { StatCard } from '@/components/ui/stat-card'
import { formatCurrency } from '@/lib/utils'
import type { Produto } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ProdutosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie seu catálogo de produtos e estoque
        </p>
      </div>

      <Suspense fallback={<ProdutosSkeleton />}>
        <ProdutosContent />
      </Suspense>
    </div>
  )
}

async function ProdutosContent() {
  const { data: produtos, error } = await getProdutosComStats()

  if (error || !produtos) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl border border-border bg-card">
        <p className="text-muted-foreground text-sm">
          Erro ao carregar produtos. Tente recarregar a página.
        </p>
      </div>
    )
  }

  // Compute stats
  const totalEstoqueValor = produtos.reduce(
    (sum, p) => sum + p.preco_venda * p.estoque,
    0
  )
  const estoqueBaixo = produtos.filter((p) => p.estoque > 0 && p.estoque <= 5).length
  const semEstoque = produtos.filter((p) => p.estoque === 0).length

  const maisProfitavel: (Produto & { total_vendido: number; lucro_total: number }) | undefined =
    produtos.length > 0
      ? produtos.reduce(
          (best, p) => (p.lucro_total > best.lucro_total ? p : best),
          produtos[0]
        )
      : undefined

  const stats = [
    {
      title: 'Total de Produtos',
      value: String(produtos.length),
      icon: Package,
      iconVariant: 'brand' as const,
      changeLabel: semEstoque > 0 ? `${semEstoque} sem estoque` : 'Todos disponíveis',
    },
    {
      title: 'Valor em Estoque',
      value: formatCurrency(totalEstoqueValor),
      icon: DollarSign,
      iconVariant: 'info' as const,
      changeLabel: 'preço de venda × unidades',
    },
    {
      title: 'Estoque Baixo',
      value: String(estoqueBaixo),
      icon: AlertTriangle,
      iconVariant: estoqueBaixo > 0 ? ('warning' as const) : ('brand' as const),
      changeLabel: estoqueBaixo > 0 ? 'produtos com ≤5 unidades' : 'estoque saudável',
    },
    {
      title: 'Mais Lucrativo',
      value: maisProfitavel?.nome ?? '—',
      icon: TrendingUp,
      iconVariant: 'purple' as const,
      changeLabel: maisProfitavel
        ? formatCurrency(maisProfitavel.lucro_total) + ' lucro total'
        : 'Nenhuma venda ainda',
    },
  ]

  return (
    <>
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard
            key={s.title}
            title={s.title}
            value={s.value}
            icon={s.icon}
            iconVariant={s.iconVariant}
            changeLabel={s.changeLabel}
          />
        ))}
      </div>

      {/* Client interactive section */}
      <ProdutosClient initialProdutos={produtos} />
    </>
  )
}

function ProdutosSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-card border border-border" />
        ))}
      </div>
      {/* Search/filter bar skeleton */}
      <div className="flex gap-3">
        <div className="h-9 flex-1 rounded-md bg-card border border-border" />
        <div className="h-9 w-32 rounded-md bg-card border border-border" />
      </div>
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-72 rounded-xl bg-card border border-border" />
        ))}
      </div>
    </div>
  )
}
