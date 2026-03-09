// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, it, expect } from "vitest"
import { ComponentPalette } from "@/components/editor/ComponentPalette"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
)

describe("ComponentPalette", () => {
  it("renders search input", () => {
    render(<ComponentPalette />, { wrapper })
    expect(screen.getByPlaceholderText(/search components/i)).toBeDefined()
  })

  it("renders palette container", () => {
    const { container } = render(<ComponentPalette />, { wrapper })
    const palette = container.querySelector("[class*='border-r']")
    expect(palette).toBeDefined()
  })

  it("renders footer info", () => {
    render(<ComponentPalette />, { wrapper })
    expect(screen.getByText(/drag components to canvas/i)).toBeDefined()
  })
})
