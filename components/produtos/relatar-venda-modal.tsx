'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import {
  X, Plus, Minus, ShoppingCart, User, Package,
  Search, Trash2, ChevronDown, Loader2, Check,
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { createPedido } from '@/lib/actions/pedidos'
import { getClientes } from '@/lib/actions/clientes'
import { formatCurrency, calcLucroUnitario } from '@/lib/utils'
import type { Produto, Cliente, Pedido } from '@/types'

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const GOLD   = '#d4a017'
const GOLD_D = 'rgba(212,160,23,'
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemMode = 'product' | 'manual'

interface ItemDraft {
  id: string            // local UI key
  mode: ItemMode
  produto?: Produto
  nome_item: string
  custo: string         // string so user can type freely
  preco: string
  quantidade: number
}

function newItem(produto?: Produto): ItemDraft {
  return {
    id: crypto.randomUUID(),
    mode: produto ? 'product' : 'manual',
    produto,
    nome_item:  produto?.nome ?? '',
    custo:      produto ? String(produto.custo)       : '',
    preco:      produto ? String(produto.preco_venda) : '',
    quantidade: 1,
  }
}

function parseMoney(v: string) { return parseFloat(v.replace(',', '.')) || 0 }

// ─── Tiny style helpers ───────────────────────────────────────────────────────

const LABEL: React.CSSProperties = {
  color: 'rgba(255,255,255,0.45)',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
}

const INPUT: React.CSSProperties = {
  width: '100%',
  height: 38,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 9,
  padding: '0 10px',
  color: '#fff',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
}

// ─── Product picker dropdown ──────────────────────────────────────────────────

