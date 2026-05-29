'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, Trash2, User, Package,
  ChevronDown, ChevronUp, Clock,
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { deletePedido } from '@/lib/actions/pedidos'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type { Pedido } from '@/types'

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const GOLD   = '#d4a017'
const GOLD_D = 'rgba(212,160,23,'
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

// ─── DeleteButton ─────────────────────────────────────────────────────────────

function DeleteButton({
  onConfirm,
  loading,
}: {
  onConfirm: () => void
  loading: boolean
}) {
  const [confirm, setConfirm] = useState(false)

  function handleClick() {
    if (!confirm) {
      setConfirm(true)
      setTimeout(() => setConfirm(false), 3000)
      return
    }
    onConfirm()
    setConfirm(false)
  }

  return (
    <motion.button
      whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.92 }}
      onClick={handleClick}
      disabled={loading}
      title={confirm ? 'Confirmar exclusão?' : 'Excluir pedido'}
      style={{
        width: 30, height: 30, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: confirm ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
        border: confirm ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(255,255,255,0.08)',
        color: confirm ? '#ef4444' : 'rgba(255,255,255,0.3)',
        transition: 'all 0.15s',
      }}
    >
      {loading
        ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent' }} />
        : <Trash2 style={{ width: 12, height: 12 }} />
      }
    </motion.button>
  )
}

// ─── PedidoCard ───────────────────────────────────────────────────────────────

function PedidoCard({
  pedido,
  onDeleted,
}: {
  pedido: Pedido
  onDeleted: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const { error } = await deletePedido(pedido.pedido_id)
    setDeleting(false)
    if (error) { toast.error(error); return }
    toast.success('Pedido removido e estoque restaurado.')
    onDeleted(pedido.pedido_id)
  }

  const buyerName =
    pedido.cliente?.nome ??
    pedido.nome_comprador ??
    'Cliente não identificado'

  // Mini image thumbnails (up to 4)
  const thumbnails = pedido.items.slice(0, 4)
  const extraCount = pedido.items.length - 4

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ duration: 0.28, ease: EASE }}
      style={{
        borderRadius: 16,
        background: 'linear-gradient(145deg, rgba(13,24,41,0.95) 0%, rgba(8,12,20,0.98) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        overflow: 'hidden',
      }}
    >
      {/* Card header row */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Product thumbnails */}
        <div style={{ display: 'flex', flexShrink: 0 }}>
          {thumbnails.map((item, i) => (
            <div
              key={item.id}
              style={{
                width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                position: 'relative',
                marginLeft: i > 0 ? -10 : 0,
                zIndex: thumbnails.length - i,
              }}
            >
              {item.produto?.imagem_url ? (
                <Image
                  src={item.produto.imagem_url}
                  alt={item.produto.nome ?? ''}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="36px"
                />
              ) : (
                <Package style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.2)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
              )}
            </div>
          ))}
          {extraCount > 0 && (
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -10, zIndex: 0, flexShrink: 0 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }}>
                +{extraCount}
              </span>
            </div>
          )}
        </div>

        {/* Buyer + date */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <User style={{ width: 11, height: 11, color: GOLD_D + '0.7)', flexShrink: 0 }} />
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {buyerName}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Clock style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.25)' }} />
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>
              {formatDateTime(pedido.created_at)}
            </p>
          </div>
        </div>

        {/* Lucro + delete */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Lucro</p>
            <p style={{ color: pedido.lucro_total >= 0 ? GOLD : '#ef4444', fontWeight: 900, fontSize: 15, margin: 0 }}>
              {formatCurrency(pedido.lucro_total)}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>
              {formatCurrency(pedido.valor_total)}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <DeleteButton onConfirm={handleDelete} loading={deleting} />
            <motion.button
              whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.92 }}
              onClick={() => setExpanded((v) => !v)}
              style={{ width: 30, height: 30, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
            >
              {expanded
                ? <ChevronUp style={{ width: 12, height: 12 }} />
                : <ChevronDown style={{ width: 12, height: 12 }} />
              }
            </motion.button>
          </div>
        </div>
      </div>

      {/* Expanded items breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pedido.items.map((item) => {
                const lucroItem = item.lucro

                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    {/* Image */}
                    <div style={{ width: 30, height: 30, borderRadius: 7, overflow: 'hidden', flexShrink: 0, position: 'relative', background: 'rgba(255,255,255,0.04)' }}>
                      {item.produto?.imagem_url ? (
                        <Image src={item.produto.imagem_url} alt={item.nome_item ?? ''} fill style={{ objectFit: 'cover' }} sizes="30px" />
                      ) : (
                        <Package style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.2)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                      )}
                    </div>

                    {/* Name + qty */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#fff', fontSize: 12, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.nome_item ?? item.produto?.nome ?? '—'}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>
                        {item.quantidade}×
                      </p>
                    </div>

                    {/* Cost / Price / Profit */}
                    <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Custo</p>
                        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 600, margin: 0 }}>
                          {formatCurrency(item.custo_unitario * item.quantidade)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Venda</p>
                        <p style={{ color: GOLD, fontSize: 12, fontWeight: 700, margin: 0 }}>
                          {formatCurrency(item.valor_total)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Lucro</p>
                        <p style={{ color: lucroItem >= 0 ? '#22c55e' : '#ef4444', fontSize: 12, fontWeight: 700, margin: 0 }}>
                          {formatCurrency(lucroItem)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Summary row */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                  Total: <span style={{ color: '#fff', fontWeight: 700 }}>{formatCurrency(pedido.valor_total)}</span>
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                  Lucro líquido: <span style={{ color: GOLD, fontWeight: 900 }}>{formatCurrency(pedido.lucro_total)}</span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── PedidosRecentes ──────────────────────────────────────────────────────────

interface PedidosRecentesProps {
  initialPedidos: Pedido[]
}

export function PedidosRecentes({ initialPedidos }: PedidosRecentesProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>(initialPedidos)

  const handleDeleted = useCallback((id: string) => {
    setPedidos((prev) => prev.filter((p) => p.pedido_id !== id))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg, ${GOLD}, #f5c842)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag style={{ width: 15, height: 15, color: '#080c14' }} />
          </div>
          <div>
            <h3 style={{ color: '#fff', fontWeight: 900, fontSize: 15, margin: 0 }}>
              Pedidos Recentes
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>
              Lucro líquido por produto · mais novo primeiro
            </p>
          </div>
        </div>
        <span style={{ padding: '3px 10px', borderRadius: 20, background: GOLD_D + '0.1)', border: `1px solid ${GOLD_D}0.25)`, color: GOLD, fontSize: 11, fontWeight: 700 }}>
          {pedidos.length}
        </span>
      </div>

      {/* Cards */}
      {pedidos.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <ShoppingBag style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.1)' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, margin: 0 }}>
            Nenhum pedido registrado ainda
          </p>
          <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 12, margin: 0 }}>
            Relate vendas na aba de Produtos
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AnimatePresence mode="popLayout">
            {pedidos.map((pedido) => (
              <PedidoCard
                key={pedido.pedido_id}
                pedido={pedido}
                onDeleted={handleDeleted}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
