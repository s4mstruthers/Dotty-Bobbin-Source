// What a card shows while the item has no photo in the dashboard: a soft polka-dot tile with a
// small line drawing. As soon as a photo is added in Wix, the card shows the photo instead.
// Purely decorative (aria-hidden) — the card's title carries the meaning.

import type { ReactNode } from "react";

type Motif = "spool" | "needle" | "scissors" | "calendar" | "bag";

const paths: Record<Motif, ReactNode> = {
  spool: (
    <>
      <rect x="14" y="8" width="36" height="6" rx="3" />
      <rect x="14" y="50" width="36" height="6" rx="3" />
      <rect x="20" y="14" width="24" height="36" />
      <path d="M20 20l24 4M20 28l24 4M20 36l24 4M20 44l24 4" />
    </>
  ),
  needle: (
    <>
      <path d="M14 50L48 16" />
      <ellipse cx="47" cy="17" rx="2" ry="4.5" transform="rotate(45 47 17)" />
      <path d="M44 20c6 8 6 18-4 26s-22 6-24-2" strokeDasharray="3 4" />
    </>
  ),
  scissors: (
    <>
      <circle cx="20" cy="44" r="7" />
      <circle cx="44" cy="44" r="7" />
      <path d="M25 39L46 12M39 39L18 12" />
    </>
  ),
  calendar: (
    <>
      <rect x="12" y="14" width="40" height="38" rx="8" />
      <path d="M12 26h40M22 10v8M42 10v8" />
      <circle cx="24" cy="36" r="2.5" />
      <circle cx="32" cy="36" r="2.5" />
      <circle cx="40" cy="36" r="2.5" />
    </>
  ),
  bag: (
    <>
      <path d="M14 22h36l-3 30H17z" />
      <path d="M24 22c0-8 4-12 8-12s8 4 8 12" />
    </>
  ),
};

export default function NoPhoto({ motif = "spool", tone = "sage", className = "" }: { motif?: Motif; tone?: "sage" | "pink"; className?: string }) {
  return (
    <div aria-hidden="true" className={`flex h-full w-full items-center justify-center ${tone === "pink" ? "dots-pink" : "dots"} ${className}`}>
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-background/90 shadow-sm">
        <svg width="44" height="44" viewBox="0 0 64 64" fill="none" stroke="var(--color-sage)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {paths[motif]}
        </svg>
      </span>
    </div>
  );
}
