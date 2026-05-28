'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Trash2, ShoppingCart, Package, TrendingUp, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent, calcMargem, calcLucroUnitario } from '@/lib/utils'
import { deleteProduto } from '@/lib/actions/produtos'
import type { Produto } from '@/types'

interface ProdutoCardProps {
  produto: Produto & { total_vendido?: number; lucro_total?: number }
  onEdit: (produto: Produto) => void
  onVenda: (produto: Produto) => void
  onDeleted: (id: string) => void
}

function StockBadge({ estoque }: { estoque: number }) {
  if (estoque === 0) {
    return (
      <Badge variant="destructive" dot>
        Sem estoque
      </Badge>
    )
  }
  if (estoque <= 5) {
    return (
      <Badge variant="warning" dot>
        {estoque} un. (baixo)
      </Badge>
    )
  }
  return (
    <Badge variant="success" dot>
      {estoque} un.
    </Badge>
  )
}

function getCategoryBadgeVariant(categoria?: string | null) {
  const map: Record<string, 'blue' | 'purple' | 'orange' | 'muted'> = {
    Roupa: 'blue',
    Calçado: 'purple',
    Acessório: 'orange',
    Eletrônico: 'blue',
  }
  return (categoria && map[categoria]) || 'muted'
}

export function ProdutoCard({ produto, onEdit, onVenda, onDeleted }: ProdutoCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const margem = calcMargem(produto.custo, produto.preco_venda)
  const lucro = calcLucroUnitario(produto.custo, produto.preco_venda)

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      // Auto-cancel confirmation after 3s
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    setDeleting(true)
    const { error } = await deleteProduto(produto.id)
    setDeleting(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Produto excluído com sucesso')
      onDeleted(produto.id)
    }
    setConfirmDelete(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
    >
      <Card className="flex flex-col h-full overflow-hidden border-border hover:border-border/60 hover:shadow-lg transition-all duration-200">
        {/* Product image */}
        <div className="relative h-44 bg-muted shrink-0 overflow-hidden">
          {produto.imagem_url ? (
            <Image
              src={produto.imagem_url}
              alt={produto.nome}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground/40">
              <Package className="w-12 h-12" />
              <span className="text-xs">Sem imagem</span>
            </div>
          )}
          {/* Stock overlay badge */}
          {produto.estoque <= 5 && (
            <div className="absolute top-2 right-2">
              <span
                className={[
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shadow',
                  produto.estoque === 0
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-yellow-500 text-white',
                ].join(' ')}
              >
                <AlertTriangle className="w-3 h-3" />
                {produto.estoque === 0 ? 'Esgotado' : `${produto.estoque} restantes`}
              </span>
            </div>
          )}
        </div>

        <CardContent className="flex flex-col gap-3 flex-1 pt-4">
          {/* Name + category */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2 flex-1">
              {produto.nome}
            </h3>
            {produto.categoria && (
              <Badge variant={getCategoryBadgeVariant(produto.categoria)} size="sm" className="shrink-0">
                {produto.categoria}
              </Badge>
            )}
          </div>

          {/* Pricing grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/60 rounded-lg p-2.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                Custo
              </p>
              <p className="text-sm font-semibold text-foreground">{formatCurrency(produto.custo)}</p>
            </div>
            <div className="bg-brand-muted rounded-lg p-2.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                Preço
              </p>
              <p className="text-sm font-semibold text-brand">{formatCurrency(produto.preco_venda)}</p>
            </div>
          </div>

          {/* Margin row */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5 text-brand" />
              <span>
                Lucro unitário:{' '}
                <span className="font-semibold text-foreground">{formatCurrency(lucro)}</span>
              </span>
            </div>
            <Badge
              variant={margem >= 30 ? 'success' : margem >= 15 ? 'warning' : 'destructive'}
              size="sm"
            >
              {formatPercent(margem)}
            </Badge>
          </div>

          {/* Stock indicator */}
          <div className="flex items-center justify-between">
            <StockBadge estoque={produto.estoque} />
            {(produto.total_vendido ?? 0) > 0 && (
              <span className="text-xs text-muted-foreground">
                {produto.total_vendido} vendidos
              </span>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex gap-2 pt-3 border-t border-border">
          <Button
            variant="brand"
            size="sm"
            className="flex-1 gap-1.5 text-xs"
            onClick={() => onVenda(produto)}
            disabled={produto.estoque === 0}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Venda Rápida
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onEdit(produto)}
            title="Editar produto"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={confirmDelete ? 'destructive' : 'ghost'}
            size="icon-sm"
            onClick={handleDelete}
            loading={deleting}
            title={confirmDelete ? 'Clique novamente para confirmar' : 'Excluir produto'}
            className={confirmDelete ? '' : 'text-muted-foreground hover:text-destructive'}
          >
            {!deleting && <Trash2 className="w-3.5 h-3.5" />}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
