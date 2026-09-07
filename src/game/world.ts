import { LAYOUT } from "./layout";
import type { GameState, Interactable, Rect, Vec2 } from "./types";

/** Logical render resolution. The canvas is upscaled with nearest-neighbour. */
export const ROOM_W = 448;
export const ROOM_H = 256;

export const WALL = 16;
/** The back wall is taller so it reads as a wall, not a border. */
export const BACK_WALL = 32;

export const PLAYER_HALF_W = 5;
export const PLAYER_HALF_H = 4;
export const PLAYER_SPEED = 86;

/** How many species the display case has slots for. */
export const BUG_SPECIES = 5;
export const BALL_RADIUS = 5;

/* Positions all come from layout.ts, which the /editor page rewrites. */
export const SPAWN: Vec2 = LAYOUT.spawn;
export const BALL_SPAWN: Vec2 = LAYOUT.ballSpawn;
/** Rug marking the central area the player starts on. Not solid. */
export const RUG: Rect = LAYOUT.rug;
/** The wall-mounted screen, sitting above the dev station desk. */
export const TV: Rect = LAYOUT.tv;
export const FURNITURE = LAYOUT.furniture;
export const PLANT_POTS: readonly Rect[] = LAYOUT.plants;

/** The smallest box containing both rectangles. */
function union(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    w: Math.max(a.x + a.w, b.x + b.w) - x,
    h: Math.max(a.y + a.h, b.y + b.h) - y,
  };
}

/**
 * The dev station is two pieces, so its highlight and its reach cover both.
 * Derived rather than hand-written, so moving either one in the editor keeps up.
 */
const DEV_STATION_BOUNDS: Rect = union(FURNITURE.deskMonitor, TV);

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
