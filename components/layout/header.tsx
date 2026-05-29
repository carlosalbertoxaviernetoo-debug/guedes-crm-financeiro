'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Bell, Sun, Moon, Search } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/produtos': 'Produtos',
  '/dashboard/clientes': 'Clientes',
  '/dashboard/vendas': 'Vendas',
  '/dashboard/metas': 'Metas',
  '/dashboard/historico': 'Histórico',
  '/dashboard/configuracoes': 'Configurações',
}

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const title = PAGE_TITLES[pathname] ?? 'Dashboard'

  return (
    <header className="hidden lg:flex h-14 md:h-16 items-center gap-4 px-4 md:px-8 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <h1 className="text-base md:text-lg font-semibold text-foreground">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Alternar tema"
        >
          <Sun className="w-4 h-4 hidden dark:block" />
          <Moon className="w-4 h-4 dark:hidden" />
        </button>
      </div>
    </header>
  )
}
