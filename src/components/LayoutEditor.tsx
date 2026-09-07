"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LAYOUT, type RoomLayout } from "@/game/layout";
import { THEMES } from "@/game/theme";
import type { Rect, Vec2 } from "@/game/types";
import { BALL_RADIUS, ROOM_H, ROOM_W } from "@/game/world";

/** One draggable thing: either a rectangle or a bare point. */
type Handle =
  | { id: string; label: string; kind: "rect"; rect: Rect }
  | { id: string; label: string; kind: "point"; at: Vec2 };

const FURNITURE_LABELS: Record<keyof RoomLayout["furniture"], string> = {
  deskLaptop: "Laptop desk",
  deskMonitor: "Dev station desk",
  serverRack: "Server rack",
  workbench: "Workbench",
  crates: "Crates",
  door: "Door",
  cooler: "Water cooler",
  bugCase: "Bug case",
  lightSwitch: "Light switch",
};

function handlesFrom(layout: RoomLayout): Handle[] {
  return [
    { id: "spawn", label: "Player spawn", kind: "point", at: layout.spawn },
    { id: "ballSpawn", label: "Ball spawn", kind: "point", at: layout.ballSpawn },
    { id: "rug", label: "Rug", kind: "rect", rect: layout.rug },
    { id: "tv", label: "Wall screen", kind: "rect", rect: layout.tv },
    ...(Object.keys(layout.furniture) as (keyof RoomLayout["furniture"])[]).map(
      (key): Handle => ({
        id: "furniture." + key,
        label: FURNITURE_LABELS[key],
        kind: "rect",
        rect: layout.furniture[key],
      }),
    ),
    ...layout.plants.map(
      (pot, i): Handle => ({
        id: "plants." + i,
        label: "Plant " + (i + 1),
        kind: "rect",
        rect: pot,
      }),
    ),
  ];
}

/** Clamped position for a handle, given a target top-left in room units. */
function place(layout: RoomLayout, id: string, x: number, y: number): RoomLayout {
  const handle = handlesFrom(layout).find((h) => h.id === id);
  if (!handle) return layout;
  if (handle.kind === "point") {
    return withHandle(layout, id, {
      x: Math.round(Math.min(ROOM_W, Math.max(0, x))),
      y: Math.round(Math.min(ROOM_H, Math.max(0, y))),
    });
  }
  return withHandle(layout, id, {
    ...handle.rect,
    x: Math.round(Math.min(ROOM_W - 2, Math.max(-24, x))),
    y: Math.round(Math.min(ROOM_H - 2, Math.max(-24, y))),
  });
}

/** Replaces one handle's geometry, returning a new layout. */
function withHandle(layout: RoomLayout, id: string, next: Rect | Vec2): RoomLayout {
  const copy: RoomLayout = structuredClone(layout);
  if (id === "spawn") copy.spawn = next as Vec2;
  else if (id === "ballSpawn") copy.ballSpawn = next as Vec2;
  else if (id === "rug") copy.rug = next as Rect;
  else if (id === "tv") copy.tv = next as Rect;
  else if (id.startsWith("furniture.")) {
    const key = id.slice(10) as keyof RoomLayout["furniture"];
    copy.furniture[key] = next as Rect;
  } else if (id.startsWith("plants.")) {
    copy.plants[Number(id.slice(7))] = next as Rect;
  }
  return copy;
}

