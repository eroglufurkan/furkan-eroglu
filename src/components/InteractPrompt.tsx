"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { FocusTarget } from "@/game/engine";
import type { Translate } from "@/game/i18n";
import { ROOM_H, ROOM_W } from "@/game/world";
import { KeyCap } from "./KeyHint";

/**
 * Small floating "[E] Inspect" label, anchored beside the object.
 *
 * The room frame clips anything that leaves it, and on a phone the frame is
 * only a few hundred pixels wide, so a percentage clamp is not enough: a label
 * for the door would still hang off the right edge. It is measured instead and
 * pulled back inside, and it drops below its object when there is no room above.
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
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);

  const anchor = target?.interactable.promptAt;
  const ax = anchor?.x ?? 0;
  const ay = anchor?.y ?? 0;

  useLayoutEffect(() => {
    const el = ref.current;
    const frame = el?.offsetParent as HTMLElement | null;
    if (!el || !frame) return;

    const place = () => {
      const fw = frame.clientWidth;
      const fh = frame.clientHeight;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const margin = 4;

      // Centred on the object, then pushed back inside the frame.
      const cx = (ax / ROOM_W) * fw;
      const left = Math.min(fw - w / 2 - margin, Math.max(w / 2 + margin, cx));

      // `top` is the label's bottom edge, since it is translated up by its own
      // height. Objects against the back wall get the label underneath instead.
      const y = (ay / ROOM_H) * fh;
      setAt({ left, top: y - h < margin ? y + h + margin : y });
    };

    place();
    const observer = new ResizeObserver(place);
    observer.observe(frame);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ax, ay, target]);

  if (!target) return null;

  const { nameKey } = target.interactable;

  return (
    <div
      ref={ref}
      className="animate-prompt pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
      // Hidden for the one frame before it has been measured.
      style={
        at
          ? { left: at.left, top: at.top }
          : { left: 0, top: 0, visibility: "hidden" }
      }
    >
      <div className="prompt-chip flex items-center gap-1.5 rounded-[3px] border border-ash-500/80 px-2 py-1.5 whitespace-nowrap backdrop-blur-[1px] sm:gap-2 sm:px-2.5">
        {!touch && target.actionable && (
          <span className="flex items-center gap-1">
            <KeyCap>{interactKey}</KeyCap>
            {target.interactable.hold && (
              <span className="font-mono text-[9px] tracking-[0.12em] text-bone-faint lowercase">
                {t("holdKey")}
              </span>
            )}
          </span>
        )}
        {touch && target.actionable && target.interactable.hold && (
          <span className="font-mono text-[9px] tracking-[0.12em] text-bone-faint lowercase">
            {t("holdKey")}
          </span>
        )}
        <span
          className={`font-mono text-[10px] tracking-wide sm:text-[11px] ${
            target.actionable ? "text-bone" : "text-bone-dim italic"
          }`}
        >
          {t(target.verbKey)}
        </span>
        <span className="font-mono text-[10px] tracking-wide text-bone-faint sm:text-[11px]">
          {t(nameKey)}
        </span>
      </div>
    </div>
  );
}
