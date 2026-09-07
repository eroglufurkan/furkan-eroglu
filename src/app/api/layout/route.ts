import { writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import type { RoomLayout } from "@/game/layout";
import { ROOM_H, ROOM_W } from "@/game/world";

/**
 * Writes the room layout back to src/game/layout.ts for the editor at /editor.
 *
 * Development only — in a production build the route answers 404, so a deployed
 * site has no way to rewrite its own source.
 */

const isDev = process.env.NODE_ENV === "development";

type Rect = { x: number; y: number; w: number; h: number };
type Vec2 = { x: number; y: number };

function num(value: unknown, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("expected a finite number");
  }
  return Math.round(Math.min(max, Math.max(min, value)));
}

function vec(value: unknown): Vec2 {
  const v = value as Vec2;
  return { x: num(v?.x, 0, ROOM_W), y: num(v?.y, 0, ROOM_H) };
}

function rect(value: unknown): Rect {
  const r = value as Rect;
  return {
    x: num(r?.x, -32, ROOM_W),
    y: num(r?.y, -32, ROOM_H),
    w: num(r?.w, 2, ROOM_W),
    h: num(r?.h, 2, ROOM_H),
  };
}

const FURNITURE_KEYS = [
  "deskLaptop",
  "deskMonitor",
  "serverRack",
  "workbench",
  "crates",
  "door",
  "cooler",
  "bugCase",
  "lightSwitch",
] as const;

/** Rebuilds the whole module, so nothing depends on matching the old text. */
function render(layout: RoomLayout): string {
  const v = (p: Vec2) => `{ x: ${p.x}, y: ${p.y} }`;
  const r = (b: Rect) => `{ x: ${b.x}, y: ${b.y}, w: ${b.w}, h: ${b.h} }`;

  return `import type { Rect, Vec2 } from "./types";

/**
 * Where everything sits in the room, in the 448x256 logical grid.
 *
 * This is kept apart from the rest of \`world.ts\` on purpose: the editor at
 * /editor rewrites this whole file, so it holds plain data and nothing else.
 * Anything derived — solids, interaction boxes, prompt anchors — is computed
 * from these values in \`world.ts\`.
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
${FURNITURE_KEYS.map((k) =>
  k === "lightSwitch"
    ? "    /** Mounted on the back wall, so it sits inside the wall's own solid. */\n    lightSwitch: Rect;"
    : `    ${k}: Rect;`,
).join("\n")}
  };
  plants: Rect[];
};

export const LAYOUT: RoomLayout = {
  spawn: ${v(layout.spawn)},
  ballSpawn: ${v(layout.ballSpawn)},
  rug: ${r(layout.rug)},
  tv: ${r(layout.tv)},
  furniture: {
${FURNITURE_KEYS.map((k) => `    ${k}: ${r(layout.furniture[k])},`).join("\n")}
  },
  plants: [
${layout.plants.map((p) => `    ${r(p)},`).join("\n")}
  ],
};
`;
}

export async function POST(request: Request) {
  if (!isDev) return new NextResponse("Not found", { status: 404 });

  try {
    const body = (await request.json()) as RoomLayout;

    const layout: RoomLayout = {
      spawn: vec(body.spawn),
      ballSpawn: vec(body.ballSpawn),
      rug: rect(body.rug),
      tv: rect(body.tv),
      furniture: Object.fromEntries(
        FURNITURE_KEYS.map((k) => [k, rect(body.furniture?.[k])]),
      ) as RoomLayout["furniture"],
      plants: (Array.isArray(body.plants) ? body.plants : []).map(rect),
    };

    if (layout.plants.length === 0) {
      return NextResponse.json({ error: "need at least one plant" }, { status: 400 });
    }

    const file = path.join(process.cwd(), "src", "game", "layout.ts");
    await writeFile(file, render(layout), "utf8");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "bad layout" },
      { status: 400 },
    );
  }
}
