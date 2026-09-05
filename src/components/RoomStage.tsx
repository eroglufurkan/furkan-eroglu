"use client";

import { useCallback, useRef, useState } from "react";
import GameCanvas from "./GameCanvas";
import InteractPrompt from "./InteractPrompt";
import TouchControls from "./TouchControls";
import PanelHost from "./panels/PanelHost";
import { PROFILE } from "@/content/portfolio";
import type { FocusTarget, GameEngine } from "@/game/engine";
import type { Translate } from "@/game/i18n";
import { keyLabel, type Settings } from "@/game/settings";
import type { RoomTheme } from "@/game/theme";
import type { PanelId, Vec2 } from "@/game/types";
import { ROOM_H, ROOM_W } from "@/game/world";

export default function RoomStage({
  touch,
  theme,
  settings,
  onSettingsChange,
  onToggleLight,
  t,
}: {
  touch: boolean;
  theme: RoomTheme;
  settings: Settings;
  onSettingsChange: (next: Settings) => void;
  onToggleLight: () => void;
  t: Translate;
}) {
  const [focused, setFocused] = useState<FocusTarget | null>(null);
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [moved, setMoved] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [caught, setCaught] = useState<number[]>([]);
  const [carrying, setCarrying] = useState(false);
  const engineRef = useRef<GameEngine | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const closePanel = useCallback(() => setPanel(null), []);
  const handleAxis = useCallback((x: number, y: number) => {
    engineRef.current?.setTouchAxis(x, y);
  }, []);
  const handleTouchInteract = useCallback(() => {
    engineRef.current?.pressInteract();
  }, []);

  // The card follows the character every frame, so it moves without a re-render.
  const handleHover = useCallback((isHovered: boolean, at: Vec2) => {
    const card = cardRef.current;
    if (card) {
      card.style.left = `${(at.x / ROOM_W) * 100}%`;
      card.style.top = `${((at.y - 25) / ROOM_H) * 100}%`;
    }
    setHovered((prev) => (prev === isHovered ? prev : isHovered));
  }, []);

  const handleCaught = useCallback((species: number) => {
    setCaught((prev) => (prev.includes(species) ? prev : [...prev, species]));
  }, []);

  return (
    <div className="flex w-full flex-col">
      <div
        className="room-grain room-shadow relative w-full overflow-hidden border border-ash-600 bg-void"
        style={{ aspectRatio: `${ROOM_W} / ${ROOM_H}` }}
      >
        <GameCanvas
          theme={theme}
          settings={settings}
          paused={panel !== null}
          label={`${PROFILE.name} — ${PROFILE.role}. A small room with a desk, a dev station, a workbench, plants and a door.`}
          onFocus={setFocused}
          onOpenPanel={setPanel}
          onToggleLight={onToggleLight}
          onCaught={handleCaught}
          onHoverPlayer={handleHover}
          onCarryChange={setCarrying}
          onFirstMove={() => setMoved(true)}
          onReady={(engine) => {
            engineRef.current = engine;
          }}
        />

        {/* Name card, shown only while the pointer is on the character. */}
        <div
          ref={cardRef}
          aria-hidden={!hovered}
          className={`title-shadow pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full text-center whitespace-nowrap transition-opacity duration-150 ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-[clamp(0.6rem,1.2vw,0.9rem)] font-medium tracking-[0.14em] text-bone">
            {PROFILE.name}
          </p>
          <p className="font-mono text-[clamp(0.4rem,0.75vw,0.55rem)] tracking-[0.2em] text-bone-faint uppercase">
            {PROFILE.role}
          </p>
        </div>

        <InteractPrompt
          target={panel ? null : focused}
          touch={touch}
          interactKey={keyLabel(settings.bindings.interact[0])}
          t={t}
        />

        {/* Reminder that you are holding a cup, since the sprite is tiny. */}
        {carrying && !panel && (
          <div className="pointer-events-none absolute top-2 left-2 z-20">
            <span className="prompt-chip rounded-[3px] border border-ash-500/70 px-2 py-1 font-mono text-[10px] tracking-wide text-bone">
              {t("carryingWater")}
            </span>
          </div>
        )}

        {/* Opening hint, retired once the player works out the controls. */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-2.5 z-10 text-center transition-opacity duration-700 ${
            moved ? "opacity-0" : "opacity-100"
          }`}
        >
          <p className="font-mono text-[clamp(0.45rem,0.9vw,0.625rem)] tracking-[0.2em] text-bone-faint uppercase">
            {touch ? t("hintMoveTouch") : t("hintMove")}
          </p>
        </div>

        <PanelHost
          panel={panel}
          onClose={closePanel}
          settings={settings}
          onSettingsChange={onSettingsChange}
          caught={caught}
          theme={theme}
          t={t}
        />
      </div>

      {touch && (
        <TouchControls
          onAxis={handleAxis}
          onInteract={handleTouchInteract}
          canInteract={focused !== null && focused.actionable && panel === null}
        />
      )}
    </div>
  );
}
