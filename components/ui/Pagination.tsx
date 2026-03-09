import * as React from "react"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/cn"

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const maxVisible = 5
  const leftSiblings = Math.max(0, currentPage - 2)
  const rightSiblings = Math.min(totalPages - 1, currentPage + 1)

  let pagesToShow = pages.slice(
    Math.max(0, currentPage - 3),
    Math.min(totalPages, currentPage + 2)
  )

  return (
    <nav
      className={cn("flex items-center justify-center gap-2", className)}
      aria-label="Pagination"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        ←
      </Button>

      {currentPage > 3 && totalPages > maxVisible && (
        <>
          <Button
            variant={1 === currentPage ? "primary" : "ghost"}
            size="sm"
            onClick={() => onPageChange(1)}
          >
            1
          </Button>
          {currentPage > 4 && <span className="text-xs text-ink/40">…</span>}
        </>
      )}

      {pagesToShow.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "primary" : "ghost"}
          size="sm"
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </Button>
      ))}

      {currentPage < totalPages - 2 && totalPages > maxVisible && (
        <>
          {currentPage < totalPages - 3 && <span className="text-xs text-ink/40">…</span>}
          <Button
            variant={totalPages === currentPage ? "primary" : "ghost"}
            size="sm"
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        →
      </Button>
    </nav>
  )
}
