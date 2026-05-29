import { Suspense } from 'react'
import { getDashboardMetrics } from '@/lib/actions/dashboard'
import { getPedidosRecentes } from '@/lib/actions/pedidos'
import { getCurrentPeriodo } from '@/lib/actions/periodos'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { PedidosRecentes } from '@/components/dashboard/pedidos-recentes'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

async function DashboardContent() {
  // Fetch period first so we can pass inicio_em to pedidos query
  const periodoResult = await getCurrentPeriodo()
  const periodoStart = periodoResult.data?.inicio_em

  const [metricsResult, pedidosResult] = await Promise.all([
    getDashboardMetrics(),
    getPedidosRecentes(30, periodoStart),
  ])

  const { data: metrics, error: metricsError } = metricsResult
  const { data: pedidos } = pedidosResult

  if (metricsError || !metrics) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
          Erro ao carregar métricas. Tente recarregar.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <DashboardClient metrics={metrics} />
      <PedidosRecentes initialPedidos={pedidos ?? []} />
    </div>
  )
}
