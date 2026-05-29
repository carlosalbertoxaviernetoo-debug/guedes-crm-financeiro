'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import {
  X, Upload, Camera, TrendingUp, Package,
  Plus, Check, Loader2,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Image from 'next/image'
import { createProduto, updateProduto, uploadProdutoImagem } from '@/lib/actions/produtos'
import { formatCurrency, calcMargem, calcLucroUnitario, CATEGORIAS_PRODUTO } from '@/lib/utils'
import type { Produto } from '@/types'

// ─── Brand tokens ────────────────────────────────────────────────────────────

const GOLD   = '#d4a017'
const GOLD_D = 'rgba(212,160,23,'
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

// ─── Zod schema ──────────────────────────────────────────────────────────────

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  custo: z
    .string()
    .min(1, 'Informe o custo')
    .refine((v) => !isNaN(parseFloat(v.replace(',', '.'))), 'Valor inválido'),
  preco_venda: z
    .string()
    .min(1, 'Informe o preço de venda')
    .refine((v) => !isNaN(parseFloat(v.replace(',', '.'))), 'Valor inválido'),
  estoque: z
    .string()
    .min(1, 'Informe o estoque')
    .refine((v) => !isNaN(parseInt(v)), 'Quantidade inválida'),
  descricao: z.string().max(500).optional(),
})
type FormValues = z.infer<typeof schema>

function parseMoney(val: string): number {
  return parseFloat(val.replace(',', '.')) || 0
}

// ─── Tiny style helpers ───────────────────────────────────────────────────────

const LABEL: React.CSSProperties = {
  color: 'rgba(255,255,255,0.45)',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
}

