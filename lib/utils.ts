import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "dd/MM/yyyy", { locale: ptBR })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatMonthYear(mes: number, ano: number): string {
  const date = new Date(ano, mes - 1)
  return format(date, "MMMM yyyy", { locale: ptBR })
}

export function calcMargem(custo: number, preco: number): number {
  if (preco === 0) return 0
  return ((preco - custo) / preco) * 100
}

export function calcLucroUnitario(custo: number, preco: number): number {
  return preco - custo
}

export function gerarLinkWhatsApp(telefone: string, mensagem?: string): string {
  const numero = telefone.replace(/\D/g, '')
  const base = `https://wa.me/55${numero}`
  if (mensagem) {
    return `${base}?text=${encodeURIComponent(mensagem)}`
  }
  return base
}

export function getMesAtual(): number {
  return new Date().getMonth() + 1
}

export function getAnoAtual(): number {
  return new Date().getFullYear()
}

export function getMesAnterior(): { mes: number; ano: number } {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return { mes: d.getMonth() + 1, ano: d.getFullYear() }
}

export function getStartOfMonth(mes?: number, ano?: number): string {
  const m = mes ?? getMesAtual()
  const a = ano ?? getAnoAtual()
  return startOfMonth(new Date(a, m - 1)).toISOString()
}

export function getEndOfMonth(mes?: number, ano?: number): string {
  const m = mes ?? getMesAtual()
  const a = ano ?? getAnoAtual()
  return endOfMonth(new Date(a, m - 1)).toISOString()
}

export const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export const CATEGORIAS_PRODUTO = [
  'Geral', 'Roupa', 'Calçado', 'Acessório', 'Eletrônico',
  'Alimento', 'Beleza', 'Casa', 'Esporte', 'Outro'
]
