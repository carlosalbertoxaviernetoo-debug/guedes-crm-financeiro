'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Sun, Moon, Settings, LogOut } from 'lucide-react'
import { logoutAction } from '@/lib/actions/auth'

const GOLD = '#d4a017'

export function MobileHeader() {
  const { theme, setTheme } = useTheme()

  return (
    <header
      className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4"
      style={{
        height: 56,
        background: 'linear-gradient(180deg, #0b1120, #080d18)',
        borderBottom: '1px solid rgba(212,160,23,0.13)',
      }}
    >
      {/* Left: Logo + Brand */}
      <div className="flex items-center gap-2.5">
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
        <div className="flex flex-col">
          <span
            className="text-[13px] font-black text-white uppercase leading-tight tracking-[0.1em]"
          >
            GUEDES CRM
          </span>
          <span
            className="font-bold uppercase leading-none mt-0.5 tracking-[0.2em]"
            style={{ fontSize: 9, color: GOLD }}
          >
            MODA MASCULINA
          </span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <motion.button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          aria-label="Alternar tema"
          style={{
            width: 38,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          <Sun className="w-4 h-4 hidden dark:block" />
          <Moon className="w-4 h-4 dark:hidden" />
        </motion.button>

        {/* Settings link */}
        <Link href="/dashboard/configuracoes">
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            aria-label="Configurações"
            style={{
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            <Settings className="w-4 h-4" />
          </motion.div>
        </Link>

        {/* Logout */}
        <form action={logoutAction}>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            aria-label="Sair"
            style={{
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            <LogOut className="w-4 h-4" />
          </motion.button>
        </form>
      </div>
    </header>
  )
}
