"use client";

import type { FocusTarget } from "@/game/engine";
import type { Translate } from "@/game/i18n";
import { ROOM_H, ROOM_W } from "@/game/world";
import { KeyCap } from "./KeyHint";

/**
 * Small floating "[E] Inspect" label, anchored beside the object and clamped so
 * it never runs off the edge of the room frame.
 */
export default function InteractPrompt({
  target,
  touch,
  interactKey,
  t,
}: {
  target: FocusTarget | null;
  touch: boolean;
  interactKey: string;
  t: Translate;
}) {
  if (!target) return null;

  const { promptAt, nameKey } = target.interactable;
  const left = Math.min(86, Math.max(9, (promptAt.x / ROOM_W) * 100));
  const top = (promptAt.y / ROOM_H) * 100;

  return (
    <div
      className="animate-prompt pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      <div className="prompt-chip flex items-center gap-2 rounded-[3px] border border-ash-500/80 px-2.5 py-1.5 backdrop-blur-[1px]">
        {!touch && target.actionable && <KeyCap>{interactKey}</KeyCap>}
        <span
          className={`font-mono text-[11px] tracking-wide ${
            target.actionable ? "text-bone" : "text-bone-dim italic"
          }`}
        >
          {t(target.verbKey)}
        </span>
        <span className="font-mono text-[11px] tracking-wide text-bone-faint">
          {t(nameKey)}
        </span>
      </div>
    </div>
  );
}
