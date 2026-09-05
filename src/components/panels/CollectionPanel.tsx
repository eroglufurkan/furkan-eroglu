"use client";

import type { Translate } from "@/game/i18n";
import type { RoomTheme } from "@/game/theme";
import { BUG_SPECIES } from "@/game/world";

/** The display case, read out as a grid of slots. */
export default function CollectionPanel({
  caught,
  theme,
  t,
}: {
  caught: readonly number[];
  theme: RoomTheme;
  t: Translate;
}) {
  const complete = caught.length >= BUG_SPECIES;
  const colors = theme.palette.bugColors;

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-bone-dim">
        {complete ? t("collectionComplete") : t("collectionHint")}
      </p>

      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[10px] tracking-[0.18em] text-bone-faint uppercase">
          {t("collectionProgress")}
        </span>
        <span className="font-mono text-sm text-bone tabular-nums">
          {caught.length} / {BUG_SPECIES}
        </span>
      </div>

      <ul className="grid grid-cols-5 gap-2">
        {Array.from({ length: BUG_SPECIES }, (_, i) => {
          const found = caught.includes(i);
          return (
            <li
              key={i}
              className={`flex aspect-square items-center justify-center border ${
                found ? "border-ash-600 bg-ash-800" : "border-dashed border-ash-700"
              }`}
            >
              {found ? (
                <span
                  aria-hidden
                  className="block h-3.5 w-3.5 rounded-[2px]"
                  style={{ background: colors[i % colors.length] }}
                />
              ) : (
                <span className="font-mono text-[14px] text-bone-faint/40">?</span>
              )}
            </li>
          );
        })}
      </ul>

      {caught.length === 0 && (
        <p className="font-mono text-[11px] text-bone-faint">
          {t("collectionEmpty")}
        </p>
      )}
    </div>
  );
}
