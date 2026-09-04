export type Rect = { x: number; y: number; w: number; h: number };

export type Vec2 = { x: number; y: number };

export type Facing = "up" | "down" | "left" | "right";

/** Every panel the room can open. Add a new id here + a case in PanelHost. */
export type PanelId = "moriqa" | "coop-horror" | "skills" | "contact";

export type Interactable = {
  id: string;
  /** Where the player must stand near (world units). */
  focus: Vec2;
  /** Where the [E] prompt floats, hand-placed to clear the player and the object. */
  promptAt: Vec2;
  /** Verb shown in the prompt: "[E] Inspect". */
  verb: string;
  /** Object name shown under the prompt. */
  name: string;
  /** How close the player's feet must be to trigger the prompt. */
  radius: number;
  panel: PanelId;
  /** Bounds used to draw the focus highlight. */
  bounds: Rect;
};

export type Player = {
  /** Feet position, i.e. the point that collides with the floor plan. */
  pos: Vec2;
  vel: Vec2;
  facing: Facing;
  /** Accumulated distance walked, drives the walk-cycle frame. */
  walkPhase: number;
  moving: boolean;
};

export type GameState = {
  player: Player;
  time: number;
  focused: Interactable | null;
  /** True while a panel is open — the world keeps rendering but input is frozen. */
  paused: boolean;
};
