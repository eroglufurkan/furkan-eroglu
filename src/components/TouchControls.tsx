"use client";

import { useCallback, useRef, useState } from "react";

const DEADZONE = 0.16;

/**
 * Thumbstick and interact button for touch devices. They sit below the room
 * rather than on top of it: on a phone the room is small enough that an
 * overlay would cover most of the level.
 */
export default function TouchControls({
  onAxis,
  onInteract,
  canInteract,
}: {
  onAxis: (x: number, y: number) => void;
  onInteract: () => void;
  canInteract: boolean;
}) {
  const padRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const update = useCallback(
    (e: React.PointerEvent) => {
      const pad = padRef.current;
      if (!pad) return;
      const r = pad.getBoundingClientRect();
      const radius = r.width / 2;
      let dx = (e.clientX - (r.left + radius)) / radius;
      let dy = (e.clientY - (r.top + radius)) / radius;
      const len = Math.hypot(dx, dy);
      if (len > 1) {
        dx /= len;
        dy /= len;
      }
      setKnob({ x: dx, y: dy });
      onAxis(len < DEADZONE ? 0 : dx, len < DEADZONE ? 0 : dy);
    },
    [onAxis],
  );

  const release = useCallback(() => {
    setKnob({ x: 0, y: 0 });
    onAxis(0, 0);
  }, [onAxis]);

  return (
    <div className="mt-5 flex items-center justify-between gap-6 select-none">
      <div
        ref={padRef}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          update(e);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) update(e);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        className="relative h-32 w-32 touch-none rounded-full border border-ash-600 bg-ash-900/70"
        aria-label="Move"
      >
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 h-12 w-12 rounded-full border border-ash-500 bg-ash-700"
          style={{
            transform: `translate(-50%, -50%) translate(${knob.x * 38}px, ${knob.y * 38}px)`,
          }}
        />
      </div>

      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          onInteract();
        }}
        disabled={!canInteract}
        className={`h-24 w-24 touch-none rounded-full border font-mono text-sm tracking-widest transition-colors ${
          canInteract
            ? "border-ember bg-ember/15 text-ember"
            : "border-ash-600 bg-ash-900/70 text-bone-faint/50"
        }`}
      >
        E
      </button>
    </div>
  );
}
