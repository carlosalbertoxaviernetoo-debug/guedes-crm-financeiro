'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import { toast } from 'sonner'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

// ---------------------------------------------------------------------------
// Real brand logo with animated glow
// ---------------------------------------------------------------------------

function GDLogo() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, rotate: -12 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.1 }}
    >
      <motion.div
        animate={{
          filter: [
            'drop-shadow(0 0 6px rgba(212,160,23,0.3))',
            'drop-shadow(0 0 24px rgba(212,160,23,0.8))',
            'drop-shadow(0 0 6px rgba(212,160,23,0.3))',
          ],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="rounded-full overflow-hidden"
      >
        <Image
          src="/guedes logo.jpg"
          alt="Guedes Outfit"
          width={96}
          height={96}
          className="rounded-full w-24 h-24 object-cover"
          priority
        />
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Floating ambient orb
// ---------------------------------------------------------------------------

function Orb({
  size,
  color,
  top,
  left,
  delay = 0,
  duration = 9,
  opacity = 0.18,
}: {
  size: number
  color: string
  top?: string
  left?: string
  delay?: number
  duration?: number
  opacity?: number
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: color,
        filter: `blur(${size * 0.55}px)`,
        opacity,
        top,
        left,
      }}
      animate={{ y: [0, -28, 0], x: [0, 14, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  )
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

// ---------------------------------------------------------------------------
// Glassmorphism input
// ---------------------------------------------------------------------------

interface GlassInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'> {
  error?: boolean
  suffix?: React.ReactNode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?: (...args: any[]) => any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onBlur?: (...args: any[]) => any
}

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  function GlassInput({ error, suffix, onBlur, ...props }, ref) {
  const [focused, setFocused] = useState(false)

  return (
    <div
      className="flex items-center h-11 rounded-xl transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${
          focused
            ? 'rgba(212,160,23,0.6)'
            : error
            ? 'rgba(239,68,68,0.5)'
            : 'rgba(255,255,255,0.1)'
        }`,
        boxShadow: focused ? '0 0 0 3px rgba(212,160,23,0.12)' : 'none',
      }}
    >
      <input
        ref={ref}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        className="flex-1 h-full px-4 text-sm text-white bg-transparent placeholder:text-gray-600 focus:outline-none focus-visible:outline-none"
        {...props}
      />
      {suffix && <div className="pr-3 flex items-center">{suffix}</div>}
    </div>
  )
})

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    setLoading(false)

    if (error) {
      toast.error('Credenciais inválidas. Verifique email e senha.')
      return
    }

    toast.success('Bem-vindo de volta!')
    router.push('/dashboard')
    router.refresh()
  }

  // Destructure register to merge blur handlers cleanly
  const { ref: emailRef, onBlur: emailBlur, ...emailRest } = register('email')
  const { ref: passRef, onBlur: passBlur, ...passRest } = register('password')

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative"
      style={{
        background: 'linear-gradient(145deg, #070c14 0%, #0d1829 55%, #080e1c 100%)',
      }}
    >
      {/* Ambient orbs */}
      <Orb size={480} color="#d4a017" top="-15%" left="-12%" delay={0} duration={10} opacity={0.12} />
      <Orb size={360} color="#1e40af" top="55%" left="60%" delay={3.5} duration={12} opacity={0.14} />
      <Orb size={260} color="#d4a017" top="70%" left="10%" delay={6} duration={8} opacity={0.1} />

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          opacity: 0.35,
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(4,7,14,0.7) 100%)',
        }}
      />

      {/* Main card */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo section */}
        <motion.div variants={fadeUp} className="flex flex-col items-center mb-8 gap-3">
          <GDLogo />

          <motion.div variants={fadeUp} className="text-center">
            <h1 className="text-2xl font-black text-white tracking-[0.15em] uppercase">
              Guedes CRM
            </h1>
            <p
              className="text-xs font-semibold uppercase tracking-[0.3em] mt-1"
              style={{ color: '#d4a017' }}
            >
              Sistema de Gestão
            </p>
          </motion.div>
        </motion.div>

        {/* Glass form card */}
        <motion.div
          variants={fadeUp}
          className="relative rounded-2xl p-6"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Gold shimmer top edge */}
          <div
            className="absolute top-0 left-8 right-8 h-px rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, #d4a017, transparent)',
            }}
          />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <motion.div variants={fadeUp} className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400"
              >
                Email
              </label>
              <GlassInput
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@guedesoutfit.com"
                error={!!errors.email}
                ref={emailRef}
                onBlur={emailBlur}
                {...emailRest}
              />
              {errors.email && (
                <p className="text-[11px] text-red-400">{errors.email.message}</p>
              )}
            </motion.div>

            {/* Password */}
            <motion.div variants={fadeUp} className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400"
              >
                Senha
              </label>
              <GlassInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                error={!!errors.password}
                ref={passRef}
                onBlur={passBlur}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                {...passRest}
              />
              {errors.password && (
                <p className="text-[11px] text-red-400">{errors.password.message}</p>
              )}
            </motion.div>

            {/* Submit */}
            <motion.div variants={fadeUp} className="pt-1">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={loading ? {} : { scale: 1.025, y: -1 }}
                whileTap={loading ? {} : { scale: 0.975 }}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl text-sm font-bold uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed transition-shadow"
                style={{
                  background: loading
                    ? 'rgba(212,160,23,0.5)'
                    : 'linear-gradient(135deg, #d4a017 0%, #f5c842 50%, #d4a017 100%)',
                  color: '#0a0f1e',
                  boxShadow: loading ? 'none' : '0 8px 28px rgba(212,160,23,0.4)',
                  backgroundSize: '200% 100%',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.p
          variants={fadeUp}
          className="text-center text-[10px] font-medium uppercase tracking-[0.3em] text-gray-700 mt-6"
        >
          Sistema Administrativo Privado
        </motion.p>
      </motion.div>
    </div>
  )
}
