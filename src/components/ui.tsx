import type { ReactNode } from "react";

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-sm border border-ash-600 bg-ash-800 px-2 py-1 font-mono text-[11px] tracking-wide text-bone-dim">
      {children}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="border border-ember-dim/60 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.18em] text-ember">
      {children}
    </span>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[10px] tracking-[0.22em] text-bone-faint uppercase">
      {children}
    </p>
  );
}

/**
 * A link that degrades to a clearly-labelled placeholder when the URL has not
 * been filled in yet, so the panel never ships a dead button.
 */
export function ActionLink({
  href,
  children,
  variant = "ghost",
  download = false,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  download?: boolean;
}) {
  const base =
    "inline-flex items-center gap-2 rounded-sm px-3.5 py-2 font-mono text-xs tracking-wide transition-colors";

  if (!href) {
    return (
      <span className={`${base} cursor-not-allowed border border-ash-600 text-bone-faint`}>
        {children} <span className="text-[10px]">· soon</span>
      </span>
    );
  }

  const style =
    variant === "primary"
      ? "bg-ember text-void hover:bg-bone"
      : "border border-ash-500 text-bone hover:border-bone-dim hover:bg-ash-800";

  const external = href.startsWith("http");

  return (
    <a
      href={href}
      {...(download ? { download: "" } : {})}
      {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      className={`${base} ${style}`}
    >
      {children}
      {external && <span aria-hidden>→</span>}
    </a>
  );
}
