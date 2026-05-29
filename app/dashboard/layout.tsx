'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileHeader } from '@/components/layout/mobile-header'
import { MobileNavbar } from '@/components/layout/mobile-navbar'
import { cn } from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile-only top header */}
        <MobileHeader />

        {/* Desktop-only header (hidden on mobile via lg:flex inside) */}
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-[100px] lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNavbar />
    </div>
  )
}
