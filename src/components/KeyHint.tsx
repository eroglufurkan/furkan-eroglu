import type { ReactNode } from "react";

/** A single key drawn as a small cap, so a control hint reads as a key. */
export function KeyCap({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[19px] items-center justify-center rounded-[3px] border border-ash-600 border-b-2 bg-ash-800 px-1 py-[2px] font-mono text-[10px] leading-none text-bone">
      {children}
    </kbd>
  );
}

/** One or more key caps followed by what they do. */
export default function KeyHint({
  keys,
  label,
}: {
  keys: readonly string[];
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-0.5">
        {keys.map((key, i) => (
          <KeyCap key={key + i}>{key}</KeyCap>
        ))}
      </span>
      <span className="font-mono text-[10px] tracking-[0.14em] text-bone-faint lowercase">
        {label}
      </span>
    </span>
  );
}
