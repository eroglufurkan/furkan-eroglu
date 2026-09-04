import type { Interactable, Rect, Vec2 } from "./types";

/** Logical render resolution. The canvas is upscaled with nearest-neighbour. */
export const ROOM_W = 448;
export const ROOM_H = 256;

export const WALL = 16;
/** The back wall is taller so it reads as a wall, not a border. */
export const BACK_WALL = 32;

export const SPAWN: Vec2 = { x: 224, y: 172 };

/** Where the name/role card is anchored, in world units. */
export const TITLE_ANCHOR: Vec2 = { x: 224, y: 126 };

/** Rug marking the central area the player starts on. Not solid. */
export const RUG: Rect = { x: 176, y: 132, w: 96, h: 62 };

export const PLAYER_HALF_W = 5;
export const PLAYER_HALF_H = 4;
export const PLAYER_SPEED = 86;

export const FURNITURE = {
  deskLaptop: { x: 52, y: 34, w: 84, h: 28 } as Rect,
  deskMonitor: { x: 300, y: 34, w: 88, h: 28 } as Rect,
  serverRack: { x: 16, y: 92, w: 28, h: 80 } as Rect,
  workbench: { x: 76, y: 188, w: 116, h: 30 } as Rect,
  crates: { x: 376, y: 190, w: 44, h: 46 } as Rect,
  door: { x: 430, y: 100, w: 18, h: 58 } as Rect,
};

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
];

export const INTERACTABLES: readonly Interactable[] = [
  {
    id: "laptop",
    name: "Laptop",
    verb: "Inspect",
    focus: { x: 94, y: 72 },
    promptAt: { x: 94, y: 30 },
    radius: 34,
    panel: "moriqa",
    bounds: FURNITURE.deskLaptop,
  },
  {
    id: "monitor",
    name: "Dev Station",
    verb: "Inspect",
    focus: { x: 344, y: 72 },
    promptAt: { x: 344, y: 30 },
    radius: 34,
    panel: "coop-horror",
    bounds: FURNITURE.deskMonitor,
  },
  {
    id: "workbench",
    name: "Workbench",
    verb: "Inspect",
    focus: { x: 134, y: 180 },
    promptAt: { x: 134, y: 154 },
    radius: 34,
    panel: "skills",
    bounds: FURNITURE.workbench,
  },
  {
    id: "door",
    name: "Door",
    verb: "Open",
    focus: { x: 414, y: 128 },
    promptAt: { x: 408, y: 94 },
    radius: 34,
    panel: "contact",
    bounds: FURNITURE.door,
  },
];

export type Light = {
  pos: Vec2;
  radius: number;
  /** [r, g, b] of the additive tint. */
  color: [number, number, number];
  intensity: number;
  /** 0 = steady, higher = more restless. */
  flicker: number;
};

export const LIGHTS: readonly Light[] = [
  // Desk lamp over the laptop.
  { pos: { x: 106, y: 62 }, radius: 108, color: [255, 176, 96], intensity: 1, flicker: 0.06 },
  // Monitor glow.
  { pos: { x: 344, y: 58 }, radius: 100, color: [128, 196, 224], intensity: 0.95, flicker: 0.12 },
  // Server rack LEDs.
  { pos: { x: 34, y: 130 }, radius: 62, color: [120, 220, 150], intensity: 0.7, flicker: 0.2 },
  // Light bleeding around the door.
  { pos: { x: 428, y: 128 }, radius: 78, color: [200, 214, 224], intensity: 0.85, flicker: 0.03 },
  // Bench lamp.
  { pos: { x: 96, y: 190 }, radius: 82, color: [255, 168, 104], intensity: 0.8, flicker: 0.05 },
  // Ceiling lamp over the central area.
  { pos: { x: 224, y: 156 }, radius: 100, color: [226, 206, 176], intensity: 0.9, flicker: 0.09 },
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
