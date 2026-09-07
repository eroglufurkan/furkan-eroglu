import type { GameState, Interactable, Rect, Vec2 } from "./types";

/** Logical render resolution. The canvas is upscaled with nearest-neighbour. */
export const ROOM_W = 448;
export const ROOM_H = 256;

export const WALL = 16;
/** The back wall is taller so it reads as a wall, not a border. */
export const BACK_WALL = 32;

export const SPAWN: Vec2 = { x: 224, y: 168 };

/** Rug marking the central area the player starts on. Not solid. */
export const RUG: Rect = { x: 176, y: 132, w: 96, h: 62 };

export const PLAYER_HALF_W = 5;
export const PLAYER_HALF_H = 4;
export const PLAYER_SPEED = 86;

/** How many species the display case has slots for. */
export const BUG_SPECIES = 5;

export const BALL_SPAWN: Vec2 = { x: 296, y: 148 };
export const BALL_RADIUS = 5;

export const FURNITURE = {
  deskLaptop: { x: 52, y: 34, w: 84, h: 28 } as Rect,
  deskMonitor: { x: 300, y: 34, w: 88, h: 28 } as Rect,
  serverRack: { x: 16, y: 92, w: 28, h: 80 } as Rect,
  workbench: { x: 76, y: 194, w: 116, h: 32 } as Rect,
  crates: { x: 376, y: 190, w: 44, h: 46 } as Rect,
  door: { x: 430, y: 100, w: 18, h: 58 } as Rect,
  cooler: { x: 202, y: 36, w: 22, h: 30 } as Rect,
  bugCase: { x: 148, y: 36, w: 32, h: 26 } as Rect,
  /** Mounted on the back wall, so it is inside the wall's own solid. */
  lightSwitch: { x: 410, y: 14, w: 12, h: 14 } as Rect,
};

/** The wall-mounted screen, moved up off the desk. */
export const TV: Rect = { x: 322, y: 8, w: 44, h: 28 };
/** Highlight box for the dev station: the screen and the desk together. */
const DEV_STATION_BOUNDS: Rect = { x: 300, y: 8, w: 88, h: 54 };

export const PLANT_POTS: readonly Rect[] = [
  { x: 236, y: 200, w: 18, h: 20 },
  { x: 20, y: 200, w: 18, h: 20 },
  { x: 332, y: 196, w: 18, h: 20 },
];

/** Everything the player cannot walk through. */
export const SOLIDS: readonly Rect[] = [
  { x: 0, y: 0, w: ROOM_W, h: BACK_WALL },
  { x: 0, y: 0, w: WALL, h: ROOM_H },
  { x: ROOM_W - WALL, y: 0, w: WALL, h: ROOM_H },
  { x: 0, y: ROOM_H - WALL, w: ROOM_W, h: WALL },
  FURNITURE.deskLaptop,
  FURNITURE.deskMonitor,
  FURNITURE.serverRack,
  FURNITURE.workbench,
  FURNITURE.crates,
  FURNITURE.cooler,
  FURNITURE.bugCase,
  ...PLANT_POTS,
];

const REACH = 22;

