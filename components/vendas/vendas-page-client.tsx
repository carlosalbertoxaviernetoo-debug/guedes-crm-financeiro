'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Download, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { VendasTable } from './vendas-table'
import { formatCurrency, MESES_NOMES } from '@/lib/utils'
import type { Venda } from '@/types'

interface VendasPageClientProps {
  initialVendas: Venda[]
  currentMes: number
  currentAno: number
}

export function VendasPageClient({
  initialVendas,
  currentMes,
  currentAno,
}: VendasPageClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function navigate(mes: number, ano: number) {
    startTransition(() => {
      router.push(`/dashboard/vendas?mes=${mes}&ano=${ano}`)
    })
  }

  function prevMonth() {
    if (currentMes === 1) {
      navigate(12, currentAno - 1)
    } else {
      navigate(currentMes - 1, currentAno)
    }
  }

  function nextMonth() {
    const now = new Date()
    const isCurrentMonth =
      currentMes === now.getMonth() + 1 && currentAno === now.getFullYear()
    if (isCurrentMonth) return

    if (currentMes === 12) {
      navigate(1, currentAno + 1)
    } else {
      navigate(currentMes + 1, currentAno)
    }
  }

  const now = new Date()
  const isCurrentMonth =
    currentMes === now.getMonth() + 1 && currentAno === now.getFullYear()

  function exportPDF() {
    try {
      // Dynamic import to avoid SSR issues
      import('jspdf').then(({ default: jsPDF }) => {
        import('jspdf-autotable').then(() => {
          const doc = new jsPDF()

          // Header
          doc.setFontSize(18)
          doc.setTextColor(40, 40, 40)
          doc.text('Relatório de Vendas', 14, 22)

          doc.setFontSize(11)
          doc.setTextColor(100, 100, 100)
          doc.text(
            `Período: ${MESES_NOMES[currentMes - 1]} ${currentAno}`,
            14,
            32
          )

          // Stats summary
          const faturamento = initialVendas.reduce((s, v) => s + v.valor_total, 0)
          const lucro = initialVendas.reduce((s, v) => s + v.lucro, 0)
          doc.text(
            `Total: ${initialVendas.length} vendas | Faturamento: ${formatCurrency(faturamento)} | Lucro: ${formatCurrency(lucro)}`,
            14,
            40
          )

          // Table data
          const rows = initialVendas.map((v) => [
            new Date(v.created_at).toLocaleString('pt-BR'),
            v.produto?.nome ?? '—',
            v.cliente?.nome ?? '—',
            String(v.quantidade),
            formatCurrency(v.valor_total),
            formatCurrency(v.lucro),
          ])

          // @ts-expect-error jspdf-autotable augments jsPDF prototype
          doc.autoTable({
            startY: 48,
            head: [['Data/Hora', 'Produto', 'Cliente', 'Qtd.', 'Total', 'Lucro']],
            body: rows,
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [22, 163, 74], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
          })

          doc.save(`vendas-${currentAno}-${String(currentMes).padStart(2, '0')}.pdf`)
          toast.success('PDF exportado com sucesso!')
        })
      })
    } catch {
      toast.error('Erro ao gerar PDF')
    }
  }

  function exportExcel() {
    try {
      import('xlsx').then((XLSX) => {
        const faturamento = initialVendas.reduce((s, v) => s + v.valor_total, 0)
        const lucro = initialVendas.reduce((s, v) => s + v.lucro, 0)

        const rows = initialVendas.map((v) => ({
          'Data/Hora': new Date(v.created_at).toLocaleString('pt-BR'),
          Produto: v.produto?.nome ?? '—',
          Cliente: v.cliente?.nome ?? '—',
          Quantidade: v.quantidade,
          'Preço Unit.': v.preco_unitario,
          'Total (R$)': v.valor_total,
          'Lucro (R$)': v.lucro,
        }))

        // Summary row
        rows.push({
          'Data/Hora': 'TOTAL',
          Produto: '',
          Cliente: `${initialVendas.length} vendas`,
          Quantidade: initialVendas.reduce((s, v) => s + v.quantidade, 0),
          'Preço Unit.': 0,
          'Total (R$)': faturamento,
          'Lucro (R$)': lucro,
        })

        const ws = XLSX.utils.json_to_sheet(rows)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Vendas')
        XLSX.writeFile(
          wb,
          `vendas-${currentAno}-${String(currentMes).padStart(2, '0')}.xlsx`
        )
        toast.success('Excel exportado com sucesso!')
      })
    } catch {
      toast.error('Erro ao gerar Excel')
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: period selector + export buttons */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Period navigator */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={prevMonth}
            disabled={isPending}
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-md border border-border bg-card min-w-[160px] justify-center">
            {isPending ? (
              <div className="flex gap-1 items-center">
                <div className="w-3 h-3 rounded-full bg-brand animate-pulse" />
                <span className="text-sm text-muted-foreground">Carregando...</span>
              </div>
            ) : (
              <span className="text-sm font-semibold text-foreground capitalize">
                {MESES_NOMES[currentMes - 1]} {currentAno}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={nextMonth}
            disabled={isPending || isCurrentMonth}
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          {!isCurrentMonth && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(now.getMonth() + 1, now.getFullYear())}
              disabled={isPending}
              className="text-xs text-muted-foreground"
            >
              Mês atual
            </Button>
          )}
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportPDF}
            disabled={initialVendas.length === 0}
            className="gap-1.5 text-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportExcel}
            disabled={initialVendas.length === 0}
            className="gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      <VendasTable initialVendas={initialVendas} />
    </div>
  )
}
