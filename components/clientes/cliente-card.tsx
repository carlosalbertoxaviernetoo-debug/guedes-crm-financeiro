'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone, MapPin, AtSign, ShoppingBag,
  Calendar, Edit2, Trash2, MessageCircle,
} from 'lucide-react'
import { formatCurrency, formatDate, gerarLinkWhatsApp } from '@/lib/utils'
import type { Cliente } from '@/types'

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const GOLD   = '#d4a017'
const GOLD_D = 'rgba(212,160,23,'

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_HUES = [
  '#e11d48','#db2777','#9333ea','#7c3aed',
  '#2563eb','#0891b2','#059669','#ca8a04',
  '#ea580c','#dc2626',
]

function getAvatarColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_HUES[Math.abs(h) % AVATAR_HUES.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ClienteCardProps {
  cliente: Cliente
  onEdit:     (c: Cliente) => void
  onDelete:   (c: Cliente) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClienteCard({ cliente, onEdit, onDelete }: ClienteCardProps) {
  const [hovered,       setHovered]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting,      setDeleting]      = useState(false)

  const isRecorrente = (cliente.total_compras ?? 0) > 1
  const avatarColor  = getAvatarColor(cliente.nome)
  const initials     = getInitials(cliente.nome)

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    onDelete(cliente)
    setConfirmDelete(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={()   => setHovered(false)}
      style={{
        position: 'relative', display: 'flex', flexDirection: 'column',
        borderRadius: 20, overflow: 'hidden', cursor: 'default',
        background: 'linear-gradient(145deg, rgba(13,24,41,0.95) 0%, rgba(8,12,20,0.98) 100%)',
        border: hovered ? `1px solid ${GOLD_D}0.28)` : '1px solid rgba(255,255,255,0.07)',
        boxShadow: hovered
          ? `0 20px 50px rgba(0,0,0,0.55), 0 0 0 1px ${GOLD_D}0.07)`
          : '0 4px 16px rgba(0,0,0,0.35)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Gold shimmer on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute', top: 0, left: 24, right: 24, height: 1,
              background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
              transformOrigin: 'left',
              zIndex: 1,
            }}
          />
        )}
      </AnimatePresence>

      {/* Body */}
      <div style={{ padding: '18px 18px 14px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>

        {/* Header: avatar + name + recorrente badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Avatar */}
          <div style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: isRecorrente
              ? `linear-gradient(135deg, ${GOLD}, #f5c842)`
              : avatarColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isRecorrente ? '#080c14' : '#fff',
            fontWeight: 900, fontSize: 15,
            boxShadow: isRecorrente ? `0 4px 12px ${GOLD_D}0.3)` : 'none',
          }}>
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cliente.nome}
              </h3>
              {isRecorrente && (
                <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', background: GOLD_D + '0.12)', border: `1px solid ${GOLD_D}0.3)`, color: GOLD }}>
                  Recorrente
                </span>
              )}
            </div>

            {/* Contact info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 5 }}>
              {cliente.telefone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Phone style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{cliente.telefone}</span>
                </div>
              )}
              {cliente.cidade && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{cliente.cidade}</span>
                </div>
              )}
              {cliente.instagram && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <AtSign style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                    {cliente.instagram.startsWith('@') ? cliente.instagram : `@${cliente.instagram}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, marginBottom: 4 }}>Compras</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              <ShoppingBag style={{ width: 10, height: 10, color: GOLD }} />
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>
                {cliente.total_compras ?? 0}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, marginBottom: 4 }}>Total gasto</p>
            <span style={{ color: GOLD, fontSize: 12, fontWeight: 900 }}>
              {formatCurrency(cliente.total_gasto ?? 0)}
            </span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, marginBottom: 4 }}>Última</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              <Calendar style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.3)' }} />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600 }}>
                {cliente.ultima_compra ? formatDate(cliente.ultima_compra) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Observações */}
        {cliente.observacoes && (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontStyle: 'italic', margin: 0, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {cliente.observacoes}
          </p>
        )}
      </div>

      {/* Footer actions */}
      <div style={{ padding: '10px 18px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>

        {/* WhatsApp */}
        {cliente.telefone && (
          <motion.a
            href={gerarLinkWhatsApp(cliente.telefone)}
            target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.96 }}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              height: 34, borderRadius: 10, textDecoration: 'none',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.25)',
              color: '#22c55e', fontSize: 11, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}
          >
            <MessageCircle style={{ width: 12, height: 12 }} />
            WhatsApp
          </motion.a>
        )}

        {/* Edit */}
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => onEdit(cliente)}
          style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
          title="Editar cliente"
        >
          <Edit2 style={{ width: 13, height: 13 }} />
        </motion.button>

        {/* Delete */}
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={handleDelete}
          disabled={deleting}
          style={confirmDelete
            ? { width: 34, height: 34, borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }
            : { width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }
          }
          title={confirmDelete ? 'Confirmar exclusão?' : 'Excluir cliente'}
        >
          {deleting
            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent' }} />
            : <Trash2 style={{ width: 13, height: 13 }} />
          }
        </motion.button>
      </div>
    </motion.div>
  )
}
