'use client'

import { useState, useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Search, SortAsc, X, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ProdutoCard } from './produto-card'
import { ProdutoForm } from './produto-form'
import { VendaRapidaModal } from './venda-rapida-modal'
import { CATEGORIAS_PRODUTO } from '@/lib/utils'
import type { Produto } from '@/types'

type ProdutoComStats = Produto & { total_vendido: number; lucro_total: number }

type SortKey = 'nome' | 'preco_venda' | 'estoque' | 'margem'

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'Nome', value: 'nome' },
  { label: 'Preço', value: 'preco_venda' },
  { label: 'Estoque', value: 'estoque' },
  { label: 'Margem', value: 'margem' },
]

interface ProdutosClientProps {
  initialProdutos: ProdutoComStats[]
}

export function ProdutosClient({ initialProdutos }: ProdutosClientProps) {
  const [produtos, setProdutos] = useState<ProdutoComStats[]>(initialProdutos)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState<string>('Todos')
  const [sortBy, setSortBy] = useState<SortKey>('nome')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Form modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)

  // Quick sale modal state
  const [vendaOpen, setVendaOpen] = useState(false)
  const [vendaProduto, setVendaProduto] = useState<Produto | null>(null)

  // Categories that actually exist in the list
  const availableCategories = useMemo(() => {
    const cats = new Set(produtos.map((p) => p.categoria ?? 'Sem categoria'))
    return ['Todos', ...CATEGORIAS_PRODUTO.filter((c) => cats.has(c)), ...(cats.has('Sem categoria') ? ['Sem categoria'] : [])]
  }, [produtos])

  const filtered = useMemo(() => {
    let list = [...produtos]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          (p.categoria ?? '').toLowerCase().includes(q) ||
          (p.descricao ?? '').toLowerCase().includes(q)
      )
    }

    // Category filter
    if (selectedCat !== 'Todos') {
      list = list.filter((p) =>
        selectedCat === 'Sem categoria' ? !p.categoria : p.categoria === selectedCat
      )
    }

    // Sort
    list.sort((a, b) => {
      let av: number | string = 0
      let bv: number | string = 0

      if (sortBy === 'nome') {
        av = a.nome.toLowerCase()
        bv = b.nome.toLowerCase()
      } else if (sortBy === 'preco_venda') {
        av = a.preco_venda
        bv = b.preco_venda
      } else if (sortBy === 'estoque') {
        av = a.estoque
        bv = b.estoque
      } else if (sortBy === 'margem') {
        av = a.preco_venda > 0 ? ((a.preco_venda - a.custo) / a.preco_venda) * 100 : 0
        bv = b.preco_venda > 0 ? ((b.preco_venda - b.custo) / b.preco_venda) * 100 : 0
      }

      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [produtos, search, selectedCat, sortBy, sortDir])

  function handleSortChange(key: SortKey) {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortDir('asc')
    }
  }

  const handleEdit = useCallback((produto: Produto) => {
    setEditingProduto(produto)
    setFormOpen(true)
  }, [])

  const handleVenda = useCallback((produto: Produto) => {
    setVendaProduto(produto)
    setVendaOpen(true)
  }, [])

  const handleDeleted = useCallback((id: string) => {
    setProdutos((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const handleSaved = useCallback((saved: Produto) => {
    setProdutos((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], ...saved }
        return updated
      }
      // New product — add with zero stats
      return [{ ...saved, total_vendido: 0, lucro_total: 0 }, ...prev]
    })
  }, [])

  const handleVendaRealizada = useCallback(() => {
    // Refresh the current produto stock optimistically
    if (vendaProduto) {
      setProdutos((prev) =>
        prev.map((p) =>
          p.id === vendaProduto.id ? { ...p, estoque: Math.max(0, p.estoque - 1) } : p
        )
      )
    }
  }, [vendaProduto])

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, categoria..."
            className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 shrink-0">
          <SortAsc className="w-4 h-4 text-muted-foreground" />
          <div className="flex rounded-md border border-border overflow-hidden">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSortChange(opt.value)}
                className={[
                  'px-3 py-1.5 text-xs font-medium transition-colors border-r border-border last:border-r-0',
                  sortBy === opt.value
                    ? 'bg-brand text-brand-foreground'
                    : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                ].join(' ')}
              >
                {opt.label}
                {sortBy === opt.value && (
                  <span className="ml-1 opacity-70">{sortDir === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category tabs */}
      {availableCategories.length > 2 && (
        <div className="flex gap-1.5 flex-wrap">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={[
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                selectedCat === cat
                  ? 'bg-brand text-brand-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
              ].join(' ')}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      {search || selectedCat !== 'Todos' ? (
        <p className="text-xs text-muted-foreground">
          {filtered.length} produto{filtered.length !== 1 ? 's' : ''} encontrado
          {filtered.length !== 1 ? 's' : ''}
          {selectedCat !== 'Todos' ? ` em "${selectedCat}"` : ''}
        </p>
      ) : null}

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search || selectedCat !== 'Todos' ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
          description={
            search || selectedCat !== 'Todos'
              ? 'Tente ajustar os filtros ou a busca.'
              : 'Clique em "+ Novo Produto" para adicionar seu primeiro produto.'
          }
          action={
            !search && selectedCat === 'Todos'
              ? {
                  label: '+ Novo Produto',
                  onClick: () => { setEditingProduto(null); setFormOpen(true) },
                }
              : undefined
          }
        />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
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

      {/* Floating FAB */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Button
          variant="brand"
          size="lg"
          className="rounded-full shadow-xl shadow-brand/25 gap-2 h-12 px-5"
          onClick={() => { setEditingProduto(null); setFormOpen(true) }}
        >
          <Plus className="w-5 h-5" />
          Novo Produto
        </Button>
      </motion.div>

      {/* Form Modal */}
      <ProdutoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        produto={editingProduto}
        onSaved={handleSaved}
      />

      {/* Quick sale modal */}
      <VendaRapidaModal
        open={vendaOpen}
        onOpenChange={setVendaOpen}
        produto={vendaProduto}
        onVendaRealizada={handleVendaRealizada}
      />
    </>
  )
}
