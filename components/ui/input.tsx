'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

export interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  required?: boolean
}

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, required, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'text-sm font-medium text-foreground leading-none',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
      className
    )}
    {...props}
  >
    {children}
    {required && (
      <span className="ml-0.5 text-destructive" aria-hidden="true">
        *
      </span>
    )}
  </LabelPrimitive.Root>
))
Label.displayName = LabelPrimitive.Root.displayName

// ---------------------------------------------------------------------------
// InputHint / InputError helpers
// ---------------------------------------------------------------------------

const InputHint = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs text-muted-foreground mt-1', className)} {...props} />
  )
)
InputHint.displayName = 'InputHint'

const InputError = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} role="alert" className={cn('text-xs text-destructive mt-1', className)} {...props} />
  )
)
InputError.displayName = 'InputError'

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Node rendered on the left inside the input wrapper */
  prefix?: React.ReactNode
  /** Node rendered on the right inside the input wrapper */
  suffix?: React.ReactNode
  /** Shows error styling */
  error?: boolean
  /** Error message rendered below the input */
  errorMessage?: string
  /** Hint rendered below the input (overridden by errorMessage) */
  hint?: string
  /** Label text rendered above the input */
  label?: string
  /** Marks label with a red asterisk */
  required?: boolean
  /** Wrapper className */
  wrapperClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      wrapperClassName,
      prefix,
      suffix,
      error,
      errorMessage,
      hint,
      label,
      required,
      id,
      disabled,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const inputId = id ?? React.useId()
    const hasError = error || !!errorMessage

    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <Label htmlFor={inputId} required={required}>
            {label}
          </Label>
        )}

        <div
          className={cn(
            'flex items-center gap-2 h-9 w-full rounded-md border bg-background px-3 text-sm',
            'transition-all duration-150',
            'ring-offset-background',
            'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            hasError
              ? 'border-destructive focus-within:ring-destructive/40'
              : 'border-input hover:border-muted-foreground/50',
            disabled && 'opacity-50 cursor-not-allowed bg-muted'
          )}
        >
          {prefix && (
            <span className="shrink-0 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
              {prefix}
            </span>
          )}

          <input
            id={inputId}
            ref={ref}
            type={type}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={
              errorMessage
                ? `${inputId}-error`
                : hint
                ? `${inputId}-hint`
                : undefined
            }
            className={cn(
              'flex-1 min-w-0 bg-transparent text-foreground placeholder:text-muted-foreground',
              'focus:outline-none disabled:cursor-not-allowed',
              'file:border-0 file:bg-transparent file:text-sm file:font-medium',
              className
            )}
            {...props}
          />

          {suffix && (
            <span className="shrink-0 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
              {suffix}
            </span>
          )}
        </div>

        {errorMessage && (
          <InputError id={`${inputId}-error`}>{errorMessage}</InputError>
        )}
        {!errorMessage && hint && (
          <InputHint id={`${inputId}-hint`}>{hint}</InputHint>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ---------------------------------------------------------------------------
// Textarea (bonus — same pattern)
// ---------------------------------------------------------------------------

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  errorMessage?: string
  hint?: string
  label?: string
  required?: boolean
  wrapperClassName?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, wrapperClassName, error, errorMessage, hint, label, required, id, disabled, ...props },
    ref
  ) => {
    const inputId = id ?? React.useId()
    const hasError = error || !!errorMessage

    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <Label htmlFor={inputId} required={required}>
            {label}
          </Label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm',
            'text-foreground placeholder:text-muted-foreground resize-vertical',
            'transition-all duration-150 ring-offset-background',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            hasError
              ? 'border-destructive focus-visible:ring-destructive/40'
              : 'border-input hover:border-muted-foreground/50',
            disabled && 'opacity-50 cursor-not-allowed bg-muted',
            className
          )}
          {...props}
        />
        {errorMessage && (
          <InputError id={`${inputId}-error`}>{errorMessage}</InputError>
        )}
        {!errorMessage && hint && (
          <InputHint id={`${inputId}-hint`}>{hint}</InputHint>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Input, Label, Textarea, InputHint, InputError }
