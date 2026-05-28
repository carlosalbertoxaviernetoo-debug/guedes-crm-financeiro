'use client'

import { useState } from 'react'
import { MessageCircle, ExternalLink, ChevronDown } from 'lucide-react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { gerarLinkWhatsApp } from '@/lib/utils'
import type { Cliente } from '@/types'

// ---------------------------------------------------------------------------
// Message templates
// ---------------------------------------------------------------------------

const TEMPLATES = [
  { label: 'Selecione um template...', value: '' },
  {
    label: 'Novidade disponivel',
    value: 'Ola, {nome}! Temos uma novidade incrivel esperando por voce. Confira ja! 🎉',
  },
  {
    label: 'Pedido pronto',
    value: 'Ola, {nome}! Seu pedido esta pronto para retirada. Qualquer duvida e so chamar! 📦',
  },
  {
    label: 'Promoção especial',
    value: 'Ola, {nome}! Voce tem uma promocao exclusiva esperando por voce. Aproveite antes que acabe! 🔥',
  },
  {
    label: 'Convite de retorno',
    value: 'Ola, {nome}! Faz tempo que nao nos falamos. Temos novidades que voce vai adorar! 😊',
  },
  {
    label: 'Confirmação de pedido',
    value: 'Ola, {nome}! Confirmamos o recebimento do seu pedido. Em breve entraremos em contato com mais detalhes. ✅',
  },
  {
    label: 'Agradecimento',
    value: 'Ola, {nome}! Muito obrigado pela sua compra! Foi um prazer atende-la(o). Volte sempre! ❤️',
  },
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WhatsAppModalProps {
  open: boolean
  onClose: () => void
  cliente: Cliente | null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WhatsAppModal({ open, onClose, cliente }: WhatsAppModalProps) {
  const [mensagem, setMensagem] = useState('')
  const [templateValue, setTemplateValue] = useState('')

  if (!cliente) return null

  const primeiroNome = cliente.nome.trim().split(' ')[0]

  function handleTemplateChange(value: string) {
    setTemplateValue(value)
    if (value) {
      setMensagem(value.replace('{nome}', primeiroNome))
    }
  }

  const link = gerarLinkWhatsApp(cliente.telefone ?? '', mensagem || undefined)

  function handleOpen() {
    window.open(link, '_blank')
  }

  function handleClose() {
    setMensagem('')
    setTemplateValue('')
    onClose()
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && handleClose()}>
      <ModalContent size="md">
        <ModalHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
              <MessageCircle className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <ModalTitle>Mensagem WhatsApp</ModalTitle>
              <ModalDescription className="mt-0.5">
                Para {cliente.nome} — {cliente.telefone}
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="flex flex-col gap-4 py-4">
          {/* Template selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Template rápido
            </label>
            <Select value={templateValue} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template..." />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map((t) => (
                  <SelectItem key={t.value} value={t.value || '__none__'}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message textarea */}
          <Textarea
            label="Mensagem"
            placeholder="Digite sua mensagem aqui..."
            rows={5}
            value={mensagem}
            onChange={(e) => {
              setMensagem(e.target.value)
              setTemplateValue('')
            }}
          />

          {/* Link preview */}
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Preview do link:
            </p>
            <p className="text-xs text-foreground break-all font-mono opacity-70">
              {link.slice(0, 80)}{link.length > 80 ? '...' : ''}
            </p>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleOpen}
            className="bg-green-600 hover:bg-green-500 text-white border-transparent gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir WhatsApp
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
