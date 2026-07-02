// Shared Tailwind class recipes for repeated interactive elements, extracted
// per the >5-class rule. Compose with cn() when adding conditional classes.

export const btnBase =
  "inline-flex items-center justify-center gap-1.5 cursor-pointer rounded-lg border px-3.5 py-2 font-medium transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45";

export const btn = `${btnBase} border-hairline-strong bg-surface hover:bg-surface-hover`;

export const btnPrimary = `${btnBase} border-accent-strong bg-linear-to-b from-accent to-accent-strong text-white glow-accent hover:brightness-105`;

export const field =
  "rounded-lg border border-hairline-strong bg-surface px-3 py-2 outline-none transition focus:border-accent";

export const sectionLabel =
  "text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-faint";
