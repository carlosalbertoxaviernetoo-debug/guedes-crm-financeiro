'use client'
import { motion, AnimatePresence } from 'framer-motion'
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

  const activeItem = activeNavItems[activeIndex]
  const ActiveIcon = activeItem ? ICON_MAP[activeItem.iconName as keyof typeof ICON_MAP] : null

  // Center of the active column as % of full width
  const bubblePct = ((activeIndex + 0.5) / count) * 100

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        height: 62,
        paddingBottom: 'env(safe-area-inset-bottom)',
        overflow: 'visible', // lets the bubble float above
      }}
    >
      {/* ── Backdrop / background layer (contained, no overflow) ── */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(11,17,32,0.97) 0%, rgba(8,13,24,0.99) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(212,160,23,0.15)',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.45)',
        }}
      />

      {/* ── Floating gold bubble — protrudes above navbar ── */}
      <motion.div
        className="pointer-events-none"
        style={{
          position: 'absolute',
          top: -24,           // rises 24px above the bar's top edge
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${GOLD} 0%, #f5c842 50%, ${GOLD} 100%)`,
          boxShadow: `0 4px 24px rgba(212,160,23,0.6), 0 2px 10px rgba(0,0,0,0.5)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
          left: `calc(${bubblePct}% - 28px)`,
        }}
        animate={{ left: `calc(${bubblePct}% - 28px)` }}
        transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.8 }}
      >
        {/* Icon inside bubble — re-animates on tab change */}
        <AnimatePresence mode="wait" initial={false}>
          {ActiveIcon && (
            <motion.div
              key={activeItem?.href}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
            >
              <ActiveIcon size={23} color="#080c14" strokeWidth={2.5} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Nav items row ── */}
      <div style={{ position: 'relative', display: 'flex', height: '100%', zIndex: 10 }}>
        {activeNavItems.map((item, i) => {
          const isActive = i === activeIndex
          const Icon = ICON_MAP[item.iconName as keyof typeof ICON_MAP]
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: 10,
                gap: 4,
              }}
            >
              {/* Active tab: icon is in the floating bubble — show empty space */}
              {isActive ? (
                <div style={{ width: 22, height: 22 }} />
              ) : (
                <Icon size={20} color="rgba(255,255,255,0.38)" strokeWidth={1.8} />
              )}

              <motion.span
                animate={{
                  color: isActive ? GOLD : 'rgba(255,255,255,0.28)',
                  opacity: isActive ? 1 : 0.7,
                }}
                transition={{ duration: 0.2 }}
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  lineHeight: 1,
                }}
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
