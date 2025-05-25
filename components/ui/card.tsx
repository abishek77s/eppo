import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // M3: Cards often use surface-variant or surface-container roles. Elevation is key.
    // Using `bg-surface-variant` and `text-on-surface-variant`.
    // Border radius updated to 'lg' (16px) as a common M3 card style.
    // Shadow can be adjusted; M3 has specific elevation tiers (e.g. shadow-sm for +1, shadow-md for +2)
    className={cn(
      "rounded-lg border border-outline-variant bg-surface-variant text-on-surface-variant shadow-md", // M3: md radius (12px), surface-variant, on-surface-variant text
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // M3: Padding is often 16dp.
    className={cn("flex flex-col space-y-1.5 p-4 md:p-6", className)} // Adjusted padding
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement, // Changed to p for semantic correctness, or h3 etc.
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p // Changed div to p
    ref={ref}
    // M3: Card titles often use "title-large" or "title-medium"
    className={cn(
      "text-title-lg font-medium text-on-surface-variant", // M3: title-lg, medium weight
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement, // Changed to p
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p // Changed div to p
    ref={ref}
    // M3: Card descriptions often use "body-medium" and a less prominent color
    className={cn("text-body-md text-on-surface-variant/80", className)} // M3: body-md, slightly muted on-surface-variant
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  // M3: Padding consistent with header, or specific content padding.
  <div ref={ref} className={cn("p-4 md:p-6 pt-0", className)} {...props} /> // Adjusted padding
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // M3: Footer padding consistent. Often contains actions (buttons).
    className={cn("flex items-center p-4 md:p-6 pt-0", className)} // Adjusted padding
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
