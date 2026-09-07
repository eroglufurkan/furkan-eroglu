import type { Vec2 } from "./types";

export type ThemeId = "dark" | "bright";

export const THEME_IDS: readonly ThemeId[] = ["dark", "bright"];

export type Light = {
  pos: Vec2;
  radius: number;
  /** [r, g, b] of the additive tint. */
  color: [number, number, number];
  intensity: number;
  /** 0 = steady, higher = more restless. */
  flicker: number;
};

/** One emissive rectangle drawn after the shadow pass, so it always glows. */
export type Emissive = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  /** Seconds per blink cycle. Omit for a steady light. */
  blink?: number;
};

/**
 * Every colour the room is drawn with. Both themes fill in the same tokens, so
 * `render.ts` never hardcodes a colour and a new theme is just another object.
 */
export type RoomPalette = {
  /* floor */
  floor: string;
  floorAlt: string;
  floorLine: string;
  floorScuff: string;
  drainOuter: string;
  drainInner: string;
  drainSlat: string;
  damp: string;
  rug: string;
  rugDark: string;
  rugEdge: string;

  /* walls */
  wallTop: string;
  wallBottom: string;
  wallSeam: string;
  wallEdge: string;
  wallStain: string;
  pipeHi: string;
  pipeMid: string;
  pipeLo: string;
  pipeBracket: string;
  ventFrame: string;
  ventInner: string;
  ventSlat: string;
  skirting: string;
  skirtingHi: string;
  sideWall: string;
  sideWallEdge: string;

  /* shared furniture */
  outline: string;
  legShadow: string;
  wood: string;
  woodDark: string;
  woodLight: string;
  metal: string;
  metalDark: string;
  metalLight: string;

  /* laptop desk */
  laptopBody: string;
  laptopKeys: string;
  laptopLid: string;
  mug: string;
  mugHi: string;
  book: string;
  bookHi: string;
  pen: string;
  lampShade: string;
  chair: string;
  chairHi: string;

  /* dev station */
  monitorBody: string;
  monitorGlass: string;
  monitorNeck: string;
  devkit: string;
  devkitTrim: string;
  padBody: string;
  padButton: string;
  cable: string;

  /* server rack */
  rackInner: string;
  rackBlade: string;
  rackBladeHi: string;
  rackSlat: string;

  /* workbench */
  bench: string;
  benchDark: string;
  benchTopHi: string;
  viceJaw: string;
  toolSteel: string;
  toolSteelHi: string;
  toolDark: string;
  toolWood: string;
  bolt: string;
  toolbox: string;

  /* crates */
  crate: string;
  crateHi: string;
  crateInner: string;
  crateBrace: string;

  /* door */
  doorFrameShadow: string;
  doorPanel: string;
  doorBrace: string;
  doorBraceMid: string;
  handleBase: string;
  handle: string;

  /* character */
  coat: string;
  coatDark: string;
  coatLight: string;
  hood: string;
  hoodLight: string;
  boot: string;
  scarf: string;
  eye: string;
  contactShadow: string;
  contactShadowAlpha: number;

  /* props */
  coolerBody: string;
  coolerTank: string;
  coolerWater: string;
  coolerTap: string;
  caseFrame: string;
  caseGlass: string;
  caseFelt: string;
  switchPlate: string;
  switchToggle: string;
  switchToggleOff: string;
  pot: string;
  potRim: string;
  soil: string;
  leafDry: string;
  leafHealthy: string;
  leafHi: string;
  bloom: string;
  ballA: string;
  ballB: string;
  ballOutline: string;
  cupBody: string;
  cupWater: string;
  bugOutline: string;
  /** The bobbing chevron that points at an unopened portfolio piece. */
  marker: string;
  markerEdge: string;
  /** One colour per collectable species. */
  bugColors: readonly string[];
};

/** Everything about how the room is lit and graded. */
export type RoomAtmosphere = {
  /** Colour of the darkness layer laid over the scene. */
  shadowColor: string;
  /** How much of that layer lands, 0..1. */
  shadowAlpha: number;
  /** Peak alpha of the additive colour poured back into each light. */
  additive: number;
  playerLight: { radius: number; strength: number };
  vignette: { color: string; alpha: number };
  grainAlpha: number;
  motes: { color: string; alpha: number };
  focusStroke: string;
};

export type RoomTheme = {
  id: ThemeId;
  /** Shown on the theme toggle. */
  label: string;
  palette: RoomPalette;
  atmosphere: RoomAtmosphere;
  lights: readonly Light[];
  emissive: readonly Emissive[];
  /** Server rack blinkenlights, alternating between the two. */
  rackLeds: [string, string];
  scanline: string;
  doorSeam: string;
};

