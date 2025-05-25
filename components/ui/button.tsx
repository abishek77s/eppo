import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-label-lg font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", // M3: label-lg, medium weight
  {
    variants: {
      variant: {
        // M3 Filled Button (Primary)
        default: "bg-primary text-on-primary hover:bg-primary/90 shadow-sm hover:shadow-md rounded-full", // M3: Full radius for standard buttons
        // M3 Filled Tonal Button (Secondary Container) - or could be actual secondary
        secondary: "bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 shadow-sm hover:shadow-md rounded-full",
        // M3 Destructive Filled Button
        destructive: "bg-error text-on-error hover:bg-error/90 shadow-sm hover:shadow-md rounded-full",
        // M3 Outlined Button
        outline: "border border-outline text-primary hover:bg-primary/10 rounded-full", // M3: uses outline color, text is primary
        // M3 Text Button
        ghost: "text-primary hover:bg-primary/10 rounded-md", // Ghost often uses primary text, subtle background on hover
        // M3 Link like button (often just text styled)
        link: "text-primary underline-offset-4 hover:underline rounded-md", // Keep as is, or use tertiary
         // M3 Elevated Button (Surface + Shadow)
        elevated: "bg-surface text-primary shadow-md hover:shadow-lg rounded-lg", // M3: surface color, primary text, distinct shadow
        // M3 Filled Tonal (using Tertiary)
        tertiary: "bg-tertiary-container text-on-tertiary-container hover:bg-tertiary-container/80 shadow-sm hover:shadow-md rounded-full"
      },
      size: { // M3 button height is often 40dp
        default: "h-10 px-6 py-2", // M3: Standard button padding (e.g., 24px horizontal)
        sm: "h-9 px-4 py-1.5 text-label-md rounded-full", // Smaller buttons might use smaller radius or full still
        lg: "h-12 px-8 py-3 text-label-lg rounded-full", // Larger buttons
        icon: "h-10 w-10 rounded-full", // Icon buttons are often circular
        icon_xs: "h-8 w-8 rounded-full p-1", // Custom smaller icon button
        xs: "h-8 px-3 text-label-md rounded-full", // Custom extra small text button
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
