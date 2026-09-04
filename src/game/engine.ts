import { createRenderer, type Renderer } from "./render";
import type { RoomTheme } from "./theme";
import type { Facing, GameState, Interactable, PanelId, Rect } from "./types";
import {
  INTERACTABLES,
  PLAYER_SPEED,
  SOLIDS,
  SPAWN,
  playerBox,
  rectsOverlap,
} from "./world";

const MOVE_KEYS: Record<string, [number, number]> = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

export type EngineCallbacks = {
  /** Fired when the object under the interaction prompt changes. */
  onFocus: (target: Interactable | null) => void;
  /** Fired when the player presses the interact key on a focused object. */
  onInteract: (panel: PanelId) => void;
  /** Fired once, the first time the player actually moves. */
  onFirstMove?: () => void;
};

function collides(box: Rect): boolean {
  for (const solid of SOLIDS) {
    if (rectsOverlap(box, solid)) return true;
  }
  return false;
}

export class GameEngine {
  private state: GameState;
  private renderer: Renderer;
  private keys = new Set<string>();
  /** Analogue input from the touch stick, -1..1 on each axis. */
  private touchAxis = { x: 0, y: 0 };
  private raf = 0;
  private last = 0;
  private running = false;
  private hasMoved = false;

  constructor(
    canvas: HTMLCanvasElement,
    theme: RoomTheme,
    private cb: EngineCallbacks,
  ) {
    this.renderer = createRenderer(canvas, theme);
    this.state = {
      player: {
        pos: { ...SPAWN },
        vel: { x: 0, y: 0 },
        facing: "down",
        walkPhase: 0,
        moving: false,
      },
      time: 0,
      focused: null,
      paused: false,
    };
  }

  start() {
    if (this.running) return;
    this.running = true;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.releaseAll);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.releaseAll);
  }

  /** While a panel is open the world keeps rendering but stops taking input. */
  setPaused(paused: boolean) {
    this.state.paused = paused;
    if (paused) this.releaseAll();
  }

  /** Repaints the room in another theme, mid-game. */
  setTheme(theme: RoomTheme) {
    this.renderer.setTheme(theme);
  }

  /** Touch joystick input, already normalised to the unit circle. */
  setTouchAxis(x: number, y: number) {
    this.touchAxis.x = x;
    this.touchAxis.y = y;
  }

  /** The on-screen interact button. */
  pressInteract() {
    if (this.state.paused) return;
    if (this.state.focused) this.cb.onInteract(this.state.focused.panel);
  }

  private releaseAll = () => {
    this.keys.clear();
    this.touchAxis.x = 0;
    this.touchAxis.y = 0;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code in MOVE_KEYS || e.code === "Space") e.preventDefault();
    if (this.state.paused) return;
    if (e.repeat) return;
    if (e.code in MOVE_KEYS) this.keys.add(e.code);
    if (e.code === "KeyE") this.pressInteract();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private readAxis(): { x: number; y: number } {
    let x = this.touchAxis.x;
    let y = this.touchAxis.y;
    for (const code of this.keys) {
      const dir = MOVE_KEYS[code];
      if (dir) {
        x += dir[0];
        y += dir[1];
      }
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
    if (collides(playerBox(p.pos))) p.pos[axis] = before;
  }

  private update(dt: number) {
    const p = this.state.player;
    const axis = this.state.paused ? { x: 0, y: 0 } : this.readAxis();
    const moving = axis.x !== 0 || axis.y !== 0;

    if (moving) {
      this.moveAxis(axis.x * PLAYER_SPEED * dt, "x");
      this.moveAxis(axis.y * PLAYER_SPEED * dt, "y");
      p.walkPhase += dt * 8;

      let facing: Facing = p.facing;
      if (Math.abs(axis.x) > Math.abs(axis.y)) facing = axis.x > 0 ? "right" : "left";
      else facing = axis.y > 0 ? "down" : "up";
      p.facing = facing;

      if (!this.hasMoved) {
        this.hasMoved = true;
        this.cb.onFirstMove?.();
      }
    } else {
      p.walkPhase = 0;
    }
    p.moving = moving;

    // Nearest interactable within its own radius wins.
    let best: Interactable | null = null;
    let bestDist = Infinity;
    for (const item of INTERACTABLES) {
      const d = Math.hypot(item.focus.x - p.pos.x, item.focus.y - p.pos.y);
      if (d <= item.radius && d < bestDist) {
        best = item;
        bestDist = d;
      }
    }
    if (best !== this.state.focused) {
      this.state.focused = best;
      this.cb.onFocus(best);
    }
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
