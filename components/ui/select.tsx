'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from './input'

// ---------------------------------------------------------------------------
// Root / primitives re-exports
// ---------------------------------------------------------------------------

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    error?: boolean
  }
>(({ className, children, error, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 py-2',
      'text-sm text-foreground placeholder:text-muted-foreground',
      'transition-all duration-150 ring-offset-background',
      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      '[&>span]:line-clamp-1 [&>span]:text-left',
      error
        ? 'border-destructive focus:ring-destructive/40'
        : 'border-input hover:border-muted-foreground/50',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 opacity-60" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

// ---------------------------------------------------------------------------
// ScrollUpButton / ScrollDownButton
// ---------------------------------------------------------------------------

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4 text-muted-foreground" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4 text-muted-foreground" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {
  /** When true, renders a search box at the top that filters visible items */
  searchable?: boolean
  searchPlaceholder?: string
}

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(
  (
    {
      className,
      children,
      position = 'popper',
      searchable = false,
      searchPlaceholder = 'Buscar...',
      ...props
    },
    ref
  ) => {
    const [search, setSearch] = React.useState('')

    // Filter children by search text when searchable
    const filteredChildren = React.useMemo(() => {
      if (!searchable || !search.trim()) return children
      const lower = search.toLowerCase()

      return React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child

        // Handle SelectGroup
        if ((child as React.ReactElement<{ children?: React.ReactNode }>).props?.children) {
          const grandChildren = React.Children.toArray(
            (child as React.ReactElement<{ children?: React.ReactNode }>).props.children
          ).filter((gc) => {
            if (!React.isValidElement(gc)) return true
            const gcEl = gc as React.ReactElement<{ children?: React.ReactNode; value?: string }>
            const text = String(gcEl.props?.children ?? gcEl.props?.value ?? '')
            return text.toLowerCase().includes(lower)
          })
          if (grandChildren.length === 0) return null
          return React.cloneElement(
            child as React.ReactElement<{ children?: React.ReactNode }>,
            {},
            ...grandChildren
          )
        }

        // Handle SelectItem directly
        const itemEl = child as React.ReactElement<{ children?: React.ReactNode; value?: string }>
        const text = String(itemEl.props?.children ?? itemEl.props?.value ?? '')
        return text.toLowerCase().includes(lower) ? child : null
      })
    }, [children, search, searchable])

    return (
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          ref={ref}
          className={cn(
            'relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-hidden',
            'rounded-lg border border-border bg-popover text-popover-foreground shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            'duration-150',
            position === 'popper' &&
              'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
            className
          )}
          position={position}
          {...props}
        >
          {searchable && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border sticky top-0 bg-popover">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <SelectScrollUpButton />
          <SelectPrimitive.Viewport
            className={cn(
              'p-1',
              position === 'popper' &&
                'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
            )}
          >
            {filteredChildren}
          </SelectPrimitive.Viewport>
          <SelectScrollDownButton />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    )
  }
)
SelectContent.displayName = SelectPrimitive.Content.displayName

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-xs font-semibold text-muted-foreground', className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center gap-2',
      'rounded-md py-1.5 pl-8 pr-2 text-sm text-foreground',
      'outline-none transition-colors duration-100',
      'focus:bg-accent focus:text-accent-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-brand" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

// ---------------------------------------------------------------------------
// Separator
// ---------------------------------------------------------------------------

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

// ---------------------------------------------------------------------------
// Field wrapper (label + trigger)
// ---------------------------------------------------------------------------

export interface SelectFieldProps {
  label?: string
  required?: boolean
  error?: boolean
  errorMessage?: string
  hint?: string
  wrapperClassName?: string
  children: React.ReactNode
}

function SelectField({
  label,
  required,
  errorMessage,
  hint,
  wrapperClassName,
  children,
}: SelectFieldProps) {
  const id = React.useId()
  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      {children}
      {errorMessage && (
        <p role="alert" className="text-xs text-destructive mt-0.5">
          {errorMessage}
        </p>
      )}
      {!errorMessage && hint && (
        <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
      )}
    </div>
  )
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  SelectField,
}
