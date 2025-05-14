import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressVariants = cva("h-2 w-full overflow-hidden rounded-full bg-gray-800", {
  variants: {
    variant: {
      default: "", // Parent background defined in base class
      warning: "", // Parent background defined in base class
      success: "", // Parent background defined in base class
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const progressIndicatorVariants = cva("h-full w-full flex-1 transition-all", {
  variants: {
    variant: {
      default: "bg-blue-600",
      warning: "bg-yellow-500",
      success: "bg-green-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value: number
  max?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, variant, ...props }, ref) => {
    const percentage = (value / max) * 100
    
    return (
      <div
        ref={ref}
        className={cn(progressVariants({ variant }), className)}
        {...props}
      >
        <div
          className={cn(progressIndicatorVariants({ variant }))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress } 