'use client'

import { useState, useMemo, useCallback, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, X, SlidersHorizontal, Repeat2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { deleteCliente } from '@/lib/actions/clientes'
import { ClienteCard } from './cliente-card'
import { ClienteForm } from './cliente-form'
import type { Cliente } from '@/types'

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const GOLD   = '#d4a017'
const GOLD_D = 'rgba(212,160,23,'

// ─── Sort types ───────────────────────────────────────────────────────────────

type SortKey = 'nome' | 'total_gasto' | 'total_compras' | 'ultima_compra'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'nome',           label: 'Nome A→Z'          },
  { value: 'total_gasto',    label: 'Maior gasto'        },
  { value: 'total_compras',  label: 'Mais compras'       },
  { value: 'ultima_compra',  label: 'Compra mais recente'},
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface ClientesClientProps {
  initialClientes: Cliente[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClientesClient({ initialClientes }: ClientesClientProps) {
  const [clientes,       setClientes]       = useState<Cliente[]>(initialClientes)
  const [search,         setSearch]         = useState('')
  const [sortBy,         setSortBy]         = useState<SortKey>('nome')
  const [sortOpen,       setSortOpen]       = useState(false)
  const [recorrentesOnly,setRecorrentesOnly]= useState(false)

  const [formOpen,       setFormOpen]       = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)

  const [, startTransition] = useTransition()

  // ── derived ───────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...clientes]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.nome.toLowerCase().includes(q) ||
          c.telefone?.includes(q) ||
          c.cidade?.toLowerCase().includes(q) ||
          c.instagram?.toLowerCase().includes(q),
      )
    }

    if (recorrentesOnly) {
      list = list.filter((c) => (c.total_compras ?? 0) > 1)
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'nome':          return a.nome.localeCompare(b.nome, 'pt-BR')
        case 'total_gasto':   return (b.total_gasto   ?? 0) - (a.total_gasto   ?? 0)
        case 'total_compras': return (b.total_compras ?? 0) - (a.total_compras ?? 0)
        case 'ultima_compra': return (b.ultima_compra ?? '').localeCompare(a.ultima_compra ?? '')
        default:              return 0
      }
    })

    return list
  }, [clientes, search, sortBy, recorrentesOnly])

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleEdit = useCallback((c: Cliente) => {
    setEditingCliente(c)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback((c: Cliente) => {
    startTransition(async () => {
      const { error } = await deleteCliente(c.id)
      if (error) { toast.error(error); return }
      setClientes((prev) => prev.filter((x) => x.id !== c.id))
      toast.success('Cliente excluído.')
    })
  }, [])

  const handleSaved = useCallback((saved: Cliente) => {
    setClientes((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
  }, [])

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Row: search + sort + recorrentes */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Search */}
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.3)', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, telefone, cidade..."
              className="md:text-base"
              style={{
                width: '100%', height: 40,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 12,
                paddingLeft: 36, paddingRight: search ? 36 : 12,
                color: '#fff', fontSize: 13, outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = GOLD_D + '0.3)')}
              onBlur={(e)  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 2 }}>
                <X style={{ width: 12, height: 12 }} />
              </button>
            )}
          </div>

          {/* Recorrentes toggle */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setRecorrentesOnly((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, height: 40,
              padding: '0 14px', borderRadius: 12, cursor: 'pointer',
              background: recorrentesOnly ? GOLD_D + '0.1)'  : 'rgba(255,255,255,0.04)',
              border: recorrentesOnly
                ? `1px solid ${GOLD_D}0.3)`
                : '1px solid rgba(255,255,255,0.09)',
              color: recorrentesOnly ? GOLD : 'rgba(255,255,255,0.45)',
              fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
            }}
          >
            <Repeat2 style={{ width: 13, height: 13 }} />
            Recorrentes
          </motion.button>

          {/* Sort dropdown */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setSortOpen((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, height: 40,
                padding: '0 14px', borderRadius: 12, cursor: 'pointer',
                background: sortOpen ? GOLD_D + '0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${sortOpen ? GOLD_D + '0.25)' : 'rgba(255,255,255,0.09)'}`,
                color: sortOpen ? GOLD : 'rgba(255,255,255,0.45)',
                fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
              }}
            >
              <SlidersHorizontal style={{ width: 13, height: 13 }} />
              {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
            </motion.button>

            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0,  scale: 1    }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 40, minWidth: 180, background: '#0d1829', border: `1px solid ${GOLD_D}0.2)`, borderRadius: 12, boxShadow: '0 16px 40px rgba(0,0,0,0.6)', overflow: 'hidden' }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button"
                      onClick={() => { setSortBy(opt.value); setSortOpen(false) }}
                      style={{ width: '100%', padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: sortBy === opt.value ? GOLD_D + '0.08)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: sortBy === opt.value ? GOLD : 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: sortBy === opt.value ? 700 : 500, transition: 'background 0.1s' }}
                      onMouseEnter={(e) => { if (sortBy !== opt.value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      onMouseLeave={(e) => { if (sortBy !== opt.value) e.currentTarget.style.background = 'transparent' }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Result count */}
        {(search || recorrentesOnly) && (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: 0 }}>
            {filtered.length} cliente{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 12, borderRadius: 20, border: '1px dashed rgba(255,255,255,0.08)' }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users style={{ width: 24, height: 24, color: 'rgba(255,255,255,0.15)' }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 600, margin: 0 }}>
            {search || recorrentesOnly ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, margin: 0, textAlign: 'center' }}>
            {search || recorrentesOnly
              ? 'Tente ajustar os filtros.'
              : 'Clique em "+ Novo Cliente" para começar.'}
          </p>
          {!search && !recorrentesOnly && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
              onClick={() => { setEditingCliente(null); setFormOpen(true) }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 12, background: `linear-gradient(135deg, ${GOLD}, #f5c842)`, border: 'none', color: '#080c14', fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: `0 4px 14px ${GOLD_D}0.3)`, marginTop: 4 }}>
              <Plus style={{ width: 14, height: 14 }} /> Novo Cliente
            </motion.button>
          )}
        </motion.div>
      ) : (
        <motion.div
          layout
          className="md:gap-5"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((cliente) => (
              <ClienteCard
                key={cliente.id}
                cliente={cliente}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      </div>{/* end content wrapper */}

      {/* ── FAB ── */}
      <motion.div
        style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 40 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
      >
        <motion.button
          whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.94 }}
          onClick={() => { setEditingCliente(null); setFormOpen(true) }}
          className="md:h-11"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            height: 48, padding: '0 22px', borderRadius: 24,
            background: `linear-gradient(135deg, ${GOLD} 0%, #f5c842 50%, ${GOLD} 100%)`,
            border: 'none', color: '#080c14', fontSize: 13, fontWeight: 900,
            cursor: 'pointer',
            boxShadow: `0 8px 28px ${GOLD_D}0.45), 0 2px 8px rgba(0,0,0,0.4)`,
          }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          Novo Cliente
        </motion.button>
      </motion.div>

      {/* ── Form modal ── */}
      <ClienteForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingCliente(null) }}
        editingCliente={editingCliente}
        onSaved={handleSaved}
      />
    </>
  )
}
