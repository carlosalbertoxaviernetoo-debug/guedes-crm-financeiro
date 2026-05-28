'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Root variants
// ---------------------------------------------------------------------------

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full select-none',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-[10px]',
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-xl',
        '2xl': 'h-20 w-20 text-2xl',
      },
    },
    defaultVariants: { size: 'md' },
  }
)

// ---------------------------------------------------------------------------
// Avatar (root)
// ---------------------------------------------------------------------------

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(avatarVariants({ size }), className)}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

// ---------------------------------------------------------------------------
// AvatarImage
// ---------------------------------------------------------------------------

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

// ---------------------------------------------------------------------------
// AvatarFallback
// ---------------------------------------------------------------------------

const fallbackColorPalette = [
  'bg-red-500/20 text-red-600',
  'bg-orange-500/20 text-orange-600',
  'bg-amber-500/20 text-amber-600',
  'bg-yellow-500/20 text-yellow-600',
  'bg-lime-500/20 text-lime-600',
  'bg-green-500/20 text-green-600',
  'bg-emerald-500/20 text-emerald-600',
  'bg-teal-500/20 text-teal-600',
  'bg-cyan-500/20 text-cyan-600',
  'bg-sky-500/20 text-sky-600',
  'bg-blue-500/20 text-blue-600',
  'bg-indigo-500/20 text-indigo-600',
  'bg-violet-500/20 text-violet-600',
  'bg-purple-500/20 text-purple-600',
  'bg-fuchsia-500/20 text-fuchsia-600',
  'bg-pink-500/20 text-pink-600',
  'bg-rose-500/20 text-rose-600',
]

function getColorFromString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return fallbackColorPalette[Math.abs(hash) % fallbackColorPalette.length]
}

export interface AvatarFallbackProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> {
  /** Full name used to derive initials and background color automatically */
  name?: string
}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, name, children, ...props }, ref) => {
  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
    : undefined

  const colorClass = name ? getColorFromString(name) : 'bg-muted text-muted-foreground'

  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full font-semibold',
        colorClass,
        className
      )}
      {...props}
    >
      {children ?? initials ?? '??'}
    </AvatarPrimitive.Fallback>
  )
})
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// ---------------------------------------------------------------------------
// AvatarGroup — stacked avatars
// ---------------------------------------------------------------------------

export interface AvatarGroupProps {
  children: React.ReactNode
  max?: number
  size?: AvatarProps['size']
  className?: string
}

function AvatarGroup({ children, max, size = 'sm', className }: AvatarGroupProps) {
  const allChildren = React.Children.toArray(children)
  const visible = max ? allChildren.slice(0, max) : allChildren
  const overflow = max ? allChildren.length - max : 0

  return (
    <div className={cn('flex items-center', className)}>
      {visible.map((child, i) => (
        <div key={i} className={cn('-ml-2 first:ml-0 ring-2 ring-background rounded-full')}>
          {React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<AvatarProps>, { size })
            : child}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            avatarVariants({ size }),
            '-ml-2 ring-2 ring-background bg-muted text-muted-foreground font-semibold'
          )}
        >
          <span className="flex h-full w-full items-center justify-center text-xs">
            +{overflow}
          </span>
        </div>
      )}
    </div>
  )
}

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, avatarVariants }
