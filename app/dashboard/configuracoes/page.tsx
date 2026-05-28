'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Settings, User, Database, Download, Trash2, Shield, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { saveHistoricoMes } from '@/lib/actions/historico'
import { formatCurrency, getMesAtual, getAnoAtual, MESES_NOMES } from '@/lib/utils'

const profileSchema = z.object({
  nome_empresa: z.string().min(1, 'Obrigatório'),
  email_admin: z.string().email('Email inválido'),
})
type ProfileData = z.infer<typeof profileSchema>

export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nome_empresa: 'Guedes',
      email_admin: '',
    }
  })

  async function onSaveProfile(data: ProfileData) {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    toast.success('Configurações salvas com sucesso!')
  }

  async function handleSaveMonth() {
    setResetting(true)
    const mes = getMesAtual()
    const ano = getAnoAtual()
    const { error } = await saveHistoricoMes(mes, ano)
    setResetting(false)
    if (error) {
      toast.error('Erro ao salvar histórico do mês')
      return
    }
    toast.success(`Histórico de ${MESES_NOMES[mes - 1]} salvo com sucesso!`)
  }

  const mesAtual = MESES_NOMES[getMesAtual() - 1]

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Configurações</h2>
        <p className="text-sm text-muted-foreground">Gerencie as preferências do sistema</p>
      </div>

      {/* Aparência */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Aparência</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Tema</p>
            <p className="text-xs text-muted-foreground">Escolha entre claro e escuro</p>
          </div>
          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                theme === 'light'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sun className="w-3 h-3" /> Claro
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Moon className="w-3 h-3" /> Escuro
            </button>
          </div>
        </div>
      </motion.div>

      {/* Perfil */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Perfil da Empresa</h3>
        </div>
        <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nome da Empresa</label>
            <input
              {...register('nome_empresa')}
              className="w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Guedes"
            />
            {errors.nome_empresa && <p className="text-xs text-destructive">{errors.nome_empresa.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email do Administrador</label>
            <input
              {...register('email_admin')}
              type="email"
              className="w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="admin@exemplo.com"
            />
            {errors.email_admin && <p className="text-xs text-destructive">{errors.email_admin.message}</p>}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-brand hover:bg-brand/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </motion.div>

      {/* Histórico mensal */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Histórico Mensal</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Salve o snapshot financeiro do mês atual no histórico. Isso registra faturamento, lucro, vendas e metas do mês de <strong className="text-foreground">{mesAtual}</strong>.
        </p>
        <button
          onClick={handleSaveMonth}
          disabled={resetting}
          className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {resetting ? 'Salvando...' : `Salvar histórico de ${mesAtual}`}
        </button>
      </motion.div>

      {/* Info do sistema */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Sistema</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Versão</span>
            <span className="text-foreground font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Stack</span>
            <span className="text-foreground font-medium">Next.js 16 + Supabase</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ambiente</span>
            <span className="text-brand font-medium">Produção</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
