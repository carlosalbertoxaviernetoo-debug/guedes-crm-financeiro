'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Phone,
  MapPin,
  AtSign,
  ShoppingBag,
  Calendar,
  Pencil,
  Trash2,
  MessageCircle,
  ChevronDown,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate, gerarLinkWhatsApp } from '@/lib/utils'
import type { Cliente } from '@/types'

// ---------------------------------------------------------------------------
// Deterministic avatar color from name
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  'bg-rose-500',
  'bg-pink-500',
  'bg-fuchsia-500',
  'bg-purple-500',
  'bg-violet-500',
  'bg-indigo-500',
  'bg-blue-500',
  'bg-sky-500',
  'bg-cyan-500',
  'bg-teal-500',
  'bg-emerald-500',
  'bg-green-500',
  'bg-lime-600',
  'bg-yellow-600',
  'bg-amber-600',
  'bg-orange-500',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ClienteCardProps {
  cliente: Cliente
  onEdit: (cliente: Cliente) => void
  onDelete: (cliente: Cliente) => void
  onWhatsApp: (cliente: Cliente) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClienteCard({ cliente, onEdit, onDelete, onWhatsApp }: ClienteCardProps) {
  const [whatsDropOpen, setWhatsDropOpen] = useState(false)

  const isRecorrente = (cliente.total_compras ?? 0) > 1
  const avatarColor = getAvatarColor(cliente.nome)
  const initials = getInitials(cliente.nome)

  function handleOpenWhatsApp() {
    window.open(gerarLinkWhatsApp(cliente.telefone ?? ''), '_blank')
    setWhatsDropOpen(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group relative flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md hover:border-border/60 transition-all duration-200"
    >
      {/* Header: Avatar + name + badges */}
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white font-semibold text-sm shadow-sm ${avatarColor}`}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground truncate">{cliente.nome}</h3>
            {isRecorrente && (
              <Badge variant="success" dot>
                Recorrente
              </Badge>
            )}
          </div>

          <div className="mt-1 flex flex-col gap-0.5">
            {cliente.telefone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3 w-3 shrink-0" />
                {cliente.telefone}
              </p>
            )}
            {cliente.cidade && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3 w-3 shrink-0" />
                {cliente.cidade}
              </p>
            )}
            {cliente.instagram && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <AtSign className="h-3 w-3 shrink-0" />
                {cliente.instagram.startsWith('@') ? cliente.instagram : `@${cliente.instagram}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-muted-foreground leading-none mb-1">Compras</p>
          <p className="text-sm font-semibold text-foreground flex items-center justify-center gap-1">
            <ShoppingBag className="h-3 w-3 text-brand" />
            {cliente.total_compras ?? 0}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground leading-none mb-1">Total gasto</p>
          <p className="text-sm font-semibold text-brand">
            {formatCurrency(cliente.total_gasto ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground leading-none mb-1">Última compra</p>
          <p className="text-xs font-medium text-foreground flex items-center justify-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            {cliente.ultima_compra ? formatDate(cliente.ultima_compra) : '—'}
          </p>
        </div>
      </div>

      {/* Observacoes */}
      {cliente.observacoes && (
        <p className="text-xs text-muted-foreground italic line-clamp-2 border-t border-border pt-3">
          {cliente.observacoes}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        {/* WhatsApp dropdown */}
        {cliente.telefone && (
          <div className="relative">
            <div className="flex items-center rounded-md overflow-hidden border border-border">
              <button
                onClick={handleOpenWhatsApp}
                className="flex items-center gap-1.5 px-3 h-8 text-xs font-medium text-foreground bg-card hover:bg-accent transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5 text-green-500" />
                WhatsApp
              </button>
              <button
                onClick={() => setWhatsDropOpen((v) => !v)}
                className="flex items-center justify-center w-7 h-8 border-l border-border bg-card hover:bg-accent transition-colors"
              >
                <ChevronDown className={`h-3 w-3 transition-transform ${whatsDropOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {whatsDropOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setWhatsDropOpen(false)}
                />
                <div className="absolute top-full left-0 mt-1 z-20 w-52 rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
                  <button
                    onClick={handleOpenWhatsApp}
                    className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors"
                  >
                    Abrir conversa
                  </button>
                  <button
                    onClick={() => {
                      setWhatsDropOpen(false)
                      onWhatsApp(cliente)
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors"
                  >
                    Enviar mensagem personalizada
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => onEdit(cliente)}
            title="Editar cliente"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => onDelete(cliente)}
            title="Excluir cliente"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
