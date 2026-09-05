"use client";

import { useEffect, useRef } from "react";
import { GameEngine, type EngineCallbacks } from "@/game/engine";
import type { Settings } from "@/game/settings";
import type { RoomTheme } from "@/game/theme";
import { ROOM_H, ROOM_W } from "@/game/world";

type Props = EngineCallbacks & {
  theme: RoomTheme;
  settings: Settings;
  paused: boolean;
  label: string;
  onReady?: (engine: GameEngine) => void;
};

export default function GameCanvas({
  theme,
  settings,
  paused,
  label,
  onReady,
  ...callbacks
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Callbacks are read through a ref so the engine is created exactly once.
  const cbs = useRef({ ...callbacks, onReady });
  cbs.current = { ...callbacks, onReady };

  // The engine is created once; theme and settings are pushed in as they change.
  const initial = useRef({ theme, settings });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(
      canvas,
      initial.current.theme,
      initial.current.settings,
      {
        onFocus: (target) => cbs.current.onFocus(target),
        onOpenPanel: (panel) => cbs.current.onOpenPanel(panel),
        onToggleLight: () => cbs.current.onToggleLight(),
        onCaught: (species, total) => cbs.current.onCaught(species, total),
        onHoverPlayer: (hovered, at) => cbs.current.onHoverPlayer(hovered, at),
        onCarryChange: (carrying) => cbs.current.onCarryChange(carrying),
        onHoverBall: (hovered, at) => cbs.current.onHoverBall(hovered, at),
        onFirstMove: () => cbs.current.onFirstMove?.(),
      },
    );
    engineRef.current = engine;
    engine.start();
    if (process.env.NODE_ENV === "development") {
      // Handy for poking at the room from the console while building it.
      (window as unknown as { __engine?: GameEngine }).__engine = engine;
    }
    cbs.current.onReady?.(engine);

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setPaused(paused);
  }, [paused]);

  useEffect(() => {
    engineRef.current?.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    engineRef.current?.setSettings(settings);
  }, [settings]);

  return (
    <canvas
      ref={canvasRef}
      width={ROOM_W}
      height={ROOM_H}
      aria-label={label}
      className="pixelated block h-full w-full touch-none"
    />
  );
}
