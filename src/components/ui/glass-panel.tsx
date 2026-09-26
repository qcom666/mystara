import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Generic surface/panel primitive — deliberately not named "Card" to avoid
 * collision with the domain concept of a Tarot card throughout the codebase.
 */
const panelVariants = cva("rounded-2xl", {
  variants: {
    variant: {
      glass: "glass-panel",
      solid: "bg-midnight-800 border border-midnight-600",
      flat: "bg-midnight-900/60 border border-midnight-700",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
  },
  defaultVariants: {
    variant: "glass",
    padding: "md",
  },
});

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof panelVariants> {}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(({ className, variant, padding, ...props }, ref) => (
  <div ref={ref} className={cn(panelVariants({ variant, padding }), className)} {...props} />
));
GlassPanel.displayName = "GlassPanel";
