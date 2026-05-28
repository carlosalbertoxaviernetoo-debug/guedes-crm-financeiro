'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { upsertMeta } from '@/lib/actions/metas'
import { getMesAtual, getAnoAtual, MESES_NOMES } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Meta } from '@/types'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const mensalSchema = z.object({
  tipo: z.literal('mensal'),
  mes: z.coerce.number().int().min(1).max(12),
  ano: z.coerce.number().int().min(2020).max(2100),
  valor: z.coerce.number().positive('Valor deve ser maior que zero'),
})

const anualSchema = z.object({
  tipo: z.literal('anual'),
  mes: z.undefined().optional(),
  ano: z.coerce.number().int().min(2020).max(2100),
  valor: z.coerce.number().positive('Valor deve ser maior que zero'),
})

type MensalValues = z.infer<typeof mensalSchema>
type AnualValues = z.infer<typeof anualSchema>

// ---------------------------------------------------------------------------
// Currency input helpers
// ---------------------------------------------------------------------------

function parseCurrency(raw: string): number {
  const cleaned = raw.replace(/[R$\s.]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

function formatCurrencyInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const number = parseInt(digits, 10) / 100
  return number.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

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

export function MetaForm({
  open,
  onClose,
  onSaved,
  initialMes,
  initialAno,
}: MetaFormProps) {
  const [tab, setTab] = useState<'mensal' | 'anual'>('mensal')
  const [valorRaw, setValorRaw] = useState('')
  const [loading, setLoading] = useState(false)
  const [mes, setMes] = useState(String(initialMes ?? getMesAtual()))
  const [ano, setAno] = useState(String(initialAno ?? getAnoAtual()))

  function handleValorChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCurrencyInput(e.target.value)
    setValorRaw(formatted)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valor = parseCurrency(valorRaw)
    if (!valor || valor <= 0) {
      toast.error('Informe um valor válido.')
      return
    }
    const anoNum = parseInt(ano, 10)
    const mesNum = parseInt(mes, 10)
    if (!anoNum || anoNum < 2020) {
      toast.error('Informe um ano válido.')
      return
    }

    setLoading(true)
    const result = await upsertMeta({
      tipo: tab,
      valor,
      mes: tab === 'mensal' ? mesNum : undefined,
      ano: anoNum,
    })
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(tab === 'mensal' ? 'Meta mensal salva!' : 'Meta anual salva!')
    onSaved(result.data!)
    handleClose()
  }

  function handleClose() {
    setValorRaw('')
    setTab('mensal')
    setMes(String(getMesAtual()))
    setAno(String(getAnoAtual()))
    onClose()
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && handleClose()}>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>Definir meta</ModalTitle>
          <ModalDescription>
            Configure sua meta mensal ou anual de faturamento.
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody className="flex flex-col gap-4 py-4">
            {/* Tabs: Mensal / Anual */}
            <TabsPrimitive.Root
              value={tab}
              onValueChange={(v) => setTab(v as 'mensal' | 'anual')}
            >
              <TabsPrimitive.List className="flex rounded-lg border border-border overflow-hidden bg-muted/40 p-0.5">
                {(['mensal', 'anual'] as const).map((t) => (
                  <TabsPrimitive.Trigger
                    key={t}
                    value={t}
                    className={cn(
                      'flex-1 py-1.5 text-sm font-medium rounded-md transition-all duration-150',
                      'data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm',
                      'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground'
                    )}
                  >
                    {t === 'mensal' ? 'Mensal' : 'Anual'}
                  </TabsPrimitive.Trigger>
                ))}
              </TabsPrimitive.List>

              {/* Mensal fields */}
              <TabsPrimitive.Content value="mensal" className="mt-4 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Mês</label>
                    <Select value={mes} onValueChange={setMes}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MESES_NOMES.map((nome, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>
                            {nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    label="Ano"
                    type="number"
                    min={2020}
                    max={2100}
                    value={ano}
                    onChange={(e) => setAno(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
              </TabsPrimitive.Content>

              {/* Anual fields */}
              <TabsPrimitive.Content value="anual" className="mt-4">
                <Input
                  label="Ano"
                  type="number"
                  min={2020}
                  max={2100}
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  inputMode="numeric"
                />
              </TabsPrimitive.Content>
            </TabsPrimitive.Root>

            {/* Currency input */}
            <Input
              label="Valor da meta"
              required
              prefix={<span className="text-xs font-medium text-muted-foreground">R$</span>}
              placeholder="0,00"
              value={valorRaw}
              onChange={handleValorChange}
              inputMode="numeric"
            />
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="brand" loading={loading}>
              Salvar meta
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
