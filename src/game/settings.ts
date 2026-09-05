export type LanguageId = "en" | "tr";

export type ActionId = "up" | "down" | "left" | "right" | "interact";

export const ACTION_IDS: readonly ActionId[] = [
  "up",
  "down",
  "left",
  "right",
  "interact",
];

/**
 * Two slots per action: a primary and an alternate. Both are rebindable, which
 * is why the arrow keys live in the alternate slot rather than being hardcoded.
 */
export type KeyBindings = Record<ActionId, [string, string | null]>;

export const DEFAULT_BINDINGS: KeyBindings = {
  up: ["KeyW", "ArrowUp"],
  down: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  interact: ["KeyE", "Space"],
};

export type Settings = {
  /** 0..1, applied to every sound the room makes. */
  volume: number;
  sfxEnabled: boolean;
  language: LanguageId;
  bindings: KeyBindings;
};

export const DEFAULT_SETTINGS: Settings = {
  volume: 0.6,
  sfxEnabled: true,
  language: "en",
  bindings: DEFAULT_BINDINGS,
};

export const SETTINGS_STORAGE_KEY = "fe-portfolio-settings";

function isLanguage(value: unknown): value is LanguageId {
  return value === "en" || value === "tr";
}

function readBindings(raw: unknown): KeyBindings {
  const out: KeyBindings = {
    up: [...DEFAULT_BINDINGS.up],
    down: [...DEFAULT_BINDINGS.down],
    left: [...DEFAULT_BINDINGS.left],
    right: [...DEFAULT_BINDINGS.right],
    interact: [...DEFAULT_BINDINGS.interact],
  };
  if (!raw || typeof raw !== "object") return out;
  const source = raw as Record<string, unknown>;
  for (const action of ACTION_IDS) {
    const pair = source[action];
    if (!Array.isArray(pair)) continue;
    const primary = typeof pair[0] === "string" ? pair[0] : out[action][0];
    const alternate = typeof pair[1] === "string" ? pair[1] : null;
    out[action] = [primary, alternate];
  }
  return out;
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      volume:
        typeof parsed.volume === "number"
          ? Math.min(1, Math.max(0, parsed.volume))
          : DEFAULT_SETTINGS.volume,
      sfxEnabled:
        typeof parsed.sfxEnabled === "boolean"
          ? parsed.sfxEnabled
          : DEFAULT_SETTINGS.sfxEnabled,
      language: isLanguage(parsed.language)
        ? parsed.language
        : DEFAULT_SETTINGS.language,
      bindings: readBindings(parsed.bindings),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings) {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private mode: the choice just will not persist.
  }
}

/**
 * Assigns `code` to one slot, clearing it from wherever else it was bound so a
 * key never drives two actions at once.
 */
export function rebind(
  bindings: KeyBindings,
  action: ActionId,
  slot: 0 | 1,
  code: string,
): KeyBindings {
  const next: KeyBindings = { ...bindings };
  for (const other of ACTION_IDS) {
    const pair: [string, string | null] = [...bindings[other]];
    if (pair[0] === code) pair[0] = "";
    if (pair[1] === code) pair[1] = null;
    next[other] = pair;
  }
  const target: [string, string | null] = [...next[action]];
  target[slot] = code;
  // An action must keep at least one usable key in the primary slot.
  if (!target[0]) {
    target[0] = target[1] ?? code;
    if (slot === 1) target[1] = null;
  }
  next[action] = target;
  return next;
}

/** Human-readable label for a KeyboardEvent.code. */
export function keyLabel(code: string | null): string {
  if (!code) return "—";
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code.startsWith("Numpad")) return "Num " + code.slice(6);
  const named: Record<string, string> = {
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    Space: "Space",
    Enter: "Enter",
    ShiftLeft: "Shift",
    ShiftRight: "Shift",
    ControlLeft: "Ctrl",
    ControlRight: "Ctrl",
    AltLeft: "Alt",
    AltRight: "Alt",
    Tab: "Tab",
    Backquote: "`",
    Minus: "-",
    Equal: "=",
    Comma: ",",
    Period: ".",
    Slash: "/",
    Semicolon: ";",
    Quote: "'",
    BracketLeft: "[",
    BracketRight: "]",
    Backslash: "\\",
  };
  return named[code] ?? code;
}
