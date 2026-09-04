import type { GameState, Rect } from "./types";
import type { RoomPalette, RoomTheme } from "./theme";
import { BACK_WALL, FURNITURE, ROOM_H, ROOM_W, RUG, WALL } from "./world";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

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

function makeLayer() {
  const c = document.createElement("canvas");
  c.width = ROOM_W;
  c.height = ROOM_H;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

/* ------------------------------------------------------------------ */
/* static layers                                                       */
/* ------------------------------------------------------------------ */

function drawFloor(ctx: CanvasRenderingContext2D, C: RoomPalette) {
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
  px(ctx, dx - 6, dy - 6, 12, 12, C.drainOuter);
  px(ctx, dx - 5, dy - 5, 10, 10, C.drainInner);
  ctx.fillStyle = C.drainSlat;
  for (let i = 0; i < 4; i++) ctx.fillRect(dx - 4, dy - 4 + i * 3, 8, 1);

  // Hazard stripes painted in front of the door.
  for (let i = 0; i < 9; i++) {
    const sx = 384 + i * 5;
    ctx.fillStyle = i % 2 === 0 ? C.hazardA : C.hazardB;
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
  ctx.fillStyle = C.damp;
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

function drawWalls(ctx: CanvasRenderingContext2D, C: RoomPalette) {
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
      rnd() > 0.5 ? C.wallSeam : C.wallStain,
    );
  }

  // Pipe running the length of the wall.
  px(ctx, 0, 8, ROOM_W, 1, C.pipeHi);
  px(ctx, 0, 9, ROOM_W, 3, C.pipeMid);
  px(ctx, 0, 12, ROOM_W, 1, C.pipeLo);
  for (let x = 24; x < ROOM_W; x += 72) px(ctx, x, 7, 3, 7, C.pipeBracket);

  // Wall vent.
  px(ctx, 198, 15, 34, 13, C.ventFrame);
  px(ctx, 199, 16, 32, 11, C.ventInner);
  ctx.fillStyle = C.ventSlat;
  for (let i = 0; i < 4; i++) ctx.fillRect(200, 17 + i * 3, 30, 1);

  // Skirting.
  px(ctx, 0, BACK_WALL - 4, ROOM_W, 4, C.skirting);
  px(ctx, 0, BACK_WALL - 4, ROOM_W, 1, C.skirtingHi);

  // Side and bottom walls.
  px(ctx, 0, BACK_WALL, WALL, ROOM_H - BACK_WALL, C.sideWall);
  px(ctx, ROOM_W - WALL, BACK_WALL, WALL, ROOM_H - BACK_WALL, C.sideWall);
  px(ctx, 0, ROOM_H - WALL, ROOM_W, WALL, C.sideWall);
  px(ctx, WALL - 1, BACK_WALL, 1, ROOM_H - BACK_WALL, C.sideWallEdge);
  px(ctx, ROOM_W - WALL, BACK_WALL, 1, ROOM_H - BACK_WALL, C.sideWallEdge);
  px(ctx, 0, ROOM_H - WALL, ROOM_W, 1, C.sideWallEdge);
}

/** A desk seen from slightly above: top surface plus a darker front lip. */
function drawDesk(ctx: CanvasRenderingContext2D, C: RoomPalette, r: Rect) {
  px(ctx, r.x - 1, r.y - 1, r.w + 2, r.h + 3, C.outline);
  px(ctx, r.x, r.y, r.w, r.h, C.wood);
  px(ctx, r.x, r.y, r.w, 1, C.woodLight);
  px(ctx, r.x, r.y + r.h - 5, r.w, 5, C.woodDark);
  px(ctx, r.x + 2, r.y + r.h, 3, 2, C.legShadow);
  px(ctx, r.x + r.w - 5, r.y + r.h, 3, 2, C.legShadow);
}

function drawLaptopDesk(ctx: CanvasRenderingContext2D, C: RoomPalette) {
  drawDesk(ctx, C, FURNITURE.deskLaptop);

  // Laptop. The screen itself is drawn in the emissive pass.
  px(ctx, 79, 41, 30, 13, C.outline);
  px(ctx, 80, 42, 28, 11, C.laptopBody);
  px(ctx, 82, 44, 24, 6, C.laptopKeys);
  px(ctx, 79, 34, 30, 8, C.outline);
  px(ctx, 80, 35, 28, 7, C.laptopLid);

  // Mug and notebook.
  px(ctx, 118, 45, 7, 7, C.outline);
  px(ctx, 119, 46, 5, 5, C.mug);
  px(ctx, 119, 46, 5, 2, C.mugHi);
  px(ctx, 58, 44, 14, 10, C.outline);
  px(ctx, 59, 45, 12, 8, C.book);
  px(ctx, 59, 45, 12, 1, C.bookHi);
  px(ctx, 61, 56, 9, 1, C.pen);

  // Desk lamp leaning against the wall.
  px(ctx, 60, 36, 8, 3, C.metalDark);
  px(ctx, 63, 30, 2, 6, C.metalLight);
  px(ctx, 58, 26, 12, 5, C.outline);
  px(ctx, 59, 27, 10, 4, C.lampShade);

  // Chair, offset so it never blocks the interaction spot.
  px(ctx, 48, 68, 18, 14, C.outline);
  px(ctx, 49, 69, 16, 12, C.chair);
  px(ctx, 51, 71, 12, 7, C.chairHi);
}

function drawMonitorDesk(ctx: CanvasRenderingContext2D, C: RoomPalette) {
  drawDesk(ctx, C, FURNITURE.deskMonitor);

  // Heavy-bezel monitor.
  px(ctx, 322, 28, 44, 28, C.outline);
  px(ctx, 323, 29, 42, 26, C.monitorBody);
  px(ctx, 325, 31, 38, 20, C.monitorGlass);
  px(ctx, 336, 56, 16, 4, C.monitorNeck);
  px(ctx, 332, 59, 24, 3, C.metalDark);

  // Dev kit with a status LED.
  px(ctx, 368, 42, 20, 14, C.outline);
  px(ctx, 369, 43, 18, 12, C.devkit);
  px(ctx, 371, 45, 14, 2, C.devkitTrim);
  px(ctx, 371, 50, 9, 1, C.devkitTrim);

  // Controller on the desk.
  px(ctx, 302, 46, 15, 9, C.outline);
  px(ctx, 303, 47, 13, 7, C.padBody);
  px(ctx, 305, 49, 3, 3, C.padButton);
  px(ctx, 311, 49, 3, 3, C.padButton);

  ctx.fillStyle = C.cable;
  ctx.fillRect(344, 62, 1, 6);
  ctx.fillRect(345, 65, 6, 1);
}

function drawServerRack(ctx: CanvasRenderingContext2D, C: RoomPalette) {
  const r = FURNITURE.serverRack;
  px(ctx, r.x - 1, r.y - 1, r.w + 2, r.h + 2, C.outline);
  px(ctx, r.x, r.y, r.w, r.h, C.metal);
  px(ctx, r.x + 1, r.y + 1, r.w - 2, r.h - 2, C.rackInner);

  for (let i = 0; i < 7; i++) {
    const y = r.y + 4 + i * 10;
    px(ctx, r.x + 3, y, r.w - 6, 8, C.rackBlade);
    px(ctx, r.x + 3, y, r.w - 6, 1, C.rackBladeHi);
    ctx.fillStyle = C.rackSlat;
    for (let s = 0; s < 3; s++) ctx.fillRect(r.x + 6, y + 2 + s * 2, 10, 1);
  }
}

function drawWorkbench(ctx: CanvasRenderingContext2D, C: RoomPalette) {
  const r = FURNITURE.workbench;
  px(ctx, r.x - 1, r.y - 1, r.w + 2, r.h + 3, C.outline);
  px(ctx, r.x, r.y, r.w, r.h, C.bench);
  px(ctx, r.x, r.y, r.w, 1, C.benchTopHi);
  ctx.fillStyle = C.benchDark;
  for (let i = 1; i < 4; i++) ctx.fillRect(r.x, r.y + i * 7, r.w, 1);
  px(ctx, r.x, r.y + r.h - 5, r.w, 5, C.benchDark);
  px(ctx, r.x + 3, r.y + r.h, 3, 3, C.legShadow);
  px(ctx, r.x + r.w - 6, r.y + r.h, 3, 3, C.legShadow);

  // Bench vice.
  px(ctx, r.x + r.w - 24, r.y + 5, 18, 12, C.outline);
  px(ctx, r.x + r.w - 23, r.y + 6, 16, 10, C.metalLight);
  px(ctx, r.x + r.w - 20, r.y + 8, 4, 6, C.viceJaw);

  // Tools.
  px(ctx, r.x + 30, r.y + 8, 22, 2, C.toolSteel);
  px(ctx, r.x + 30, r.y + 7, 5, 4, C.toolSteelHi);
  px(ctx, r.x + 46, r.y + 12, 16, 2, C.toolDark);
  px(ctx, r.x + 60, r.y + 11, 4, 4, C.toolWood);
  px(ctx, r.x + 34, r.y + 18, 3, 3, C.bolt);
  px(ctx, r.x + 40, r.y + 20, 2, 2, C.bolt);
  px(ctx, r.x + 70, r.y + 18, 10, 6, C.toolbox);

  // Bench lamp. Bulb is emissive.
  px(ctx, r.x + 12, r.y + 4, 10, 3, C.metalDark);
  px(ctx, r.x + 16, r.y - 6, 2, 10, C.metalLight);
  px(ctx, r.x + 12, r.y - 11, 10, 5, C.outline);
  px(ctx, r.x + 13, r.y - 10, 8, 4, C.lampShade);
}

function drawCrates(ctx: CanvasRenderingContext2D, C: RoomPalette) {
  const r = FURNITURE.crates;
  const crate = (x: number, y: number, w: number, h: number) => {
    px(ctx, x - 1, y - 1, w + 2, h + 2, C.outline);
    px(ctx, x, y, w, h, C.crate);
    px(ctx, x, y, w, 1, C.crateHi);
    px(ctx, x + 2, y + 2, w - 4, h - 4, C.crateInner);
    ctx.fillStyle = C.crateBrace;
    ctx.fillRect(x + 2, y + 2, w - 4, 1);
    ctx.fillRect(x + 2, y + h - 3, w - 4, 1);
  };
  crate(r.x, r.y, 26, 26);
  crate(r.x + 18, r.y + 20, 26, 26);
}

function drawDoor(ctx: CanvasRenderingContext2D, C: RoomPalette) {
  const r = FURNITURE.door;
  px(ctx, r.x - 3, r.y - 4, r.w + 3, r.h + 8, C.doorFrameShadow);
  px(ctx, r.x - 2, r.y - 3, r.w + 2, r.h + 6, C.metalLight);
  px(ctx, r.x - 1, r.y, r.w + 1, r.h, C.doorPanel);
  px(ctx, r.x - 1, r.y + 3, r.w + 1, 2, C.doorBrace);
  px(ctx, r.x - 1, r.y + r.h - 5, r.w + 1, 2, C.doorBrace);
  px(ctx, r.x - 1, r.y + r.h / 2 - 1, r.w + 1, 3, C.doorBraceMid);
  px(ctx, r.x - 3, r.y + r.h / 2 - 4, 3, 7, C.handleBase);
  px(ctx, r.x - 3, r.y + r.h / 2 - 3, 2, 4, C.handle);
  // Sign plate above the door.
  px(ctx, r.x - 5, r.y - 13, 13, 8, C.signPlate);
}

/* ------------------------------------------------------------------ */
/* dynamic bits                                                        */
/* ------------------------------------------------------------------ */

function drawPlayer(ctx: CanvasRenderingContext2D, C: RoomPalette, s: GameState) {
  const { player } = s;
  const x = Math.round(player.pos.x);
  const y = Math.round(player.pos.y);
  const step = player.moving ? Math.floor(player.walkPhase) % 4 : 0;
  const bob = step === 1 ? -1 : 0;

  ctx.globalAlpha = C.contactShadowAlpha;
  ctx.fillStyle = C.contactShadow;
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 7, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  const top = y - 20 + bob;
  const swing = player.moving ? (step === 1 ? 1 : step === 3 ? -1 : 0) : 0;

  // Boots.
  px(ctx, x - 4, y - 4 - Math.max(0, swing), 4, 4 + Math.max(0, swing), C.boot);
  px(ctx, x, y - 4 - Math.max(0, -swing), 4, 4 + Math.max(0, -swing), C.boot);

  // Coat, wider at the shoulders than the hood.
  px(ctx, x - 7, top + 6, 14, 11, C.outline);
  px(ctx, x - 6, top + 7, 12, 9, C.coat);
  px(ctx, x - 6, top + 7, 12, 1, C.coatLight);
  px(ctx, x - 6, top + 13, 12, 3, C.coatDark);
  // Arms hanging at the sides.
  px(ctx, x - 6, top + 8, 2, 7, C.coatDark);
  px(ctx, x + 4, top + 8, 2, 7, C.coatDark);
  // Scarf, the one warm note on the character.
  px(ctx, x - 4, top + 6, 8, 2, C.scarf);

  // Hood.
  px(ctx, x - 5, top - 1, 10, 9, C.outline);
  px(ctx, x - 4, top, 8, 8, C.hood);
  px(ctx, x - 4, top, 8, 1, C.hoodLight);
  px(ctx, x - 4, top + 1, 1, 6, C.hoodLight);

  if (player.facing === "down") {
    px(ctx, x - 3, top + 3, 6, 4, C.boot);
    px(ctx, x - 2, top + 4, 1, 1, C.eye);
    px(ctx, x + 1, top + 4, 1, 1, C.eye);
  } else if (player.facing === "left") {
    px(ctx, x - 4, top + 3, 4, 4, C.boot);
    px(ctx, x - 1, top + 4, 1, 1, C.eye);
  } else if (player.facing === "right") {
    px(ctx, x, top + 3, 4, 4, C.boot);
    px(ctx, x, top + 4, 1, 1, C.eye);
  } else {
    // Facing away: just the back of the hood.
    px(ctx, x - 3, top + 2, 6, 4, C.hood);
    px(ctx, x - 3, top + 2, 6, 1, C.hoodLight);
  }
}

function drawEmissive(ctx: CanvasRenderingContext2D, theme: RoomTheme, t: number) {
  for (const e of theme.emissive) {
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
    px(ctx, 36, 97 + i * 10, 2, 2, theme.rackLeds[i % 3 === 0 ? 0 : 1]);
  }
  ctx.globalAlpha = 1;

  // Scanline creeping down the monitor.
  ctx.globalAlpha = 0.14;
  px(ctx, 326, 32 + ((t * 9) % 18), 36, 1, theme.scanline);

  // Light seeping around the door.
  ctx.globalAlpha = 0.45 + Math.sin(t * 1.3) * 0.06;
  px(ctx, 427, 100, 1, 58, theme.doorSeam);
  px(ctx, 427, 158, 4, 1, theme.doorSeam);
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ */
/* renderer                                                            */
/* ------------------------------------------------------------------ */

export type Renderer = {
  draw: (state: GameState) => void;
  /** Repaints the baked layers in a new theme without restarting the game. */
  setTheme: (theme: RoomTheme) => void;
};

export function createRenderer(
  canvas: HTMLCanvasElement,
  initialTheme: RoomTheme,
): Renderer {
  canvas.width = ROOM_W;
  canvas.height = ROOM_H;
  const ctx = canvas.getContext("2d", { alpha: false })!;
  ctx.imageSmoothingEnabled = false;

  let theme = initialTheme;

  // Everything that never moves is baked once per theme.
  const bg = makeLayer();
  function bake() {
    const C = theme.palette;
    drawFloor(bg.ctx, C);
    drawWalls(bg.ctx, C);
    drawServerRack(bg.ctx, C);
    drawLaptopDesk(bg.ctx, C);
    drawMonitorDesk(bg.ctx, C);
    drawWorkbench(bg.ctx, C);
    drawCrates(bg.ctx, C);
    drawDoor(bg.ctx, C);
  }
  bake();

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
    const A = theme.atmosphere;
    const sctx = shadow.ctx;

    sctx.globalCompositeOperation = "source-over";
    sctx.fillStyle = A.shadowColor;
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

    for (let i = 0; i < theme.lights.length; i++) {
      const l = theme.lights[i];
      const f = lightFlicker(i, l.flicker, t);
      cut(l.pos.x, l.pos.y, l.radius * f, l.intensity * f);
    }
    // The player carries a faint pool of light so they stay readable.
    cut(
      state.player.pos.x,
      state.player.pos.y - 6,
      A.playerLight.radius,
      A.playerLight.strength,
    );

    sctx.globalCompositeOperation = "source-over";

    ctx.globalAlpha = A.shadowAlpha;
    ctx.drawImage(shadow.c, 0, 0);
    ctx.globalAlpha = 1;

    // Additive colour over the lit areas.
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < theme.lights.length; i++) {
      const l = theme.lights[i];
      const f = lightFlicker(i, l.flicker * 0.5, t);
      const r = l.radius * f;
      const rgb = l.color[0] + "," + l.color[1] + "," + l.color[2];
      const grad = ctx.createRadialGradient(l.pos.x, l.pos.y, 0, l.pos.x, l.pos.y, r);
      grad.addColorStop(0, "rgba(" + rgb + "," + A.additive * l.intensity * f + ")");
      grad.addColorStop(1, "rgba(" + rgb + ",0)");
      ctx.fillStyle = grad;
      ctx.fillRect(l.pos.x - r, l.pos.y - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function drawFocus(state: GameState) {
    if (!state.focused) return;
    const b = state.focused.bounds;
    ctx.globalAlpha = 0.35 + 0.2 * Math.sin(state.time * 4);
    ctx.strokeStyle = theme.atmosphere.focusStroke;
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
    const A = theme.atmosphere;

    ctx.globalAlpha = A.motes.alpha;
    ctx.fillStyle = A.motes.color;
    for (const m of motes) {
      const x = m.x + Math.sin(t * 0.35 + m.drift) * 9;
      const y = BACK_WALL + (((m.y - t * m.speed) % driftRange) + driftRange) % driftRange;
      ctx.fillRect(Math.round(x), Math.round(y), m.size, m.size);
    }
    ctx.globalAlpha = 1;

    const v = ctx.createRadialGradient(ROOM_W / 2, ROOM_H / 2, 70, ROOM_W / 2, ROOM_H / 2, 290);
    v.addColorStop(0, "rgba(" + A.vignette.color + ",0)");
    v.addColorStop(1, "rgba(" + A.vignette.color + "," + A.vignette.alpha + ")");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, ROOM_W, ROOM_H);

    ctx.globalAlpha = A.grainAlpha;
    ctx.globalCompositeOperation = "overlay";
    ctx.drawImage(grain.c, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  return {
    draw(state) {
      ctx.drawImage(bg.c, 0, 0);
      drawPlayer(ctx, theme.palette, state);
      drawLighting(state);
      drawEmissive(ctx, theme, state.time);
      drawFocus(state);
      drawAtmosphere(state);
    },
    setTheme(next) {
      theme = next;
      bake();
    },
  };
}
