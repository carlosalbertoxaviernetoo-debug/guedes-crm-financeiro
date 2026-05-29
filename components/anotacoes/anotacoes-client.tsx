'use client'

import { useState, useTransition, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import {
  StickyNote, Package, TrendingUp, Lightbulb,
  CheckSquare, Pin, Plus, X, Pencil, Trash2,
  Loader2, Search, BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import { createAnotacao, updateAnotacao, deleteAnotacao } from '@/lib/actions/anotacoes'
import { formatDateTime } from '@/lib/utils'
import type { Anotacao, AnotacaoForm, AnotacaoTipo } from '@/types'

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const GOLD   = '#d4a017'
const GOLD_D = 'rgba(212,160,23,'
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

// ─── Tipo config ──────────────────────────────────────────────────────────────

const TIPOS: Record<AnotacaoTipo, { label: string; color: string; icon: React.ElementType }> = {
  observacao:   { label: 'Observação',    color: GOLD,                      icon: StickyNote  },
  produto:      { label: 'Produtos',      color: '#3b82f6',                  icon: Package     },
  investimento: { label: 'Investimento',  color: '#22c55e',                  icon: TrendingUp  },
  ideia:        { label: 'Ideia',         color: '#a855f7',                  icon: Lightbulb   },
  tarefa:       { label: 'Tarefa',        color: '#f97316',                  icon: CheckSquare },
  outro:        { label: 'Outro',         color: 'rgba(255,255,255,0.5)',    icon: Pin         },
}

const TIPOS_KEYS = Object.keys(TIPOS) as AnotacaoTipo[]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LABEL: React.CSSProperties = {
  color: 'rgba(255,255,255,0.38)', fontSize: 10, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.15em',
}

function inputStyle(hasError = false): React.CSSProperties {
  return {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${hasError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10, padding: '0 14px', color: '#fff',
    fontSize: 13, outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  }
}

// ─── Delete button ────────────────────────────────────────────────────────────

function DeleteBtn({ onConfirm, loading }: { onConfirm: () => void; loading: boolean }) {
  const [confirm, setConfirm] = useState(false)

  function handle() {
    if (!confirm) { setConfirm(true); setTimeout(() => setConfirm(false), 2800); return }
    onConfirm()
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}
      onClick={handle} disabled={loading} title={confirm ? 'Confirmar exclusão?' : 'Excluir'}
      style={{
        width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center',
        justifyContent: 'center', cursor: 'pointer',
        background: confirm ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
        border: confirm ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.09)',
        color: confirm ? '#ef4444' : 'rgba(255,255,255,0.3)',
        transition: 'all 0.15s',
      }}
    >
      {loading
        ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
            style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent' }} />
        : <Trash2 style={{ width: 11, height: 11 }} />
      }
    </motion.button>
  )
}

// ─── Anotação card ────────────────────────────────────────────────────────────

function AnotacaoCard({
  anotacao, onEdit, onDeleted,
}: {
  anotacao: Anotacao
  onEdit: (a: Anotacao) => void
  onDeleted: (id: string) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const cfg = TIPOS[anotacao.tipo]
  const TipoIcon = cfg.icon

  async function handleDelete() {
    setDeleting(true)
    const { error } = await deleteAnotacao(anotacao.id)
    setDeleting(false)
    if (error) { toast.error(error); return }
    toast.success('Anotação removida.')
    onDeleted(anotacao.id)
  }

  const preview = anotacao.conteudo.length > 120
    ? anotacao.conteudo.slice(0, 120) + '…'
    : anotacao.conteudo

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
      whileHover={{
        y: -3,
        boxShadow: `0 12px 36px rgba(0,0,0,0.5), 0 0 0 1px ${cfg.color}33`,
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: EASE }}
      style={{
        borderRadius: 16,
        background: 'linear-gradient(145deg, rgba(13,24,41,0.97) 0%, rgba(8,12,20,0.99) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden', cursor: 'default',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Colored left accent */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: cfg.color, borderRadius: '3px 0 0 3px' }} />

      {/* Content */}
      <div className="md:p-5" style={{ padding: '16px 16px 14px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Top row: type badge + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 20,
            background: `${cfg.color}18`,
            border: `1px solid ${cfg.color}33`,
          }}>
            <TipoIcon style={{ width: 10, height: 10, color: cfg.color, flexShrink: 0 }} />
            <span style={{ color: cfg.color, fontSize: 10, fontWeight: 700 }}>{cfg.label}</span>
          </div>
          {/* Action buttons — always visible on mobile, hover-revealed on desktop via group */}
          <div style={{ display: 'flex', gap: 5 }}>
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}
              onClick={() => onEdit(anotacao)}
              title="Editar"
              style={{
                width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              <Pencil style={{ width: 11, height: 11 }} />
            </motion.button>
            <DeleteBtn onConfirm={handleDelete} loading={deleting} />
          </div>
        </div>

        {/* Title */}
        <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: 0, lineHeight: 1.3 }}>
          {anotacao.titulo}
        </p>

        {/* Content preview */}
        {anotacao.conteudo && (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {preview}
          </p>
        )}
        {!anotacao.conteudo && (
          <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12, margin: 0, fontStyle: 'italic' }}>
            Sem descrição
          </p>
        )}

        {/* Date/time */}
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 600, margin: 0, marginTop: 'auto', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {formatDateTime(anotacao.created_at)}
          {anotacao.updated_at !== anotacao.created_at && (
            <span style={{ color: 'rgba(255,255,255,0.12)', marginLeft: 6 }}>
              · editado {formatDateTime(anotacao.updated_at)}
            </span>
          )}
        </p>
      </div>
    </motion.div>
  )
}

