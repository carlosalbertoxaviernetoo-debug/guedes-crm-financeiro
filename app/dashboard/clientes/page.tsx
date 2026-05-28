'use client'

import { useEffect, useState, useMemo, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Repeat2,
  Trophy,
  TrendingUp,
  Plus,
  Search,
  SlidersHorizontal,
  Medal,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClienteCard } from '@/components/clientes/cliente-card'
import { ClienteForm } from '@/components/clientes/cliente-form'
import { WhatsAppModal } from '@/components/clientes/whatsapp-modal'

import { getClientes, deleteCliente } from '@/lib/actions/clientes'
import { formatCurrency } from '@/lib/utils'
import type { Cliente } from '@/types'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'text-brand',
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------

type SortKey = 'nome' | 'total_gasto' | 'total_compras' | 'ultima_compra'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'nome', label: 'Nome (A-Z)' },
  { value: 'total_gasto', label: 'Maior gasto' },
  { value: 'total_compras', label: 'Mais compras' },
  { value: 'ultima_compra', label: 'Compra mais recente' },
]

// ---------------------------------------------------------------------------
// Medal for top buyers
// ---------------------------------------------------------------------------

const MEDAL_COLORS = ['text-yellow-400', 'text-slate-400', 'text-amber-600']
const MEDAL_BG = ['bg-yellow-400/10', 'bg-slate-400/10', 'bg-amber-600/10']

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [cidadeFilter, setCidadeFilter] = useState('all')
  const [recorrentesOnly, setRecorrentesOnly] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey>('nome')

  // Modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [whatsAppCliente, setWhatsAppCliente] = useState<Cliente | null>(null)

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Load clients
  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await getClientes()
      if (error) toast.error(error)
      else setClientes(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // Derived cities
  const cidades = useMemo(() => {
    const all = clientes.map((c) => c.cidade).filter(Boolean) as string[]
    return [...new Set(all)].sort()
  }, [clientes])

  // Filtered + sorted clients
  const filtered = useMemo(() => {
    let list = [...clientes]

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.nome.toLowerCase().includes(q) ||
          c.telefone?.includes(q) ||
          c.cidade?.toLowerCase().includes(q) ||
          c.instagram?.toLowerCase().includes(q)
      )
    }

    if (cidadeFilter !== 'all') {
      list = list.filter((c) => c.cidade === cidadeFilter)
    }

    if (recorrentesOnly) {
      list = list.filter((c) => (c.total_compras ?? 0) > 1)
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'nome':
          return a.nome.localeCompare(b.nome, 'pt-BR')
        case 'total_gasto':
          return (b.total_gasto ?? 0) - (a.total_gasto ?? 0)
        case 'total_compras':
          return (b.total_compras ?? 0) - (a.total_compras ?? 0)
        case 'ultima_compra':
          return (b.ultima_compra ?? '').localeCompare(a.ultima_compra ?? '')
        default:
          return 0
      }
    })

    return list
  }, [clientes, search, cidadeFilter, recorrentesOnly, sortBy])

  // Top 5 by total_gasto
  const topCompradores = useMemo(
    () =>
      [...clientes]
        .filter((c) => (c.total_gasto ?? 0) > 0)
        .sort((a, b) => (b.total_gasto ?? 0) - (a.total_gasto ?? 0))
        .slice(0, 5),
    [clientes]
  )

  // Stats
  const stats = useMemo(() => {
    const total = clientes.length
    const recorrentes = clientes.filter((c) => (c.total_compras ?? 0) > 1).length
    const topSpender = topCompradores[0] ?? null
    const totalGasto = clientes.reduce((s, c) => s + (c.total_gasto ?? 0), 0)
    const avgGasto = total > 0 ? totalGasto / total : 0
    return { total, recorrentes, topSpender, avgGasto }
  }, [clientes, topCompradores])

  function handleEdit(cliente: Cliente) {
    setEditingCliente(cliente)
    setFormOpen(true)
  }

  function handleDeleteConfirm(cliente: Cliente) {
    if (!confirm(`Excluir "${cliente.nome}"? Esta ação não pode ser desfeita.`)) return
    startTransition(async () => {
      const { error } = await deleteCliente(cliente.id)
      if (error) {
        toast.error(error)
      } else {
        setClientes((prev) => prev.filter((c) => c.id !== cliente.id))
        toast.success('Cliente excluído.')
      }
    })
  }

  function handleSaved(saved: Cliente) {
    setClientes((prev) => {
      const exists = prev.find((c) => c.id === saved.id)
      if (exists) return prev.map((c) => (c.id === saved.id ? saved : c))
      return [saved, ...prev]
    })
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie seus clientes e acompanhe o relacionamento.
          </p>
        </div>
        <Button
          variant="brand"
          onClick={() => {
            setEditingCliente(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Novo cliente
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total de clientes"
          value={String(stats.total)}
          color="text-blue-500"
        />
        <StatCard
          icon={Repeat2}
          label="Recorrentes"
          value={String(stats.recorrentes)}
          sub={stats.total > 0 ? `${Math.round((stats.recorrentes / stats.total) * 100)}% do total` : undefined}
          color="text-brand"
        />
        <StatCard
          icon={Trophy}
          label="Top comprador"
          value={stats.topSpender?.nome.split(' ')[0] ?? '—'}
          sub={stats.topSpender ? formatCurrency(stats.topSpender.total_gasto ?? 0) : undefined}
          color="text-yellow-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Ticket médio / cliente"
          value={formatCurrency(stats.avgGasto)}
          color="text-purple-500"
        />
      </div>

      {/* Top buyers ranking */}
      {topCompradores.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Top Compradores
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ol className="flex flex-col gap-2">
              {topCompradores.map((c, i) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${MEDAL_BG[i] ?? 'bg-muted'}`}
                  >
                    {i < 3 ? (
                      <Medal className={`h-3.5 w-3.5 ${MEDAL_COLORS[i]}`} />
                    ) : (
                      <span className="text-muted-foreground">{i + 1}</span>
                    )}
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground truncate">
                    {c.nome}
                  </span>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-brand">
                      {formatCurrency(c.total_gasto ?? 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.total_compras ?? 0} compras
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            placeholder="Buscar por nome, telefone, cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {cidades.length > 0 && (
          <Select value={cidadeFilter} onValueChange={setCidadeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as cidades</SelectItem>
              {cidades.map((cidade) => (
                <SelectItem key={cidade} value={cidade}>
                  {cidade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          onClick={() => setRecorrentesOnly((v) => !v)}
          className={`flex items-center gap-2 px-3 h-9 rounded-md border text-sm font-medium transition-all ${
            recorrentesOnly
              ? 'bg-brand/10 border-brand/30 text-brand'
              : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
          }`}
        >
          <Repeat2 className="h-4 w-4" />
          Recorrentes
        </button>
      </div>

      {/* Client grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">
            {search || cidadeFilter !== 'all' || recorrentesOnly
              ? 'Nenhum cliente encontrado com esses filtros.'
              : 'Nenhum cliente cadastrado ainda.'}
          </p>
          {!search && cidadeFilter === 'all' && !recorrentesOnly && (
            <Button
              variant="brand"
              size="sm"
              className="mt-4"
              onClick={() => {
                setEditingCliente(null)
                setFormOpen(true)
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Cadastrar primeiro cliente
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((cliente) => (
              <ClienteCard
                key={cliente.id}
                cliente={cliente}
                onEdit={handleEdit}
                onDelete={handleDeleteConfirm}
                onWhatsApp={setWhatsAppCliente}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <ClienteForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingCliente(null)
        }}
        editingCliente={editingCliente}
        onSaved={handleSaved}
      />

      <WhatsAppModal
        open={!!whatsAppCliente}
        onClose={() => setWhatsAppCliente(null)}
        cliente={whatsAppCliente}
      />
    </div>
  )
}
