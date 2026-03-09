// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  ProductCard,
  TestimonialCard,
  FeatureCard,
  StatCard,
  PricingCard,
} from "@/components/ui/CardVariants"

describe("CardVariants", () => {
  describe("ProductCard", () => {
    it("renders product name and price", () => {
      render(
        <ProductCard
          name="Test Product"
          price={99.99}
          description="A test product"
        />
      )
      expect(screen.getByText("Test Product")).toBeDefined()
      expect(screen.getByText("$99.99")).toBeDefined()
    })

    it("renders CTA button with custom text", () => {
      render(
        <ProductCard
          name="Test"
          price={50}
          ctaText="Buy Now"
        />
      )
      expect(screen.getByRole("button", { name: /buy now/i })).toBeDefined()
    })
  })

  describe("TestimonialCard", () => {
    it("renders quote and author", () => {
      render(
        <TestimonialCard
          quote="This is great!"
          author="John Doe"
          role="CEO"
        />
      )
      expect(screen.getByText(/this is great/i)).toBeDefined()
      expect(screen.getByText("John Doe")).toBeDefined()
      expect(screen.getByText("CEO")).toBeDefined()
    })

    it("renders star rating", () => {
      render(
        <TestimonialCard
          quote="Amazing"
          author="Jane"
          rating={4}
        />
      )
      const stars = screen.getAllByText("★")
      expect(stars.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe("FeatureCard", () => {
    it("renders title and description", () => {
      render(
        <FeatureCard
          title="Feature Title"
          description="Feature description"
        />
      )
      expect(screen.getByText("Feature Title")).toBeDefined()
      expect(screen.getByText("Feature description")).toBeDefined()
    })
  })

  describe("StatCard", () => {
    it("renders value and label", () => {
      render(<StatCard value="1,234" label="Total Users" />)
      expect(screen.getByText("1,234")).toBeDefined()
      expect(screen.getByText("Total Users")).toBeDefined()
    })

    it("renders change indicator", () => {
      render(
        <StatCard value="500" label="Revenue" change="12%" changeType="positive" />
      )
      const changeText = screen.getByText(/12%/i)
      expect(changeText).toBeDefined()
    })
  })

  describe("PricingCard", () => {
    it("renders pricing information", () => {
      render(
        <PricingCard
          name="Pro Plan"
          price={99}
          features={["Feature 1", "Feature 2"]}
        />
      )
      expect(screen.getByText("Pro Plan")).toBeDefined()
      expect(screen.getByText(/\$99/)).toBeDefined()
      expect(screen.getByText("Feature 1")).toBeDefined()
      expect(screen.getByText("Feature 2")).toBeDefined()
    })

    it("highlights popular plan", () => {
      const { container } = render(
        <PricingCard
          name="Premium"
          price={199}
          features={["All features"]}
          highlighted
        />
      )
      const card = container.querySelector("[class*='ring-2']")
      expect(card).toBeDefined()
      expect(screen.getByText("Most Popular")).toBeDefined()
    })
  })
})
