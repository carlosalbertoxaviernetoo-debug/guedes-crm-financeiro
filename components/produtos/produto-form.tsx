'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { TrendingUp, DollarSign, Package } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { createProduto, updateProduto } from '@/lib/actions/produtos'
import {
  formatCurrency,
  formatPercent,
  calcMargem,
  calcLucroUnitario,
  CATEGORIAS_PRODUTO,
} from '@/lib/utils'
import type { Produto } from '@/types'

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  categoria: z.string().optional(),
  custo: z
    .string()
    .min(1, 'Informe o custo')
    .refine((v) => !isNaN(parseFloat(v.replace(',', '.'))), 'Valor inválido'),
  preco_venda: z
    .string()
    .min(1, 'Informe o preço')
    .refine((v) => !isNaN(parseFloat(v.replace(',', '.'))), 'Valor inválido'),
  estoque: z
    .string()
    .min(1, 'Informe o estoque')
    .refine((v) => !isNaN(parseInt(v)), 'Quantidade inválida'),
  descricao: z.string().max(500).optional(),
  imagem_url: z.string().url('URL inválida').optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseMoney(val: string): number {
  return parseFloat(val.replace(',', '.')) || 0
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ProdutoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto?: Produto | null
  onSaved: (produto: Produto) => void
}

export function ProdutoForm({ open, onOpenChange, produto, onSaved }: ProdutoFormProps) {
  const isEdit = !!produto

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      categoria: '',
      custo: '',
      preco_venda: '',
      estoque: '0',
      descricao: '',
      imagem_url: '',
    },
  })

  // Populate when editing
  useEffect(() => {
    if (open) {
      if (produto) {
        reset({
          nome: produto.nome,
          categoria: produto.categoria ?? '',
          custo: String(produto.custo),
          preco_venda: String(produto.preco_venda),
          estoque: String(produto.estoque),
          descricao: produto.descricao ?? '',
          imagem_url: produto.imagem_url ?? '',
        })
      } else {
        reset({
          nome: '',
          categoria: '',
          custo: '',
          preco_venda: '',
          estoque: '0',
          descricao: '',
          imagem_url: '',
        })
      }
    }
  }, [open, produto, reset])

  // Live margin preview
  const custoVal = parseMoney(watch('custo') ?? '0')
  const precoVal = parseMoney(watch('preco_venda') ?? '0')
  const margem = calcMargem(custoVal, precoVal)
  const lucroUnit = calcLucroUnitario(custoVal, precoVal)

  async function onSubmit(values: FormValues) {
    const payload = {
      nome: values.nome,
      categoria: values.categoria || null,
      custo: parseMoney(values.custo),
      preco_venda: parseMoney(values.preco_venda),
      estoque: parseInt(values.estoque),
      descricao: values.descricao || null,
      imagem_url: values.imagem_url || null,
    }

    if (isEdit && produto) {
      const { data, error } = await updateProduto(produto.id, payload)
      if (error) { toast.error(error); return }
      toast.success('Produto atualizado com sucesso!')
      onSaved(data!)
    } else {
      const { data, error } = await createProduto(payload)
      if (error) { toast.error(error); return }
      toast.success('Produto criado com sucesso!')
      onSaved(data!)
    }
    onOpenChange(false)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle>{isEdit ? 'Editar Produto' : 'Novo Produto'}</ModalTitle>
          <ModalDescription>
            {isEdit
              ? 'Atualize as informações do produto abaixo.'
              : 'Preencha as informações para cadastrar um novo produto.'}
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <ModalBody className="space-y-4 max-h-[60vh] overflow-y-auto pb-4">
            {/* Nome */}
            <Input
              label="Nome do produto"
              required
              placeholder="Ex: Camiseta Básica Preta"
              {...register('nome')}
              error={!!errors.nome}
              errorMessage={errors.nome?.message}
            />

            {/* Categoria */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Categoria</label>
              <select
                {...register('categoria')}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-all"
              >
                <option value="">Selecionar categoria</option>
                {CATEGORIAS_PRODUTO.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Custo + Preço */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Custo (R$)"
                required
                placeholder="0,00"
                prefix={<DollarSign className="w-4 h-4" />}
                {...register('custo')}
                error={!!errors.custo}
                errorMessage={errors.custo?.message}
              />
              <Input
                label="Preço de venda (R$)"
                required
                placeholder="0,00"
                prefix={<DollarSign className="w-4 h-4" />}
                {...register('preco_venda')}
                error={!!errors.preco_venda}
                errorMessage={errors.preco_venda?.message}
              />
            </div>

            {/* Live margin preview */}
            {custoVal > 0 && precoVal > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-muted border border-brand/20">
                <TrendingUp className="w-4 h-4 text-brand shrink-0" />
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">
                    Lucro unitário:{' '}
                    <span className={lucroUnit >= 0 ? 'font-semibold text-brand' : 'font-semibold text-destructive'}>
                      {formatCurrency(lucroUnit)}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Margem:{' '}
                    <Badge
                      variant={margem >= 30 ? 'success' : margem >= 15 ? 'warning' : 'destructive'}
                      size="sm"
                    >
                      {formatPercent(margem)}
                    </Badge>
                  </span>
                </div>
              </div>
            )}

            {/* Estoque */}
            <Input
              label="Estoque inicial"
              required
              type="number"
              min="0"
              step="1"
              placeholder="0"
              prefix={<Package className="w-4 h-4" />}
              {...register('estoque')}
              error={!!errors.estoque}
              errorMessage={errors.estoque?.message}
            />

            {/* Descrição */}
            <Textarea
              label="Descrição (opcional)"
              placeholder="Detalhes do produto..."
              rows={3}
              {...register('descricao')}
              error={!!errors.descricao}
              errorMessage={errors.descricao?.message}
            />

            {/* Imagem */}
            <Input
              label="URL da imagem (opcional)"
              placeholder="https://exemplo.com/imagem.jpg"
              {...register('imagem_url')}
              error={!!errors.imagem_url}
              errorMessage={errors.imagem_url?.message}
            />
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
            <Button type="submit" variant="brand" loading={isSubmitting}>
              {isEdit ? 'Salvar alterações' : 'Criar produto'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
