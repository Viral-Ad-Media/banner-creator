import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

const buttonVariants = cva(
  // Transform-only press feedback (Emil: 0.97 scale, ~140ms ease-out); colours fade with plain ease.
  "relative inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-semibold whitespace-nowrap outline-none transition-[transform,background-color,border-color,color,opacity] duration-150 ease-out-strong active:not-disabled:scale-[0.97] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/88",
        primary: "bg-primary text-primary-foreground hover:bg-primary/88",
        brand: "bg-brand text-brand-foreground hover:bg-brand/88",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/40",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost:
          "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-foreground underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        md: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-11 rounded-md px-6 text-[15px] has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
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
  variant = "default",
  size = "default",
  asChild = false,
  isLoading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    isLoading?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={asChild ? undefined : isLoading || disabled}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {isLoading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Spinner />
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-[inherit]",
              isLoading && "invisible"
            )}
          >
            {children}
          </span>
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
