import type { SelectHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/** Обычный нативный `<select>`, оформленный как Input; Radix Select для пары коротких списков не нужен. */
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
