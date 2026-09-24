import * as React from "react"
import { cn } from "cn"

/**
 * Lightweight scroll container styled to match base-nova. Uses native overflow
 * with a themed scrollbar rather than a JS-driven scrollbar primitive.
 */
function ScrollArea({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="scroll-area"
      className={cn(
        "relative overflow-y-auto [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { ScrollArea }
