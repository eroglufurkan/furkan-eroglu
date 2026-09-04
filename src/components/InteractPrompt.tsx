"use client";

import type { Interactable } from "@/game/types";
import { ROOM_H, ROOM_W } from "@/game/world";

/**
 * Small floating "[E] Inspect" label, anchored to the spot the player stands on
 * and clamped so it never runs off the edge of the room frame.
 */
export default function InteractPrompt({
  target,
  touch,
}: {
  target: Interactable | null;
  touch: boolean;
}) {
  if (!target) return null;

  const left = Math.min(86, Math.max(9, (target.promptAt.x / ROOM_W) * 100));
  const top = (target.promptAt.y / ROOM_H) * 100;

  return (
    <div
      className="animate-prompt pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      <div className="prompt-chip flex items-center gap-2 border border-ash-500/80 px-2.5 py-1.5 backdrop-blur-[1px]">
        {!touch && (
          <kbd className="border border-bone-faint/70 px-1.5 py-px font-mono text-[10px] leading-4 text-bone">
            E
          </kbd>
        )}
        <span className="font-mono text-[11px] tracking-wide text-bone">
          {target.verb}
        </span>
        <span className="font-mono text-[11px] tracking-wide text-bone-faint">
          {target.name}
        </span>
      </div>
    </div>
  );
}
