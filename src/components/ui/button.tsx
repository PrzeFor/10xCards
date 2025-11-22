import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-fluent-md text-body font-medium transition-all duration-[var(--durationFast)] ease-[var(--curveEasyEase)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-[var(--strokeWidthThick)] focus-visible:outline-[var(--colorBrandBackground)] focus-visible:outline-offset-[var(--spacingHorizontalXXS)] hover-lift",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground elevation-2 hover:elevation-4 active:elevation-1",
        destructive:
          "bg-destructive text-destructive-foreground elevation-2 hover:elevation-4 active:elevation-1",
        outline:
          "border border-border bg-background hover:bg-secondary hover:text-secondary-foreground active:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground elevation-2 hover:elevation-4 active:elevation-1",
        ghost:
          "hover:bg-secondary hover:text-secondary-foreground active:bg-accent",
        link: "text-brand underline-offset-4 hover:underline hover:text-brand/80",
        success:
          "bg-success text-success-foreground elevation-2 hover:elevation-4 active:elevation-1",
        warning:
          "bg-warning text-warning-foreground elevation-2 hover:elevation-4 active:elevation-1",
        info:
          "bg-info text-info-foreground elevation-2 hover:elevation-4 active:elevation-1",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-fluent-sm gap-1.5 px-3 text-caption",
        lg: "h-10 rounded-fluent-lg px-6 text-subtitle",
        icon: "size-9 rounded-fluent-md p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
