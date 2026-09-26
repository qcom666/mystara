import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "focus-ring h-11 w-full rounded-xl border border-silver-500/25 bg-midnight-900/70 px-4 text-sm text-silver-100 placeholder:text-silver-500 transition-colors focus-visible:border-gold-400/50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "focus-ring w-full resize-none rounded-xl border border-silver-500/25 bg-midnight-900/70 px-4 py-3 text-sm text-silver-100 placeholder:text-silver-500 transition-colors focus-visible:border-gold-400/50",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
