"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

interface ConsentCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  invalid?: boolean;
}

/**
 * Unticked by default and never pre-selected — consent has to be an active act.
 * The two documents open in a new tab so a half-filled form isn't lost.
 */
export function ConsentCheckbox({ id, checked, onChange, invalid = false }: ConsentCheckboxProps) {
  const t = useTranslation();
  const linkClass = "text-gold-300 underline-offset-2 hover:underline";

  return (
    <div>
      <div className="flex items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={invalid}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-gold-400"
        />
        <label htmlFor={id} className="cursor-pointer text-xs leading-snug text-silver-400">
          {t.legal.consentLead}
          <Link href="/consent" target="_blank" className={linkClass}>
            {t.legal.consentLinkLabel}
          </Link>
          {t.legal.consentMiddle}
          <Link href="/privacy" target="_blank" className={linkClass}>
            {t.legal.consentPolicyLabel}
          </Link>
          .
        </label>
      </div>
      {invalid && <p className="mt-1.5 text-xs text-red-400">{t.legal.consentRequired}</p>}
    </div>
  );
}
