'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import Image from 'next/image'
import {
  LayoutDashboard, Package, Users,
  Target, History, Settings, LogOut,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/lib/actions/auth'

const GOLD = '#d4a017'

const NAV_ITEMS = [
  { href: '/dashboard',               label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/dashboard/produtos',      label: 'Produtos',      icon: Package         },
  { href: '/dashboard/clientes',      label: 'Clientes',      icon: Users           },
  { href: '/dashboard/metas',         label: 'Metas',         icon: Target          },
  { href: '/dashboard/historico',     label: 'Histórico',     icon: History         },
  { href: '/dashboard/configuracoes', label: 'Configurações', icon: Settings        },
]

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  show:  { opacity: 1, x: 0, transition: { duration: 0.28, ease: EASE } },
}

interface SidebarProps {
  collapsed?: boolean
  onCollapse?: (v: boolean) => void
}

export function Sidebar({ collapsed = false, onCollapse }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className="relative flex flex-col h-full select-none overflow-hidden"
      style={{
        width: collapsed ? 68 : 256,
        transition: 'width 240ms cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'width',
        background: 'linear-gradient(180deg, #0b1120 0%, #080d18 50%, #060a13 100%)',
        borderRight: '1px solid rgba(212,160,23,0.13)',
      }}
    >
      {/* Ambient glow topo */}
      <div
        className="absolute top-0 inset-x-0 h-40 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,160,23,0.08) 0%, transparent 100%)',
        }}
      />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        className="relative flex items-center h-[72px] shrink-0 z-10"
        style={{
          borderBottom: '1px solid rgba(212,160,23,0.1)',
          padding: collapsed ? '0 17px' : '0 12px',
        }}
      >
        {/* Logo com glow */}
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className="shrink-0 cursor-pointer"
        >
          <motion.div
            animate={{
              filter: [
                'drop-shadow(0 0 4px rgba(212,160,23,0.2))',
                'drop-shadow(0 0 14px rgba(212,160,23,0.6))',
                'drop-shadow(0 0 4px rgba(212,160,23,0.2))',
              ],
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Image
              src="/guedes logo.jpg"
              alt="Guedes Outfit"
              width={40}
              height={40}
              className="rounded-full object-cover"
              priority
            />
          </motion.div>
        </motion.div>

        {/* Texto da marca — faz fade in/out; o clip é feito pelo aside overflow:hidden */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="brand"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.18, duration: 0.15 } }}
              exit={{ opacity: 0, transition: { duration: 0.06 } }}
              className="flex flex-col ml-3 overflow-hidden whitespace-nowrap flex-1 min-w-0"
            >
              <span className="text-[13px] font-black text-white uppercase tracking-[0.12em] leading-tight">
                Guedes CRM
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.28em] leading-none mt-0.5" style={{ color: GOLD }}>
                Moda Masculina
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão colapsar — só aparece quando expandido */}
        <AnimatePresence initial={false}>
          {!collapsed && onCollapse && (
            <motion.button
              key="collapse-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.2, duration: 0.15 } }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              onClick={() => onCollapse(true)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="hidden lg:flex ml-auto shrink-0 items-center justify-center w-6 h-6 rounded-full"
              style={{
                background: '#0d1829',
                border: '1px solid rgba(212,160,23,0.3)',
                color: GOLD,
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
            >
              <ChevronLeft className="w-3 h-3" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Label seção ────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="nav-label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.1, duration: 0.18 } }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            className="px-4 pt-5 pb-1.5 whitespace-nowrap overflow-hidden"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.35em]" style={{ color: 'rgba(212,160,23,0.32)' }}>
              Navegação
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Nav ────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden z-10 px-2 py-2">
        <motion.ul variants={listVariants} initial="hidden" animate="show" className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <motion.li key={item.href} variants={itemVariants} className="relative">
                <Link href={item.href} className={cn('group block rounded-xl')}>
                  <motion.div
                    whileHover={isActive ? {} : { x: 3 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                    className={cn(
                      'relative flex items-center rounded-xl py-2.5 text-sm font-medium cursor-pointer',
                      collapsed ? 'justify-center h-10' : 'gap-3 px-3',
                      isActive ? 'text-white' : 'text-gray-500 hover:text-gray-200'
                    )}
                  >
                    {/* Pill ativa animada */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-bg"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: 'rgba(212,160,23,0.1)',
                          border: '1px solid rgba(212,160,23,0.22)',
                        }}
                        transition={{ type: 'spring', bounce: 0.1, duration: 0.35 }}
                      />
                    )}

                    {/* Barra lateral dourada */}
                    {isActive && !collapsed && (
                      <motion.div
                        layoutId="nav-active-bar"
                        className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full"
                        style={{
                          width: 3,
                          height: 18,
                          background: `linear-gradient(180deg, #f5c842, ${GOLD})`,
                          boxShadow: `0 0 7px ${GOLD}`,
                        }}
                        transition={{ type: 'spring', bounce: 0.15, duration: 0.32 }}
                      />
                    )}

                    {/* Ícone */}
                    <motion.div
                      animate={
                        isActive
                          ? { color: GOLD, filter: `drop-shadow(0 0 5px ${GOLD})` }
                          : { color: 'rgb(107,114,128)', filter: 'none' }
                      }
                      transition={{ duration: 0.18 }}
                      className="relative z-10 shrink-0"
                    >
                      <Icon className="w-[18px] h-[18px]" />
                    </motion.div>

                    {/* Label — fade simples, clip pelo aside */}
                    <AnimatePresence initial={false}>
                      {!collapsed && (
                        <motion.span
                          key="lbl"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, transition: { delay: 0.18, duration: 0.12 } }}
                          exit={{ opacity: 0, transition: { duration: 0.05 } }}
                          className="relative z-10 whitespace-nowrap overflow-hidden tracking-wide"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Tooltip modo compacto */}
                  {collapsed && (
                    <div
                      className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap pointer-events-none z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150"
                      style={{
                        background: '#0d1829',
                        border: '1px solid rgba(212,160,23,0.22)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                      }}
                    >
                      {item.label}
                    </div>
                  )}
                </Link>
              </motion.li>
            )
          })}
        </motion.ul>
      </nav>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="p-2 shrink-0 z-10" style={{ borderTop: '1px solid rgba(212,160,23,0.08)' }}>
        {/* Botão expandir — só aparece quando recolhido */}
        {onCollapse && collapsed && (
          <motion.button
            onClick={() => onCollapse(false)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            className="hidden lg:flex w-full justify-center items-center py-2.5 rounded-xl mb-0.5"
            style={{ color: GOLD }}
            title="Expandir menu"
          >
            <ChevronRight className="w-[18px] h-[18px]" />
          </motion.button>
        )}

        <form action={logoutAction}>
          <motion.button
            type="submit"
            whileHover={{ x: collapsed ? 0 : 3 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={cn(
              'group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-red-400',
              collapsed && 'justify-center px-0'
            )}
          >
            <LogOut className="w-[18px] h-[18px] shrink-0 transition-colors duration-150 group-hover:text-red-400" />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  key="sair"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.15 } }}
                  exit={{ opacity: 0, transition: { duration: 0.08 } }}
                  className="whitespace-nowrap overflow-hidden tracking-wide"
                >
                  Sair
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </form>
      </div>
    </aside>
  )
}
