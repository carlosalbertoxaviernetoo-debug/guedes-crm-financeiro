'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Loader2, MessageCircle, User } from 'lucide-react'
import { createCliente, updateCliente } from '@/lib/actions/clientes'
import { gerarLinkWhatsApp } from '@/lib/utils'
import type { Cliente } from '@/types'

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const GOLD   = '#d4a017'
const GOLD_D = 'rgba(212,160,23,'
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  telefone: z
    .string().optional()
    .transform((v) => v?.replace(/\D/g, '') || undefined)
    .refine((v) => !v || v.length === 10 || v.length === 11, 'Telefone deve ter 10 ou 11 dígitos'),
  cpf: z
    .string().optional()
    .transform((v) => v?.replace(/\D/g, '') || undefined)
    .refine((v) => !v || v.length === 11, 'CPF deve ter 11 dígitos'),
  instagram: z.string().optional(),
  cidade:    z.string().optional(),
  observacoes: z.string().optional(),
})

type FormValues = z.input<typeof schema>

// ─── Masks ────────────────────────────────────────────────────────────────────

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2)  return d
  if (d.length <= 6)  return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

function maskCPF(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LABEL: React.CSSProperties = {
  color: 'rgba(255,255,255,0.45)',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
}

function inputCss(hasError?: boolean): React.CSSProperties {
  return {
    width: '100%', height: 40,
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${hasError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10, padding: '0 12px',
    color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  }
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={LABEL}>
        {label}{required && <span style={{ color: GOLD }}> *</span>}
      </label>
      {children}
      {error && <p style={{ color: '#ef4444', fontSize: 11, margin: 0 }}>{error}</p>}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ClienteFormProps {
  open:            boolean
  onClose:         () => void
  editingCliente?: Cliente | null
  onSaved:         (c: Cliente) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClienteForm({ open, onClose, editingCliente, onSaved }: ClienteFormProps) {
  const isEdit = !!editingCliente

  const {
    register, handleSubmit, watch, setValue, reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', telefone: '', cpf: '', instagram: '', cidade: '', observacoes: '' },
  })

  useEffect(() => {
    if (editingCliente) {
      reset({
        nome:        editingCliente.nome ?? '',
        telefone:    editingCliente.telefone ? maskPhone(editingCliente.telefone) : '',
        cpf:         editingCliente.cpf      ? maskCPF(editingCliente.cpf)        : '',
        instagram:   editingCliente.instagram ?? '',
        cidade:      editingCliente.cidade ?? '',
        observacoes: editingCliente.observacoes ?? '',
      })
    } else {
      reset({ nome: '', telefone: '', cpf: '', instagram: '', cidade: '', observacoes: '' })
    }
  }, [editingCliente, reset, open])

  const telefoneRaw  = watch('telefone') ?? ''
  const whatsappLink = telefoneRaw.replace(/\D/g, '').length >= 10
    ? gerarLinkWhatsApp(telefoneRaw)
    : null

  async function onSubmit(values: FormValues) {
    const payload = {
      nome:        values.nome,
      telefone:    values.telefone ? maskPhone(values.telefone) : undefined,
      cpf:         values.cpf      ? maskCPF(values.cpf)        : undefined,
      instagram:   values.instagram?.trim()   || undefined,
      cidade:      values.cidade?.trim()      || undefined,
      observacoes: values.observacoes?.trim() || undefined,
    }

    const result = isEdit
      ? await updateCliente(editingCliente!.id, payload)
      : await createCliente(payload)

    if (result.error) { toast.error(result.error); return }

    toast.success(isEdit ? 'Cliente atualizado!' : 'Cliente cadastrado!')
    onSaved(result.data!)
    onClose()
    reset()
  }

  function handleOpenChange(v: boolean) {
    if (!v) onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Overlay */}
            <Dialog.Overlay asChild>
              <motion.div
                key="cf-overlay"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(2,5,12,0.85)', backdropFilter: 'blur(8px)', zIndex: 50 }}
              />
            </Dialog.Overlay>

            {/* Panel */}
            <Dialog.Content
              style={{
                position: 'fixed', inset: 0, zIndex: 51,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 12px', outline: 'none', pointerEvents: 'none',
              }}
            >
              <motion.div
                key="cf-panel"
                initial={{ opacity: 0, y: 28, scale: 0.97 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{ opacity: 0, y: 18, scale: 0.96 }}
                transition={{ duration: 0.32, ease: EASE }}
                style={{
                  width: '100%', maxWidth: 500,
                  background: 'linear-gradient(145deg, #0d1829 0%, #080c14 100%)',
                  border: `1px solid ${GOLD_D}0.18)`,
                  borderRadius: 20,
                  boxShadow: `0 36px 90px rgba(0,0,0,0.8), 0 0 0 1px ${GOLD_D}0.05)`,
                  maxHeight: '92vh', display: 'flex', flexDirection: 'column',
                  pointerEvents: 'auto',
                }}
              >
                {/* Header */}
                <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${GOLD}, #f5c842)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User style={{ width: 15, height: 15, color: '#080c14' }} />
                    </div>
                    <div>
                      <Dialog.Title style={{ color: '#fff', fontWeight: 900, fontSize: 16, margin: 0 }}>
                        {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
                      </Dialog.Title>
                      <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, marginTop: 2 }}>
                        {isEdit ? 'Atualize os dados do cliente' : 'Preencha os dados para cadastrar'}
                      </p>
                    </div>
                  </div>
                  <Dialog.Close asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </motion.button>
                  </Dialog.Close>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Nome */}
                    <Field label="Nome completo" required error={errors.nome?.message}>
                      <input {...register('nome')} placeholder="Ex: Carlos Andrade"
                        style={inputCss(!!errors.nome)} />
                    </Field>

                    {/* Telefone */}
                    <Field label="Telefone" error={errors.telefone?.message}>
                      <input
                        value={telefoneRaw}
                        onChange={(e) => setValue('telefone', maskPhone(e.target.value))}
                        inputMode="tel"
                        placeholder="(00) 00000-0000"
                        style={inputCss(!!errors.telefone)}
                      />
                      {whatsappLink && (
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#22c55e', fontSize: 11, textDecoration: 'none', marginTop: 2 }}>
                          <MessageCircle style={{ width: 11, height: 11 }} />
                          Abrir WhatsApp
                        </a>
                      )}
                    </Field>

                    {/* CPF */}
                    <Field label="CPF (opcional)" error={errors.cpf?.message}>
                      <input
                        value={watch('cpf') ?? ''}
                        onChange={(e) => setValue('cpf', maskCPF(e.target.value))}
                        inputMode="numeric"
                        placeholder="000.000.000-00"
                        style={inputCss(!!errors.cpf)}
                      />
                    </Field>

                    {/* Instagram */}
                    <Field label="Instagram (opcional)">
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>@</span>
                        <input
                          value={(watch('instagram') ?? '').replace(/^@+/, '')}
                          onChange={(e) => {
                            const val = e.target.value.replace(/^@+/, '')
                            setValue('instagram', val ? `@${val}` : '')
                          }}
                          placeholder="usuario"
                          style={{ ...inputCss(), paddingLeft: 26 }}
                        />
                      </div>
                    </Field>

                    {/* Cidade */}
                    <Field label="Cidade (opcional)">
                      <input {...register('cidade')} placeholder="Ex: São Paulo"
                        style={inputCss()} />
                    </Field>

                    {/* Observações */}
                    <Field label="Observações (opcional)">
                      <textarea {...register('observacoes')} rows={3}
                        placeholder="Preferências, histórico, notas..."
                        style={{ ...inputCss(), height: 'auto', padding: '10px 12px', resize: 'none', lineHeight: 1.5 }}
                      />
                    </Field>
                  </div>

                  {/* Footer */}
                  <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
                    <Dialog.Close asChild>
                      <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        style={{ padding: '9px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        Cancelar
                      </motion.button>
                    </Dialog.Close>
                    <motion.button type="submit" disabled={isSubmitting}
                      whileHover={isSubmitting ? {} : { scale: 1.02 }}
                      whileTap={isSubmitting ? {} : { scale: 0.97 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 24px', borderRadius: 12, background: `linear-gradient(135deg, ${GOLD} 0%, #f5c842 50%, ${GOLD} 100%)`, border: 'none', color: '#080c14', fontSize: 13, fontWeight: 900, cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: `0 4px 14px ${GOLD_D}0.3)`, opacity: isSubmitting ? 0.7 : 1 }}>
                      {isSubmitting && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
                      {isEdit ? 'Salvar alterações' : 'Cadastrar cliente'}
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