function inputCss(hasError?: boolean): React.CSSProperties {
  return {
    width: '100%',
    height: 40,
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${hasError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10,
    padding: '0 12px',
    color: '#fff',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  }
}

function Field({
  label, required, error, children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={LABEL}>
        {label}
        {required && <span style={{ color: GOLD }}> *</span>}
      </label>
      {children}
      {error && (
        <p style={{ color: '#ef4444', fontSize: 11, margin: 0 }}>{error}</p>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ProdutoFormProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  produto?: Produto | null
  onSaved: (p: Produto) => void
}

export function ProdutoForm({ open, onOpenChange, produto, onSaved }: ProdutoFormProps) {
  const isEdit = !!produto

  // ── image ─────────────────────────────────────────────────
  const [imageUrl,      setImageUrl]      = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const fileRef   = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  // ── categories ────────────────────────────────────────────
  const [selectedCat,    setSelectedCat]    = useState('')
  const [customCats,     setCustomCats]     = useState<string[]>([])
  const [catInput,       setCatInput]       = useState('')
  const [showCatInput,   setShowCatInput]   = useState(false)
  const allCats = [...CATEGORIAS_PRODUTO, ...customCats]

  // ── form ──────────────────────────────────────────────────
  const {
    register, handleSubmit, watch, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', custo: '', preco_venda: '', estoque: '0', descricao: '' },
  })

  // Reset when opened / produto changes
  useEffect(() => {
    if (!open) return
    if (produto) {
      reset({
        nome:        produto.nome,
        custo:       String(produto.custo),
        preco_venda: String(produto.preco_venda),
        estoque:     String(produto.estoque),
        descricao:   produto.descricao ?? '',
      })
      setImageUrl(produto.imagem_url ?? null)
      setSelectedCat(produto.categoria ?? '')
    } else {
      reset({ nome: '', custo: '', preco_venda: '', estoque: '0', descricao: '' })
      setImageUrl(null)
      setSelectedCat('')
    }
    setCatInput('')
    setShowCatInput(false)
  }, [open, produto, reset])

  // Live margin preview
  const custoVal  = parseMoney(watch('custo')       ?? '0')
  const precoVal  = parseMoney(watch('preco_venda') ?? '0')
  const margem    = calcMargem(custoVal, precoVal)
  const lucroUnit = calcLucroUnitario(custoVal, precoVal)

  // ── handlers ──────────────────────────────────────────────

  async function handleImageFile(file: File) {
    setImageUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const { url, error } = await uploadProdutoImagem(fd)
    setImageUploading(false)
    if (error) { toast.error(error); return }
    setImageUrl(url)
    toast.success('Imagem enviada com sucesso!')
  }

  function handleAddCat() {
    const name = catInput.trim()
    if (!name) { setShowCatInput(false); return }
    if (!allCats.includes(name)) setCustomCats(prev => [...prev, name])
    setSelectedCat(name)
    setCatInput('')
    setShowCatInput(false)
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      nome:        values.nome,
      categoria:   selectedCat || null,
      custo:       parseMoney(values.custo),
      preco_venda: parseMoney(values.preco_venda),
      estoque:     parseInt(values.estoque),
      descricao:   values.descricao || null,
      imagem_url:  imageUrl || null,
    }

    if (isEdit && produto) {
      const { data, error } = await updateProduto(produto.id, payload)
      if (error) { toast.error(error); return }
      toast.success('Produto atualizado!')
      onSaved(data!)
    } else {
      const { data, error } = await createProduto(payload)
      if (error) { toast.error(error); return }
      toast.success('Produto criado com sucesso!')
      onSaved(data!)
    }
    onOpenChange(false)
  }

  // ── render ────────────────────────────────────────────────

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Overlay */}
            <Dialog.Overlay asChild>
              <motion.div
                key="pf-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'fixed', inset: 0,
                  background: 'rgba(2,5,12,0.85)',
                  backdropFilter: 'blur(8px)',
                  zIndex: 50,
                }}
              />
            </Dialog.Overlay>

            {/* Panel — Dialog.Content is the full-screen flex container so Framer Motion
                doesn't conflict with the centering transform */}
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
                key="pf-panel"
                initial={{ opacity: 0, y: 28, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.96 }}
                transition={{ duration: 0.32, ease: EASE }}
                style={{
                  width: '100%', maxWidth: 560,
                  background: 'linear-gradient(145deg, #0d1829 0%, #080c14 100%)',
                  border: `1px solid ${GOLD_D}0.18)`,
                  borderRadius: 20,
                  boxShadow: `0 36px 90px rgba(0,0,0,0.8), 0 0 0 1px ${GOLD_D}0.05)`,
                  maxHeight: '92vh',
                  display: 'flex',
                  flexDirection: 'column',
                  pointerEvents: 'auto',
                }}
              >
                {/* ── Header ── */}
                <div style={{
                  padding: '22px 24px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexShrink: 0,
                }}>
                  <div>
                    <Dialog.Title style={{ color: '#fff', fontWeight: 900, fontSize: 17, margin: 0 }}>
                      {isEdit ? 'Editar Produto' : 'Novo Produto'}
                    </Dialog.Title>
                    <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, marginTop: 3 }}>
                      {isEdit
                        ? 'Atualize as informações do produto'
                        : 'Preencha os dados para cadastrar'}
                    </p>
                  </div>
                  <Dialog.Close asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      style={{
                        width: 32, height: 32, borderRadius: 9,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        color: 'rgba(255,255,255,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </motion.button>
                  </Dialog.Close>
                </div>

                {/* ── Body ── */}
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  noValidate
                  style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
                >
                  <div style={{
                    flex: 1, overflowY: 'auto',
                    padding: '20px 24px',
                    display: 'flex', flexDirection: 'column', gap: 18,
                  }}>

                    {/* Image upload row */}
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      {/* Preview box */}
                      <div style={{
                        width: 90, height: 90, borderRadius: 14, flexShrink: 0,
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${imageUrl ? GOLD_D + '0.35)' : 'rgba(255,255,255,0.08)'}`,
                        overflow: 'hidden', position: 'relative',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'border-color 0.2s',
                      }}>
                        {imageUploading
                          ? <Loader2 style={{ width: 24, height: 24, color: GOLD }} className="animate-spin" />
                          : imageUrl
                            ? <Image src={imageUrl} alt="preview" fill style={{ objectFit: 'cover' }} sizes="90px" />
                            : <Package style={{ width: 28, height: 28, color: GOLD_D + '0.2)' }} />
                        }
                      </div>

                      {/* Action buttons */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <p style={LABEL}>Imagem do produto</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {/* Hidden file inputs */}
                          <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={e => {
                              const f = e.target.files?.[0]
                              if (f) handleImageFile(f)
                              e.target.value = ''
                            }}
                          />
                          {/* capture="environment" picks the rear camera on mobile */}
                          <input
                            ref={cameraRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            style={{ display: 'none' }}
                            onChange={e => {
                              const f = e.target.files?.[0]
                              if (f) handleImageFile(f)
                              e.target.value = ''
                            }}
                          />

                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
                            onClick={() => fileRef.current?.click()}
                            disabled={imageUploading}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '6px 13px', borderRadius: 9,
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: 'rgba(255,255,255,0.7)',
                              fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            }}
                          >
                            <Upload style={{ width: 12, height: 12 }} />
                            Galeria
                          </motion.button>

                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
                            onClick={() => cameraRef.current?.click()}
                            disabled={imageUploading}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '6px 13px', borderRadius: 9,
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: 'rgba(255,255,255,0.7)',
                              fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            }}
                          >
                            <Camera style={{ width: 12, height: 12 }} />
                            Câmera
                          </motion.button>

                          {imageUrl && (
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.92 }}
                              onClick={() => setImageUrl(null)}
                              style={{
                                padding: '6px 10px', borderRadius: 9,
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.25)',
                                color: '#ef4444',
                                display: 'flex', alignItems: 'center', cursor: 'pointer',
                              }}
                            >
                              <X style={{ width: 12, height: 12 }} />
                            </motion.button>
                          )}
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>
                          JPEG, PNG, WEBP — máx. 5 MB
                        </p>
                      </div>
                    </div>

                    {/* Nome */}
                    <Field label="Nome do produto" required error={errors.nome?.message}>
                      <input
                        {...register('nome')}
                        placeholder="Ex: Camiseta Básica Preta"
                        style={inputCss(!!errors.nome)}
                      />
                    </Field>

                    {/* Categorias ─ chips */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={LABEL}>Categoria</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {allCats.map((cat) => {
                          const active = selectedCat === cat
                          return (
                            <motion.button
                              key={cat}
                              type="button"
                              whileTap={{ scale: 0.91 }}
                              onClick={() => setSelectedCat(active ? '' : cat)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '5px 13px', borderRadius: 50,
                                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.15s',
                                background: active
                                  ? `linear-gradient(135deg, ${GOLD}, #f5c842)`
                                  : 'rgba(255,255,255,0.05)',
                                border: active ? 'none' : '1px solid rgba(255,255,255,0.09)',
                                color: active ? '#080c14' : 'rgba(255,255,255,0.5)',
                              }}
                            >
                              {active && <Check style={{ width: 9, height: 9 }} />}
                              {cat}
                            </motion.button>
                          )
                        })}

                        {/* "Nova categoria" */}
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.91 }}
                          onClick={() => setShowCatInput((v) => !v)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '5px 13px', borderRadius: 50,
                            fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            background: 'transparent',
                            border: `1px dashed ${GOLD_D}0.4)`,
                            color: GOLD_D + '0.65)',
                          }}
                        >
                          <Plus style={{ width: 10, height: 10 }} />
                          Nova
                        </motion.button>
                      </div>

                      {/* Custom category input */}
                      <AnimatePresence>
                        {showCatInput && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 44 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ display: 'flex', gap: 8, overflow: 'hidden', alignItems: 'center' }}
                          >
                            <input
                              value={catInput}
                              onChange={(e) => setCatInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); handleAddCat() }
                              }}
                              placeholder="Nome da nova categoria..."
                              autoFocus
                              style={{ ...inputCss(), flex: 1 }}
                            />
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.92 }}
                              onClick={handleAddCat}
                              style={{
                                width: 40, height: 40, flexShrink: 0, borderRadius: 10,
                                background: `linear-gradient(135deg, ${GOLD}, #f5c842)`,
                                border: 'none', color: '#080c14',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <Check style={{ width: 16, height: 16 }} />
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Custo + Preço */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="Custo (R$)" required error={errors.custo?.message}>
                        <input
                          {...register('custo')}
                          placeholder="0,00"
                          style={inputCss(!!errors.custo)}
                        />
                      </Field>
                      <Field label="Preço de venda (R$)" required error={errors.preco_venda?.message}>
                        <input
                          {...register('preco_venda')}
                          placeholder="0,00"
                          style={{
                            ...inputCss(!!errors.preco_venda),
                            borderColor: errors.preco_venda
                              ? 'rgba(239,68,68,0.5)'
                              : GOLD_D + '0.2)',
                          }}
                        />
                      </Field>
                    </div>

                    {/* Live margin pill */}
                    <AnimatePresence>
                      {custoVal > 0 && precoVal > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 14px', borderRadius: 12,
                            background: GOLD_D + '0.06)',
                            border: `1px solid ${GOLD_D}0.18)`,
                          }}
                        >
                          <TrendingUp style={{ width: 14, height: 14, color: GOLD, flexShrink: 0 }} />
                          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12 }}>
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                              Lucro:{' '}
                              <span style={{
                                color: lucroUnit >= 0 ? GOLD : '#ef4444',
                                fontWeight: 700,
                              }}>
                                {formatCurrency(lucroUnit)}
                              </span>
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                              Margem:{' '}
                              <span style={{
                                color: margem >= 30 ? GOLD : margem >= 15 ? '#f59e0b' : '#ef4444',
                                fontWeight: 700,
                              }}>
                                {margem.toFixed(1)}%
                              </span>
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Estoque */}
                    <Field label="Estoque inicial" required error={errors.estoque?.message}>
                      <input
                        {...register('estoque')}
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        style={inputCss(!!errors.estoque)}
                      />
                    </Field>

                    {/* Descrição */}
                    <Field label="Descrição (opcional)" error={errors.descricao?.message}>
                      <textarea
                        {...register('descricao')}
                        rows={2}
                        placeholder="Detalhes do produto..."
                        style={{
                          ...inputCss(),
                          height: 'auto',
                          padding: '10px 12px',
                          resize: 'none',
                          lineHeight: 1.5,
                        }}
                      />
                    </Field>
                  </div>

                  {/* ── Footer ── */}
                  <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', gap: 10, justifyContent: 'flex-end',
                    flexShrink: 0,
                  }}>
                    <Dialog.Close asChild>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        style={{
                          padding: '9px 20px', borderRadius: 12,
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.55)',
                          fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        Cancelar
                      </motion.button>
                    </Dialog.Close>

                    <motion.button
                      type="submit"
                      disabled={isSubmitting || imageUploading}
                      whileHover={isSubmitting ? {} : { scale: 1.02 }}
                      whileTap={isSubmitting ? {} : { scale: 0.97 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '9px 24px', borderRadius: 12,
                        background: `linear-gradient(135deg, ${GOLD} 0%, #f5c842 50%, ${GOLD} 100%)`,
                        border: 'none',
                        color: '#080c14',
                        fontSize: 13, fontWeight: 900,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        boxShadow: `0 4px 14px ${GOLD_D}0.3)`,
                        opacity: isSubmitting || imageUploading ? 0.7 : 1,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      {isSubmitting && (
                        <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                      )}
                      {isEdit ? 'Salvar alterações' : 'Criar produto'}
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
