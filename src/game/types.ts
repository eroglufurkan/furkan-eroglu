import type { StringKey } from "./i18n";

export type Rect = { x: number; y: number; w: number; h: number };

export type Vec2 = { x: number; y: number };

export type Facing = "up" | "down" | "left" | "right";

/** Every panel the room can open. Add a new id here + a case in PanelHost. */
export type PanelId =
  | "moriqa"
  | "coop-horror"
  | "skills"
  | "contact"
  | "settings"
  | "collection";

/** What pressing the interact key on an object actually does. */
export type InteractAction =
  | { type: "panel"; panel: PanelId }
  | { type: "toggleLight" }
  | { type: "takeWater" }
  | { type: "waterPlant"; plant: number };

export type Interactable = {
  id: string;
  /** i18n key for the object name shown next to the prompt. */
  nameKey: StringKey;
  /** i18n key for the verb, e.g. "Inspect". Some objects swap this at runtime. */
  verbKey: StringKey;
  /** Where the [E] prompt floats, hand-placed to clear the player and the object. */
  promptAt: Vec2;
  /**
   * How far from the object's edge the player can stand. Measured against the
   * whole rectangle, so an object is reachable from every side.
   */
  reach: number;
  action: InteractAction;
  /** Bounds used both for the focus highlight and for the reach test. */
  bounds: Rect;
  /**
   * Marks an object as one of the portfolio pieces a first-time visitor is
   * pointed at. Flavour props (plants, the cooler) are deliberately left out.
   */
  guide?: boolean;
  /** Seconds the interact key must be held. Omit for an instant action. */
  hold?: number;
  /** When false the object is skipped entirely — a fully watered plant, say. */
  enabled?: (state: GameState) => boolean;
  /** Lets an object change its verb with the world state. */
  resolveVerb?: (state: GameState) => StringKey;
};

/** What the interaction prompt is currently offering. */
export type FocusTarget = {
  interactable: Interactable;
  /** Resolved at runtime, so a plant can say "needs water" instead of "water". */
  verbKey: StringKey;
  /** False when the prompt is informational and pressing the key does nothing. */
  actionable: boolean;
};

export type Player = {
  /** Feet position, i.e. the point that collides with the floor plan. */
  pos: Vec2;
  facing: Facing;
  /** Accumulated distance walked, drives the walk-cycle frame. */
  walkPhase: number;
  /** Free-running while standing still, drives the breathing bob. */
  idlePhase: number;
  moving: boolean;
  /** Seconds left of the wave animation; 0 when not waving. */
  waveFor: number;
  /** True while the pointer is over the character. */
  hovered: boolean;
  carryingWater: boolean;
  /** What the hands are busy with, which drives the pose. */
  activity: "none" | "fill" | "water" | "drink";
  /** 0..1 through a held interaction. */
  activityProgress: number;
};

export type Ball = {
  pos: Vec2;
  vel: Vec2;
  /** True while the pointer is over it, which offers the reset label. */
  hovered: boolean;
  /** Rolling angle, purely cosmetic. */
  spin: number;
};

export type Bug = {
  id: number;
  species: number;
  pos: Vec2;
  dir: Vec2;
  speed: number;
  /** Seconds before it wanders back out of the room. */
  life: number;
  /** What life started at, so the entry fade knows how far along it is. */
  maxLife: number;
  /** Counts down between direction changes. */
  turnIn: number;
  /** 0..1 fade used on entry and exit. */
  alpha: number;
};

export type Plant = {
  id: number;
  /** Pot rectangle; also the solid. */
  bounds: Rect;
  watered: boolean;
  /** Seconds since watering, drives the little growth pop. */
  since: number;
};

export type GameState = {
  player: Player;
  ball: Ball;
  bugs: Bug[];
  plants: Plant[];
  /** Species indices already in the display case. */
  caught: number[];
  /** Ids of the guided objects already opened, so their markers can retire. */
  visited: string[];
  time: number;
  focused: FocusTarget | null;
  /** True while a panel is open — the world keeps rendering but input is frozen. */
  paused: boolean;
  /** Mirrors the theme so the wall switch can draw itself in the right position. */
  lightsOn: boolean;
  /**
   * The opening: the room starts under a scrim with one lit circle, which
   * expands to fill the frame once the visitor starts it.
   */
  reveal: {
    phase: "curtain" | "opening" | "open";
    /** 0..1 through the expansion. */
    t: number;
    /** Fixed, so walking during the expansion does not drag the circle. */
    center: Vec2;
  };
};
