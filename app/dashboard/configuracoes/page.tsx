'use client'

import { useTheme } from 'next-themes'
import { motion, type Variants } from 'framer-motion'
import { Sun, Moon, Check, Palette } from 'lucide-react'
import Image from 'next/image'

const GOLD = '#d4a017'

// ---------------------------------------------------------------------------
// Animações
// ---------------------------------------------------------------------------

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

// ---------------------------------------------------------------------------
// Mini preview do tema
// ---------------------------------------------------------------------------

function ThemePreview({ dark }: { dark: boolean }) {
  const bg     = dark ? '#080c14' : '#f0f2f5'
  const sidebar = dark ? '#0b1120' : '#e2e4e8'
  const card   = dark ? '#111827' : '#ffffff'
  const bar1   = dark ? '#d4a017' : '#d4a017'
  const bar2   = dark ? '#1e2d42' : '#d4d8e0'
  const text   = dark ? '#1e2d42' : '#d4d8e0'

  return (
    <div
      className="w-full h-[68px] rounded-lg overflow-hidden"
      style={{ background: bg, border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}` }}
    >
      <div className="flex h-full">
        {/* Sidebar mini */}
        <div
          className="w-9 h-full flex flex-col items-center gap-1.5 pt-2"
          style={{ background: sidebar }}
        >
          <div className="w-5 h-5 rounded-full" style={{ background: bar1, opacity: 0.8 }} />
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="w-4 h-1 rounded-full" style={{ background: i === 0 ? bar1 : bar2 }} />
          ))}
        </div>
        {/* Content mini */}
        <div className="flex-1 p-2 flex flex-col gap-1.5">
          <div className="w-14 h-1.5 rounded-full" style={{ background: text }} />
          <div className="grid grid-cols-2 gap-1">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="h-4 rounded-md"
                style={{ background: card, border: `1px solid ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'}` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

const THEMES = [
  { id: 'light', label: 'Claro',  desc: 'Modo diurno',   icon: Sun  },
  { id: 'dark',  label: 'Escuro', desc: 'Modo noturno',  icon: Moon },
] as const

export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme()

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="max-w-md"
    >
      {/* ── Cabeçalho ─────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="mb-10">
        <div className="flex items-center gap-3 mb-1">
          <motion.div
            animate={{
              filter: [
                'drop-shadow(0 0 4px rgba(212,160,23,0.2))',
                'drop-shadow(0 0 12px rgba(212,160,23,0.6))',
                'drop-shadow(0 0 4px rgba(212,160,23,0.2))',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Image
              src="/guedes logo.jpg"
              alt="Guedes Outfit"
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          </motion.div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-[0.12em] leading-tight">
              Configurações
            </h2>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: GOLD }}>
              Preferências do sistema
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Card Aparência ─────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="relative rounded-2xl p-6"
        style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
      >
        {/* Linha dourada topo */}
        <div
          className="absolute top-0 left-10 right-10 h-px rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, #d4a017, transparent)' }}
        />

        {/* Título da seção */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(212,160,23,0.1)',
              border: '1px solid rgba(212,160,23,0.2)',
            }}
          >
            <Palette className="w-4 h-4" style={{ color: GOLD }} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Aparência</h3>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">Tema visual do sistema</p>
          </div>
        </div>

        {/* Cards de tema */}
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map(({ id, label, desc, icon: Icon }) => {
            const active = theme === id

            return (
              <motion.button
                key={id}
                onClick={() => setTheme(id)}
                whileHover={{ scale: 1.03, y: -3 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                className="relative flex flex-col gap-3 p-4 rounded-xl cursor-pointer text-left"
                style={{
                  background: active ? 'rgba(212,160,23,0.07)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${active ? 'rgba(212,160,23,0.45)' : 'rgba(255,255,255,0.05)'}`,
                  boxShadow: active ? '0 0 24px rgba(212,160,23,0.1), inset 0 0 20px rgba(212,160,23,0.03)' : 'none',
                  transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
                }}
              >
                {/* Checkmark ativo */}
                <motion.div
                  initial={false}
                  animate={active ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: GOLD }}
                >
                  <Check className="w-3 h-3 font-black" style={{ color: '#080c14' }} strokeWidth={3} />
                </motion.div>

                {/* Preview */}
                <ThemePreview dark={id === 'dark'} />

                {/* Label */}
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={active ? { color: GOLD } : { color: 'rgb(75,85,99)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                  </motion.div>
                  <div>
                    <p
                      className="text-sm font-bold leading-tight transition-colors duration-200"
                      style={{ color: active ? '#ffffff' : 'rgb(107,114,128)' }}
                    >
                      {label}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{desc}</p>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* ── Versão ────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex justify-center mt-10">
        <motion.div
          whileHover={{ scale: 1.04 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full cursor-default"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: GOLD }}
          />
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.18)' }}>
            Guedes CRM &nbsp;·&nbsp; v1.0.0
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
