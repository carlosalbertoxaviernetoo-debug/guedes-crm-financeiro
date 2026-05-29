'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit2, Trash2, ShoppingCart, Package, TrendingUp, AlertTriangle, Plus } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { formatCurrency, calcMargem, calcLucroUnitario } from '@/lib/utils'
import { deleteProduto } from '@/lib/actions/produtos'
import type { Produto } from '@/types'

const GOLD   = '#d4a017'
const GOLD_D = 'rgba(212,160,23,'

interface ProdutoCardProps {
  produto: Produto & { total_vendido?: number; lucro_total?: number }
  onEdit: (produto: Produto) => void
  onVenda: (produto: Produto) => void
  onDeleted: (id: string) => void
}

export function ProdutoCard({ produto, onEdit, onVenda, onDeleted }: ProdutoCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [hovered, setHovered] = useState(false)

  const margem   = calcMargem(produto.custo, produto.preco_venda)
  const lucroU   = calcLucroUnitario(produto.custo, produto.preco_venda)
  const semEstoque = produto.estoque === 0
  const baixo      = produto.estoque > 0 && produto.estoque <= 5

  const margemColor = margem >= 30 ? GOLD : margem >= 15 ? '#f59e0b' : '#ef4444'

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    setDeleting(true)
    const { error } = await deleteProduto(produto.id)
    setDeleting(false)
    if (error) { toast.error(error); return }
    toast.success('Produto excluído.')
    onDeleted(produto.id)
    setConfirmDelete(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative flex flex-col rounded-2xl overflow-hidden cursor-default"
      style={{
        background: 'linear-gradient(145deg, rgba(13,24,41,0.95) 0%, rgba(8,12,20,0.98) 100%)',
        border: hovered ? `1px solid ${GOLD_D}0.3)` : '1px solid rgba(255,255,255,0.07)',
        boxShadow: hovered
          ? `0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px ${GOLD_D}0.08)`
          : '0 4px 16px rgba(0,0,0,0.4)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Top gold shimmer on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute top-0 left-6 right-6 h-px origin-left"
            style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
          />
        )}
      </AnimatePresence>

      {/* Image area */}
      <div className="relative h-44 shrink-0 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        {produto.imagem_url ? (
          <Image
            src={produto.imagem_url}
            alt={produto.nome}
            fill
            className="object-cover transition-transform duration-500"
            style={{ transform: hovered ? 'scale(1.06)' : 'scale(1)' }}
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Package className="w-10 h-10" style={{ color: GOLD_D + '0.25)' }} />
          </div>
        )}

        {/* Stock overlay */}
        <AnimatePresence>
          {(semEstoque || baixo) && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
              style={semEstoque
                ? { background: 'rgba(239,68,68,0.9)', color: '#fff' }
                : { background: 'rgba(245,158,11,0.9)', color: '#000' }
              }
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              {semEstoque ? 'Esgotado' : `${produto.estoque} restantes`}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category pill */}
        {produto.categoria && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ background: GOLD_D + '0.85)', color: '#080c14', backdropFilter: 'blur(8px)' }}>
            {produto.categoria}
          </div>
        )}

      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Name */}
        <h3 className="text-sm font-black text-white leading-tight line-clamp-2 tracking-wide">
          {produto.nome}
        </h3>

        {/* Price grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-2.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5"
              style={{ color: 'rgba(255,255,255,0.35)' }}>Custo</p>
            <p className="text-xs font-bold text-white">{formatCurrency(produto.custo)}</p>
          </div>
          <div className="rounded-xl p-2.5"
            style={{ background: GOLD_D + '0.07)', border: `1px solid ${GOLD_D}0.15)` }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5"
              style={{ color: GOLD_D + '0.7)' }}>Venda</p>
            <p className="text-xs font-black" style={{ color: GOLD }}>{formatCurrency(produto.preco_venda)}</p>
          </div>
        </div>

        {/* Margin + profit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" style={{ color: margemColor }} />
            <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Lucro: <span className="text-white">{formatCurrency(lucroU)}</span>
            </span>
          </div>
          <span
            className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
            style={{ background: `${margemColor}18`, color: margemColor, border: `1px solid ${margemColor}30` }}
          >
            {margem.toFixed(0)}%
          </span>
        </div>

        {/* Stock + sold */}
        <div className="flex items-center justify-between pt-1"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{
              color: semEstoque ? '#ef4444' : baixo ? '#f59e0b' : GOLD_D + '0.7)',
            }}
          >
            {semEstoque ? '⚠ Esgotado' : baixo ? `⚠ ${produto.estoque} un.` : `${produto.estoque} un.`}
          </span>
          {(produto.total_vendido ?? 0) > 0 && (
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {produto.total_vendido} vendidos
            </span>
          )}
        </div>
      </div>

      {/* Footer actions — sobe no hover */}
      <motion.div
        animate={{ y: hovered ? -8 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="flex gap-2 px-4 pb-4 pt-0"
      >
        <motion.button
          onClick={() => !semEstoque && onVenda(produto)}
          whileHover={semEstoque ? {} : { scale: 1.02, y: -1 }}
          whileTap={semEstoque ? {} : { scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          disabled={semEstoque}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-[11px] font-black uppercase tracking-wider transition-opacity"
          style={{
            background: semEstoque
              ? 'rgba(255,255,255,0.04)'
              : `linear-gradient(135deg, ${GOLD} 0%, #f5c842 50%, ${GOLD} 100%)`,
            color: semEstoque ? 'rgba(255,255,255,0.2)' : '#080c14',
            boxShadow: semEstoque ? 'none' : `0 4px 14px ${GOLD_D}0.3)`,
            cursor: semEstoque ? 'not-allowed' : 'pointer',
          }}
        >
          <Plus className="w-3 h-3" />
          Relatar Venda
        </motion.button>

        <motion.button
          onClick={() => onEdit(produto)}
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.5)',
          }}
          title="Editar produto"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </motion.button>

        <motion.button
          onClick={handleDelete}
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          disabled={deleting}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={confirmDelete
            ? { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444' }
            : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }
          }
          title={confirmDelete ? 'Confirmar exclusão?' : 'Excluir produto'}
        >
          {deleting
            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="w-3 h-3 rounded-full border-2 border-current border-t-transparent" />
            : <Trash2 className="w-3.5 h-3.5" />
          }
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
