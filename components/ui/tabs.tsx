'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

const Tabs = TabsPrimitive.Root

// ---------------------------------------------------------------------------
// List variants
// ---------------------------------------------------------------------------

const listVariants = cva('flex', {
  variants: {
    variant: {
      /** Pill-style background list */
      pills: [
        'inline-flex items-center gap-1 rounded-lg bg-muted p-1',
        'h-9',
      ],
      /** Underline-style list (full width) */
      underline: [
        'w-full items-end gap-0 border-b border-border',
      ],
      /** Outlined card-style tabs */
      outline: [
        'inline-flex items-center gap-1',
      ],
    },
  },
  defaultVariants: { variant: 'pills' },
})

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof listVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(listVariants({ variant }), className)}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

// ---------------------------------------------------------------------------
// Trigger variants
// ---------------------------------------------------------------------------

const triggerVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap',
    'transition-all duration-150 cursor-pointer select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        pills: [
          'rounded-md px-3 py-1 text-muted-foreground',
          'hover:text-foreground',
          'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        ],
        underline: [
          'rounded-none border-b-2 border-transparent px-4 py-2.5 text-muted-foreground',
          '-mb-px',
          'hover:text-foreground hover:border-muted-foreground/50',
          'data-[state=active]:border-brand data-[state=active]:text-foreground',
        ],
        outline: [
          'rounded-md border border-transparent px-3 py-1.5 text-muted-foreground',
          'hover:text-foreground hover:border-border',
          'data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        ],
      },
    },
    defaultVariants: { variant: 'pills' },
  }
)

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof triggerVariants> {
  /** Optional badge/count displayed after the label */
  count?: number | string
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, count, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(triggerVariants({ variant }), className)}
    {...props}
  >
    {children}
    {count !== undefined && (
      <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums">
        {count}
      </span>
    )}
  </TabsPrimitive.Trigger>
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4 ring-offset-background',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'data-[state=inactive]:hidden',
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
