import { PlatformHero }   from "@/components/platform/PlatformHero"
import { DemoShowcase }   from "@/components/platform/DemoShowcase"
import { PricingSection } from "@/components/platform/PricingSection"

export default function PlatformHomepage() {
  return (
    <>
      <PlatformHero />
      <DemoShowcase />
      <PricingSection />
    </>
  )
}
