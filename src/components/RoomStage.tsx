"use client";

import { useCallback, useRef, useState } from "react";
import GameCanvas from "./GameCanvas";
import InteractPrompt from "./InteractPrompt";
import TouchControls from "./TouchControls";
import PanelHost from "./panels/PanelHost";
import type { GameEngine } from "@/game/engine";
import type { Interactable, PanelId } from "@/game/types";
import { PROFILE } from "@/content/portfolio";
import { ROOM_H, ROOM_W, TITLE_ANCHOR } from "@/game/world";

export default function RoomStage({ touch }: { touch: boolean }) {
  const [focused, setFocused] = useState<Interactable | null>(null);
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [moved, setMoved] = useState(false);
  const engineRef = useRef<GameEngine | null>(null);

  const closePanel = useCallback(() => setPanel(null), []);
  const handleAxis = useCallback((x: number, y: number) => {
    engineRef.current?.setTouchAxis(x, y);
  }, []);
  const handleTouchInteract = useCallback(() => {
    engineRef.current?.pressInteract();
  }, []);

  return (
    <div className="flex w-full flex-col">
      <div
        className="room-grain relative w-full overflow-hidden border border-ash-600 bg-void shadow-[0_0_0_1px_rgba(0,0,0,0.7),0_40px_90px_-40px_rgba(0,0,0,0.95)]"
        style={{ aspectRatio: `${ROOM_W} / ${ROOM_H}` }}
      >
        <GameCanvas
          paused={panel !== null}
          onFocus={setFocused}
          onInteract={setPanel}
          onFirstMove={() => setMoved(true)}
          onReady={(engine) => {
            engineRef.current = engine;
          }}
        />

        {/* Name card, painted into the middle of the room above the rug. */}
        <div
          className="pointer-events-none absolute inset-x-0 z-10 -translate-y-full px-3 text-center"
          style={{ top: `${(TITLE_ANCHOR.y / ROOM_H) * 100}%` }}
        >
          <h1 className="text-[clamp(0.85rem,2.1vw,1.4rem)] font-medium tracking-[0.2em] text-bone/85 uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            {PROFILE.name}
          </h1>
          <p className="mt-1 font-mono text-[clamp(0.45rem,1vw,0.7rem)] tracking-[0.2em] text-bone-faint uppercase">
            {PROFILE.role}
          </p>
        </div>

        <InteractPrompt target={panel ? null : focused} touch={touch} />

        {/* Opening hint, retired once the player works out the controls. */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-2.5 z-10 text-center transition-opacity duration-700 ${
            moved ? "opacity-0" : "opacity-100"
          }`}
        >
          <p className="font-mono text-[clamp(0.45rem,0.9vw,0.625rem)] tracking-[0.2em] text-bone-faint uppercase">
            {touch ? "Drag the stick to move" : "W A S D  /  arrow keys to move"}
          </p>
        </div>

        <PanelHost panel={panel} onClose={closePanel} />
      </div>

      {touch && (
        <TouchControls
          onAxis={handleAxis}
          onInteract={handleTouchInteract}
          canInteract={focused !== null && panel === null}
        />
      )}
    </div>
  );
}
