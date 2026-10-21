import * as React from "react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type HintProps = {
  label: string
  placement?: "top" | "bottom" | "left" | "right"
  children: React.ReactElement
}

/** Label for an icon-only control. Wraps exactly one focusable child. */
function Hint({ label, placement = "top", children }: HintProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={placement} sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

export { Hint }
