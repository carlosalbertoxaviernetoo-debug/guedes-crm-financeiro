'use client'

import { useState, useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Search, X, SlidersHorizontal } from 'lucide-react'
import { ProdutoCard } from './produto-card'
import { ProdutoForm } from './produto-form'
import { RelatarVendaModal } from './relatar-venda-modal'
import { CATEGORIAS_PRODUTO } from '@/lib/utils'
import type { Produto, Pedido } from '@/types'

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const GOLD   = '#d4a017'
const GOLD_D = 'rgba(212,160,23,'

type ProdutoComStats = Produto & { total_vendido: number; lucro_total: number }
type SortKey = 'nome' | 'preco_venda' | 'estoque' | 'margem'

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'Nome',    value: 'nome'        },
  { label: 'Preço',   value: 'preco_venda' },
  { label: 'Estoque', value: 'estoque'     },
  { label: 'Margem',  value: 'margem'      },
]

interface ProdutosClientProps {
  initialProdutos: ProdutoComStats[]
}

export function ProdutosClient({ initialProdutos }: ProdutosClientProps) {
  const [produtos,      setProdutos]      = useState<ProdutoComStats[]>(initialProdutos)
  const [search,        setSearch]        = useState('')
  const [selectedCat,   setSelectedCat]   = useState<string>('Todos')
  const [sortBy,        setSortBy]        = useState<SortKey>('nome')
  const [sortDir,       setSortDir]       = useState<'asc' | 'desc'>('asc')
  const [sortOpen,      setSortOpen]      = useState(false)

  // Modal state
  const [formOpen,      setFormOpen]      = useState(false)
  const [editingProd,   setEditingProd]   = useState<Produto | null>(null)
  const [vendaOpen,     setVendaOpen]     = useState(false)
  const [vendaProd,     setVendaProd]     = useState<Produto | null>(null)

  // All categories derived from current product list
  const availableCategories = useMemo(() => {
    const prodCats = new Set(produtos.map((p) => p.categoria).filter(Boolean) as string[])
    const allKnown = CATEGORIAS_PRODUTO.filter((c) => prodCats.has(c))
    // Include any custom categories not in the preset list
    const custom = [...prodCats].filter((c) => !CATEGORIAS_PRODUTO.includes(c))
    return ['Todos', ...allKnown, ...custom, ...(prodCats.has('') || prodCats.size < produtos.length ? [] : [])]
  }, [produtos])

  const filtered = useMemo(() => {
    let list = [...produtos]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          (p.categoria ?? '').toLowerCase().includes(q) ||
          (p.descricao ?? '').toLowerCase().includes(q),
      )
    }

    if (selectedCat !== 'Todos') {
      list = list.filter((p) =>
        selectedCat === 'Sem categoria' ? !p.categoria : p.categoria === selectedCat,
      )
    }

    list.sort((a, b) => {
      let av: number | string = 0
      let bv: number | string = 0
      if (sortBy === 'nome')        { av = a.nome.toLowerCase(); bv = b.nome.toLowerCase() }
      else if (sortBy === 'preco_venda') { av = a.preco_venda; bv = b.preco_venda }
      else if (sortBy === 'estoque')     { av = a.estoque; bv = b.estoque }
      else if (sortBy === 'margem')      {
        av = a.preco_venda > 0 ? ((a.preco_venda - a.custo) / a.preco_venda) * 100 : 0
        bv = b.preco_venda > 0 ? ((b.preco_venda - b.custo) / b.preco_venda) * 100 : 0
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ?  1 : -1
      return 0
    })

    return list
  }, [produtos, search, selectedCat, sortBy, sortDir])

  function handleSortChange(key: SortKey) {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(key); setSortDir('asc') }
    setSortOpen(false)
  }

  const handleEdit    = useCallback((p: Produto) => { setEditingProd(p); setFormOpen(true) }, [])
  const handleVenda   = useCallback((p: Produto) => { setVendaProd(p);   setVendaOpen(true) }, [])
  const handleDeleted = useCallback((id: string) => { setProdutos((prev) => prev.filter((p) => p.id !== id)) }, [])

  const handleSaved = useCallback((saved: Produto) => {
    setProdutos((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], ...saved }
        return updated
      }
      return [{ ...saved, total_vendido: 0, lucro_total: 0 }, ...prev]
    })
  }, [])

  const handlePedidoRealizado = useCallback((pedido: Pedido) => {
    // Decrement stock for product items
    setProdutos((prev) => {
      let next = [...prev]
      for (const item of pedido.items) {
        if (item.produto_id) {
          next = next.map((p) =>
            p.id === item.produto_id
              ? { ...p, estoque: Math.max(0, p.estoque - item.quantidade) }
              : p,
          )
        }
      }
      return next
    })
  }, [])

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Row 1: search + sort */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
            <Search style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.3)', position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, categoria..."
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
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 2 }}
              >
                <X style={{ width: 12, height: 12 }} />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSortOpen((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, height: 40,
                padding: '0 14px', borderRadius: 12,
                background: sortOpen ? GOLD_D + '0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${sortOpen ? GOLD_D + '0.25)' : 'rgba(255,255,255,0.09)'}`,
                color: sortOpen ? GOLD : 'rgba(255,255,255,0.55)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <SlidersHorizontal style={{ width: 13, height: 13 }} />
              {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
              <span style={{ opacity: 0.6 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
            </motion.button>

            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 6,
                    zIndex: 40, minWidth: 140,
                    background: '#0d1829',
                    border: `1px solid ${GOLD_D}0.2)`,
                    borderRadius: 12,
                    boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                    overflow: 'hidden',
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button"
                      onClick={() => handleSortChange(opt.value)}
                      style={{
                        width: '100%', padding: '9px 14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: sortBy === opt.value ? GOLD_D + '0.08)' : 'transparent',
                        border: 'none', cursor: 'pointer', textAlign: 'left',
                        color: sortBy === opt.value ? GOLD : 'rgba(255,255,255,0.6)',
                        fontSize: 12, fontWeight: sortBy === opt.value ? 700 : 500,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => { if (sortBy !== opt.value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      onMouseLeave={(e) => { if (sortBy !== opt.value) e.currentTarget.style.background = 'transparent' }}
                    >
                      {opt.label}
                      {sortBy === opt.value && (
                        <span style={{ opacity: 0.8 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Row 2: category chips */}
        {availableCategories.length > 2 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {availableCategories.map((cat) => {
              const active = selectedCat === cat
              return (
                <motion.button key={cat} type="button" whileTap={{ scale: 0.91 }}
                  onClick={() => setSelectedCat(cat)}
                  style={{
                    padding: '4px 13px', borderRadius: 50,
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: active ? `linear-gradient(135deg, ${GOLD}, #f5c842)` : 'rgba(255,255,255,0.05)',
                    border: active ? 'none' : '1px solid rgba(255,255,255,0.09)',
                    color: active ? '#080c14' : 'rgba(255,255,255,0.5)',
                  }}>
                  {cat}
                </motion.button>
              )
            })}
          </div>
        )}

        {/* Result count */}
        {(search || selectedCat !== 'Todos') && (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: 0 }}>
            {filtered.length} produto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            {selectedCat !== 'Todos' ? ` em "${selectedCat}"` : ''}
          </p>
        )}
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 12, borderRadius: 20, border: '1px dashed rgba(255,255,255,0.08)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Search style={{ width: 24, height: 24, color: 'rgba(255,255,255,0.15)' }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 600, margin: 0 }}>
            {search || selectedCat !== 'Todos' ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, margin: 0, textAlign: 'center' }}>
            {search || selectedCat !== 'Todos'
              ? 'Tente ajustar os filtros ou a busca.'
              : 'Clique em "+ Novo Produto" para adicionar seu primeiro produto.'}
          </p>
          {!search && selectedCat === 'Todos' && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
              onClick={() => { setEditingProd(null); setFormOpen(true) }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 12, background: `linear-gradient(135deg, ${GOLD}, #f5c842)`, border: 'none', color: '#080c14', fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: `0 4px 14px ${GOLD_D}0.3)`, marginTop: 4 }}>
              <Plus style={{ width: 14, height: 14 }} /> Novo Produto
            </motion.button>
          )}
        </motion.div>
      ) : (
        <motion.div
          layout
          className="md:gap-5"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((produto) => (
              <ProdutoCard
                key={produto.id}
                produto={produto}
                onEdit={handleEdit}
                onVenda={handleVenda}
                onDeleted={handleDeleted}
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
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => { setEditingProd(null); setFormOpen(true) }}
          className="md:h-11 md:px-6"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            height: 48, padding: '0 22px', borderRadius: 24,
            background: `linear-gradient(135deg, ${GOLD} 0%, #f5c842 50%, ${GOLD} 100%)`,
            border: 'none', color: '#080c14',
            fontSize: 13, fontWeight: 900,
            cursor: 'pointer',
            boxShadow: `0 8px 28px ${GOLD_D}0.45), 0 2px 8px rgba(0,0,0,0.4)`,
          }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          Novo Produto
        </motion.button>
      </motion.div>

      {/* ── Modals ── */}
      <ProdutoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        produto={editingProd}
        onSaved={handleSaved}
      />

      <RelatarVendaModal
        open={vendaOpen}
        onOpenChange={setVendaOpen}
        produtos={produtos}
        initialProduto={vendaProd}
        onPedidoRealizado={handlePedidoRealizado}
      />
    </>
  )
}
