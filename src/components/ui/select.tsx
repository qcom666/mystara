import type { SelectHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/** Plain native `<select>`, styled to match Input — no Radix Select needed for a handful of short option lists. */
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "focus-ring h-11 w-full rounded-xl border border-silver-500/25 bg-midnight-900/70 px-4 text-sm text-silver-100 transition-colors focus-visible:border-gold-400/50",
      className,
    )}
    {...props}
  />
));
Select.displayName = "Select";
