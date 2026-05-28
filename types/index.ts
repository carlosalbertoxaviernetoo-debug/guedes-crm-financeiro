export interface Produto {
  id: string
  nome: string
  imagem_url?: string | null
  custo: number
  preco_venda: number
  estoque: number
  categoria?: string | null
  descricao?: string | null
  created_at: string
  updated_at: string
  margem?: number
  lucro_unitario?: number
}

export interface Cliente {
  id: string
  nome: string
  telefone?: string | null
  cpf?: string | null
  instagram?: string | null
  cidade?: string | null
  observacoes?: string | null
  created_at: string
  total_compras?: number
  total_gasto?: number
  ultima_compra?: string | null
}

export interface Venda {
  id: string
  produto_id: string
  cliente_id?: string | null
  quantidade: number
  preco_unitario: number
  custo_unitario: number
  valor_total: number
  lucro: number
  observacoes?: string | null
  created_at: string
  produto?: Produto
  cliente?: Cliente
}

export interface Meta {
  id: string
  tipo: 'mensal' | 'anual'
  valor: number
  mes?: number | null
  ano: number
  created_at: string
}

export interface HistoricoMensal {
  id: string
  mes: number
  ano: number
  faturamento_bruto: number
  lucro_liquido: number
  total_vendas: number
  produtos_vendidos: number
  meta_mensal?: number | null
  meta_atingida?: boolean | null
  dados_json?: Record<string, unknown> | null
  created_at: string
}

export interface DashboardMetrics {
  faturamento_bruto: number
  lucro_liquido: number
  total_vendas: number
  produtos_vendidos: number
  total_investido: number
  ticket_medio: number
  clientes_cadastrados: number
  clientes_recorrentes: number
  produto_mais_vendido?: string
  produto_mais_lucrativo?: string
  estoque_baixo: number
  meta_mensal?: number
  meta_atingida_percent: number
  lucro_mes: number
  vendas_mes: number
  vendas_por_dia: { data: string; vendas: number; lucro: number }[]
  vendas_por_produto: { nome: string; quantidade: number; lucro: number }[]
  evolucao_mensal: { mes: string; faturamento: number; lucro: number }[]
}

export type ProdutoForm = Omit<Produto, 'id' | 'created_at' | 'updated_at' | 'margem' | 'lucro_unitario'>
export type ClienteForm = Omit<Cliente, 'id' | 'created_at' | 'total_compras' | 'total_gasto' | 'ultima_compra'>
export type VendaForm = {
  produto_id: string
  cliente_id?: string
  quantidade: number
  observacoes?: string
}
export type MetaForm = Omit<Meta, 'id' | 'created_at'>
