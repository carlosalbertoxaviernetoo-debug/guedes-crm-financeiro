'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  User,
  ShoppingCart,
  FileText,
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { deleteVenda } from '@/lib/actions/vendas'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { Venda } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortKey = 'created_at' | 'produto' | 'cliente' | 'quantidade' | 'valor_total' | 'lucro'
type SortDir = 'asc' | 'desc'

interface VendasTableProps {
  initialVendas: Venda[]
}

// ---------------------------------------------------------------------------
// Column header with sort controls
// ---------------------------------------------------------------------------

function SortableHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
  className?: string
}) {
  const isActive = current === sortKey
  const Icon = isActive ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <th
      className={[
        'px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        <Icon className={['w-3.5 h-3.5 opacity-60', isActive && 'opacity-100 text-brand'].filter(Boolean).join(' ')} />
      </span>
    </th>
  )
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

function VendaRow({
  venda,
  onDeleted,
}: {
  venda: Venda
  onDeleted: (id: string) => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const { error } = await deleteVenda(venda.id)
    setDeleting(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Venda excluída e estoque restaurado')
      onDeleted(venda.id)
    }
    setConfirmOpen(false)
  }

  const margemPercent =
    venda.preco_unitario > 0
      ? ((venda.preco_unitario - venda.custo_unitario) / venda.preco_unitario) * 100
      : 0

  return (
    <>
      <motion.tr
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="group border-b border-border/50 hover:bg-accent/40 transition-colors"
      >
        {/* Data/Hora */}
        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
          {formatDateTime(venda.created_at)}
        </td>

        {/* Produto */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted overflow-hidden shrink-0 relative">
              {venda.produto?.imagem_url ? (
                <Image
                  src={venda.produto.imagem_url}
                  alt={venda.produto?.nome ?? ''}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <Package className="w-4 h-4 text-muted-foreground/50" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate max-w-[160px]">
                {venda.produto?.nome ?? `Produto #${venda.produto_id.slice(0, 6)}`}
              </p>
              {venda.produto?.categoria && (
                <Badge variant="muted" size="sm" className="mt-0.5">
                  {venda.produto.categoria}
                </Badge>
              )}
            </div>
          </div>
        </td>

        {/* Cliente */}
        <td className="px-4 py-3">
          {venda.cliente ? (
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground">{venda.cliente.nome}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground/50">—</span>
          )}
        </td>

        {/* Qty */}
        <td className="px-4 py-3 text-center">
          <span className="inline-flex items-center justify-center w-8 h-7 rounded-md bg-muted text-sm font-semibold text-foreground">
            {venda.quantidade}
          </span>
        </td>

        {/* Total */}
        <td className="px-4 py-3 text-right">
          <span className="text-sm font-semibold text-foreground">
            {formatCurrency(venda.valor_total)}
          </span>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {formatCurrency(venda.preco_unitario)}/un.
          </p>
        </td>

        {/* Lucro */}
        <td className="px-4 py-3 text-right">
          <span
            className={[
              'text-sm font-semibold',
              venda.lucro >= 0 ? 'text-brand' : 'text-destructive',
            ].join(' ')}
          >
            {formatCurrency(venda.lucro)}
          </span>
          <div className="flex justify-end mt-0.5">
            <Badge
              variant={margemPercent >= 30 ? 'success' : margemPercent >= 15 ? 'warning' : 'destructive'}
              size="sm"
            >
              {margemPercent.toFixed(0)}%
            </Badge>
          </div>
        </td>

        {/* Actions */}
        <td className="px-4 py-3 text-right">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setConfirmOpen(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            title="Excluir venda"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </td>
      </motion.tr>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Excluir venda"
        description="Esta ação excluirá a venda e restaurará o estoque do produto. Não pode ser desfeita."
        confirmLabel="Sim, excluir"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function VendasTable({ initialVendas }: VendasTableProps) {
  const [vendas, setVendas] = useState<Venda[]>(initialVendas)
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = useMemo(() => {
    return [...vendas].sort((a, b) => {
      let av: string | number = ''
      let bv: string | number = ''

      switch (sortKey) {
        case 'created_at':
          av = a.created_at
          bv = b.created_at
          break
        case 'produto':
          av = a.produto?.nome?.toLowerCase() ?? ''
          bv = b.produto?.nome?.toLowerCase() ?? ''
          break
        case 'cliente':
          av = a.cliente?.nome?.toLowerCase() ?? ''
          bv = b.cliente?.nome?.toLowerCase() ?? ''
          break
        case 'quantidade':
          av = a.quantidade
          bv = b.quantidade
          break
        case 'valor_total':
          av = a.valor_total
          bv = b.valor_total
          break
        case 'lucro':
          av = a.lucro
          bv = b.lucro
          break
      }

      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [vendas, sortKey, sortDir])

  const handleDeleted = (id: string) => {
    setVendas((prev) => prev.filter((v) => v.id !== id))
  }

  // Totals row
  const totalFaturamento = vendas.reduce((s, v) => s + v.valor_total, 0)
  const totalLucro = vendas.reduce((s, v) => s + v.lucro, 0)
  const totalQtd = vendas.reduce((s, v) => s + v.quantidade, 0)

  if (vendas.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Nenhuma venda encontrada"
        description="Não há vendas registradas para o período selecionado."
        size="md"
      />
    )
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <SortableHeader label="Data/Hora" sortKey="created_at" current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortableHeader label="Produto" sortKey="produto" current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortableHeader label="Cliente" sortKey="cliente" current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortableHeader label="Qtd." sortKey="quantidade" current={sortKey} dir={sortDir} onSort={handleSort} className="text-center" />
              <SortableHeader label="Total" sortKey="valor_total" current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
              <SortableHeader label="Lucro" sortKey="lucro" current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {sorted.map((venda) => (
                <VendaRow key={venda.id} venda={venda} onDeleted={handleDeleted} />
              ))}
            </AnimatePresence>
          </tbody>
          {/* Totals footer */}
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/60">
              <td className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide" colSpan={3}>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Total — {vendas.length} venda{vendas.length !== 1 ? 's' : ''}
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center justify-center w-8 h-7 rounded-md bg-muted text-sm font-semibold text-foreground">
                  {totalQtd}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-sm font-bold text-foreground">
                  {formatCurrency(totalFaturamento)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className={['text-sm font-bold', totalLucro >= 0 ? 'text-brand' : 'text-destructive'].join(' ')}>
                  {formatCurrency(totalLucro)}
                </span>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
