"use client";

import { useEffect, useRef } from "react";
import { GameEngine } from "@/game/engine";
import type { Interactable, PanelId } from "@/game/types";
import { ROOM_H, ROOM_W } from "@/game/world";

type Props = {
  paused: boolean;
  onFocus: (target: Interactable | null) => void;
  onInteract: (panel: PanelId) => void;
  onFirstMove?: () => void;
  onReady?: (engine: GameEngine) => void;
};

export default function GameCanvas({
  paused,
  onFocus,
  onInteract,
  onFirstMove,
  onReady,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Callbacks are read through a ref so the engine is created exactly once.
  const cbs = useRef({ onFocus, onInteract, onFirstMove, onReady });
  cbs.current = { onFocus, onInteract, onFirstMove, onReady };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, {
      onFocus: (t) => cbs.current.onFocus(t),
      onInteract: (p) => cbs.current.onInteract(p),
      onFirstMove: () => cbs.current.onFirstMove?.(),
    });
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

  return (
    <canvas
      ref={canvasRef}
      width={ROOM_W}
      height={ROOM_H}
      aria-label="A dark room containing a desk, a dev station, a workbench and a door"
      className="pixelated block h-full w-full"
    />
  );
}
