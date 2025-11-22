import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-border placeholder:text-muted-foreground bg-input flex field-sizing-content min-h-16 w-full rounded-fluent-md border px-3 py-2 text-body transition-all duration-[var(--durationFast)] ease-[var(--curveEasyEase)] outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        "focus-visible:border-[var(--colorBrandBackground)] focus-visible:outline-[var(--strokeWidthThick)] focus-visible:outline-[var(--colorBrandBackground)] focus-visible:outline-offset-[var(--spacingHorizontalXXS)]",
        "hover:border-[var(--colorNeutralStroke1)] hover:elevation-2",
        "aria-invalid:border-destructive aria-invalid:outline-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
