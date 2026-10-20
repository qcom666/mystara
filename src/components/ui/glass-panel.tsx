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

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof panelVariants> {
  /** Проявляться при прокрутке (CSS, класс scroll-reveal в globals.css); false — для закреплённых и всплывающих панелей. */
  scrollReveal?: boolean;
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(({ className, variant, padding, scrollReveal = true, ...props }, ref) => (
  <div ref={ref} className={cn(panelVariants({ variant, padding }), scrollReveal && "scroll-reveal", className)} {...props} />
));
GlassPanel.displayName = "GlassPanel";