// ─── Create/Edit modal ────────────────────────────────────────────────────────

function AnotacaoModal({
  open,
  onClose,
  editing,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  editing: Anotacao | null
  onSaved: (a: Anotacao) => void
}) {
  const isEdit = !!editing
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [tipo, setTipo] = useState<AnotacaoTipo>('observacao')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const titleRef = useRef<HTMLInputElement>(null)

  // Populate on open
  function handleOpenChange(v: boolean) {
    if (v) {
      setTitulo(editing?.titulo ?? '')
      setConteudo(editing?.conteudo ?? '')
      setTipo(editing?.tipo ?? 'observacao')
      setError('')
      setTimeout(() => titleRef.current?.focus(), 80)
    } else {
      onClose()
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) { setError('Título é obrigatório.'); return }
    setError('')
    const form: AnotacaoForm = { titulo, conteudo, tipo }

    startTransition(async () => {
      const result = isEdit
        ? await updateAnotacao(editing!.id, form)
        : await createAnotacao(form)

      if (result.error) { toast.error(result.error); return }
      toast.success(isEdit ? 'Anotação atualizada!' : 'Anotação criada!')
      onSaved(result.data!)
      onClose()
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(2,5,12,0.85)', backdropFilter: 'blur(8px)', zIndex: 50 }}
              />
            </Dialog.Overlay>
            <Dialog.Content style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', outline: 'none', pointerEvents: 'none' }}>
              <motion.div
                key="modal"
                initial={{ opacity: 0, y: 28, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.96 }}
                transition={{ duration: 0.3, ease: EASE }}
                style={{
                  width: '100%', maxWidth: 500, maxHeight: '92vh',
                  background: 'linear-gradient(145deg, #0d1829 0%, #080c14 100%)',
                  border: `1px solid ${GOLD_D}0.18)`,
                  borderRadius: 20,
                  boxShadow: `0 36px 90px rgba(0,0,0,0.8), 0 0 0 1px ${GOLD_D}0.06)`,
                  display: 'flex', flexDirection: 'column',
                  pointerEvents: 'auto', overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${GOLD}, #f5c842)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <StickyNote style={{ width: 15, height: 15, color: '#080c14' }} />
                    </div>
                    <div>
                      <Dialog.Title style={{ color: '#fff', fontWeight: 900, fontSize: 16, margin: 0 }}>
                        {isEdit ? 'Editar Anotação' : 'Nova Anotação'}
                      </Dialog.Title>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '2px 0 0' }}>
                        {isEdit ? 'Atualize o conteúdo' : 'Registre uma ideia, observação ou plano'}
                      </p>
                    </div>
                  </div>
                  <Dialog.Close asChild>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <X style={{ width: 13, height: 13 }} />
                    </motion.button>
                  </Dialog.Close>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Tipo chips */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={LABEL}>Categoria</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                        {TIPOS_KEYS.map((t) => {
                          const cfg = TIPOS[t]
                          const TIcon = cfg.icon
                          const active = tipo === t
                          return (
                            <motion.button
                              key={t} type="button"
                              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
                              onClick={() => setTipo(t)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                                background: active ? `${cfg.color}22` : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${active ? `${cfg.color}55` : 'rgba(255,255,255,0.09)'}`,
                                color: active ? cfg.color : 'rgba(255,255,255,0.4)',
                                fontSize: 12, fontWeight: 700,
                                transition: 'all 0.15s',
                              }}
                            >
                              <TIcon style={{ width: 11, height: 11 }} />
                              {cfg.label}
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Título */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={LABEL}>Título <span style={{ color: GOLD }}>*</span></span>
                      <input
                        ref={titleRef}
                        value={titulo}
                        onChange={(e) => { setTitulo(e.target.value); setError('') }}
                        placeholder="Ex: Produtos para comprar em junho"
                        style={{ ...inputStyle(!!error), height: 40 }}
                      />
                      {error && <p style={{ color: '#ef4444', fontSize: 11, margin: 0 }}>{error}</p>}
                    </div>

                    {/* Conteúdo */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={LABEL}>Conteúdo (opcional)</span>
                      <textarea
                        value={conteudo}
                        onChange={(e) => setConteudo(e.target.value)}
                        rows={6}
                        placeholder="Escreva suas observações, ideias ou lista de itens aqui..."
                        style={{ ...inputStyle(), height: 'auto', padding: '12px 14px', resize: 'vertical', lineHeight: 1.6 }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
                    <Dialog.Close asChild>
                      <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        style={{ padding: '9px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        Cancelar
                      </motion.button>
                    </Dialog.Close>
                    <motion.button
                      type="submit" disabled={isPending}
                      whileHover={isPending ? {} : { scale: 1.03, boxShadow: `0 6px 20px ${GOLD_D}0.3)` }}
                      whileTap={isPending ? {} : { scale: 0.97 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7, padding: '9px 22px', borderRadius: 10,
                        background: `linear-gradient(135deg, ${GOLD} 0%, #f5c842 50%, ${GOLD} 100%)`,
                        border: 'none', color: '#080c14', fontSize: 13, fontWeight: 900,
                        cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1,
                      }}
                    >
                      {isPending && <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />}
                      {isEdit ? 'Salvar alterações' : 'Criar anotação'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AnotacoesClientProps {
  initialAnotacoes: Anotacao[]
}

export function AnotacoesClient({ initialAnotacoes }: AnotacoesClientProps) {
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>(initialAnotacoes)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Anotacao | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<AnotacaoTipo | 'todas'>('todas')
  const [search, setSearch] = useState('')

  // Filter
  const filtered = anotacoes
    .filter((a) => filtroTipo === 'todas' || a.tipo === filtroTipo)
    .filter((a) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return a.titulo.toLowerCase().includes(q) || a.conteudo.toLowerCase().includes(q)
    })

  function openCreate() { setEditing(null); setModalOpen(true) }
  function openEdit(a: Anotacao) { setEditing(a); setModalOpen(true) }

  function handleSaved(a: Anotacao) {
    setAnotacoes((prev) => {
      const exists = prev.find((x) => x.id === a.id)
      if (exists) return prev.map((x) => x.id === a.id ? a : x)
      return [a, ...prev]
    })
  }

  function handleDeleted(id: string) {
    setAnotacoes((prev) => prev.filter((a) => a.id !== id))
  }

  // Counts per tipo for filter badges
  const contagemTipo = TIPOS_KEYS.reduce((acc, t) => {
    acc[t] = anotacoes.filter((a) => a.tipo === t).length
    return acc
  }, {} as Record<AnotacaoTipo, number>)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${GOLD}, #f5c842)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen style={{ width: 18, height: 18, color: '#080c14' }} />
          </div>
          <div>
            <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 20, margin: 0 }}>Anotações</h1>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: '3px 0 0' }}>
              {anotacoes.length} anotaç{anotacoes.length !== 1 ? 'ões' : 'ão'} registrada{anotacoes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: `0 6px 24px ${GOLD_D}0.3)` }}
          whileTap={{ scale: 0.96 }}
          onClick={openCreate}
          className="md:h-11"
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 12,
            background: `linear-gradient(135deg, ${GOLD} 0%, #f5c842 50%, ${GOLD} 100%)`,
            border: 'none', color: '#080c14', fontSize: 13, fontWeight: 900, cursor: 'pointer',
            boxShadow: `0 4px 16px ${GOLD_D}0.25)`,
          }}
        >
          <Plus style={{ width: 15, height: 15 }} />
          Nova Anotação
        </motion.button>
      </div>

      {/* ── Search ─────────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título ou conteúdo..."
          className="md:text-base"
          style={{
            width: '100%', height: 40, paddingLeft: 36, paddingRight: 14,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit',
          }}
        />
      </div>

      {/* ── Tipo filter chips ───────────────────────────────── */}
      <div className="md:gap-3 md:flex-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {/* "Todas" chip */}
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
          onClick={() => setFiltroTipo('todas')}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '5px 13px', borderRadius: 20, cursor: 'pointer',
            background: filtroTipo === 'todas' ? `${GOLD_D}0.15)` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${filtroTipo === 'todas' ? `${GOLD_D}0.4)` : 'rgba(255,255,255,0.08)'}`,
            color: filtroTipo === 'todas' ? GOLD : 'rgba(255,255,255,0.4)',
            fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
          }}
        >
          Todas
          <span style={{ padding: '1px 6px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', fontSize: 10 }}>
            {anotacoes.length}
          </span>
        </motion.button>

        {TIPOS_KEYS.map((t) => {
          const cfg = TIPOS[t]
          const TIcon = cfg.icon
          const active = filtroTipo === t
          const count = contagemTipo[t]
          return (
            <motion.button
              key={t}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
              onClick={() => setFiltroTipo(active ? 'todas' : t)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                background: active ? `${cfg.color}22` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? `${cfg.color}55` : 'rgba(255,255,255,0.07)'}`,
                color: active ? cfg.color : 'rgba(255,255,255,0.35)',
                fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                opacity: count === 0 ? 0.45 : 1,
              }}
            >
              <TIcon style={{ width: 10, height: 10 }} />
              {cfg.label}
              {count > 0 && (
                <span style={{ padding: '1px 5px', borderRadius: 10, background: active ? `${cfg.color}30` : 'rgba(255,255,255,0.07)', fontSize: 10 }}>
                  {count}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* ── Notes grid ─────────────────────────────────────── */}
      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              padding: '60px 24px', textAlign: 'center',
              borderRadius: 20, border: `1px dashed ${GOLD_D}0.14)`,
              background: `${GOLD_D}0.025)`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `${GOLD_D}0.08)`, border: `1px solid ${GOLD_D}0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen style={{ width: 22, height: 22, color: `${GOLD_D}0.5)` }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 14, margin: 0 }}>
              {search || filtroTipo !== 'todas' ? 'Nenhuma anotação encontrada' : 'Nenhuma anotação ainda'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 12, margin: 0, maxWidth: 280 }}>
              {search || filtroTipo !== 'todas'
                ? 'Tente ajustar os filtros ou a busca'
                : 'Clique em "Nova Anotação" para registrar sua primeira ideia ou observação'}
            </p>
            {!search && filtroTipo === 'todas' && (
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: `0 6px 20px ${GOLD_D}0.25)` }}
                whileTap={{ scale: 0.96 }}
                onClick={openCreate}
                style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '8px 18px', borderRadius: 10, background: `linear-gradient(135deg, ${GOLD}, #f5c842)`, border: 'none', color: '#080c14', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
              >
                <Plus style={{ width: 13, height: 13 }} />
                Criar primeira anotação
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            className="md:grid-cols-2 lg:grid-cols-3 md:gap-4"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.04, duration: 0.28, ease: EASE } }}
                  exit={{ opacity: 0, scale: 0.92 }}
                >
                  <AnotacaoCard anotacao={a} onEdit={openEdit} onDeleted={handleDeleted} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB mobile ─────────────────────────────────────── */}
      <motion.button
        whileHover={{ scale: 1.08, boxShadow: `0 8px 28px ${GOLD_D}0.4)` }}
        whileTap={{ scale: 0.92 }}
        onClick={openCreate}
        style={{
          position: 'fixed', bottom: 24, right: 20, zIndex: 40,
          width: 52, height: 52, borderRadius: '50%',
          background: `linear-gradient(135deg, ${GOLD}, #f5c842)`,
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 6px 24px ${GOLD_D}0.35)`,
          cursor: 'pointer',
        }}
        title="Nova Anotação"
      >
        <Plus style={{ width: 22, height: 22, color: '#080c14' }} />
      </motion.button>

      {/* ── Modal ──────────────────────────────────────────── */}
      <AnotacaoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        onSaved={handleSaved}
      />
    </div>
  )
}