/* ------------------------------------------------------------------ */
/* dark — the original room                                            */
/* ------------------------------------------------------------------ */

const DARK: RoomTheme = {
  id: "dark",
  label: "Dark",
  palette: {
    floor: "#2a2f37",
    floorAlt: "#31373f",
    floorLine: "#1b1f25",
    floorScuff: "#3a4049",
    drainOuter: "#1d2028",
    drainInner: "#121619",
    drainSlat: "#2b3138",
    damp: "#151a20",
    rug: "#4a2a26",
    rugDark: "#311c1a",
    rugEdge: "#5f382f",

    wallTop: "#454c56",
    wallBottom: "#2f353d",
    wallSeam: "#1e2229",
    wallEdge: "#525a65",
    wallStain: "#4c535e",
    pipeHi: "#687380",
    pipeMid: "#444c56",
    pipeLo: "#24282d",
    pipeBracket: "#75808e",
    ventFrame: "#2f343d",
    ventInner: "#1d2026",
    ventSlat: "#434a56",
    skirting: "#191d23",
    skirtingHi: "#4c535e",
    sideWall: "#171a1f",
    sideWallEdge: "#333a43",

    outline: "#12151a",
    legShadow: "#191d22",
    wood: "#5b4733",
    woodDark: "#33271b",
    woodLight: "#6f5740",
    metal: "#464d57",
    metalDark: "#272c33",
    metalLight: "#5d656f",

    laptopBody: "#3f444d",
    laptopKeys: "#535a68",
    laptopLid: "#2d323a",
    mug: "#857365",
    mugHi: "#a28c7a",
    book: "#4d4d5c",
    bookHi: "#68687a",
    pen: "#858597",
    lampShade: "#6c7583",
    chair: "#3d434c",
    chairHi: "#4f5665",

    monitorBody: "#414856",
    monitorGlass: "#171d24",
    monitorNeck: "#323a46",
    devkit: "#363b46",
    devkitTrim: "#4f5665",
    padBody: "#444c58",
    padButton: "#282f38",
    cable: "#1d2229",

    rackInner: "#323a44",
    rackBlade: "#434c58",
    rackBladeHi: "#586170",
    rackSlat: "#242931",

    bench: "#6b5236",
    benchDark: "#3b2c1c",
    benchTopHi: "#a47e56",
    viceJaw: "#3a414c",
    toolSteel: "#9ba6b4",
    toolSteelHi: "#bfcada",
    toolDark: "#87929e",
    toolWood: "#dc8e4c",
    bolt: "#6e7783",
    toolbox: "#4f5665",

    crate: "#6a5134",
    crateHi: "#8b6a44",
    crateInner: "#5c442b",
    crateBrace: "#795534",

    doorFrameShadow: "#262b32",
    doorPanel: "#413426",
    doorBrace: "#68553b",
    doorBraceMid: "#55442f",
    handleBase: "#3a414c",
    handle: "#c1cbd8",

    coat: "#4d5668",
    coatDark: "#353c49",
    coatLight: "#6d7a90",
    hood: "#414958",
    hoodLight: "#5f6b80",
    boot: "#1a1e26",
    scarf: "#8a4f38",
    eye: "#c9b79a",
    contactShadow: "#000000",
    contactShadowAlpha: 0.45,

    coolerBody: "#5d656f",
    coolerTank: "#9fd8e8",
    coolerWater: "#5fb8d8",
    coolerTap: "#3a414c",
    caseFrame: "#5b4733",
    caseGlass: "#8fb0c0",
    caseFelt: "#2b2f38",
    switchPlate: "#c9cfd8",
    switchToggle: "#ffcf6a",
    switchToggleOff: "#4a515c",
    pot: "#8a5a3a",
    potRim: "#a86f48",
    soil: "#3a2a1c",
    leafDry: "#6b6a3a",
    leafHealthy: "#4e9a52",
    leafHi: "#78c46a",
    bloom: "#e0698a",
    ballA: "#d8524a",
    ballB: "#f0f0e8",
    ballOutline: "#2a1614",
    cupBody: "#dfe6ee",
    cupWater: "#63c4e8",
    bugOutline: "#12151a",
    marker: "#ff8c42",
    markerEdge: "#5c2a0a",
    bugColors: ["#e0c24a", "#6fd88a", "#e07a4a", "#7aa8f0", "#c98ae0"],
  },
  atmosphere: {
    shadowColor: "#05070d",
    shadowAlpha: 0.9,
    additive: 0.22,
    playerLight: { radius: 58, strength: 0.62 },
    vignette: { color: "0,0,0", alpha: 0.42 },
    grainAlpha: 0.04,
    motes: { color: "#cfd6e0", alpha: 0.09 },
    focusStroke: "#e6d9bd",
  },
  lights: [
    { pos: { x: 106, y: 62 }, radius: 108, color: [255, 176, 96], intensity: 1, flicker: 0.06 },
    { pos: { x: 344, y: 40 }, radius: 100, color: [128, 196, 224], intensity: 0.95, flicker: 0.12 },
    { pos: { x: 34, y: 130 }, radius: 62, color: [120, 220, 150], intensity: 0.7, flicker: 0.2 },
    { pos: { x: 428, y: 128 }, radius: 78, color: [200, 214, 224], intensity: 0.85, flicker: 0.03 },
    { pos: { x: 96, y: 190 }, radius: 82, color: [255, 168, 104], intensity: 0.8, flicker: 0.05 },
    { pos: { x: 224, y: 156 }, radius: 100, color: [226, 206, 176], intensity: 0.9, flicker: 0.09 },
    { pos: { x: 213, y: 54 }, radius: 48, color: [130, 210, 235], intensity: 0.5, flicker: 0.02 },
  ],
  emissive: [
    { x: 81, y: 36, w: 26, h: 5, color: "#7fd0e8" },
    { x: 326, y: 12, w: 36, h: 18, color: "#4d84a6" },
    { x: 384, y: 45, w: 2, h: 2, color: "#c8f0a0", blink: 2.4 },
    { x: 89, y: 183, w: 6, h: 2, color: "#ffcf8f" },
    { x: 60, y: 31, w: 8, h: 2, color: "#ffbe74" },
    { x: 204, y: 42, w: 2, h: 2, color: "#8fe4ff" },
  ],
  rackLeds: ["#ffcf6a", "#7ce89a"],
  scanline: "#dff2ff",
  doorSeam: "#cfe0ea",
};

