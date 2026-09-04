"use client";

import { useLayoutEffect, useState } from "react";
import PortfolioView from "./PortfolioView";
import RoomStage from "./RoomStage";
import { PROFILE } from "@/content/portfolio";

type Mode = "portfolio" | "play";

/** Below this width the room is too small to be worth playing by default. */
const PLAYABLE_WIDTH = 820;

export default function Experience() {
  // Server and first client render agree on "portfolio", so the full portfolio
  // is always in the HTML. Desktop switches to the room before the first paint.
  const [mode, setMode] = useState<Mode>("portfolio");
  const [touch, setTouch] = useState(false);

  useLayoutEffect(() => {
    setTouch(window.matchMedia("(pointer: coarse)").matches);
    if (window.innerWidth >= PLAYABLE_WIDTH) setMode("play");
  }, []);

  const playing = mode === "play";

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <p className="min-w-0 truncate font-mono text-[10px] tracking-[0.22em] text-bone-faint uppercase">
          {playing ? "Room 01" : PROFILE.name}
        </p>

        <div
          role="tablist"
          aria-label="View mode"
          className="flex items-center gap-1 border border-ash-700 p-1"
        >
          <ModeButton active={playing} onClick={() => setMode("play")}>
            Play
          </ModeButton>
          <ModeButton active={!playing} onClick={() => setMode("portfolio")}>
            View Portfolio
          </ModeButton>
        </div>
      </header>

      <div
        className={`flex flex-1 flex-col px-4 pb-8 sm:px-6 ${
          playing ? "justify-center" : ""
        }`}
      >
        {playing ? (
          <div
            className="animate-fade-in mx-auto w-full max-w-[1120px]"
            // Keeps the whole room on screen without scrolling on short displays.
            style={{
              maxWidth: touch
                ? undefined
                : "min(1120px, calc((100dvh - 215px) * 1.75))",
            }}
          >
            <RoomStage touch={touch} />
          </div>
        ) : (
          <PortfolioView />
        )}
      </div>

      <footer className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 pb-6 sm:px-6">
        <p className="font-mono text-[10px] tracking-[0.18em] text-bone-faint uppercase">
          {playing
            ? touch
              ? "Stick · move    E · interact"
              : "WASD / arrows · move    E · interact    esc · close"
            : PROFILE.role}
        </p>
        <p className="font-mono text-[10px] tracking-[0.18em] text-bone-faint uppercase">
          {PROFILE.location}
        </p>
      </footer>
    </main>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] uppercase transition-colors ${
        active
          ? "bg-bone text-void"
          : "text-bone-dim hover:bg-ash-800 hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}
