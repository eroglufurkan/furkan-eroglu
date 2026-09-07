"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  tag?: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * The modal used for every interactable. It sits inside the room frame on
 * desktop so the world stays visible around it, and becomes a sheet on phones.
 */
export default function PanelShell({
  tag,
  title,
  subtitle,
  onClose,
  children,
}: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center md:absolute md:items-center">
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="panel-backdrop absolute inset-0 cursor-default backdrop-blur-[2px] md:backdrop-blur-0"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-rise panel-shadow relative z-10 flex max-h-[88dvh] w-full flex-col border border-ash-600 bg-ash-900/97 md:max-h-[86%] md:w-[80%] md:max-w-xl"
      >
        {/* Ember hairline along the top edge. */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-ember-dim to-transparent" />

        <header className="flex items-start justify-between gap-4 border-b border-ash-700 px-5 py-4">
          <div className="min-w-0">
            {tag && (
              <p className="mb-1.5 font-mono text-[10px] tracking-[0.22em] text-ember">
                {tag}
              </p>
            )}
            <h2 className="truncate text-lg font-medium tracking-tight text-bone">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 font-mono text-[11px] tracking-wide text-bone-dim">
                {subtitle}
              </p>
            )}
          </div>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-sm border border-ash-600 px-2 py-1 font-mono text-[10px] tracking-widest text-bone-dim transition-colors hover:border-bone-dim hover:text-bone"
          >
            ESC
          </button>
        </header>

        <div className="panel-scroll overflow-y-auto px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-5">
          {children}
        </div>
      </div>
    </div>
  );
}
