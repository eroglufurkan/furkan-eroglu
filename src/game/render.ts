import type { GameState, Rect } from "./types";
import {
  BACK_WALL,
  FURNITURE,
  LIGHTS,
  ROOM_H,
  ROOM_W,
  RUG,
  WALL,
} from "./world";

/* ------------------------------------------------------------------ */
/* palette                                                             */
/* ------------------------------------------------------------------ */

/**
 * Colours are authored as if the room were fully lit. The shadow pass is what
 * makes it dark, so keeping these mid-tone leaves the lit pools readable.
 */
const C = {
  floor: "#2a2f37",
  floorAlt: "#31373f",
  floorLine: "#1b1f25",
  floorScuff: "#3a4049",
  wallTop: "#454c56",
  wallBottom: "#2f353d",
  wallSeam: "#1e2229",
  wallEdge: "#525a65",
  skirting: "#191d23",
  sideWall: "#171a1f",
  sideWallEdge: "#333a43",
  wood: "#5b4733",
  woodDark: "#33271b",
  woodLight: "#6f5740",
  bench: "#6b5236",
  benchDark: "#3b2c1c",
  metal: "#464d57",
  metalDark: "#272c33",
  metalLight: "#5d656f",
  rug: "#4a2a26",
  rugDark: "#311c1a",
  rugEdge: "#5f382f",
  outline: "#12151a",
} as const;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/* ------------------------------------------------------------------ */
/* static layers                                                       */
/* ------------------------------------------------------------------ */

