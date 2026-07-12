"use client";

import { useState } from "react";

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {
          /* clipboard blocked; ignore */
        }
      }}
      className="shrink-0 rounded-lg border border-beige px-2.5 py-1 text-xs font-medium text-taupe transition hover:bg-cream hover:text-charcoal"
    >
      {copied ? "Copied ✓" : label || "Copy"}
    </button>
  );
}