export const INTERACTABLES: readonly Interactable[] = [
  {
    id: "laptop",
    nameKey: "nameLaptop",
    verbKey: "verbInspect",
    promptAt: { x: 94, y: 30 },
    reach: REACH,
    guide: true,
    action: { type: "panel", panel: "moriqa" },
    bounds: FURNITURE.deskLaptop,
  },
  {
    id: "monitor",
    nameKey: "nameDevStation",
    verbKey: "verbInspect",
    promptAt: { x: 344, y: 74 },
    reach: REACH,
    guide: true,
    action: { type: "panel", panel: "coop-horror" },
    bounds: DEV_STATION_BOUNDS,
  },
  {
    id: "workbench",
    nameKey: "nameWorkbench",
    verbKey: "verbInspect",
    promptAt: { x: 134, y: 186 },
    reach: REACH,
    guide: true,
    action: { type: "panel", panel: "skills" },
    bounds: FURNITURE.workbench,
  },
  {
    id: "door",
    nameKey: "nameDoor",
    verbKey: "verbOpen",
    promptAt: { x: 408, y: 94 },
    reach: REACH,
    guide: true,
    action: { type: "panel", panel: "contact" },
    bounds: FURNITURE.door,
  },
  {
    id: "server",
    nameKey: "nameServer",
    verbKey: "verbAdjust",
    promptAt: { x: 60, y: 88 },
    reach: REACH,
    action: { type: "panel", panel: "settings" },
    bounds: FURNITURE.serverRack,
  },
  {
    id: "cooler",
    nameKey: "nameCooler",
    verbKey: "verbTakeWater",
    promptAt: { x: 213, y: 32 },
    reach: REACH,
    hold: 3,
    action: { type: "takeWater" },
    bounds: FURNITURE.cooler,
    // Nothing to do here while already holding a cup.
    enabled: (s) => !s.player.carryingWater,
  },
  {
    id: "bugCase",
    nameKey: "nameCase",
    verbKey: "verbViewCollection",
    promptAt: { x: 164, y: 30 },
    reach: REACH,
    action: { type: "panel", panel: "collection" },
    bounds: FURNITURE.bugCase,
  },
  {
    id: "lightSwitch",
    nameKey: "nameSwitch",
    verbKey: "verbLightsOff",
    promptAt: { x: 408, y: 74 },
    reach: REACH,
    action: { type: "toggleLight" },
    bounds: FURNITURE.lightSwitch,
    resolveVerb: (s) => (s.lightsOn ? "verbLightsOff" : "verbLightsOn"),
  },
  ...PLANT_POTS.map((pot, index): Interactable => ({
    id: "plant" + index,
    nameKey: "namePlant",
    verbKey: "verbWater",
    promptAt: { x: pot.x + pot.w / 2, y: pot.y + pot.h + 18 },
    reach: REACH,
    hold: 3,
    action: { type: "waterPlant", plant: index },
    bounds: pot,
    enabled: (s) => !s.plants[index].watered,
    resolveVerb: (s) => (s.player.carryingWater ? "verbWater" : "verbNeedsWater"),
  })),
];

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

export function playerBox(pos: Vec2): Rect {
  return {
    x: pos.x - PLAYER_HALF_W,
    y: pos.y - PLAYER_HALF_H,
    w: PLAYER_HALF_W * 2,
    h: PLAYER_HALF_H * 2,
  };
}

export function pointInRect(p: Vec2, r: Rect): boolean {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

/**
 * Distance from a point to a rectangle, 0 when inside. Measuring against the
 * whole box — rather than one hand-placed spot — is what makes objects
 * reachable from below as well as from above.
 */
export function distanceToRect(p: Vec2, r: Rect): number {
  const dx = Math.max(r.x - p.x, 0, p.x - (r.x + r.w));
  const dy = Math.max(r.y - p.y, 0, p.y - (r.y + r.h));
  return Math.hypot(dx, dy);
}

export function isSolidAt(box: Rect): boolean {
  for (const solid of SOLIDS) {
    if (rectsOverlap(box, solid)) return true;
  }
  return false;
}

/** Interior the player, the ball and the bugs are allowed to occupy. */
export const FLOOR: Rect = {
  x: WALL,
  y: BACK_WALL,
  w: ROOM_W - WALL * 2,
  h: ROOM_H - WALL - BACK_WALL,
};

/** Picks a spot on open floor, clear of furniture and of the player. */
export function randomFreeSpot(
  state: GameState,
  margin: number,
  rng: () => number,
): Vec2 | null {
  for (let attempt = 0; attempt < 40; attempt++) {
    const p = {
      x: FLOOR.x + margin + rng() * (FLOOR.w - margin * 2),
      y: FLOOR.y + margin + rng() * (FLOOR.h - margin * 2),
    };
    const box = {
      x: p.x - margin,
      y: p.y - margin,
      w: margin * 2,
      h: margin * 2,
    };
    if (isSolidAt(box)) continue;
    if (Math.hypot(p.x - state.player.pos.x, p.y - state.player.pos.y) < 40) continue;
    return p;
  }
  return null;
}

/** How many guided objects a visitor is being pointed at. */
export const GUIDE_TOTAL = INTERACTABLES.filter((i) => i.guide).length;