/* ------------------------------------------------------------------ */
/* bright — the same room at midday, repainted                         */
/* ------------------------------------------------------------------ */

const BRIGHT: RoomTheme = {
  id: "bright",
  label: "Bright",
  palette: {
    floor: "#cdbb9a",
    floorAlt: "#d9c8a8",
    floorLine: "#a48e6c",
    floorScuff: "#bcaa87",
    drainOuter: "#b6a382",
    drainInner: "#8a7a5e",
    drainSlat: "#d3c3a2",
    damp: "#8fb4c8",
    rug: "#37a89b",
    rugDark: "#23796f",
    rugEdge: "#6fd8c8",

    wallTop: "#fdf1d8",
    wallBottom: "#efdcb8",
    wallSeam: "#d3bd97",
    wallEdge: "#fffaf0",
    wallStain: "#e6d3ad",
    pipeHi: "#f4bd84",
    pipeMid: "#d68f4f",
    pipeLo: "#9c5f2c",
    pipeBracket: "#ffd7a8",
    ventFrame: "#c4a97f",
    ventInner: "#9a8055",
    ventSlat: "#eddab6",
    skirting: "#b98a55",
    skirtingHi: "#e8cfa4",
    sideWall: "#a8794a",
    sideWallEdge: "#dcb987",

    outline: "#59422a",
    legShadow: "#8a6136",
    wood: "#cf9350",
    woodDark: "#96602c",
    woodLight: "#ecb87a",
    metal: "#a9bccd",
    metalDark: "#6f889d",
    metalLight: "#dcecf7",

    laptopBody: "#8496a8",
    laptopKeys: "#c3d2e0",
    laptopLid: "#63758a",
    mug: "#e2604a",
    mugHi: "#ff9077",
    book: "#5fae7a",
    bookHi: "#96dba7",
    pen: "#ffd166",
    lampShade: "#ffb84d",
    chair: "#4f7fbd",
    chairHi: "#84b0e6",

    monitorBody: "#93a6ba",
    monitorGlass: "#2f465c",
    monitorNeck: "#74889d",
    devkit: "#7d6fb0",
    devkitTrim: "#bcaee8",
    padBody: "#66788b",
    padButton: "#3a4a5c",
    cable: "#8a6f4e",

    rackInner: "#74889d",
    rackBlade: "#98adc1",
    rackBladeHi: "#cfe0ee",
    rackSlat: "#556a7e",

    bench: "#d69a55",
    benchDark: "#9a6229",
    benchTopHi: "#f4c489",
    viceJaw: "#74889d",
    toolSteel: "#bfcedd",
    toolSteelHi: "#ecf4fb",
    toolDark: "#93a6ba",
    toolWood: "#e08a3c",
    bolt: "#8496a8",
    toolbox: "#d95c4a",

    crate: "#e0ab63",
    crateHi: "#f7cd8f",
    crateInner: "#c8934e",
    crateBrace: "#a86f34",

    doorFrameShadow: "#8a6136",
    doorPanel: "#3fa8c9",
    doorBrace: "#7fdcf0",
    doorBraceMid: "#2f8ba8",
    handleBase: "#74889d",
    handle: "#ffe08a",

    coat: "#4185d6",
    coatDark: "#2e63a6",
    coatLight: "#79b2f2",
    hood: "#2e63a6",
    hoodLight: "#79b2f2",
    boot: "#2a3550",
    scarf: "#e8543f",
    eye: "#fff0d4",
    contactShadow: "#5a4326",
    contactShadowAlpha: 0.3,

    coolerBody: "#dcecf7",
    coolerTank: "#8fd8f0",
    coolerWater: "#3fb0d8",
    coolerTap: "#74889d",
    caseFrame: "#a8703c",
    caseGlass: "#8a6238",
    caseFelt: "#e6cfa4",
    switchPlate: "#fffaf0",
    switchToggle: "#e08a1f",
    switchToggleOff: "#a98f63",
    pot: "#c96f42",
    potRim: "#e89060",
    soil: "#6b4a2e",
    leafDry: "#a8a052",
    leafHealthy: "#3f9a4a",
    leafHi: "#6fd06a",
    bloom: "#e0567f",
    ballA: "#e0453c",
    ballB: "#fffaf0",
    ballOutline: "#59422a",
    cupBody: "#ffffff",
    cupWater: "#3fb0d8",
    bugOutline: "#59422a",
    marker: "#ea580c",
    markerEdge: "#fff6e6",
    bugColors: ["#c9982a", "#2f9c5a", "#d9642a", "#3f7fd0", "#9a4fc0"],
  },
  atmosphere: {
    // Barely any darkness: the pools of light are colour, not visibility.
    shadowColor: "#4a5f88",
    shadowAlpha: 0.28,
    additive: 0.08,
    playerLight: { radius: 44, strength: 0.35 },
    vignette: { color: "94,62,24", alpha: 0.16 },
    grainAlpha: 0.02,
    motes: { color: "#fff6dc", alpha: 0.24 },
    focusStroke: "#3b2a16",
  },
  lights: [
    { pos: { x: 106, y: 62 }, radius: 116, color: [255, 214, 140], intensity: 1, flicker: 0.03 },
    { pos: { x: 344, y: 40 }, radius: 106, color: [150, 220, 255], intensity: 0.85, flicker: 0.06 },
    { pos: { x: 34, y: 130 }, radius: 66, color: [140, 255, 190], intensity: 0.65, flicker: 0.12 },
    { pos: { x: 428, y: 128 }, radius: 96, color: [170, 236, 255], intensity: 0.95, flicker: 0.02 },
    { pos: { x: 96, y: 190 }, radius: 90, color: [255, 206, 150], intensity: 0.75, flicker: 0.03 },
    { pos: { x: 224, y: 156 }, radius: 124, color: [255, 244, 214], intensity: 0.85, flicker: 0.03 },
    { pos: { x: 213, y: 54 }, radius: 44, color: [150, 225, 245], intensity: 0.4, flicker: 0.02 },
  ],
  emissive: [
    { x: 81, y: 36, w: 26, h: 5, color: "#3fd0f0" },
    { x: 326, y: 12, w: 36, h: 18, color: "#2f9fd8" },
    { x: 384, y: 45, w: 2, h: 2, color: "#63e87f", blink: 2.4 },
    { x: 89, y: 183, w: 6, h: 2, color: "#fff0b0" },
    { x: 60, y: 31, w: 8, h: 2, color: "#ffe08a" },
    { x: 204, y: 42, w: 2, h: 2, color: "#2fa8d8" },
  ],
  rackLeds: ["#ff9a3c", "#2fd06f"],
  scanline: "#ffffff",
  doorSeam: "#ffffff",
};

export const THEMES: Record<ThemeId, RoomTheme> = { dark: DARK, bright: BRIGHT };

export const DEFAULT_THEME: ThemeId = "bright";

/** Shared by the no-flash inline script and the React state, so they agree. */
export const THEME_STORAGE_KEY = "fe-portfolio-theme";

export function isThemeId(value: unknown): value is ThemeId {
  return value === "dark" || value === "bright";
}
