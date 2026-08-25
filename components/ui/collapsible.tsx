"use client"

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"

/**
 * shadcn/ui Collapsible, on `@base-ui/react` — the primitive layer the rest of
 * `components/ui/` already uses (see `accordion.tsx`), not Radix.
 *
 * The panel animates on `--collapsible-panel-height`, a CSS variable base-ui sets on the
 * element from its measured content height. That is what makes a height transition possible at
 * all: `height: auto` is not animatable, and hardcoding a pixel height breaks the moment the
 * list gains an item.
 */
function Collapsible({ ...props }: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({ ...props }: CollapsiblePrimitive.Trigger.Props) {
  return <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
}

function CollapsibleContent({ ...props }: CollapsiblePrimitive.Panel.Props) {
  return <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
