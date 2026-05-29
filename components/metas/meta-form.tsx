'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Target, Calendar, BarChart3, X, Save, ChevronDown } from 'lucide-react'

import { upsertMeta } from '@/lib/actions/metas'
import { getMesAtual, getAnoAtual, MESES_NOMES } from '@/lib/utils'
import type { Meta } from '@/types'

const GOLD = '#d4a017'
const GOLD_DIM = 'rgba(212,160,23,0.15)'
const GOLD_BORDER = 'rgba(212,160,23,0.3)'

// ---------------------------------------------------------------------------
// Currency helpers
// ---------------------------------------------------------------------------

function parseCurrency(raw: string): number {
  const cleaned = raw.replace(/[R$\s.]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

function formatCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const number = parseInt(digits, 10) / 100
  return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ---------------------------------------------------------------------------
// Glass Input
// ---------------------------------------------------------------------------

function GlassInput({
  label,
  prefix,
  type = 'text',
  value,
  onChange,
  placeholder,
  min,
  max,
  required,
  inputMode,
}: {
  label: string
  prefix?: React.ReactNode
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  min?: string | number
  max?: string | number
  required?: boolean
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </label>
      <div
        className="relative flex items-center rounded-xl overflow-hidden transition-all duration-200"
        style={{
          background: focused ? 'rgba(212,160,23,0.06)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${focused ? GOLD_BORDER : 'rgba(255,255,255,0.08)'}`,
          boxShadow: focused ? `0 0 0 3px rgba(212,160,23,0.08)` : 'none',
        }}
      >
        {prefix && (
          <span className="pl-3 pr-1 text-xs font-bold shrink-0" style={{ color: GOLD }}>
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          min={min}
          max={max}
          required={required}
          inputMode={inputMode}
          className="w-full py-2.5 px-3 text-sm font-medium bg-transparent outline-none focus-visible:outline-none placeholder:text-gray-600"
          style={{ color: 'rgba(255,255,255,0.9)' }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Glass Textarea
// ---------------------------------------------------------------------------

function GlassTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  rows?: number
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full rounded-xl py-2.5 px-3 text-sm font-medium resize-none outline-none focus-visible:outline-none placeholder:text-gray-600 transition-all duration-200"
        style={{
          background: focused ? 'rgba(212,160,23,0.06)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${focused ? GOLD_BORDER : 'rgba(255,255,255,0.08)'}`,
          boxShadow: focused ? `0 0 0 3px rgba(212,160,23,0.08)` : 'none',
          color: 'rgba(255,255,255,0.9)',
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Glass Select
// ---------------------------------------------------------------------------

function GlassSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full rounded-xl py-2.5 px-3 pr-8 text-sm font-medium appearance-none outline-none focus-visible:outline-none transition-all duration-200"
          style={{
            background: focused ? 'rgba(212,160,23,0.06)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${focused ? GOLD_BORDER : 'rgba(255,255,255,0.08)'}`,
            boxShadow: focused ? `0 0 0 3px rgba(212,160,23,0.08)` : 'none',
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ background: '#0d1829', color: '#fff' }}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: GOLD }} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab button
// ---------------------------------------------------------------------------

type TabId = 'mensal' | 'anual' | 'periodo'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'mensal',  label: 'Mensal',  icon: Calendar   },
  { id: 'anual',   label: 'Anual',   icon: BarChart3   },
  { id: 'periodo', label: 'Período', icon: Target      },
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MetaFormProps {
  open: boolean
  onClose: () => void
  onSaved: (meta: Meta) => void
  initialMes?: number
  initialAno?: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MetaForm({ open, onClose, onSaved, initialMes, initialAno }: MetaFormProps) {
  const [tab, setTab]           = useState<TabId>('mensal')
  const [valorRaw, setValorRaw] = useState('')
  const [loading, setLoading]   = useState(false)
  const [mes, setMes]           = useState(String(initialMes ?? getMesAtual()))
  const [ano, setAno]           = useState(String(initialAno ?? getAnoAtual()))
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim]       = useState('')
  const [observacoes, setObservacoes] = useState('')

  function handleValorChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValorRaw(formatCurrencyInput(e.target.value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valor = parseCurrency(valorRaw)
    if (!valor || valor <= 0) { toast.error('Informe um valor válido.'); return }
    const anoNum = parseInt(ano, 10)
    if (!anoNum || anoNum < 2020) { toast.error('Informe um ano válido.'); return }
    if (tab === 'periodo') {
      if (!dataInicio || !dataFim) { toast.error('Informe as datas de início e fim.'); return }
      if (dataInicio > dataFim) { toast.error('A data de início deve ser antes do fim.'); return }
    }

    setLoading(true)
    const result = await upsertMeta({
      tipo: tab,
      valor,
      mes: tab === 'mensal' ? parseInt(mes, 10) : undefined,
      ano: anoNum,
      data_inicio: tab === 'periodo' ? dataInicio : null,
      data_fim: tab === 'periodo' ? dataFim : null,
      observacoes: observacoes.trim() || null,
    })
    setLoading(false)

    if (result.error) { toast.error(result.error); return }
    const labels = { mensal: 'Meta mensal salva!', anual: 'Meta anual salva!', periodo: 'Meta de período salva!' }
    toast.success(labels[tab])
    onSaved(result.data!)
    handleClose()
  }

  function handleClose() {
    setValorRaw('')
    setTab('mensal')
    setMes(String(getMesAtual()))
    setAno(String(getAnoAtual()))
    setDataInicio('')
    setDataFim('')
    setObservacoes('')
    onClose()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative w-full max-w-md rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #0d1829 0%, #080c14 100%)',
                border: '1px solid rgba(212,160,23,0.2)',
                boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
              }}
            >
              {/* Gold top line */}
              <div
                className="absolute top-0 left-12 right-12 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, #d4a017, transparent)' }}
              />

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}
                  >
                    <Target className="w-4 h-4" style={{ color: GOLD }} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white uppercase tracking-wider">Definir Meta</h2>
                    <p className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: GOLD }}>
                      Faturamento
                    </p>
                  </div>
                </div>

                <motion.button
                  onClick={handleClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <X className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.5)' }} />
                </motion.button>
              </div>

              {/* Tab bar */}
              <div className="px-6 pb-4">
                <div
                  className="flex rounded-xl p-0.5 gap-0.5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {TABS.map(({ id, label, icon: Icon }) => {
                    const active = tab === id
                    return (
                      <motion.button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        whileHover={active ? {} : { scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors duration-150"
                        style={{
                          color: active ? '#080c14' : 'rgba(255,255,255,0.35)',
                        }}
                      >
                        {active && (
                          <motion.div
                            layoutId="tab-pill"
                            className="absolute inset-0 rounded-lg"
                            style={{ background: GOLD }}
                            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                          <Icon className="w-3 h-3" />
                          {label}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="px-6 pb-4 flex flex-col gap-3.5">
                  {/* Mensal fields */}
                  <AnimatePresence mode="wait">
                    {tab === 'mensal' && (
                      <motion.div
                        key="mensal"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="grid grid-cols-2 gap-3"
                      >
                        <GlassSelect
                          label="Mês"
                          value={mes}
                          onChange={setMes}
                          options={MESES_NOMES.map((n, i) => ({ value: String(i + 1), label: n }))}
                        />
                        <GlassInput
                          label="Ano"
                          type="number"
                          value={ano}
                          onChange={(e) => setAno(e.target.value)}
                          min={2020}
                          max={2100}
                          inputMode="numeric"
                        />
                      </motion.div>
                    )}

                    {tab === 'anual' && (
                      <motion.div
                        key="anual"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <GlassInput
                          label="Ano"
                          type="number"
                          value={ano}
                          onChange={(e) => setAno(e.target.value)}
                          min={2020}
                          max={2100}
                          inputMode="numeric"
                        />
                      </motion.div>
                    )}

                    {tab === 'periodo' && (
                      <motion.div
                        key="periodo"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col gap-3"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <GlassInput
                            label="Data início"
                            type="date"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                          />
                          <GlassInput
                            label="Data fim"
                            type="date"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                          />
                        </div>
                        <GlassInput
                          label="Ano (referência)"
                          type="number"
                          value={ano}
                          onChange={(e) => setAno(e.target.value)}
                          min={2020}
                          max={2100}
                          inputMode="numeric"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Currency value - always visible */}
                  <GlassInput
                    label="Valor da meta"
                    prefix="R$"
                    placeholder="0,00"
                    value={valorRaw}
                    onChange={handleValorChange}
                    inputMode="numeric"
                    required
                  />

                  {/* Observations */}
                  <GlassTextarea
                    label="Observações (opcional)"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Notas sobre esta meta..."
                    rows={2}
                  />
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 24px' }} />

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4">
                  <motion.button
                    type="button"
                    onClick={handleClose}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors duration-150"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.45)',
                    }}
                  >
                    Cancelar
                  </motion.button>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={loading ? {} : { scale: 1.04, y: -1 }}
                    whileTap={loading ? {} : { scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-black uppercase tracking-wider"
                    style={{
                      background: loading
                        ? 'rgba(212,160,23,0.3)'
                        : 'linear-gradient(135deg, #d4a017 0%, #f5c842 50%, #d4a017 100%)',
                      color: '#080c14',
                      boxShadow: loading ? 'none' : '0 4px 16px rgba(212,160,23,0.35)',
                    }}
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black/60"
                      />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    {loading ? 'Salvando...' : 'Salvar meta'}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
