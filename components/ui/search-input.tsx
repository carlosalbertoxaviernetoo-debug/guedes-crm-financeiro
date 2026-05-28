'use client'

import * as React from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// useDebounce hook
// ---------------------------------------------------------------------------

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState<T>(value)

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

// ---------------------------------------------------------------------------
// SearchInput
// ---------------------------------------------------------------------------

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  /** Debounced onChange — fires after `debounceMs` milliseconds of no typing */
  onChange?: (value: string) => void
  /** Immediate onChange without debounce */
  onChangeImmediate?: (value: string) => void
  /** Debounce delay in ms (default 300) */
  debounceMs?: number
  /** Show a loading spinner instead of the search icon */
  loading?: boolean
  /** Controlled value */
  value?: string
  /** Default value for uncontrolled usage */
  defaultValue?: string
  /** Callback when user clears the input */
  onClear?: () => void
  /** Wrapper className */
  wrapperClassName?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: { wrapper: 'h-8 text-xs', icon: 'h-3.5 w-3.5', padding: 'pl-8 pr-7' },
  md: { wrapper: 'h-9 text-sm', icon: 'h-4 w-4', padding: 'pl-9 pr-8' },
  lg: { wrapper: 'h-10 text-sm', icon: 'h-4 w-4', padding: 'pl-10 pr-9' },
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      wrapperClassName,
      onChange,
      onChangeImmediate,
      debounceMs = 300,
      loading = false,
      value: controlledValue,
      defaultValue = '',
      onClear,
      placeholder = 'Buscar...',
      size = 'md',
      disabled,
      ...props
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined
    const [internalValue, setInternalValue] = React.useState<string>(
      isControlled ? (controlledValue ?? '') : defaultValue
    )

    const displayValue = isControlled ? (controlledValue ?? '') : internalValue
    const debouncedValue = useDebounce(displayValue, debounceMs)

    // Fire debounced onChange
    const onChangeRef = React.useRef(onChange)
    onChangeRef.current = onChange
    React.useEffect(() => {
      onChangeRef.current?.(debouncedValue)
    }, [debouncedValue])

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const val = e.target.value
      if (!isControlled) setInternalValue(val)
      onChangeImmediate?.(val)
    }

    function handleClear() {
      if (!isControlled) setInternalValue('')
      onChangeImmediate?.('')
      onChange?.('')
      onClear?.()
    }

    const cfg = sizeClasses[size]
    const hasValue = displayValue.length > 0

    return (
      <div className={cn('relative flex items-center', wrapperClassName)}>
        {/* Left icon */}
        <span
          className={cn(
            'pointer-events-none absolute left-0 flex items-center justify-center text-muted-foreground',
            size === 'sm' && 'pl-2.5',
            size === 'md' && 'pl-3',
            size === 'lg' && 'pl-3.5'
          )}
        >
          {loading ? (
            <Loader2 className={cn(cfg.icon, 'animate-spin')} aria-label="Carregando" />
          ) : (
            <Search className={cfg.icon} aria-hidden="true" />
          )}
        </span>

        <input
          ref={ref}
          type="search"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full rounded-md border border-input bg-background text-foreground',
            'placeholder:text-muted-foreground',
            'transition-all duration-150 ring-offset-background',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Remove native browser clear button from search inputs
            '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
            'hover:border-muted-foreground/50',
            cfg.wrapper,
            cfg.padding,
            className
          )}
          {...props}
        />

        {/* Clear button */}
        {hasValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpar busca"
            className={cn(
              'absolute right-0 flex items-center justify-center text-muted-foreground',
              'rounded transition-colors hover:text-foreground',
              size === 'sm' && 'pr-2',
              size === 'md' && 'pr-2.5',
              size === 'lg' && 'pr-3'
            )}
          >
            <X className={cn(cfg.icon, 'opacity-70 hover:opacity-100 transition-opacity')} />
          </button>
        )}
      </div>
    )
  }
)
SearchInput.displayName = 'SearchInput'

export { SearchInput, useDebounce }
