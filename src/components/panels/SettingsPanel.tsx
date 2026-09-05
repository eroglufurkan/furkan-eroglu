"use client";

import { useEffect, useState } from "react";
import type { Translate } from "@/game/i18n";
import {
  ACTION_IDS,
  DEFAULT_SETTINGS,
  keyLabel,
  rebind,
  type ActionId,
  type LanguageId,
  type Settings,
} from "@/game/settings";
import { Eyebrow } from "@/components/ui";
import { KeyCap } from "@/components/KeyHint";

const ACTION_LABEL: Record<ActionId, "actionUp" | "actionDown" | "actionLeft" | "actionRight" | "actionInteract"> = {
  up: "actionUp",
  down: "actionDown",
  left: "actionLeft",
  right: "actionRight",
  interact: "actionInteract",
};

type Capture = { action: ActionId; slot: 0 | 1 } | null;

export default function SettingsPanel({
  settings,
  onChange,
  t,
}: {
  settings: Settings;
  onChange: (next: Settings) => void;
  t: Translate;
}) {
  const [capture, setCapture] = useState<Capture>(null);

  // While a slot is armed, the very next key press becomes its binding.
  useEffect(() => {
    if (!capture) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === "Escape") {
        setCapture(null);
        return;
      }
      onChange({
        ...settings,
        bindings: rebind(settings.bindings, capture.action, capture.slot, e.code),
      });
      setCapture(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [capture, settings, onChange]);

  const volumePercent = Math.round(settings.volume * 100);

  return (
    <div className="space-y-6">
      <section>
        <Eyebrow>{t("audio")}</Eyebrow>

        <div className="mt-3 flex items-center gap-3">
          <label
            htmlFor="volume"
            className="w-28 shrink-0 font-mono text-[11px] text-bone-dim"
          >
            {t("volume")}
          </label>
          <input
            id="volume"
            type="range"
            min={0}
            max={100}
            value={volumePercent}
            onChange={(e) =>
              onChange({ ...settings, volume: Number(e.target.value) / 100 })
            }
            className="room-range h-1 flex-1"
          />
          <span className="w-9 shrink-0 text-right font-mono text-[11px] text-bone-faint tabular-nums">
            {volumePercent}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <span className="w-28 shrink-0 font-mono text-[11px] text-bone-dim">
            {t("soundEffects")}
          </span>
          <Segmented
            options={[
              { value: "on", label: t("on") },
              { value: "off", label: t("off") },
            ]}
            value={settings.sfxEnabled ? "on" : "off"}
            onSelect={(value) =>
              onChange({ ...settings, sfxEnabled: value === "on" })
            }
          />
        </div>
      </section>

      <section>
        <Eyebrow>{t("language")}</Eyebrow>
        <div className="mt-3">
          <Segmented
            options={[
              { value: "en", label: t("english") },
              { value: "tr", label: t("turkish") },
            ]}
            value={settings.language}
            onSelect={(value) =>
              onChange({ ...settings, language: value as LanguageId })
            }
          />
        </div>
      </section>

      <section>
        <Eyebrow>{t("controls")}</Eyebrow>
        <p className="mt-2 font-mono text-[10px] text-bone-faint">
          {t("controlsHint")}
        </p>

        <div className="mt-3 overflow-hidden border border-ash-700">
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-ash-700 bg-ash-800 px-3 py-2">
            <span className="font-mono text-[9px] tracking-[0.18em] text-bone-faint uppercase" />
            <span className="w-16 text-center font-mono text-[9px] tracking-[0.14em] text-bone-faint uppercase">
              {t("primary")}
            </span>
            <span className="w-16 text-center font-mono text-[9px] tracking-[0.14em] text-bone-faint uppercase">
              {t("alternate")}
            </span>
          </div>

          {ACTION_IDS.map((action) => (
            <div
              key={action}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-ash-700 px-3 py-2 last:border-b-0"
            >
              <span className="font-mono text-[11px] text-bone">
                {t(ACTION_LABEL[action])}
              </span>
              {([0, 1] as const).map((slot) => {
                const armed =
                  capture?.action === action && capture.slot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setCapture(armed ? null : { action, slot })}
                    className={`w-16 rounded-[3px] border px-1 py-1 font-mono text-[10px] transition-colors ${
                      armed
                        ? "border-ember bg-ember/15 text-ember"
                        : "border-ash-600 text-bone hover:border-bone-dim"
                    }`}
                  >
                    {armed ? t("pressKey") : keyLabel(settings.bindings[action][slot])}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            onChange({ ...settings, bindings: DEFAULT_SETTINGS.bindings })
          }
          className="mt-3 inline-flex items-center gap-2 rounded-[3px] border border-ash-500 px-3 py-1.5 font-mono text-[10px] tracking-wide text-bone-dim transition-colors hover:border-bone-dim hover:text-bone"
        >
          {t("resetDefaults")}
        </button>
      </section>

      <p className="flex flex-wrap items-center gap-1.5 border-t border-ash-700 pt-4 font-mono text-[10px] text-bone-faint">
        <KeyCap>Esc</KeyCap>
        <span>{t("close")}</span>
      </p>
    </div>
  );
}

function Segmented({
  options,
  value,
  onSelect,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 border border-ash-700 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onSelect(option.value)}
          className={`px-3 py-1 font-mono text-[10px] tracking-[0.12em] uppercase transition-colors ${
            value === option.value
              ? "bg-bone text-void"
              : "text-bone-dim hover:bg-ash-800 hover:text-bone"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
