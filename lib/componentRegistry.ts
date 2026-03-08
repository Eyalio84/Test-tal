// Component registry: every UI component Aria can reference by name.
// Used by buildAriaConfig() to inform Aria of available components.

export interface ComponentEntry {
  name:        string   // Aria-speakable name
  path:        string   // import path
  description: string   // what it does in one sentence
  variants?:   string[] // available variants
  ariaTrigger: string   // phrase Aria uses to reference this component
}

export const COMPONENT_REGISTRY: ComponentEntry[] = [
  {
    name: "Button",
    path: "components/ui/Button",
    description: "Interactive button with 6 visual variants, 4 sizes, loading state, and asChild support.",
    variants: ["primary", "secondary", "ghost", "outline", "destructive", "link"],
    ariaTrigger: "button",
  },
  {
    name: "Badge",
    path: "components/ui/Badge",
    description: "Status and count indicators. Use for order status (paid/pending/error) and item counts.",
    variants: ["default", "success", "warning", "error", "active", "outline"],
    ariaTrigger: "badge or status indicator",
  },
  {
    name: "Input",
    path: "components/ui/Input",
    description: "Text input with label, helper text, and error state. Wired for react-hook-form.",
    ariaTrigger: "text input or form field",
  },
  {
    name: "Textarea",
    path: "components/ui/Input",
    description: "Multiline text input with same label/error/helper API as Input.",
    ariaTrigger: "textarea or multiline input",
  },
  {
    name: "Select",
    path: "components/ui/Select",
    description: "Accessible native select with custom styling, placeholder, and error state.",
    ariaTrigger: "select or dropdown",
  },
  {
    name: "Card",
    path: "components/ui/Card",
    description: "Container compound component. Variants: default, stat, shortcut, flat.",
    variants: ["default", "stat", "shortcut", "flat"],
    ariaTrigger: "card",
  },
  {
    name: "Dialog",
    path: "components/ui/Dialog",
    description: "Modal dialog with focus trap, Escape to close, ARIA labeling. Compound: DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter.",
    ariaTrigger: "modal or dialog",
  },
  {
    name: "Tabs",
    path: "components/ui/Tabs",
    description: "Tab navigation with APG keyboard pattern. Compound: TabList, Tab, TabPanel.",
    ariaTrigger: "tabs",
  },
  {
    name: "DataTable",
    path: "components/ui/DataTable",
    description: "TanStack Table v8 wrapper with sort, filter, pagination, and aria-sort.",
    ariaTrigger: "table or data table",
  },
  {
    name: "Skeleton",
    path: "components/ui/Skeleton",
    description: "Animated placeholder matching content geometry. Use for initial data loads.",
    ariaTrigger: "skeleton loader or loading placeholder",
  },
  {
    name: "Spinner",
    path: "components/ui/Skeleton",
    description: "Animated spinner for user-triggered loading states (button clicks, mutations).",
    ariaTrigger: "spinner or loading indicator",
  },
  {
    name: "EmptyState",
    path: "components/ui/EmptyState",
    description: "Three-variant empty content display: default (first-time), search (no results), error (failed).",
    variants: ["default", "search", "error"],
    ariaTrigger: "empty state",
  },
  {
    name: "Breadcrumb",
    path: "components/ui/Breadcrumb",
    description: "Navigation breadcrumb with aria-current='page' on current item.",
    ariaTrigger: "breadcrumb",
  },
]
