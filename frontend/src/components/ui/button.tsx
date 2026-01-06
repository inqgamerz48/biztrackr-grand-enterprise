import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-white hover:text-black hover:scale-[1.02] active:scale-[0.98] font-sans font-medium tracking-wide transition-all duration-300 rounded-none",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-none",
                outline:
                    "border border-white/20 text-white bg-transparent hover:bg-white hover:text-black font-sans font-medium tracking-wide rounded-none transition-all duration-300",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-white/10 border border-white/5",
                ghost: "hover:bg-white/5 hover:text-white",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-11 px-6 py-2",
                sm: "h-9 rounded-md px-3 text-xs",
                lg: "h-14 rounded-md px-10 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag" | "ref">,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"

        // If it's a Slot (asChild), we can't easily apply motion props directly without more complex composition.
        // For now, we'll only apply motion if it's a standard button.
        if (asChild) {
            return (
                <Comp
                    className={cn(buttonVariants({ variant, size, className }))}
                    ref={ref}
                    {...props}
                />
            )
        }

        return (
            <motion.button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref as any}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                {...(props as HTMLMotionProps<"button">)}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