function makeLayer() {
  const c = document.createElement("canvas");
  c.width = ROOM_W;
  c.height = ROOM_H;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

function drawFloor(ctx: CanvasRenderingContext2D) {
  const rnd = mulberry32(1337);
  px(ctx, 0, 0, ROOM_W, ROOM_H, C.floor);

  // Large floor slabs, checkerboarded with two near-identical tones.
  for (let y = BACK_WALL; y < ROOM_H - WALL; y += 32) {
    for (let x = WALL; x < ROOM_W - WALL; x += 32) {
      if (((x / 32) | 0) % 2 === ((y / 32) | 0) % 2) {
        px(ctx, x, y, 32, 32, C.floorAlt);
      }
    }
  }

  ctx.fillStyle = C.floorLine;
  for (let x = WALL; x <= ROOM_W - WALL; x += 32) {
    ctx.fillRect(x, BACK_WALL, 1, ROOM_H - WALL - BACK_WALL);
  }
  for (let y = BACK_WALL; y <= ROOM_H - WALL; y += 32) {
    ctx.fillRect(WALL, y, ROOM_W - WALL * 2, 1);
  }

  // Grime and wear.
  for (let i = 0; i < 70; i++) {
    const x = WALL + rnd() * (ROOM_W - WALL * 2);
    const y = BACK_WALL + rnd() * (ROOM_H - WALL - BACK_WALL);
    px(ctx, x, y, 2 + rnd() * 14, 1 + rnd() * 2, rnd() > 0.55 ? C.floorScuff : C.floorLine);
  }

  // Floor drain.
  const dx = 300;
  const dy = 218;
  px(ctx, dx - 6, dy - 6, 12, 12, "#1d2028");
  px(ctx, dx - 5, dy - 5, 10, 10, "#121619");
  ctx.fillStyle = "#2b3138";
  for (let i = 0; i < 4; i++) ctx.fillRect(dx - 4, dy - 4 + i * 3, 8, 1);

  // Hazard stripes painted in front of the door.
  for (let i = 0; i < 9; i++) {
    const sx = 384 + i * 5;
    ctx.fillStyle = i % 2 === 0 ? "#6a5a2a" : "#2c3038";
    ctx.beginPath();
    ctx.moveTo(sx, 104);
    ctx.lineTo(sx + 5, 104);
    ctx.lineTo(sx - 3, 152);
    ctx.lineTo(sx - 8, 152);
    ctx.closePath();
    ctx.fill();
  }

  // Damp patch spreading from the drain.
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#151a20";
  ctx.beginPath();
  ctx.ellipse(dx + 2, dy + 1, 22, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Central rug.
  px(ctx, RUG.x - 1, RUG.y - 1, RUG.w + 2, RUG.h + 2, C.rugDark);
  px(ctx, RUG.x, RUG.y, RUG.w, RUG.h, C.rug);
  ctx.fillStyle = C.rugEdge;
  ctx.fillRect(RUG.x + 4, RUG.y + 4, RUG.w - 8, 1);
  ctx.fillRect(RUG.x + 4, RUG.y + RUG.h - 5, RUG.w - 8, 1);
  ctx.fillRect(RUG.x + 4, RUG.y + 4, 1, RUG.h - 8);
  ctx.fillRect(RUG.x + RUG.w - 5, RUG.y + 4, 1, RUG.h - 8);
  for (let i = 0; i < 40; i++) {
    const x = RUG.x + 2 + rnd() * (RUG.w - 4);
    const y = RUG.y + 2 + rnd() * (RUG.h - 4);
    px(ctx, x, y, 1 + rnd() * 5, 1, rnd() > 0.5 ? C.rugDark : C.rugEdge);
  }
}

function drawWalls(ctx: CanvasRenderingContext2D) {
  const rnd = mulberry32(90210);

  const g = ctx.createLinearGradient(0, 0, 0, BACK_WALL);
  g.addColorStop(0, C.wallTop);
  g.addColorStop(1, C.wallBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, ROOM_W, BACK_WALL);

  // Concrete panel seams.
  for (let x = 0; x <= ROOM_W; x += 56) {
    px(ctx, x, 0, 1, BACK_WALL - 4, C.wallSeam);
    px(ctx, x + 1, 0, 1, BACK_WALL - 4, C.wallEdge);
  }
  for (let i = 0; i < 26; i++) {
    px(
      ctx,
      rnd() * ROOM_W,
      rnd() * (BACK_WALL - 6),
      2 + rnd() * 10,
      1 + rnd() * 2,
      rnd() > 0.5 ? C.wallSeam : "#4c535e",
    );
  }

  // Pipe running the length of the wall.
  px(ctx, 0, 8, ROOM_W, 1, "#687380");
  px(ctx, 0, 9, ROOM_W, 3, "#444c56");
  px(ctx, 0, 12, ROOM_W, 1, "#24282d");
  for (let x = 24; x < ROOM_W; x += 72) px(ctx, x, 7, 3, 7, "#75808e");

  // Wall vent.
  px(ctx, 198, 15, 34, 13, "#2f343d");
  px(ctx, 199, 16, 32, 11, "#1d2026");
  ctx.fillStyle = "#434a56";
  for (let i = 0; i < 4; i++) ctx.fillRect(200, 17 + i * 3, 30, 1);

  // Skirting.
  px(ctx, 0, BACK_WALL - 4, ROOM_W, 4, C.skirting);
  px(ctx, 0, BACK_WALL - 4, ROOM_W, 1, "#4c535e");

  // Side and bottom walls.
  px(ctx, 0, BACK_WALL, WALL, ROOM_H - BACK_WALL, C.sideWall);
  px(ctx, ROOM_W - WALL, BACK_WALL, WALL, ROOM_H - BACK_WALL, C.sideWall);
  px(ctx, 0, ROOM_H - WALL, ROOM_W, WALL, C.sideWall);
  px(ctx, WALL - 1, BACK_WALL, 1, ROOM_H - BACK_WALL, C.sideWallEdge);
  px(ctx, ROOM_W - WALL, BACK_WALL, 1, ROOM_H - BACK_WALL, C.sideWallEdge);
  px(ctx, 0, ROOM_H - WALL, ROOM_W, 1, C.sideWallEdge);
}

/** A desk seen from slightly above: top surface plus a darker front lip. */
function drawDesk(ctx: CanvasRenderingContext2D, r: Rect) {
  px(ctx, r.x - 1, r.y - 1, r.w + 2, r.h + 3, C.outline);
  px(ctx, r.x, r.y, r.w, r.h, C.wood);
  px(ctx, r.x, r.y, r.w, 1, C.woodLight);
  px(ctx, r.x, r.y + r.h - 5, r.w, 5, C.woodDark);
  px(ctx, r.x + 2, r.y + r.h, 3, 2, "#191d22");
  px(ctx, r.x + r.w - 5, r.y + r.h, 3, 2, "#191d22");
}

function drawLaptopDesk(ctx: CanvasRenderingContext2D) {
  drawDesk(ctx, FURNITURE.deskLaptop);

  // Laptop. The screen itself is drawn in the emissive pass.
  px(ctx, 79, 41, 30, 13, C.outline);
  px(ctx, 80, 42, 28, 11, "#3f444d");
  px(ctx, 82, 44, 24, 6, "#535a68");
  px(ctx, 79, 34, 30, 8, C.outline);
  px(ctx, 80, 35, 28, 7, "#2d323a");

  // Mug and notebook.
  px(ctx, 118, 45, 7, 7, C.outline);
  px(ctx, 119, 46, 5, 5, "#857365");
  px(ctx, 119, 46, 5, 2, "#a28c7a");
  px(ctx, 58, 44, 14, 10, C.outline);
  px(ctx, 59, 45, 12, 8, "#4d4d5c");
  px(ctx, 59, 45, 12, 1, "#68687a");
  px(ctx, 61, 56, 9, 1, "#858597");

  // Desk lamp leaning against the wall.
  px(ctx, 60, 36, 8, 3, C.metalDark);
  px(ctx, 63, 30, 2, 6, C.metalLight);
  px(ctx, 58, 26, 12, 5, C.outline);
  px(ctx, 59, 27, 10, 4, "#6c7583");

  // Chair, offset so it never blocks the interaction spot.
  px(ctx, 48, 68, 18, 14, C.outline);
  px(ctx, 49, 69, 16, 12, "#3d434c");
  px(ctx, 51, 71, 12, 7, "#4f5665");
}

function drawMonitorDesk(ctx: CanvasRenderingContext2D) {
  drawDesk(ctx, FURNITURE.deskMonitor);

  // Heavy-bezel monitor.
  px(ctx, 322, 28, 44, 28, C.outline);
  px(ctx, 323, 29, 42, 26, "#414856");
  px(ctx, 325, 31, 38, 20, "#171d24");
  px(ctx, 336, 56, 16, 4, "#323a46");
  px(ctx, 332, 59, 24, 3, C.metalDark);

  // Dev kit with a status LED.
  px(ctx, 368, 42, 20, 14, C.outline);
  px(ctx, 369, 43, 18, 12, "#363b46");
  px(ctx, 371, 45, 14, 2, "#4f5665");
  px(ctx, 371, 50, 9, 1, "#4f5665");

  // Controller on the desk.
  px(ctx, 302, 46, 15, 9, C.outline);
  px(ctx, 303, 47, 13, 7, "#444c58");
  px(ctx, 305, 49, 3, 3, "#282f38");
  px(ctx, 311, 49, 3, 3, "#282f38");

  ctx.fillStyle = "#1d2229";
  ctx.fillRect(344, 62, 1, 6);
  ctx.fillRect(345, 65, 6, 1);
}

function drawServerRack(ctx: CanvasRenderingContext2D) {
  const r = FURNITURE.serverRack;
  px(ctx, r.x - 1, r.y - 1, r.w + 2, r.h + 2, C.outline);
  px(ctx, r.x, r.y, r.w, r.h, C.metal);
  px(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, "#323a44");

  for (let i = 0; i < 7; i++) {
    const y = r.y + 4 + i * 10;
    px(ctx, r.x + 3, y, r.w - 6, 8, "#434c58");
    px(ctx, r.x + 3, y, r.w - 6, 1, "#586170");
    ctx.fillStyle = "#242931";
    for (let s = 0; s < 3; s++) ctx.fillRect(r.x + 6, y + 2 + s * 2, 10, 1);
  }
}

function drawWorkbench(ctx: CanvasRenderingContext2D) {
  const r = FURNITURE.workbench;
  px(ctx, r.x - 1, r.y - 1, r.w + 2, r.h + 3, C.outline);
  px(ctx, r.x, r.y, r.w, r.h, C.bench);
  px(ctx, r.x, r.y, r.w, 1, "#a47e56");
  ctx.fillStyle = C.benchDark;
  for (let i = 1; i < 4; i++) ctx.fillRect(r.x, r.y + i * 7, r.w, 1);
  px(ctx, r.x, r.y + r.h - 5, r.w, 5, C.benchDark);
  px(ctx, r.x + 3, r.y + r.h, 3, 3, "#191d22");
  px(ctx, r.x + r.w - 6, r.y + r.h, 3, 3, "#191d22");

  // Bench vice.
  px(ctx, r.x + r.w - 24, r.y + 5, 18, 12, C.outline);
  px(ctx, r.x + r.w - 23, r.y + 6, 16, 10, C.metalLight);
  px(ctx, r.x + r.w - 20, r.y + 8, 4, 6, "#3a414c");

  // Tools.
  px(ctx, r.x + 30, r.y + 8, 22, 2, "#9ba6b4");
  px(ctx, r.x + 30, r.y + 7, 5, 4, "#bfcada");
  px(ctx, r.x + 46, r.y + 12, 16, 2, "#87929e");
  px(ctx, r.x + 60, r.y + 11, 4, 4, "#dc8e4c");
  px(ctx, r.x + 34, r.y + 18, 3, 3, "#6e7783");
  px(ctx, r.x + 40, r.y + 20, 2, 2, "#6e7783");
  px(ctx, r.x + 70, r.y + 18, 10, 6, "#4f5665");

  // Bench lamp. Bulb is emissive.
  px(ctx, r.x + 12, r.y + 4, 10, 3, C.metalDark);
  px(ctx, r.x + 16, r.y - 6, 2, 10, C.metalLight);
  px(ctx, r.x + 12, r.y - 11, 10, 5, C.outline);
  px(ctx, r.x + 13, r.y - 10, 8, 4, "#6c7583");
}

function drawCrates(ctx: CanvasRenderingContext2D) {
  const r = FURNITURE.crates;
  const crate = (x: number, y: number, w: number, h: number) => {
    px(ctx, x - 1, y - 1, w + 2, h + 2, C.outline);
    px(ctx, x, y, w, h, "#6a5134");
    px(ctx, x, y, w, 1, "#8b6a44");
    px(ctx, x + 2, y + 2, w - 4, h - 4, "#5c442b");
    ctx.fillStyle = "#795534";
    ctx.fillRect(x + 2, y + 2, w - 4, 1);
    ctx.fillRect(x + 2, y + h - 3, w - 4, 1);
  };
  crate(r.x, r.y, 26, 26);
  crate(r.x + 18, r.y + 20, 26, 26);
}

function drawDoor(ctx: CanvasRenderingContext2D) {
  const r = FURNITURE.door;
  px(ctx, r.x - 3, r.y - 4, r.w + 3, r.h + 8, "#262b32");
  px(ctx, r.x - 2, r.y - 3, r.w + 2, r.h + 6, C.metalLight);
  px(ctx, r.x - 1, r.y, r.w + 1, r.h, "#413426");
  px(ctx, r.x - 1, r.y + 3, r.w + 1, 2, "#68553b");
  px(ctx, r.x - 1, r.y + r.h - 5, r.w + 1, 2, "#68553b");
  px(ctx, r.x - 1, r.y + r.h / 2 - 1, r.w + 1, 3, "#55442f");
  px(ctx, r.x - 3, r.y + r.h / 2 - 4, 3, 7, "#3a414c");
  px(ctx, r.x - 3, r.y + r.h / 2 - 3, 2, 4, "#c1cbd8");
  // Sign plate above the door.
  px(ctx, r.x - 5, r.y - 13, 13, 8, "#1d222b");
}

/* ------------------------------------------------------------------ */
/* dynamic bits                                                        */
/* ------------------------------------------------------------------ */

function drawPlayer(ctx: CanvasRenderingContext2D, s: GameState) {
  const { player } = s;
  const x = Math.round(player.pos.x);
  const y = Math.round(player.pos.y);
  const step = player.moving ? Math.floor(player.walkPhase) % 4 : 0;
  const bob = step === 1 ? -1 : 0;

  ctx.globalAlpha = 0.45;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const top = y - 20 + bob;
  const coat = "#4d5668";
  const coatDark = "#353c49";
  const coatLight = "#6d7a90";
  const hood = "#414958";
  const hoodLight = "#5f6b80";
  const dark = "#1a1e26";
  const scarf = "#8a4f38";
  const swing = player.moving ? (step === 1 ? 1 : step === 3 ? -1 : 0) : 0;

  // Boots.
  px(ctx, x - 4, y - 4 - Math.max(0, swing), 4, 4 + Math.max(0, swing), dark);
  px(ctx, x, y - 4 - Math.max(0, -swing), 4, 4 + Math.max(0, -swing), dark);

  // Coat, wider at the shoulders than the hood.
  px(ctx, x - 7, top + 6, 14, 11, C.outline);
  px(ctx, x - 6, top + 7, 12, 9, coat);
  px(ctx, x - 6, top + 7, 12, 1, coatLight);
  px(ctx, x - 6, top + 13, 12, 3, coatDark);
  // Arms hanging at the sides.
  px(ctx, x - 6, top + 8, 2, 7, coatDark);
  px(ctx, x + 4, top + 8, 2, 7, coatDark);
  // Scarf, the one warm note on the character.
  px(ctx, x - 4, top + 6, 8, 2, scarf);

  // Hood.
  px(ctx, x - 5, top - 1, 10, 9, C.outline);
  px(ctx, x - 4, top, 8, 8, hood);
  px(ctx, x - 4, top, 8, 1, hoodLight);
  px(ctx, x - 4, top + 1, 1, 6, hoodLight);

  if (player.facing === "down") {
    px(ctx, x - 3, top + 3, 6, 4, dark);
    px(ctx, x - 2, top + 4, 1, 1, "#c9b79a");
    px(ctx, x + 1, top + 4, 1, 1, "#c9b79a");
  } else if (player.facing === "left") {
    px(ctx, x - 4, top + 3, 4, 4, dark);
    px(ctx, x - 1, top + 4, 1, 1, "#c9b79a");
  } else if (player.facing === "right") {
    px(ctx, x, top + 3, 4, 4, dark);
    px(ctx, x, top + 4, 1, 1, "#c9b79a");
  } else {
    // Facing away: just the back of the hood.
    px(ctx, x - 3, top + 2, 6, 4, hood);
    px(ctx, x - 3, top + 2, 6, 1, hoodLight);
  }
}

type Emissive = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  /** Seconds per blink cycle. Omit for a steady light. */
  blink?: number;
};

const EMISSIVE: readonly Emissive[] = [
  { x: 81, y: 36, w: 26, h: 5, color: "#7fd0e8" }, // laptop screen
  { x: 326, y: 32, w: 36, h: 18, color: "#4d84a6" }, // monitor screen
  { x: 384, y: 45, w: 2, h: 2, color: "#c8f0a0", blink: 2.4 }, // dev kit LED
  { x: 89, y: 183, w: 6, h: 2, color: "#ffcf8f" }, // bench lamp
  { x: 60, y: 31, w: 8, h: 2, color: "#ffbe74" }, // desk lamp
  { x: 426, y: 88, w: 11, h: 6, color: "#7fc99a" }, // exit sign
];

function drawEmissive(ctx: CanvasRenderingContext2D, t: number) {
  for (const e of EMISSIVE) {
    ctx.globalAlpha = e.blink
      ? Math.sin((t / e.blink) * Math.PI * 2) > 0
        ? 1
        : 0.25
      : 1;
    px(ctx, e.x, e.y, e.w, e.h, e.color);
  }
  ctx.globalAlpha = 1;

  // Server rack LEDs.
  for (let i = 0; i < 7; i++) {
    const on = Math.sin(t * (1.7 + i * 0.6) + i) > -0.2;
    ctx.globalAlpha = on ? 0.95 : 0.2;
    px(ctx, 36, 97 + i * 10, 2, 2, i % 3 === 0 ? "#ffcf6a" : "#7ce89a");
  }
  ctx.globalAlpha = 1;

  // Scanline creeping down the monitor.
  ctx.globalAlpha = 0.14;
  px(ctx, 326, 32 + ((t * 9) % 18), 36, 1, "#dff2ff");

  // Light seeping around the door.
  ctx.globalAlpha = 0.45 + Math.sin(t * 1.3) * 0.06;
  px(ctx, 427, 100, 1, 58, "#cfe0ea");
  px(ctx, 427, 158, 4, 1, "#cfe0ea");
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ */
/* renderer                                                            */
/* ------------------------------------------------------------------ */

export type Renderer = { draw: (state: GameState) => void };

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  canvas.width = ROOM_W;
  canvas.height = ROOM_H;
  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.imageSmoothingEnabled = false;

  // Everything that never moves is baked once into an offscreen layer.
  const bg = makeLayer();
  drawFloor(bg.ctx);
  drawWalls(bg.ctx);
  drawServerRack(bg.ctx);
  drawLaptopDesk(bg.ctx);
  drawMonitorDesk(bg.ctx);
  drawWorkbench(bg.ctx);
  drawCrates(bg.ctx);
  drawDoor(bg.ctx);

  // Film grain, baked once and composited at low opacity.
  const grain = makeLayer();
  {
    const img = grain.ctx.createImageData(ROOM_W, ROOM_H);
    const rnd = mulberry32(4242);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = rnd() * 255;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    grain.ctx.putImageData(img, 0, 0);
  }

  const shadow = makeLayer();
  const driftRange = ROOM_H - BACK_WALL - WALL;

  const motes = Array.from({ length: 16 }, (_, i) => {
    const rnd = mulberry32(i * 977 + 5);
    return {
      x: rnd() * ROOM_W,
      y: rnd() * driftRange,
      speed: 2 + rnd() * 5,
      drift: rnd() * Math.PI * 2,
      size: rnd() > 0.7 ? 2 : 1,
    };
  });

  function lightFlicker(index: number, flicker: number, t: number) {
    return 1 - flicker * (0.5 + 0.5 * Math.sin(t * (5 + index * 2.3) + index * 1.7));
  }

  function drawLighting(state: GameState) {
    const t = state.time;
    const sctx = shadow.ctx;

    sctx.globalCompositeOperation = "source-over";
    sctx.fillStyle = "#05070d";
    sctx.fillRect(0, 0, ROOM_W, ROOM_H);

    // Carve the lit areas back out of the darkness.
    sctx.globalCompositeOperation = "destination-out";
    const cut = (x: number, y: number, radius: number, strength: number) => {
      const g = sctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, "rgba(0,0,0," + Math.min(1, strength) + ")");
      g.addColorStop(0.45, "rgba(0,0,0," + Math.min(1, strength * 0.82) + ")");
      g.addColorStop(0.75, "rgba(0,0,0," + Math.min(1, strength * 0.36) + ")");
      g.addColorStop(1, "rgba(0,0,0,0)");
      sctx.fillStyle = g;
      sctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    };

    for (let i = 0; i < LIGHTS.length; i++) {
      const l = LIGHTS[i];
      const f = lightFlicker(i, l.flicker, t);
      cut(l.pos.x, l.pos.y, l.radius * f, l.intensity * f);
    }
    // The player carries a faint pool of light so they stay readable.
    cut(state.player.pos.x, state.player.pos.y - 6, 58, 0.62);

    sctx.globalCompositeOperation = "source-over";

    ctx.globalAlpha = 0.9;
    ctx.drawImage(shadow.c, 0, 0);
    ctx.globalAlpha = 1;

    // Additive colour over the lit areas.
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < LIGHTS.length; i++) {
      const l = LIGHTS[i];
      const f = lightFlicker(i, l.flicker * 0.5, t);
      const r = l.radius * f;
      const rgb = l.color[0] + "," + l.color[1] + "," + l.color[2];
      const grad = ctx.createRadialGradient(l.pos.x, l.pos.y, 0, l.pos.x, l.pos.y, r);
      grad.addColorStop(0, "rgba(" + rgb + "," + 0.22 * l.intensity * f + ")");
      grad.addColorStop(1, "rgba(" + rgb + ",0)");
      ctx.fillStyle = grad;
      ctx.fillRect(l.pos.x - r, l.pos.y - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function drawFocus(state: GameState) {
    if (!state.focused) return;
    const b = state.focused.bounds;
    ctx.globalAlpha = 0.3 + 0.16 * Math.sin(state.time * 4);
    ctx.strokeStyle = "#e6d9bd";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      Math.round(b.x) - 2.5,
      Math.round(b.y) - 2.5,
      Math.round(b.w) + 5,
      Math.round(b.h) + 5,
    );
    ctx.globalAlpha = 1;
  }

  function drawAtmosphere(state: GameState) {
    const t = state.time;

    ctx.globalAlpha = 0.09;
    ctx.fillStyle = "#cfd6e0";
    for (const m of motes) {
      const x = m.x + Math.sin(t * 0.35 + m.drift) * 9;
      const y = BACK_WALL + (((m.y - t * m.speed) % driftRange) + driftRange) % driftRange;
      ctx.fillRect(Math.round(x), Math.round(y), m.size, m.size);
    }
    ctx.globalAlpha = 1;

    const v = ctx.createRadialGradient(ROOM_W / 2, ROOM_H / 2, 70, ROOM_W / 2, ROOM_H / 2, 290);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.42)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, ROOM_W, ROOM_H);

    ctx.globalAlpha = 0.04;
    ctx.globalCompositeOperation = "overlay";
    ctx.drawImage(grain.c, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  return {
    draw(state) {
      ctx.drawImage(bg.c, 0, 0);
      drawPlayer(ctx, state);
      drawLighting(state);
      drawEmissive(ctx, state.time);
      drawFocus(state);
      drawAtmosphere(state);
    },
  };
}
