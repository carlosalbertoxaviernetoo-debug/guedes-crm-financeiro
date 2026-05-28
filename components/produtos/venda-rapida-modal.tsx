'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Minus, Plus, ShoppingCart, TrendingUp, User, Package } from 'lucide-react'
import Image from 'next/image'
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
import { Badge } from '@/components/ui/badge'
import { createVenda } from '@/lib/actions/vendas'
import { getClientes } from '@/lib/actions/clientes'
import { formatCurrency, calcLucroUnitario, calcMargem, formatPercent } from '@/lib/utils'
import type { Produto, Cliente } from '@/types'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const schema = z.object({
  quantidade: z.number().int().min(1, 'Mínimo 1 unidade'),
  cliente_id: z.string().optional(),
  observacoes: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof schema>

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface VendaRapidaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto: Produto | null
  onVendaRealizada?: () => void
}

export function VendaRapidaModal({
  open,
  onOpenChange,
  produto,
  onVendaRealizada,
}: VendaRapidaModalProps) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSearch, setClienteSearch] = useState('')
  const [showClienteList, setShowClienteList] = useState(false)
  const [loadingClientes, setLoadingClientes] = useState(false)

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { quantidade: 1, cliente_id: '', observacoes: '' },
  })

  const quantidade = watch('quantidade')

  // Load clients when modal opens
  useEffect(() => {
    if (open) {
      reset({ quantidade: 1, cliente_id: '', observacoes: '' })
      setClienteSearch('')
      setShowClienteList(false)
      setLoadingClientes(true)
      getClientes().then(({ data }) => {
        setClientes(data ?? [])
        setLoadingClientes(false)
      })
    }
  }, [open, reset])

  const maxQty = produto?.estoque ?? 0

  const decrement = useCallback(() => {
    setValue('quantidade', Math.max(1, quantidade - 1))
  }, [quantidade, setValue])

  const increment = useCallback(() => {
    setValue('quantidade', Math.min(maxQty, quantidade + 1))
  }, [quantidade, maxQty, setValue])

  // Computed previews
  const precoUnit = produto?.preco_venda ?? 0
  const custoUnit = produto?.custo ?? 0
  const lucroUnit = calcLucroUnitario(custoUnit, precoUnit)
  const margem = calcMargem(custoUnit, precoUnit)
  const totalVenda = precoUnit * quantidade
  const lucroTotal = lucroUnit * quantidade

  const filteredClientes = clientes.filter((c) =>
    c.nome.toLowerCase().includes(clienteSearch.toLowerCase())
  )

  async function onSubmit(values: FormValues) {
    if (!produto) return

    const { error } = await createVenda({
      produto_id: produto.id,
      cliente_id: values.cliente_id || undefined,
      quantidade: values.quantidade,
      observacoes: values.observacoes || undefined,
    })

    if (error) {
      toast.error(error)
      return
    }

    toast.success(`Venda registrada! ${formatCurrency(totalVenda)}`)
    onOpenChange(false)
    onVendaRealizada?.()
  }

  if (!produto) return null

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="md">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-brand" />
            Registrar Venda
          </ModalTitle>
          <ModalDescription>Confirme os detalhes da venda rápida</ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <ModalBody className="space-y-4">
            {/* Product info card */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/60 border border-border">
              <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 relative">
                {produto.imagem_url ? (
                  <Image
                    src={produto.imagem_url}
                    alt={produto.nome}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <Package className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{produto.nome}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-sm font-bold text-brand">{formatCurrency(precoUnit)}</span>
                  {produto.categoria && (
                    <Badge variant="muted" size="sm">
                      {produto.categoria}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {produto.estoque} em estoque
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Quantidade</label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={decrement}
                  disabled={quantidade <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Controller
                  name="quantidade"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      min={1}
                      max={maxQty}
                      value={field.value}
                      onChange={(e) => {
                        const v = parseInt(e.target.value)
                        if (!isNaN(v)) field.onChange(Math.min(maxQty, Math.max(1, v)))
                      }}
                      className="w-20 h-9 text-center rounded-md border border-input bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={increment}
                  disabled={quantidade >= maxQty}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground">máx. {maxQty}</span>
              </div>
              {errors.quantidade && (
                <p className="text-xs text-destructive">{errors.quantidade.message}</p>
              )}
            </div>

            {/* Preview totals */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-brand-muted rounded-lg p-3 border border-brand/20">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">
                  Total da venda
                </p>
                <p className="text-lg font-bold text-brand">{formatCurrency(totalVenda)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {quantidade} × {formatCurrency(precoUnit)}
                </p>
              </div>
              <div className="bg-muted/60 rounded-lg p-3 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">
                  Lucro estimado
                </p>
                <div className="flex items-baseline gap-1.5">
                  <p
                    className={[
                      'text-lg font-bold',
                      lucroTotal >= 0 ? 'text-foreground' : 'text-destructive',
                    ].join(' ')}
                  >
                    {formatCurrency(lucroTotal)}
                  </p>
                  <Badge
                    variant={margem >= 30 ? 'success' : margem >= 15 ? 'warning' : 'destructive'}
                    size="sm"
                  >
                    <TrendingUp className="w-3 h-3" />
                    {formatPercent(margem)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Client selector */}
            <div className="space-y-1.5 relative">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <User className="w-4 h-4" />
                Cliente{' '}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={clienteSearch}
                onChange={(e) => {
                  setClienteSearch(e.target.value)
                  setShowClienteList(true)
                  if (!e.target.value) setValue('cliente_id', '')
                }}
                onFocus={() => setShowClienteList(true)}
                placeholder={loadingClientes ? 'Carregando clientes...' : 'Buscar cliente por nome...'}
                disabled={loadingClientes}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all"
              />
              {showClienteList && clienteSearch && filteredClientes.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full max-h-40 overflow-y-auto rounded-md border border-border bg-popover shadow-xl">
                  <Controller
                    name="cliente_id"
                    control={control}
                    render={({ field }) => (
                      <>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            field.onChange('')
                            setClienteSearch('')
                            setShowClienteList(false)
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-accent transition-colors"
                        >
                          Sem cliente vinculado
                        </button>
                        {filteredClientes.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              field.onChange(c.id)
                              setClienteSearch(c.nome)
                              setShowClienteList(false)
                            }}
                            className={[
                              'w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors',
                              field.value === c.id ? 'bg-accent' : '',
                            ].join(' ')}
                          >
                            <span className="font-medium text-foreground">{c.nome}</span>
                            {c.cidade && (
                              <span className="text-muted-foreground ml-1.5 text-xs">
                                {c.cidade}
                              </span>
                            )}
                          </button>
                        ))}
                      </>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Observações{' '}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Controller
                name="observacoes"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={2}
                    placeholder="Alguma nota sobre esta venda..."
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all"
                  />
                )}
              />
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="brand"
              loading={isSubmitting}
              disabled={produto.estoque === 0}
              className="gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Confirmar venda
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
