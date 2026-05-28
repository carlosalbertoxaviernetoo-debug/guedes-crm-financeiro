import * as React from 'react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Table wrapper — adds horizontal scroll on small viewports
// ---------------------------------------------------------------------------

const TableWrapper = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('relative w-full overflow-x-auto', className)}
      {...props}
    />
  )
)
TableWrapper.displayName = 'TableWrapper'

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-sm border-collapse', className)}
      {...props}
    />
  )
)
Table.displayName = 'Table'

// ---------------------------------------------------------------------------
// TableHeader
// ---------------------------------------------------------------------------

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b [&_tr]:border-border', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

// ---------------------------------------------------------------------------
// TableBody
// ---------------------------------------------------------------------------

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
))
TableBody.displayName = 'TableBody'

// ---------------------------------------------------------------------------
// TableFooter
// ---------------------------------------------------------------------------

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

// ---------------------------------------------------------------------------
// TableRow
// ---------------------------------------------------------------------------

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Makes the row look clickable with hover state */
  clickable?: boolean
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, clickable = false, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b border-border transition-colors duration-100',
        'data-[state=selected]:bg-muted',
        clickable && 'cursor-pointer hover:bg-muted/50',
        !clickable && 'hover:bg-muted/30',
        className
      )}
      {...props}
    />
  )
)
TableRow.displayName = 'TableRow'

// ---------------------------------------------------------------------------
// TableHead
// ---------------------------------------------------------------------------

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-10 px-4 text-left align-middle font-medium text-muted-foreground',
      'whitespace-nowrap text-xs uppercase tracking-wider',
      '[&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

// ---------------------------------------------------------------------------
// TableCell
// ---------------------------------------------------------------------------

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'px-4 py-3 align-middle text-sm text-foreground',
      '[&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

// ---------------------------------------------------------------------------
// TableCaption
// ---------------------------------------------------------------------------

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
))
TableCaption.displayName = 'TableCaption'

// ---------------------------------------------------------------------------
// TableEmpty — full-width empty row displayed when no data
// ---------------------------------------------------------------------------

interface TableEmptyProps {
  colSpan: number
  message?: string
  className?: string
}

function TableEmpty({ colSpan, message = 'Nenhum resultado encontrado.', className }: TableEmptyProps) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={cn('py-10 text-center text-sm text-muted-foreground', className)}
      >
        {message}
      </td>
    </tr>
  )
}

export {
  TableWrapper,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  TableEmpty,
}
