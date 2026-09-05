import { createAudio, type RoomAudio } from "./audio";
import { createRenderer, type Renderer } from "./render";
import type { ActionId, KeyBindings, Settings } from "./settings";
import { ACTION_IDS } from "./settings";
import type { RoomTheme } from "./theme";
import type {
  Bug,
  Facing,
  FocusTarget,
  GameState,
  Interactable,
  PanelId,
  Rect,
  Vec2,
} from "./types";
import {
  BALL_RADIUS,
  BALL_SPAWN,
  BUG_SPECIES,
  FLOOR,
  INTERACTABLES,
  PLANT_POTS,
  PLAYER_HALF_W,
  PLAYER_SPEED,
  RUG,
  SPAWN,
  distanceToRect,
  isSolidAt,
  playerBox,
  pointInRect,
  randomFreeSpot,
} from "./world";

const AXIS: Record<ActionId, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
  interact: [0, 0],
};

export type { FocusTarget };

export type EngineCallbacks = {
  onFocus: (target: FocusTarget | null) => void;
  onOpenPanel: (panel: PanelId) => void;
  onToggleLight: () => void;
  onCaught: (species: number, total: number) => void;
  /** Hover state plus where the character is, in 0..1 of the room. */
  onHoverPlayer: (hovered: boolean, at: Vec2) => void;
  onCarryChange: (carrying: boolean) => void;
  onFirstMove?: () => void;
};

function ballBox(pos: Vec2): Rect {
  return {
    x: pos.x - BALL_RADIUS,
    y: pos.y - BALL_RADIUS,
    w: BALL_RADIUS * 2,
    h: BALL_RADIUS * 2,
  };
}

export class GameEngine {
  private state: GameState;
  private renderer: Renderer;
  private audio: RoomAudio;
  /** KeyboardEvent.code -> action, rebuilt whenever the bindings change. */
  private keyMap = new Map<string, ActionId>();
  private held = new Set<ActionId>();
  private touchAxis = { x: 0, y: 0 };

  private raf = 0;
  private last = 0;
  private running = false;
  private hasMoved = false;
  private lastStepPhase = 0;
  private bugTimer = 6;
  private nextBugId = 1;
  private focusKey = "";

  constructor(
    private canvas: HTMLCanvasElement,
    theme: RoomTheme,
    settings: Settings,
    private cb: EngineCallbacks,
  ) {
    this.renderer = createRenderer(canvas, theme);
    this.audio = createAudio({
      volume: settings.volume,
      enabled: settings.sfxEnabled,
    });
    this.rebuildKeyMap(settings.bindings);

    this.state = {
      player: {
        pos: { ...SPAWN },
        facing: "down",
        walkPhase: 0,
        idlePhase: 0,
        moving: false,
        waveFor: 0,
        hovered: false,
        carryingWater: false,
      },
      ball: { pos: { ...BALL_SPAWN }, vel: { x: 0, y: 0 }, spin: 0 },
      bugs: [],
      plants: PLANT_POTS.map((bounds, id) => ({
        id,
        bounds,
        watered: false,
        since: 0,
      })),
      caught: [],
      time: 0,
      focused: null,
      paused: false,
      lightsOn: theme.id === "bright",
    };
  }

