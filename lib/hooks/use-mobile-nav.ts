'use client'
import { useState, useEffect } from 'react'

export const ALL_NAV_ITEMS = [
  { href: '/dashboard',               label: 'Dashboard', iconName: 'LayoutDashboard' },
  { href: '/dashboard/produtos',      label: 'Produtos',  iconName: 'Package'         },
  { href: '/dashboard/anotacoes',     label: 'Anotações', iconName: 'StickyNote'      },
  { href: '/dashboard/clientes',      label: 'Clientes',  iconName: 'Users'           },
  { href: '/dashboard/metas',         label: 'Metas',     iconName: 'Target'          },
  { href: '/dashboard/historico',     label: 'Histórico', iconName: 'History'         },
  { href: '/dashboard/configuracoes', label: 'Config',    iconName: 'Settings'        },
] as const

export type NavItemHref = typeof ALL_NAV_ITEMS[number]['href']

const DEFAULT_HREFS: NavItemHref[] = [
  '/dashboard',
  '/dashboard/produtos',
  '/dashboard/anotacoes',
  '/dashboard/clientes',
]

const STORAGE_KEY = 'guedes-mobile-nav'

export function useMobileNav() {
  const [selectedHrefs, setSelectedHrefs] = useState<NavItemHref[]>(DEFAULT_HREFS)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedHrefs(parsed.slice(0, 4) as NavItemHref[])
        }
      }
    } catch {}
  }, [])

  function updateMobileNav(hrefs: NavItemHref[]) {
    const limited = hrefs.slice(0, 4) as NavItemHref[]
    setSelectedHrefs(limited)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(limited)) } catch {}
  }

  const activeNavItems = ALL_NAV_ITEMS.filter(item =>
    selectedHrefs.includes(item.href as NavItemHref)
  ).sort((a, b) =>
    selectedHrefs.indexOf(a.href as NavItemHref) - selectedHrefs.indexOf(b.href as NavItemHref)
  )

  return { selectedHrefs, activeNavItems, updateMobileNav }
}
