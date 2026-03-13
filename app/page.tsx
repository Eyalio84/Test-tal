import PlatformHero             from "@/components/platform/PlatformHero"
import { DemoShowcase }        from "@/components/platform/DemoShowcase"
import PricingSection           from "@/components/platform/PricingSection"
import { PlatformAriaContext } from "@/components/platform/PlatformAriaContext"

export default function PlatformHomepage() {
  return (
    <>
      <PlatformAriaContext />
      <PlatformHero />
      <DemoShowcase />
      <PricingSection />
    </>
  )
}
