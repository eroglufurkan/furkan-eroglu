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
  /** How many of the guided portfolio pieces have been opened so far. */
  onVisited: (count: number) => void;
  /** Hover state for the ball, so the reset label can follow it. */
  onHoverBall: (hovered: boolean, at: Vec2) => void;
  onFirstMove?: () => void;
};

/** How long a sip takes, start to empty cup. */
const DRINK_SECONDS = 1.6;

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
  private interactDown = false;
  private holdTargetId: string | null = null;
  private holdElapsed = 0;
  private stopStream: (() => void) | null = null;
  /** Throttles the contact thud while the player leans on the ball. */
  private ballTouchCooldown = 0;
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
        activity: "none",
        activityProgress: 0,
      },
      ball: { pos: { ...BALL_SPAWN }, vel: { x: 0, y: 0 }, spin: 0, hovered: false },
      bugs: [],
      plants: PLANT_POTS.map((bounds, id) => ({
        id,
        bounds,
        watered: false,
        since: 0,
      })),
      caught: [],
      visited: [],
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

  /**
   * Interact key or on-screen button. Instant actions fire on the press; a
   * held action starts filling a progress bar and completes when it is full.
   */
  setInteractDown(down: boolean) {
    if (down === this.interactDown) return;
    this.interactDown = down;
    if (!down) {
      this.cancelHold();
      return;
    }
    if (this.state.paused) return;
    const focused = this.state.focused;
    if (!focused || !focused.actionable) return;
    if (!focused.interactable.hold) {
      this.runAction(focused);
      return;
    }
    this.beginHold(focused);
  }

  /** Kept for the touch button, which taps rather than holds. */
  pressInteract() {
    this.setInteractDown(true);
  }

  releaseInteract() {
    this.setInteractDown(false);
  }

  /** A sip from the carried cup: a short animation, no holding required. */
  drink() {
    const player = this.state.player;
    if (this.state.paused) return;
    if (!player.carryingWater || player.activity !== "none") return;
    player.activity = "drink";
    player.activityProgress = 0;
    player.waveFor = 0;
    this.audio.sip();
  }

  /** Sends the ball back to where it started. */
  resetBall() {
    const ball = this.state.ball;
    ball.pos = { ...BALL_SPAWN };
    ball.vel = { x: 0, y: 0 };
    ball.spin = 0;
    if (ball.hovered) {
      ball.hovered = false;
      this.canvas.style.cursor = this.state.player.hovered ? "pointer" : "";
      this.cb.onHoverBall(false, ball.pos);
    }
  }

  private beginHold(focused: FocusTarget) {
    const player = this.state.player;
    const bounds = focused.interactable.bounds;
    // Turn towards whatever is being used, so the pose reads.
    const dx = bounds.x + bounds.w / 2 - player.pos.x;
    const dy = bounds.y + bounds.h / 2 - player.pos.y;
    player.facing =
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";

    this.holdTargetId = focused.interactable.id;
    this.holdElapsed = 0;
    player.activity =
      focused.interactable.action.type === "takeWater" ? "fill" : "water";
    player.activityProgress = 0;
    this.stopStream = this.audio.startStream();
  }

  private cancelHold() {
    // Nothing to cancel, and no business clearing a drink that is under way.
    if (this.holdTargetId === null) return;
    this.holdTargetId = null;
    this.holdElapsed = 0;
    this.state.player.activity = "none";
    this.state.player.activityProgress = 0;
    this.stopStream?.();
    this.stopStream = null;
  }

  private updateHold(dt: number) {
    if (!this.holdTargetId) return;
    const focused = this.state.focused;
    const player = this.state.player;

    // Letting go, walking off, or the target changing all cancel the hold.
    if (
      this.state.paused ||
      !this.interactDown ||
      player.moving ||
      !focused ||
      !focused.actionable ||
      focused.interactable.id !== this.holdTargetId
    ) {
      this.cancelHold();
      return;
    }

    const hold = focused.interactable.hold ?? 0;
    this.holdElapsed += dt;
    player.activityProgress = Math.min(1, this.holdElapsed / hold);
    if (this.holdElapsed >= hold) {
      const done = focused;
      this.cancelHold();
      this.runAction(done);
      this.audio.confirm();
    }
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
    this.setInteractDown(false);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const action = this.keyMap.get(e.code);
    if (action || e.code === "Space") e.preventDefault();
    if (this.state.paused || e.repeat || !action) return;
    if (action === "interact") this.setInteractDown(true);
    else this.held.add(action);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const action = this.keyMap.get(e.code);
    if (!action) return;
    if (action === "interact") this.setInteractDown(false);
    else this.held.delete(action);
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

  private overBall(at: Vec2): boolean {
    const b = this.state.ball.pos;
    // The sprite sits a radius above the ground point it collides on.
    return Math.hypot(at.x - b.x, at.y - (b.y - BALL_RADIUS + 1)) <= BALL_RADIUS + 4;
  }

  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const at = this.toRoom(e);
    const player = this.state.player;
    const ball = this.state.ball;

    const onPlayer = this.overPlayer(at);
    // The character wins ties, so the reset label never steals a wave.
    const onBall = !onPlayer && this.overBall(at);

    if (onPlayer !== player.hovered) {
      player.hovered = onPlayer;
      this.emitHover();
    }
    if (onBall !== ball.hovered) {
      ball.hovered = onBall;
      this.cb.onHoverBall(onBall, { x: ball.pos.x, y: ball.pos.y });
    } else if (onBall) {
      // Keep the label glued to a ball that is still rolling.
      this.cb.onHoverBall(true, { x: ball.pos.x, y: ball.pos.y });
    }
    this.canvas.style.cursor = onPlayer || onBall ? "pointer" : "";
  };

  private onPointerLeave = () => {
    this.canvas.style.cursor = "";
    if (this.state.player.hovered) {
      this.state.player.hovered = false;
      this.emitHover();
    }
    if (this.state.ball.hovered) {
      this.state.ball.hovered = false;
      this.cb.onHoverBall(false, { ...this.state.ball.pos });
    }
  };

  private onPointerDown = (e: PointerEvent) => {
    if (this.state.paused) return;
    const at = this.toRoom(e);
    if (this.overPlayer(at)) {
      e.preventDefault();
      this.state.player.waveFor = 1.5;
      return;
    }
    if (this.overBall(at)) {
      e.preventDefault();
      this.resetBall();
    }
  };

  private emitHover() {
    const p = this.state.player;
    this.cb.onHoverPlayer(p.hovered, { x: p.pos.x, y: p.pos.y });
  }

  private runAction(target: FocusTarget) {
    const { action } = target.interactable;
    const player = this.state.player;

    switch (action.type) {
      case "panel": {
        const { id, guide } = target.interactable;
        // Opening a guided piece retires its marker for good.
        if (guide && !this.state.visited.includes(id)) {
          this.state.visited.push(id);
          this.cb.onVisited(this.state.visited.length);
        }
        this.cb.onOpenPanel(action.panel);
        return;
      }
      case "toggleLight":
        this.audio.toggleSwitch(!this.state.lightsOn);
        this.cb.onToggleLight();
        return;
      case "takeWater":
        if (player.carryingWater) return;
        player.carryingWater = true;
        this.cb.onCarryChange(true);
        return;
      case "waterPlant": {
        const plant = this.state.plants[action.plant];
        if (!player.carryingWater || plant.watered) return;
        plant.watered = true;
        plant.since = 0;
        player.carryingWater = false;
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

      // One footfall per four-frame cycle. The legs keep their own pace;
      // this only sets how often the sound repeats.
      if (Math.floor(p.walkPhase / 4) !== Math.floor(this.lastStepPhase / 4)) {
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

    if (p.activity === "drink") {
      if (moving) {
        // Walking off cancels the sip, and the water is kept.
        p.activity = "none";
        p.activityProgress = 0;
      } else {
        p.activityProgress += dt / DRINK_SECONDS;
        if (p.activityProgress >= 1) {
          p.activity = "none";
          p.activityProgress = 0;
          p.carryingWater = false;
          this.cb.onCarryChange(false);
        }
      }
    }
  }

  /** Moves the ball on one axis, reverting if that would put it inside a solid. */
  private moveBallAxis(delta: number, axis: "x" | "y"): boolean {
    const ball = this.state.ball;
    const before = ball.pos[axis];
    ball.pos[axis] = before + delta;
    if (isSolidAt(ballBox(ball.pos))) {
      ball.pos[axis] = before;
      return true;
    }
    return false;
  }

  private updateBall(dt: number) {
    const ball = this.state.ball;
    const p = this.state.player.pos;
    if (this.ballTouchCooldown > 0) this.ballTouchCooldown -= dt;

    // A moving player nudges the ball away along the contact normal. The
    // separation goes through moveBallAxis so a ball pinned against furniture
    // simply stays put instead of being shoved inside it.
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

      const separation = contact - dist;
      const blockedX = this.moveBallAxis(nx * separation, "x");
      const blockedY = this.moveBallAxis(ny * separation, "y");
      // Pinned against something: kill the component pointing into it, so the
      // ball rolls along the obstacle rather than trying to burrow through.
      if (blockedX) ball.vel.x = 0;
      if (blockedY) ball.vel.y = 0;

      if (this.ballTouchCooldown <= 0) {
        this.audio.bump(0.6);
        this.ballTouchCooldown = 0.22;
      }
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

    if (this.moveBallAxis(ball.vel.x * dt, "x")) {
      ball.vel.x *= -0.55;
      if (speed > 40 && this.ballTouchCooldown <= 0) {
        this.audio.bump(Math.min(1, speed / 220));
        this.ballTouchCooldown = 0.12;
      }
    }
    if (this.moveBallAxis(ball.vel.y * dt, "y")) {
      ball.vel.y *= -0.55;
      if (speed > 40 && this.ballTouchCooldown <= 0) {
        this.audio.bump(Math.min(1, speed / 220));
        this.ballTouchCooldown = 0.12;
      }
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
    this.updateHold(dt);
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
