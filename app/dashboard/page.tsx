import { Suspense } from 'react'
import { getDashboardMetrics } from '@/lib/actions/dashboard'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

async function DashboardContent() {
  const { data: metrics, error } = await getDashboardMetrics()

  if (error || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Erro ao carregar métricas. Tente recarregar.</p>
      </div>
    )
  }

  return <DashboardClient metrics={metrics} />
}