export default function LayoutEditor() {
  const [layout, setLayout] = useState<RoomLayout>(() => structuredClone(LAYOUT));
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [dark, setDark] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const handles = useMemo(() => handlesFrom(layout), [layout]);
  const current = handles.find((h) => h.id === selected) ?? null;
  const dirty = useMemo(
    () => JSON.stringify(layout) !== JSON.stringify(LAYOUT),
    [layout],
  );

  /** Pointer position in room units. */
  const toRoom = useCallback((e: React.PointerEvent | PointerEvent): Vec2 => {
    const frame = frameRef.current!;
    const r = frame.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * ROOM_W,
      y: ((e.clientY - r.top) / r.height) * ROOM_H,
    };
  }, []);

  const move = useCallback((id: string, x: number, y: number) => {
    setLayout((prev) => place(prev, id, x, y));
  }, []);

  /** Relative step, resolved inside the updater so held keys never drop one. */
  const nudge = useCallback((id: string, dx: number, dy: number) => {
    setLayout((prev) => {
      const handle = handlesFrom(prev).find((h) => h.id === id);
      if (!handle) return prev;
      const at = handle.kind === "point" ? handle.at : handle.rect;
      return place(prev, id, at.x + dx, at.y + dy);
    });
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!drag.current) return;
      const at = toRoom(e);
      move(drag.current.id, at.x - drag.current.dx, at.y - drag.current.dy);
    };
    const onUp = () => {
      drag.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [move, toRoom]);

  // Arrow keys nudge the selection; Shift jumps eight at a time.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 8 : 1;
      const delta: Record<string, [number, number]> = {
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
      };
      const d = delta[e.key];
      if (!d) return;
      e.preventDefault();
      nudge(selected, d[0], d[1]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, nudge]);

  const resize = (field: "w" | "h", value: number) => {
    if (!current || current.kind !== "rect") return;
    setLayout((prev) =>
      withHandle(prev, current.id, {
        ...current.rect,
        [field]: Math.max(2, Math.round(value)),
      }),
    );
  };

  const save = async () => {
    setStatus("Saving…");
    try {
      const res = await fetch("/api/layout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(layout),
      });
      const body = (await res.json()) as { error?: string };
      setStatus(res.ok ? "Written to src/game/layout.ts" : "Failed: " + body.error);
    } catch (error) {
      setStatus("Failed: " + (error instanceof Error ? error.message : "unknown"));
    }
  };

  const palette = THEMES[dark ? "dark" : "bright"].palette;

  return (
    <main className="min-h-dvh bg-void p-6 text-bone">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-mono text-sm tracking-[0.2em] uppercase">
              Room layout
            </h1>
            <p className="mt-1 font-mono text-[11px] text-bone-faint">
              Drag a box, or select it and nudge with the arrow keys. Shift for 8.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="rounded-[3px] border border-ash-600 px-3 py-1.5 font-mono text-[10px] tracking-wide text-bone-dim hover:border-bone-dim hover:text-bone"
            >
              {dark ? "Night" : "Day"}
            </button>
            <button
              type="button"
              onClick={() => setLayout(structuredClone(LAYOUT))}
              disabled={!dirty}
              className="rounded-[3px] border border-ash-600 px-3 py-1.5 font-mono text-[10px] tracking-wide text-bone-dim disabled:opacity-40 enabled:hover:border-bone-dim enabled:hover:text-bone"
            >
              Revert
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!dirty}
              className="rounded-[3px] bg-ember px-3 py-1.5 font-mono text-[10px] tracking-wide text-void disabled:opacity-40"
            >
              Save to layout.ts
            </button>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
          <div>
            <div
              ref={frameRef}
              onPointerDown={() => setSelected(null)}
              className="relative w-full overflow-hidden border border-ash-600 select-none"
              style={{
                aspectRatio: `${ROOM_W} / ${ROOM_H}`,
                background: palette.floor,
              }}
            >
              {/* Walls, so the playable area is obvious while dragging. */}
              <Band top={0} height={32} color={palette.wallBottom} />
              <Band top={ROOM_H - 16} height={16} color={palette.sideWall} />
              <Side left={0} color={palette.sideWall} />
              <Side left={ROOM_W - 16} color={palette.sideWall} />

              {handles.map((h) => {
                const box =
                  h.kind === "rect"
                    ? h.rect
                    : { x: h.at.x - 6, y: h.at.y - 6, w: 12, h: 12 };
                const active = h.id === selected;
                return (
                  <button
                    key={h.id}
                    type="button"
                    title={h.label}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setSelected(h.id);
                      const at = toRoom(e);
                      drag.current = {
                        id: h.id,
                        dx: at.x - box.x,
                        dy: at.y - box.y,
                      };
                    }}
                    className={`absolute cursor-move border text-left ${
                      active
                        ? "border-ember bg-ember/25 z-10"
                        : "border-bone/50 bg-bone/10 hover:bg-bone/20"
                    } ${h.kind === "point" ? "rounded-full" : ""}`}
                    style={{
                      left: `${(box.x / ROOM_W) * 100}%`,
                      top: `${(box.y / ROOM_H) * 100}%`,
                      width: `${(box.w / ROOM_W) * 100}%`,
                      height: `${(box.h / ROOM_H) * 100}%`,
                    }}
                  />
                );
              })}

              {/* The ball, drawn where it will actually sit. */}
              <span
                className="pointer-events-none absolute rounded-full border border-ember/70"
                style={{
                  left: `${((layout.ballSpawn.x - BALL_RADIUS) / ROOM_W) * 100}%`,
                  top: `${((layout.ballSpawn.y - BALL_RADIUS * 2) / ROOM_H) * 100}%`,
                  width: `${((BALL_RADIUS * 2) / ROOM_W) * 100}%`,
                  height: `${((BALL_RADIUS * 2) / ROOM_H) * 100}%`,
                }}
              />
            </div>

            <p className="mt-2 font-mono text-[10px] text-bone-faint">
              {ROOM_W} × {ROOM_H} · walls are drawn for reference and are not
              editable
            </p>
          </div>

          <aside className="flex flex-col gap-3">
            <div className="border border-ash-700 p-3">
              <p className="font-mono text-[10px] tracking-[0.18em] text-bone-faint uppercase">
                Selected
              </p>
              {current ? (
                <>
                  <p className="mt-1.5 text-sm">{current.label}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
                    <Field label="x" value={(current.kind === "point" ? current.at : current.rect).x} />
                    <Field label="y" value={(current.kind === "point" ? current.at : current.rect).y} />
                    {current.kind === "rect" && (
                      <>
                        <NumberField label="w" value={current.rect.w} onChange={(v) => resize("w", v)} />
                        <NumberField label="h" value={current.rect.h} onChange={(v) => resize("h", v)} />
                      </>
                    )}
                  </dl>
                </>
              ) : (
                <p className="mt-1.5 font-mono text-[11px] text-bone-faint">
                  Nothing selected.
                </p>
              )}
            </div>

            <ul className="max-h-[320px] overflow-y-auto border border-ash-700">
              {handles.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(h.id)}
                    className={`w-full px-3 py-1.5 text-left font-mono text-[11px] ${
                      h.id === selected
                        ? "bg-ash-800 text-bone"
                        : "text-bone-dim hover:bg-ash-800"
                    }`}
                  >
                    {h.label}
                  </button>
                </li>
              ))}
            </ul>

            {status && (
              <p className="font-mono text-[11px] text-bone-dim">{status}</p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function Band({ top, height, color }: { top: number; height: number; color: string }) {
  return (
    <span
      className="pointer-events-none absolute inset-x-0"
      style={{
        top: `${(top / ROOM_H) * 100}%`,
        height: `${(height / ROOM_H) * 100}%`,
        background: color,
      }}
    />
  );
}

function Side({ left, color }: { left: number; color: string }) {
  return (
    <span
      className="pointer-events-none absolute inset-y-0"
      style={{
        left: `${(left / ROOM_W) * 100}%`,
        width: `${(16 / ROOM_W) * 100}%`,
        background: color,
      }}
    />
  );
}

function Field({ label, value }: { label: string; value: number }) {
  return (
    <>
      <dt className="text-bone-faint">{label}</dt>
      <dd className="text-right tabular-nums">{value}</dd>
    </>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <>
      <dt className="text-bone-faint">{label}</dt>
      <dd className="text-right">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 border border-ash-600 bg-ash-900 px-1 py-0.5 text-right tabular-nums"
        />
      </dd>
    </>
  );
}