  start() {
    if (this.running) return;
    this.running = true;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.releaseAll);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerleave", this.onPointerLeave);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.releaseAll);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.audio.dispose();
  }

  /** While a panel is open the world keeps rendering but stops taking input. */
  setPaused(paused: boolean) {
    this.state.paused = paused;
    if (paused) this.releaseAll();
  }

  setTheme(theme: RoomTheme) {
    this.state.lightsOn = theme.id === "bright";
    this.renderer.setTheme(theme);
  }

  setSettings(settings: Settings) {
    this.rebuildKeyMap(settings.bindings);
    this.audio.setOptions({
      volume: settings.volume,
      enabled: settings.sfxEnabled,
    });
  }

  /** Touch joystick input, already normalised to the unit circle. */
  setTouchAxis(x: number, y: number) {
    this.touchAxis.x = x;
    this.touchAxis.y = y;
  }

  /** The on-screen interact button. */
  pressInteract() {
    if (this.state.paused) return;
    const focused = this.state.focused;
    if (focused) this.runAction(focused);
  }

  private rebuildKeyMap(bindings: KeyBindings) {
    this.keyMap.clear();
    for (const action of ACTION_IDS) {
      for (const code of bindings[action]) {
        if (code) this.keyMap.set(code, action);
      }
    }
  }

  private releaseAll = () => {
    this.held.clear();
    this.touchAxis.x = 0;
    this.touchAxis.y = 0;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const action = this.keyMap.get(e.code);
    if (action || e.code === "Space") e.preventDefault();
    if (this.state.paused || e.repeat || !action) return;
    if (action === "interact") this.pressInteract();
    else this.held.add(action);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const action = this.keyMap.get(e.code);
    if (action) this.held.delete(action);
  };

  /** Canvas pixel under the pointer, in room units. */
  private toRoom(e: PointerEvent): Vec2 {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * this.canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * this.canvas.height,
    };
  }

  private overPlayer(at: Vec2): boolean {
    const p = this.state.player.pos;
    return (
      at.x >= p.x - 9 && at.x <= p.x + 9 && at.y >= p.y - 24 && at.y <= p.y + 4
    );
  }

  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const hovered = this.overPlayer(this.toRoom(e));
    if (hovered !== this.state.player.hovered) {
      this.state.player.hovered = hovered;
      this.canvas.style.cursor = hovered ? "pointer" : "";
      this.emitHover();
    }
  };

  private onPointerLeave = () => {
    if (!this.state.player.hovered) return;
    this.state.player.hovered = false;
    this.canvas.style.cursor = "";
    this.emitHover();
  };

  private onPointerDown = (e: PointerEvent) => {
    if (this.state.paused) return;
    if (!this.overPlayer(this.toRoom(e))) return;
    e.preventDefault();
    this.state.player.waveFor = 1.5;
  };

  private emitHover() {
    const p = this.state.player;
    this.cb.onHoverPlayer(p.hovered, { x: p.pos.x, y: p.pos.y });
  }

  private runAction(target: FocusTarget) {
    const { action } = target.interactable;
    const player = this.state.player;

    switch (action.type) {
      case "panel":
        this.cb.onOpenPanel(action.panel);
        return;
      case "toggleLight":
        this.audio.toggleSwitch(!this.state.lightsOn);
        this.cb.onToggleLight();
        return;
      case "takeWater":
        if (player.carryingWater) return;
        player.carryingWater = true;
        this.audio.pour();
        this.cb.onCarryChange(true);
        return;
      case "waterPlant": {
        const plant = this.state.plants[action.plant];
        if (!player.carryingWater || plant.watered) return;
        plant.watered = true;
        plant.since = 0;
        player.carryingWater = false;
        this.audio.pour();
        this.cb.onCarryChange(false);
        return;
      }
    }
  }

  private readAxis(): Vec2 {
    let x = this.touchAxis.x;
    let y = this.touchAxis.y;
    for (const action of this.held) {
      const dir = AXIS[action];
      x += dir[0];
      y += dir[1];
    }
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }

  private moveAxis(delta: number, axis: "x" | "y") {
    const p = this.state.player;
    const before = p.pos[axis];
    p.pos[axis] = before + delta;
    if (isSolidAt(playerBox(p.pos))) p.pos[axis] = before;
  }

  private updatePlayer(dt: number) {
    const p = this.state.player;
    const axis = this.state.paused ? { x: 0, y: 0 } : this.readAxis();
    const moving = axis.x !== 0 || axis.y !== 0;

    if (moving) {
      this.moveAxis(axis.x * PLAYER_SPEED * dt, "x");
      this.moveAxis(axis.y * PLAYER_SPEED * dt, "y");
      p.walkPhase += dt * 8;
      p.idlePhase = 0;
      // Walking cancels a wave part way through, which feels right.
      p.waveFor = 0;

      let facing: Facing = p.facing;
      if (Math.abs(axis.x) > Math.abs(axis.y)) facing = axis.x > 0 ? "right" : "left";
      else facing = axis.y > 0 ? "down" : "up";
      p.facing = facing;

      // Two footfalls per four-frame cycle.
      if (Math.floor(p.walkPhase / 2) !== Math.floor(this.lastStepPhase / 2)) {
        this.audio.step(pointInRect(p.pos, RUG) ? "rug" : "floor");
      }
      this.lastStepPhase = p.walkPhase;

      if (!this.hasMoved) {
        this.hasMoved = true;
        this.cb.onFirstMove?.();
      }
      if (p.hovered) this.emitHover();
    } else {
      p.walkPhase = 0;
      this.lastStepPhase = 0;
      p.idlePhase += dt;
      if (p.waveFor > 0) p.waveFor = Math.max(0, p.waveFor - dt);
    }
    p.moving = moving;
  }

  private updateBall(dt: number) {
    const ball = this.state.ball;
    const p = this.state.player.pos;

    // A moving player nudges the ball away along the contact normal.
    const dx = ball.pos.x - p.x;
    const dy = ball.pos.y - p.y;
    const dist = Math.hypot(dx, dy);
    const contact = PLAYER_HALF_W + BALL_RADIUS + 2;
    if (dist < contact && dist > 0.001) {
      const nx = dx / dist;
      const ny = dy / dist;
      const push = this.state.player.moving ? 150 : 55;
      ball.vel.x = nx * push;
      ball.vel.y = ny * push;
      ball.pos.x = p.x + nx * contact;
      ball.pos.y = p.y + ny * contact;
      if (isSolidAt(ballBox(ball.pos))) {
        ball.pos.x = p.x + nx * contact;
        ball.pos.y = p.y + ny * contact;
      }
      this.audio.bump(0.6);
    }

    const speed = Math.hypot(ball.vel.x, ball.vel.y);
    if (speed < 3) {
      ball.vel.x = 0;
      ball.vel.y = 0;
      return;
    }

    // Rolling friction, then a bounce off anything solid, axis by axis.
    const damp = Math.exp(-1.7 * dt);
    ball.vel.x *= damp;
    ball.vel.y *= damp;
    ball.spin += (speed / BALL_RADIUS) * dt * 0.5;

    const beforeX = ball.pos.x;
    ball.pos.x += ball.vel.x * dt;
    if (isSolidAt(ballBox(ball.pos))) {
      ball.pos.x = beforeX;
      ball.vel.x *= -0.55;
      if (speed > 40) this.audio.bump(Math.min(1, speed / 220));
    }
    const beforeY = ball.pos.y;
    ball.pos.y += ball.vel.y * dt;
    if (isSolidAt(ballBox(ball.pos))) {
      ball.pos.y = beforeY;
      ball.vel.y *= -0.55;
      if (speed > 40) this.audio.bump(Math.min(1, speed / 220));
    }
  }

  private spawnBug() {
    const remaining: number[] = [];
    for (let i = 0; i < BUG_SPECIES; i++) {
      if (!this.state.caught.includes(i)) remaining.push(i);
    }
    if (remaining.length === 0) return;

    const spot = randomFreeSpot(this.state, 8, Math.random);
    if (!spot) return;

    const angle = Math.random() * Math.PI * 2;
    const bug: Bug = {
      id: this.nextBugId++,
      species: remaining[Math.floor(Math.random() * remaining.length)],
      pos: spot,
      dir: { x: Math.cos(angle), y: Math.sin(angle) },
      speed: 16 + Math.random() * 14,
      life: 0,
      maxLife: 0,
      turnIn: 0.5 + Math.random(),
      alpha: 0,
    };
    bug.maxLife = 20 + Math.random() * 10;
    bug.life = bug.maxLife;
    this.state.bugs.push(bug);
  }

  private updateBugs(dt: number) {
    const complete = this.state.caught.length >= BUG_SPECIES;

    if (!complete && !this.state.paused) {
      this.bugTimer -= dt;
      if (this.bugTimer <= 0 && this.state.bugs.length < 2) {
        this.spawnBug();
        this.bugTimer = 8 + Math.random() * 10;
      }
    }

    const player = this.state.player.pos;
    for (let i = this.state.bugs.length - 1; i >= 0; i--) {
      const bug = this.state.bugs[i];
      bug.life -= dt;
      // Fade in on arrival, fade out as it gives up and leaves.
      const fadeIn = Math.min(1, (bug.maxLife - bug.life) / 0.5);
      bug.alpha = Math.max(0, Math.min(fadeIn, Math.min(1, bug.life / 1.2)));

      bug.turnIn -= dt;
      if (bug.turnIn <= 0) {
        const angle = Math.random() * Math.PI * 2;
        bug.dir = { x: Math.cos(angle), y: Math.sin(angle) };
        bug.turnIn = 0.5 + Math.random() * 1.5;
      }

      const next = {
        x: bug.pos.x + bug.dir.x * bug.speed * dt,
        y: bug.pos.y + bug.dir.y * bug.speed * dt,
      };
      const box = { x: next.x - 4, y: next.y - 4, w: 8, h: 8 };
      const inside =
        next.x > FLOOR.x + 6 &&
        next.x < FLOOR.x + FLOOR.w - 6 &&
        next.y > FLOOR.y + 6 &&
        next.y < FLOOR.y + FLOOR.h - 6;
      if (inside && !isSolidAt(box)) {
        bug.pos = next;
      } else {
        // Turn away rather than walking into furniture.
        bug.dir = { x: -bug.dir.x, y: -bug.dir.y };
        bug.turnIn = 0.4 + Math.random();
      }

      if (bug.life <= 0) {
        this.state.bugs.splice(i, 1);
        continue;
      }

      // Caught by walking into it.
      if (
        bug.alpha > 0.4 &&
        Math.hypot(bug.pos.x - player.x, bug.pos.y - player.y) < 9
      ) {
        this.state.bugs.splice(i, 1);
        if (!this.state.caught.includes(bug.species)) {
          this.state.caught.push(bug.species);
          this.audio.catchBug();
          this.cb.onCaught(bug.species, this.state.caught.length);
        }
      }
    }
  }

  private updateFocus() {
    const state = this.state;
    let best: Interactable | null = null;
    let bestDist = Infinity;

    for (const item of INTERACTABLES) {
      if (item.enabled && !item.enabled(state)) continue;
      const d = distanceToRect(state.player.pos, item.bounds);
      if (d <= item.reach && d < bestDist) {
        best = item;
        bestDist = d;
      }
    }

    let target: FocusTarget | null = null;
    if (best) {
      const verbKey = best.resolveVerb ? best.resolveVerb(state) : best.verbKey;
      const actionable =
        best.action.type !== "waterPlant" || state.player.carryingWater;
      target = { interactable: best, verbKey, actionable };
    }

    // Only tell React when something it would render actually changed.
    const key = target
      ? target.interactable.id + "|" + target.verbKey + "|" + target.actionable
      : "";
    if (key !== this.focusKey) {
      this.focusKey = key;
      state.focused = target;
      this.cb.onFocus(target);
    } else {
      state.focused = target;
    }
  }

  private update(dt: number) {
    this.updatePlayer(dt);
    this.updateBall(dt);
    this.updateBugs(dt);
    for (const plant of this.state.plants) {
      if (plant.watered) plant.since += dt;
    }
    this.updateFocus();
  }

  private tick = (now: number) => {
    if (!this.running) return;
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.state.time += dt;
    this.update(dt);
    this.renderer.draw(this.state);
    this.raf = requestAnimationFrame(this.tick);
  };
}
