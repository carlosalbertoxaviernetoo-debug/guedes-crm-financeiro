'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { MessageCircle } from 'lucide-react'

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createCliente, updateCliente } from '@/lib/actions/clientes'
import { gerarLinkWhatsApp } from '@/lib/utils'
import type { Cliente } from '@/types'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  telefone: z
    .string()
    .optional()
    .transform((v) => v?.replace(/\D/g, '') || undefined)
    .refine(
      (v) => !v || v.length === 10 || v.length === 11,
      'Telefone deve ter 10 ou 11 dígitos'
    ),
  cpf: z
    .string()
    .optional()
    .transform((v) => v?.replace(/\D/g, '') || undefined)
    .refine((v) => !v || v.length === 11, 'CPF deve ter 11 dígitos'),
  instagram: z.string().optional(),
  cidade: z.string().optional(),
  observacoes: z.string().optional(),
})

type FormValues = z.input<typeof schema>

// ---------------------------------------------------------------------------
// Mask helpers
// ---------------------------------------------------------------------------

function maskPhone(v: string): string {
  const digits = v.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function maskCPF(v: string): string {
  const digits = v.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ClienteFormProps {
  open: boolean
  onClose: () => void
  editingCliente?: Cliente | null
  onSaved: (cliente: Cliente) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ClienteForm({ open, onClose, editingCliente, onSaved }: ClienteFormProps) {
  const isEdit = !!editingCliente

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      telefone: '',
      cpf: '',
      instagram: '',
      cidade: '',
      observacoes: '',
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (editingCliente) {
      reset({
        nome: editingCliente.nome ?? '',
        telefone: editingCliente.telefone
          ? maskPhone(editingCliente.telefone)
          : '',
        cpf: editingCliente.cpf ? maskCPF(editingCliente.cpf) : '',
        instagram: editingCliente.instagram ?? '',
        cidade: editingCliente.cidade ?? '',
        observacoes: editingCliente.observacoes ?? '',
      })
    } else {
      reset({
        nome: '',
        telefone: '',
        cpf: '',
        instagram: '',
        cidade: '',
        observacoes: '',
      })
    }
  }, [editingCliente, reset])

  const telefoneRaw = watch('telefone') ?? ''
  const whatsappLink =
    telefoneRaw.replace(/\D/g, '').length >= 10
      ? gerarLinkWhatsApp(telefoneRaw)
      : null

  async function onSubmit(values: FormValues) {
    const payload = {
      nome: values.nome,
      telefone: values.telefone ? maskPhone(values.telefone) : undefined,
      cpf: values.cpf ? maskCPF(values.cpf) : undefined,
      instagram: values.instagram?.trim() || undefined,
      cidade: values.cidade?.trim() || undefined,
      observacoes: values.observacoes?.trim() || undefined,
    }

    const result = isEdit
      ? await updateCliente(editingCliente!.id, payload)
      : await createCliente(payload)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(isEdit ? 'Cliente atualizado!' : 'Cliente adicionado!')
    onSaved(result.data!)
    onClose()
    reset()
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="md">
        <ModalHeader>
          <ModalTitle>{isEdit ? 'Editar cliente' : 'Novo cliente'}</ModalTitle>
          <ModalDescription>
            {isEdit
              ? 'Atualize os dados do cliente abaixo.'
              : 'Preencha os dados para cadastrar um novo cliente.'}
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody className="flex flex-col gap-4 py-4">
            {/* Nome */}
            <Input
              label="Nome"
              required
              placeholder="Ex: Maria Silva"
              errorMessage={errors.nome?.message}
              {...register('nome')}
            />

            {/* Telefone */}
            <div className="flex flex-col gap-1.5">
              <Input
                label="Telefone"
                placeholder="(00) 00000-0000"
                errorMessage={errors.telefone?.message}
                value={telefoneRaw}
                onChange={(e) =>
                  setValue('telefone', maskPhone(e.target.value))
                }
                inputMode="tel"
              />
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-green-500 hover:text-green-400 transition-colors"
                >
                  <MessageCircle className="h-3 w-3" />
                  Abrir WhatsApp
                </a>
              )}
            </div>

            {/* CPF */}
            <Input
              label="CPF (opcional)"
              placeholder="000.000.000-00"
              errorMessage={errors.cpf?.message}
              value={watch('cpf') ?? ''}
              onChange={(e) => setValue('cpf', maskCPF(e.target.value))}
              inputMode="numeric"
            />

            {/* Instagram */}
            <Input
              label="Instagram (opcional)"
              placeholder="@usuario"
              prefix={<span className="text-xs">@</span>}
              errorMessage={errors.instagram?.message}
              {...register('instagram')}
              onChange={(e) => {
                const val = e.target.value.replace(/^@+/, '')
                setValue('instagram', val ? `@${val}` : '')
              }}
              value={(watch('instagram') ?? '').replace(/^@+/, '')}
            />

            {/* Cidade */}
            <Input
              label="Cidade (opcional)"
              placeholder="Ex: São Paulo"
              {...register('cidade')}
            />

            {/* Observações */}
            <Textarea
              label="Observações (opcional)"
              placeholder="Preferências, histórico, notas..."
              rows={3}
              {...register('observacoes')}
            />
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="brand" loading={isSubmitting}>
              {isEdit ? 'Salvar alterações' : 'Cadastrar cliente'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
