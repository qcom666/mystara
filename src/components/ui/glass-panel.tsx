import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Универсальный примитив поверхности/панели; намеренно не назван «Card», чтобы не путать с доменным
 * понятием карты Таро, которое встречается по всему коду.
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
