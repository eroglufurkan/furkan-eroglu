"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import KeyHint from "./KeyHint";
import PortfolioView from "./PortfolioView";
import RoomStage from "./RoomStage";
import { PROFILE } from "@/content/portfolio";
import { translator } from "@/game/i18n";
import {
  DEFAULT_SETTINGS,
  keyLabel,
  loadSettings,
  saveSettings,
  type Settings,
} from "@/game/settings";
import {
  DEFAULT_THEME,
  THEMES,
  THEME_STORAGE_KEY,
  isThemeId,
  type ThemeId,
} from "@/game/theme";

type Mode = "portfolio" | "play";

/** Below this width the room is too small to be worth playing by default. */
const PLAYABLE_WIDTH = 820;

export default function Experience() {
  // Server and first client render agree on "portfolio", so the full portfolio
  // is always in the HTML. Desktop switches to the room before the first paint.
  const [mode, setMode] = useState<Mode>("portfolio");
  const [touch, setTouch] = useState(false);
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useLayoutEffect(() => {
    setTouch(window.matchMedia("(pointer: coarse)").matches);
    if (window.innerWidth >= PLAYABLE_WIDTH) setMode("play");
    setSettings(loadSettings());

    // The inline script in the document head already applied this to <html>;
    // reading it back only keeps React in step with what is on screen.
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      // Blocked storage: fall through to the default theme.
    }
    if (isThemeId(stored)) setTheme(stored);
  }, []);

  /** Driven by the light switch on the room's wall, not by a header button. */
  const toggleLight = useCallback(() => {
    setTheme((current) => {
      const next: ThemeId = current === "dark" ? "bright" : "dark";
      if (next === DEFAULT_THEME) delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = next;
      // Keep the browser chrome in step with the room.
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", next === "dark" ? "#07080a" : "#fdf4e3");
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // Private mode: the choice just will not persist.
      }
      return next;
    });
  }, []);

  const changeSettings = useCallback((next: Settings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  // Screen readers should hear the interface in the language it is showing.
  useEffect(() => {
    document.documentElement.lang = settings.language;
  }, [settings.language]);

  const t = useMemo(() => translator(settings.language), [settings.language]);
  const playing = mode === "play";
  const bind = settings.bindings;

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <p className="min-w-0 truncate font-mono text-[10px] tracking-[0.22em] text-bone-faint uppercase">
          {playing ? t("roomLabel") : PROFILE.name}
        </p>

        <div
          role="tablist"
          aria-label="View mode"
          className="flex items-center gap-1 border border-ash-700 p-1"
        >
          <ModeButton active={playing} onClick={() => setMode("play")}>
            {t("play")}
          </ModeButton>
          <ModeButton active={!playing} onClick={() => setMode("portfolio")}>
            {t("viewPortfolio")}
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
            <RoomStage
              touch={touch}
              theme={THEMES[theme]}
              settings={settings}
              onSettingsChange={changeSettings}
              onToggleLight={toggleLight}
              t={t}
            />
          </div>
        ) : (
          <PortfolioView />
        )}
      </div>

      <footer className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 pb-6 sm:px-6">
        {playing ? (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {touch ? (
              <span className="font-mono text-[10px] tracking-[0.14em] text-bone-faint lowercase">
                {t("hintMoveTouch")}
              </span>
            ) : (
              <KeyHint
                keys={[
                  keyLabel(bind.up[0]),
                  keyLabel(bind.left[0]),
                  keyLabel(bind.down[0]),
                  keyLabel(bind.right[0]),
                ]}
                label={t("move")}
              />
            )}
            <KeyHint
              keys={[touch ? "E" : keyLabel(bind.interact[0])]}
              label={t("interactVerb")}
            />
            <KeyHint keys={["Esc"]} label={t("close")} />
          </div>
        ) : (
          <p className="font-mono text-[10px] tracking-[0.18em] text-bone-faint uppercase">
            {PROFILE.role}
          </p>
        )}
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
