import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-gold-400 to-gold-600 text-midnight-950 shadow-[0_0_0_1px_rgba(212,175,55,0.3)] hover:shadow-[0_0_24px_-4px_rgba(212,175,55,0.6)] hover:brightness-110 active:brightness-95",
        secondary: "glass-panel text-silver-200 hover:border-gold-400/40 hover:text-gold-300",
        ghost: "text-silver-300 hover:bg-white/5 hover:text-silver-100",
        outline: "border border-silver-500/40 text-silver-200 hover:border-gold-400/50 hover:text-gold-300",
        violet:
          "bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-[0_0_0_1px_rgba(139,92,246,0.35)] hover:shadow-[0_0_24px_-4px_rgba(139,92,246,0.6)] hover:brightness-110",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";
