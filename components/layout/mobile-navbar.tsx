'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, StickyNote, Users, Target, History, Settings } from 'lucide-react'
import { useMobileNav } from '@/lib/hooks/use-mobile-nav'

const GOLD = '#d4a017'
const ICON_MAP = { LayoutDashboard, Package, StickyNote, Users, Target, History, Settings }

export function MobileNavbar() {
  const pathname = usePathname()
  const { activeNavItems } = useMobileNav()
  const count = activeNavItems.length || 4

  const activeIndex = Math.max(
    activeNavItems.findIndex(item =>
      pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
    ),
    0
  )

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        height: 68,
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'linear-gradient(180deg, rgba(11,17,32,0.97) 0%, rgba(8,13,24,0.99) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(212,160,23,0.1)',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Gold bubble — slides between active positions */}
      <motion.div
        className="absolute top-[8px] rounded-full pointer-events-none"
        style={{
          width: `calc(${100 / count}% - 24px)`,
          height: 50,
          background: `linear-gradient(135deg, ${GOLD} 0%, #f5c842 50%, ${GOLD} 100%)`,
          boxShadow: `0 4px 20px rgba(212,160,23,0.45), 0 0 0 1px rgba(212,160,23,0.2)`,
          zIndex: 1,
          left: `calc(${(activeIndex / count) * 100}% + 12px)`,
        }}
        animate={{
          left: `calc(${(activeIndex / count) * 100}% + 12px)`,
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.8 }}
      />

      {/* Nav items */}
      <div className="relative flex h-full z-10">
        {activeNavItems.map((item, i) => {
          const isActive = i === activeIndex
          const Icon = ICON_MAP[item.iconName as keyof typeof ICON_MAP]
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}
            >
              <motion.div
                animate={{
                  color: isActive ? '#080c14' : 'rgba(255,255,255,0.4)',
                  y: isActive ? -1 : 0,
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                style={{ position: 'relative', zIndex: 10 }}
              >
                <Icon size={20} />
              </motion.div>
              <motion.span
                animate={{
                  color: isActive ? GOLD : 'rgba(255,255,255,0.3)',
                  opacity: isActive ? 1 : 0.6,
                }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1 }}
              >
                {item.label}
              </motion.span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
