import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium", {
  variants: {
    variant: {
      gold: "border-gold-500/30 bg-gold-500/10 text-gold-300",
      violet: "border-violet-500/30 bg-violet-500/10 text-violet-300",
      neutral: "border-silver-500/25 bg-silver-500/10 text-silver-300",
      outline: "border-silver-500/30 text-silver-400",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
