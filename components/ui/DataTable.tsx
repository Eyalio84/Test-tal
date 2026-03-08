"use client"
import * as React from "react"
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel,
  flexRender, type ColumnDef, type SortingState, type ColumnFiltersState,
} from "@tanstack/react-table"
import { cn } from "@/lib/cn"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"

interface DataTableProps<TData> {
  // ColumnDef uses `any` for value param — TanStack Table v8 recommendation for mixed accessors
  // biome-ignore lint/suspicious/noExplicitAny: TanStack Table v8 requires any for heterogeneous columns
  columns: ColumnDef<TData, any>[]
  data: TData[]
  emptyMessage?: string
  pageSize?: number
  className?: string
}

export function DataTable<TData>({
  columns, data, emptyMessage = "No results.", pageSize = 10, className,
}: DataTableProps<TData>) {
  const [sorting,       setSorting]       = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sortAnnouncement, setSortAnnouncement] = React.useState("")

  const table = useReactTable({
    data,
    columns,
    state:           { sorting, columnFilters },
    onSortingChange:       setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel:       getCoreRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    aria-sort={
                      header.column.getIsSorted() === "asc"  ? "ascending"  :
                      header.column.getIsSorted() === "desc" ? "descending" : undefined
                    }
                    className="text-left text-xs tracking-widest uppercase text-ink/40 pb-3 pr-6 border-b border-stone-100 cursor-pointer select-none whitespace-nowrap"
                    onClick={(e) => {
                      header.column.getToggleSortingHandler()?.(e)
                      const next = header.column.getIsSorted() === "asc" ? "descending" :
                                   header.column.getIsSorted() === "desc" ? "none" : "ascending"
                      const label = typeof header.column.columnDef.header === "string"
                        ? header.column.columnDef.header
                        : header.column.id
                      setSortAnnouncement(next === "none" ? `${label} sort cleared` : `Sorted by ${label}, ${next}`)
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc"  && <span aria-hidden>↑</span>}
                        {header.column.getIsSorted() === "desc" && <span aria-hidden>↓</span>}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyMessage} variant="search" />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-b border-stone-50 hover:bg-stone-50 transition">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="py-3 pr-6 text-ink">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Screen reader sort announcement */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{sortAnnouncement}</div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-xs text-ink/50">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>← Prev</Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()}     disabled={!table.getCanNextPage()}>Next →</Button>
          </div>
        </div>
      )}
    </div>
  )
}
