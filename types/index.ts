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
  pedido_id?: string | null
  produto_id?: string | null
  nome_item?: string | null
  nome_comprador?: string | null
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

export interface PedidoItem {
  id: string
  produto_id?: string | null
  nome_item?: string | null
  quantidade: number
  preco_unitario: number
  custo_unitario: number
  valor_total: number
  lucro: number
  produto?: Pick<Produto, 'id' | 'nome' | 'imagem_url' | 'categoria'>
}

export interface Pedido {
  pedido_id: string
  cliente_id?: string | null
  nome_comprador?: string | null
  created_at: string
  items: PedidoItem[]
  valor_total: number
  custo_total: number
  lucro_total: number
  cliente?: Pick<Cliente, 'id' | 'nome'>
}

export interface PedidoItemForm {
  produto_id?: string | null
  nome_item?: string
  quantidade: number
  preco_unitario: number
  custo_unitario: number
}

export interface PedidoForm {
  cliente_id?: string | null
  nome_comprador?: string | null
  observacoes?: string | null
  items: PedidoItemForm[]
}

export interface Meta {
  id: string
  tipo: 'mensal' | 'anual' | 'periodo'
  valor: number
  mes?: number | null
  ano: number
  data_inicio?: string | null
  data_fim?: string | null
  observacoes?: string | null
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

export interface TopCliente {
  id: string
  nome: string
  total_gasto: number
  total_compras: number
}

export interface DashboardPeriodo {
  id: string
  inicio_em: string
  fim_em: string | null
  faturamento_bruto: number
  lucro_liquido: number
  total_vendas: number
  ticket_medio: number
  produtos_vendidos: number
  created_at: string
}

export interface DashboardMetrics {
  // ── Period-based (reset with dashboard) ──────────────────
  faturamento_bruto: number
  lucro_liquido: number
  total_vendas: number
  produtos_vendidos: number
  ticket_medio: number
  produto_mais_vendido?: string
  produto_mais_lucrativo?: string
  top_clientes: TopCliente[]
  periodo_inicio_em?: string          // undefined = showing all-time data
  // ── Always-on (never reset) ───────────────────────────────
  total_investido: number
  clientes_cadastrados: number
  clientes_recorrentes: number
  estoque_baixo: number
  // ── Meta & charts ─────────────────────────────────────────
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
