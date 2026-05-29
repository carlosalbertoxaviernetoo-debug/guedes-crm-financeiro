'use client'
import { useEffect, useState } from 'react'
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, StickyNote, Users, Target, History, Settings } from 'lucide-react'
import { useMobileNav } from '@/lib/hooks/use-mobile-nav'

const GOLD = '#d4a017'
const ICON_MAP = { LayoutDashboard, Package, StickyNote, Users, Target, History, Settings }

// ── Navbar geometry ────────────────────────────────────────────────────────────
const NAV_H   = 62   // bar height in px
const ND      = 30   // notch depth (how far the "dip" goes into the bar)
const NW      = 44   // notch shoulder half-width
const CR      = 16   // top-corner radius

/**
 * Generates the navbar SVG path with a smooth curved notch at `cx`.
 * The notch traces two cubic beziers that form a concave "U" in the top edge.
 */
function getNavPath(w: number, cx: number): string {
  if (!w) return ''

  // Clamp shoulders so the notch never bleeds off-screen
  const ls = Math.max(CR + 2,     cx - NW)
  const rs = Math.min(w - CR - 2, cx + NW)

  const rHW = rs - cx            // actual right half-width
  const lHW = cx - ls            // actual left half-width

  // Proportional bezier control points (preserve curve shape when clamped)
  const rCP1x = rs  - rHW * 0.36
  const rCP2x = cx  + rHW * 0.32
  const lCP1x = ls  + lHW * 0.36
  const lCP2x = cx  - lHW * 0.32

  return [
    `M ${CR} 0`,
    `Q 0 0 0 ${CR}`,
    `L 0 ${NAV_H}`,
    `L ${w} ${NAV_H}`,
    `L ${w} ${CR}`,
    `Q ${w} 0 ${w - CR} 0`,
    // Right shoulder → notch bottom
    `L ${rs} 0`,
    `C ${rCP1x} 0 ${rCP2x} ${ND} ${cx} ${ND}`,
    // Notch bottom → left shoulder
    `C ${lCP2x} ${ND} ${lCP1x} 0 ${ls} 0`,
    `Z`,
  ].join(' ')
}

// ── Component ──────────────────────────────────────────────────────────────────
export function MobileNavbar() {
  const pathname      = usePathname()
  const { activeNavItems } = useMobileNav()
  const count         = activeNavItems.length || 4

  // Measure actual screen width (SSR-safe)
  const [navW, setNavW] = useState(390)
  useEffect(() => {
    const update = () => setNavW(window.innerWidth)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const activeIndex = Math.max(
    activeNavItems.findIndex(item =>
      pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
    ),
    0
  )

  // Spring-animated notch centre X
  const targetCx  = ((activeIndex + 0.5) / count) * navW
  const notchX    = useMotionValue(targetCx)

  useEffect(() => {
    animate(notchX, targetCx, {
      type: 'spring', stiffness: 320, damping: 28, mass: 0.8,
    })
  }, [targetCx, notchX])

  // Reactive SVG path derived from the motion value
  const pathD = useTransform(notchX, x => getNavPath(navW, x))

  const activeItem  = activeNavItems[activeIndex]
  const ActiveIcon  = activeItem ? ICON_MAP[activeItem.iconName as keyof typeof ICON_MAP] : null
  const bubblePct   = ((activeIndex + 0.5) / count) * 100

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{ height: NAV_H, paddingBottom: 'env(safe-area-inset-bottom)', overflow: 'visible' }}
    >
      {/* ── Backdrop blur (rectangular fallback) ── */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      />

      {/* ── SVG background with animated notch ── */}
      <svg
        aria-hidden
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: NAV_H,
          overflow: 'visible',
        }}
        viewBox={`0 0 ${navW} ${NAV_H}`}
        preserveAspectRatio="none"
      >
        {/* Dark fill — covers the blurred layer, except at the notch */}
        <motion.path d={pathD} fill="rgba(10,16,30,0.97)" />
        {/* Gold border along the entire top edge + notch curve */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="rgba(212,160,23,0.22)"
          strokeWidth="1"
        />
      </svg>

      {/* ── Floating gold bubble ── */}
      <motion.div
        className="pointer-events-none"
        style={{
          position: 'absolute',
          // Circle is 56 px → radius 28. top:-28 centres it on the bar's top edge.
          top: -28,
          width: 56, height: 56,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${GOLD} 0%, #f5c842 50%, ${GOLD} 100%)`,
          boxShadow: [
            `0 4px 20px rgba(212,160,23,0.65)`,
            `0 2px 8px  rgba(0,0,0,0.5)`,
            `0 0 0 3px  rgba(212,160,23,0.25)`, // subtle gold ring
          ].join(', '),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 20,
          left: `calc(${bubblePct}% - 28px)`,
        }}
        animate={{ left: `calc(${bubblePct}% - 28px)` }}
        transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.8 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {ActiveIcon && (
            <motion.div
              key={activeItem?.href}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1,   opacity: 1 }}
              exit={{   scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.13 }}
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
          const Icon     = ICON_MAP[item.iconName as keyof typeof ICON_MAP]
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'flex-end',
                paddingBottom: 10, gap: 4,
              }}
            >
              {/* Active tab: icon lives in the floating bubble — spacer here */}
              {isActive
                ? <div style={{ width: 22, height: 22 }} />
                : <Icon size={20} color="rgba(255,255,255,0.38)" strokeWidth={1.8} />
              }

              <motion.span
                animate={{
                  color:   isActive ? GOLD : 'rgba(255,255,255,0.28)',
                  opacity: isActive ? 1    : 0.7,
                }}
                transition={{ duration: 0.2 }}
                style={{
                  fontSize: 8, fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em', lineHeight: 1,
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
