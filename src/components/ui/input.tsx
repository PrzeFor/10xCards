import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground bg-input border-border h-9 w-full min-w-0 rounded-fluent-md border px-3 py-1 text-body transition-all duration-[var(--durationFast)] ease-[var(--curveEasyEase)] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-caption file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-[var(--colorBrandBackground)] focus-visible:outline-[var(--strokeWidthThick)] focus-visible:outline-[var(--colorBrandBackground)] focus-visible:outline-offset-[var(--spacingHorizontalXXS)]",
        "hover:border-[var(--colorNeutralStroke1)] hover:elevation-2",
        "aria-invalid:border-destructive aria-invalid:outline-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
