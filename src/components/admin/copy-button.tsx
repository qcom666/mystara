"use client";

import { useState } from "react";

/** Копирует текст в буфер обмена (например, наименование услуги для «Мой налог»). */
export function CopyButton({ text, label = "копировать" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Скопируйте вручную:", text);
    }
  }

  return (
    <button type="button" onClick={onClick} title={text} className="whitespace-nowrap text-xs text-silver-500 underline-offset-2 hover:text-gold-300 hover:underline">
      {copied ? "скопировано" : label}
    </button>
  );
}
