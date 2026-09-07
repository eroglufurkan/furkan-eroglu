import type { Rect, Vec2 } from "./types";

/**
 * Where everything sits in the room, in the 448x256 logical grid.
 *
 * This is kept apart from the rest of `world.ts` on purpose: the editor at
 * /editor rewrites this whole file, so it holds plain data and nothing else.
 * Anything derived — solids, interaction boxes, prompt anchors — is computed
 * from these values in `world.ts`.
 */
export type RoomLayout = {
  /** Where the character stands when the room opens. */
  spawn: Vec2;
  /** Where the ball starts, and where its reset button sends it back to. */
  ballSpawn: Vec2;
  /** The rug in the middle. Walkable, so not a solid. */
  rug: Rect;
  /** The wall-mounted screen above the dev station desk. */
  tv: Rect;
  furniture: {
    deskLaptop: Rect;
    deskMonitor: Rect;
    serverRack: Rect;
    workbench: Rect;
    crates: Rect;
    door: Rect;
    cooler: Rect;
    bugCase: Rect;
    /** Mounted on the back wall, so it sits inside the wall's own solid. */
    lightSwitch: Rect;
  };
  plants: Rect[];
};

export const LAYOUT: RoomLayout = {
  spawn: { x: 224, y: 168 },
  ballSpawn: { x: 296, y: 148 },
  rug: { x: 176, y: 132, w: 96, h: 62 },
  tv: { x: 322, y: 8, w: 44, h: 28 },
  furniture: {
    deskLaptop: { x: 52, y: 34, w: 84, h: 28 },
    deskMonitor: { x: 300, y: 34, w: 88, h: 28 },
    serverRack: { x: 16, y: 92, w: 28, h: 80 },
    workbench: { x: 76, y: 194, w: 116, h: 32 },
    crates: { x: 376, y: 190, w: 44, h: 46 },
    door: { x: 430, y: 100, w: 18, h: 58 },
    cooler: { x: 202, y: 36, w: 22, h: 30 },
    bugCase: { x: 148, y: 36, w: 32, h: 26 },
    lightSwitch: { x: 410, y: 14, w: 12, h: 14 },
  },
  plants: [
    { x: 236, y: 200, w: 18, h: 20 },
    { x: 20, y: 200, w: 18, h: 20 },
    { x: 332, y: 196, w: 18, h: 20 },
  ],
};