function ProdutoPicker({
  produtos,
  value,
  onChange,
}: {
  produtos: Produto[]
  value?: Produto
  onChange: (p: Produto) => void
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ]       = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const filtered = useMemo(
    () =>
      produtos.filter(
        (p) =>
          p.nome.toLowerCase().includes(q.toLowerCase()) ||
          (p.categoria ?? '').toLowerCase().includes(q.toLowerCase()),
      ),
    [produtos, q],
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', height: 38, display: 'flex', alignItems: 'center',
          gap: 8, padding: '0 10px', borderRadius: 9,
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${value ? GOLD_D + '0.25)' : 'rgba(255,255,255,0.1)'}`,
          cursor: 'pointer',
        }}
      >
        {value?.imagem_url ? (
          <div style={{ width: 20, height: 20, borderRadius: 4, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
            <Image src={value.imagem_url} alt={value.nome} fill style={{ objectFit: 'cover' }} sizes="20px" />
          </div>
        ) : (
          <Package style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
        )}
        <span style={{
          flex: 1, textAlign: 'left', fontSize: 12,
          color: value ? '#fff' : 'rgba(255,255,255,0.3)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {value ? value.nome : 'Selecionar produto...'}
        </span>
        <ChevronDown style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
              zIndex: 60,
              background: '#0d1829',
              border: `1px solid ${GOLD_D}0.2)`,
              borderRadius: 12,
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
              overflow: 'hidden',
              maxHeight: 240,
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Search */}
            <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative', flexShrink: 0 }}>
              <Search style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.3)', position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar produto..."
                style={{ ...INPUT, height: 30, paddingLeft: 28, fontSize: 12 }}
              />
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filtered.length === 0 ? (
                <p style={{ padding: '12px 12px', color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center' }}>
                  Nenhum produto encontrado
                </p>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { onChange(p); setOpen(false); setQ('') }}
                    style={{
                      width: '100%', padding: '8px 12px',
                      display: 'flex', alignItems: 'center', gap: 10,
                      cursor: 'pointer', background: 'transparent',
                      border: 'none', textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden', flexShrink: 0, position: 'relative', background: 'rgba(255,255,255,0.05)' }}>
                      {p.imagem_url
                        ? <Image src={p.imagem_url} alt={p.nome} fill style={{ objectFit: 'cover' }} sizes="28px" />
                        : <Package style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.2)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#fff', fontSize: 12, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>
                        {formatCurrency(p.preco_venda)} · {p.estoque} un.
                      </p>
                    </div>
                    {value?.id === p.id && <Check style={{ width: 12, height: 12, color: GOLD, flexShrink: 0 }} />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── ItemRow ──────────────────────────────────────────────────────────────────

function ItemRow({
  item, produtos, onChange, onRemove,
}: {
  item: ItemDraft
  produtos: Produto[]
  onChange: (patch: Partial<ItemDraft>) => void
  onRemove: () => void
}) {
  const custo  = parseMoney(item.custo)
  const preco  = parseMoney(item.preco)
  const lucro  = calcLucroUnitario(custo, preco) * item.quantidade
  const total  = preco * item.quantidade

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      style={{
        borderRadius: 14, padding: '12px 14px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      {/* Mode toggle + remove */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {(['product', 'manual'] as ItemMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChange({ mode: m, produto: undefined, nome_item: '', custo: '', preco: '' })}
              style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                background: item.mode === m ? `linear-gradient(135deg, ${GOLD}, #f5c842)` : 'rgba(255,255,255,0.05)',
                border: item.mode === m ? 'none' : '1px solid rgba(255,255,255,0.09)',
                color: item.mode === m ? '#080c14' : 'rgba(255,255,255,0.45)',
                textTransform: 'uppercase', letterSpacing: '0.1em',
              }}
            >
              {m === 'product' ? 'Produto' : 'Manual'}
            </button>
          ))}
        </div>

        {/* Remove */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={onRemove}
          style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Trash2 style={{ width: 12, height: 12 }} />
        </motion.button>
      </div>

      {/* Produto picker or manual name */}
      {item.mode === 'product' ? (
        <ProdutoPicker
          produtos={produtos}
          value={item.produto}
          onChange={(p) =>
            onChange({
              produto:   p,
              nome_item: p.nome,
              custo:     String(p.custo),
              preco:     String(p.preco_venda),
            })
          }
        />
      ) : (
        <input
          value={item.nome_item}
          onChange={(e) => onChange({ nome_item: e.target.value })}
          placeholder="Descrição do item..."
          style={INPUT}
        />
      )}

      {/* Cost + Price + Qty */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'center' }}>
        <div>
          <p style={{ ...LABEL, marginBottom: 4 }}>Custo</p>
          <input
            value={item.custo}
            onChange={(e) => onChange({ custo: e.target.value })}
            placeholder="0,00"
            style={INPUT}
          />
        </div>
        <div>
          <p style={{ ...LABEL, marginBottom: 4 }}>Venda</p>
          <input
            value={item.preco}
            onChange={(e) => onChange({ preco: e.target.value })}
            placeholder="0,00"
            style={{ ...INPUT, borderColor: GOLD_D + '0.2)' }}
          />
        </div>

        {/* Qty stepper */}
        <div>
          <p style={{ ...LABEL, marginBottom: 4 }}>Qtd</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <motion.button type="button" whileTap={{ scale: 0.87 }}
              onClick={() => onChange({ quantidade: Math.max(1, item.quantidade - 1) })}
              style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Minus style={{ width: 10, height: 10 }} />
            </motion.button>
            <span style={{ minWidth: 24, textAlign: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
              {item.quantidade}
            </span>
            <motion.button type="button" whileTap={{ scale: 0.87 }}
              onClick={() => {
                const max = item.produto ? item.produto.estoque : 999
                onChange({ quantidade: Math.min(max, item.quantidade + 1) })
              }}
              style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Plus style={{ width: 10, height: 10 }} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mini totals */}
      {(custo > 0 || preco > 0) && (
        <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
            Total: <span style={{ color: GOLD, fontWeight: 700 }}>{formatCurrency(total)}</span>
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
            Lucro: <span style={{ color: lucro >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{formatCurrency(lucro)}</span>
          </span>
        </div>
      )}
    </motion.div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface RelatarVendaModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  produtos: Produto[]
  initialProduto?: Produto | null
  onPedidoRealizado?: (pedido: Pedido) => void
}

export function RelatarVendaModal({
  open,
  onOpenChange,
  produtos,
  initialProduto,
  onPedidoRealizado,
}: RelatarVendaModalProps) {
  const [items,       setItems]       = useState<ItemDraft[]>([])
  const [clientes,    setClientes]    = useState<Cliente[]>([])
  const [clienteId,   setClienteId]   = useState('')
  const [nomeBuyer,   setNomeBuyer]   = useState('')
  const [buyerSearch, setBuyerSearch] = useState('')
  const [showSuggest, setShowSuggest] = useState(false)
  const [loadingCli,  setLoadingCli]  = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [observacoes, setObservacoes] = useState('')

  // Reset when opened
  useEffect(() => {
    if (!open) return
    setItems(initialProduto ? [newItem(initialProduto)] : [newItem()])
    setClienteId('')
    setNomeBuyer('')
    setBuyerSearch('')
    setShowSuggest(false)
    setObservacoes('')
    setLoadingCli(true)
    getClientes().then(({ data }) => {
      setClientes(data ?? [])
      setLoadingCli(false)
    })
  }, [open, initialProduto])

  // ── derived totals ─────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    let valorTotal = 0
    let lucroTotal = 0
    for (const it of items) {
      const p = parseMoney(it.preco)
      const c = parseMoney(it.custo)
      valorTotal += p * it.quantidade
      lucroTotal += (p - c) * it.quantidade
    }
    return { valorTotal, lucroTotal }
  }, [items])

  // ── item helpers ───────────────────────────────────────────────────────────
  function addItem() {
    setItems((prev) => [...prev, newItem()])
  }

  function updateItem(id: string, patch: Partial<ItemDraft>) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    )
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  // ── client suggestions ────────────────────────────────────────────────────
  const suggestions = useMemo(
    () =>
      buyerSearch
        ? clientes.filter((c) =>
            c.nome.toLowerCase().includes(buyerSearch.toLowerCase()),
          )
        : [],
    [clientes, buyerSearch],
  )

  function selectCliente(c: Cliente) {
    setClienteId(c.id)
    setNomeBuyer(c.nome)
    setBuyerSearch(c.nome)
    setShowSuggest(false)
  }

  function clearCliente() {
    setClienteId('')
    setNomeBuyer(buyerSearch)
  }

  // ── submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (items.length === 0) {
      toast.error('Adicione pelo menos um item ao pedido.')
      return
    }

    for (const it of items) {
      if (it.mode === 'product' && !it.produto) {
        toast.error('Selecione o produto para todos os itens do tipo "Produto".')
        return
      }
      if (it.mode === 'manual' && !it.nome_item.trim()) {
        toast.error('Preencha a descrição de todos os itens manuais.')
        return
      }
      if (!parseMoney(it.preco)) {
        toast.error('Preencha o preço de venda de todos os itens.')
        return
      }
    }

    setSubmitting(true)

    const { data, error } = await createPedido({
      cliente_id:    clienteId || null,
      nome_comprador: nomeBuyer.trim() || null,
      observacoes:   observacoes || null,
      items: items.map((it) => ({
        produto_id:     it.produto?.id ?? null,
        nome_item:      it.nome_item || undefined,
        quantidade:     it.quantidade,
        preco_unitario: parseMoney(it.preco),
        custo_unitario: parseMoney(it.custo),
      })),
    })

    setSubmitting(false)

    if (error) { toast.error(error); return }

    toast.success(`Pedido registrado — ${formatCurrency(totals.valorTotal)}`)
    onPedidoRealizado?.(data!)
    onOpenChange(false)
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Overlay */}
            <Dialog.Overlay asChild>
              <motion.div
                key="rv-overlay"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(2,5,12,0.85)', backdropFilter: 'blur(8px)', zIndex: 50 }}
              />
            </Dialog.Overlay>

            {/* Panel — Dialog.Content is the fullscreen flex container; motion.div
                handles only visual animation so transforms don't conflict */}
            <Dialog.Content
              style={{
                position: 'fixed', inset: 0, zIndex: 51,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 12px',
                outline: 'none',
                pointerEvents: 'none',
              }}
            >
              <motion.div
                key="rv-panel"
                initial={{ opacity: 0, y: 28, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.96 }}
                transition={{ duration: 0.32, ease: EASE }}
                style={{
                  width: '100%', maxWidth: 580,
                  background: 'linear-gradient(145deg, #0d1829 0%, #080c14 100%)',
                  border: `1px solid ${GOLD_D}0.18)`,
                  borderRadius: 20,
                  boxShadow: `0 36px 90px rgba(0,0,0,0.8), 0 0 0 1px ${GOLD_D}0.05)`,
                  maxHeight: '92vh', display: 'flex', flexDirection: 'column',
                  pointerEvents: 'auto',
                }}
              >
                {/* Header */}
                <div style={{
                  padding: '22px 24px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${GOLD}, #f5c842)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingCart style={{ width: 16, height: 16, color: '#080c14' }} />
                    </div>
                    <div>
                      <Dialog.Title style={{ color: '#fff', fontWeight: 900, fontSize: 16, margin: 0 }}>Relatar Venda</Dialog.Title>
                      <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, marginTop: 2 }}>
                        Registre um pedido com um ou mais itens
                      </p>
                    </div>
                  </div>
                  <Dialog.Close asChild>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <X style={{ width: 14, height: 14 }} />
                    </motion.button>
                  </Dialog.Close>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* ── Items ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={LABEL}>Itens do pedido</label>
                        <motion.button
                          type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
                          onClick={addItem}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 20, background: GOLD_D + '0.1)', border: `1px solid ${GOLD_D}0.25)`, color: GOLD, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          <Plus style={{ width: 10, height: 10 }} /> Adicionar item
                        </motion.button>
                      </div>

                      <AnimatePresence mode="popLayout">
                        {items.map((item) => (
                          <ItemRow
                            key={item.id}
                            item={item}
                            produtos={produtos}
                            onChange={(patch) => updateItem(item.id, patch)}
                            onRemove={() => removeItem(item.id)}
                          />
                        ))}
                      </AnimatePresence>

                      {items.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', borderRadius: 14, border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                          Nenhum item adicionado
                        </div>
                      )}
                    </div>

                    {/* ── Totals preview ── */}
                    {items.length > 0 && (totals.valorTotal > 0) && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ padding: '12px 14px', borderRadius: 12, background: GOLD_D + '0.06)', border: `1px solid ${GOLD_D}0.18)` }}>
                          <p style={{ ...LABEL, marginBottom: 4 }}>Total do pedido</p>
                          <p style={{ color: GOLD, fontWeight: 900, fontSize: 18, margin: 0 }}>
                            {formatCurrency(totals.valorTotal)}
                          </p>
                        </div>
                        <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)' }}>
                          <p style={{ ...LABEL, marginBottom: 4 }}>Lucro líquido</p>
                          <p style={{ color: totals.lucroTotal >= 0 ? '#22c55e' : '#ef4444', fontWeight: 900, fontSize: 18, margin: 0 }}>
                            {formatCurrency(totals.lucroTotal)}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* ── Buyer / Client ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ ...LABEL, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User style={{ width: 11, height: 11 }} />
                        Comprador{' '}
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
                          (opcional)
                        </span>
                      </label>

                      <div style={{ position: 'relative' }}>
                        {clienteId && (
                          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>
                            <Check style={{ width: 12, height: 12, color: GOLD }} />
                          </div>
                        )}
                        <input
                          value={buyerSearch}
                          onChange={(e) => {
                            setBuyerSearch(e.target.value)
                            setNomeBuyer(e.target.value)
                            clearCliente()
                            setShowSuggest(true)
                          }}
                          onFocus={() => setShowSuggest(true)}
                          onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                          placeholder={loadingCli ? 'Carregando clientes...' : 'Nome do comprador ou buscar cliente...'}
                          disabled={loadingCli}
                          style={{
                            ...INPUT,
                            paddingLeft: clienteId ? 28 : 10,
                            borderColor: clienteId ? GOLD_D + '0.3)' : 'rgba(255,255,255,0.1)',
                          }}
                        />

                        {/* Suggestions */}
                        <AnimatePresence>
                          {showSuggest && suggestions.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                              style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 60, background: '#0d1829', border: `1px solid ${GOLD_D}0.2)`, borderRadius: 12, boxShadow: '0 16px 40px rgba(0,0,0,0.5)', overflow: 'hidden', maxHeight: 180, overflowY: 'auto' }}>
                              {suggestions.map((c) => (
                                <button key={c.id} type="button"
                                  onMouseDown={(e) => { e.preventDefault(); selectCliente(c) }}
                                  style={{ width: '100%', padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'transparent', border: 'none', textAlign: 'left' }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{c.nome}</span>
                                  {c.cidade && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{c.cidade}</span>}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {clienteId && (
                        <p style={{ fontSize: 11, color: GOLD_D + '0.7)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Check style={{ width: 10, height: 10 }} />
                          Cliente cadastrado selecionado
                        </p>
                      )}
                    </div>

                    {/* ── Observações ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={LABEL}>Observações (opcional)</label>
                      <textarea
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        rows={2}
                        placeholder="Notas sobre este pedido..."
                        style={{
                          ...INPUT,
                          height: 'auto', padding: '9px 10px',
                          resize: 'none', lineHeight: 1.5,
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
                    <Dialog.Close asChild>
                      <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        style={{ padding: '9px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        Cancelar
                      </motion.button>
                    </Dialog.Close>

                    <motion.button
                      type="submit"
                      disabled={submitting || items.length === 0}
                      whileHover={submitting ? {} : { scale: 1.02 }}
                      whileTap={submitting ? {} : { scale: 0.97 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '9px 24px', borderRadius: 12,
                        background: `linear-gradient(135deg, ${GOLD} 0%, #f5c842 50%, ${GOLD} 100%)`,
                        border: 'none', color: '#080c14',
                        fontSize: 13, fontWeight: 900,
                        cursor: submitting || items.length === 0 ? 'not-allowed' : 'pointer',
                        boxShadow: `0 4px 14px ${GOLD_D}0.3)`,
                        opacity: submitting || items.length === 0 ? 0.6 : 1,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      {submitting
                        ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                        : <ShoppingCart style={{ width: 14, height: 14 }} />
                      }
                      Confirmar pedido
                      {totals.valorTotal > 0 && (
                        <span style={{ opacity: 0.75 }}>· {formatCurrency(totals.valorTotal)}</span>
                      )}
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
