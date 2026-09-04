# Furkan Eroğlu — playable portfolio

A portfolio that is a small top-down room. You walk around with **WASD / arrow
keys** and press **E** to inspect the laptop, the dev station, the workbench and
the door. Each one opens a panel with real portfolio content. Anyone who would
rather just read gets the same content through **View Portfolio**.

Next.js (App Router) · TypeScript · Tailwind CSS · plain Canvas 2D. No game
engine, no sprite assets — the room is drawn from code, so the whole thing is a
few kilobytes of JavaScript.

The room comes in two themes, swapped with the sun/moon button in the header:
**Dark** (a dim industrial basement) and **Bright** (the same room at midday,
repainted in colour). The choice is remembered in `localStorage` and applied
before the first paint, so there is no flash of the wrong room.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Before you deploy — four things to fill in

All of them live in [`src/content/portfolio.ts`](src/content/portfolio.ts),
marked with `TODO`:

| What | Where |
| --- | --- |
| GitHub profile URL | `LINKS.github` |
| LinkedIn profile URL | `LINKS.linkedin` |
| Co-op horror gameplay video URL | `LINKS.coopHorrorVideo` |
| Your CV PDF | drop it at `public/cv/furkan-eroglu-cv.pdf` |

A link left empty renders as a disabled `· soon` button rather than a dead link,
so nothing breaks if you ship before filling one in.

The email in `LINKS.email` is currently `erogllu.furkan@gmail.com` — change it if
you would rather publish a different address.

## Layout

```
src/
  content/portfolio.ts    all copy, projects, skills and links — the only file
                          you need to touch to add a project
  game/
    types.ts              shared shapes
    theme.ts              the two palettes: every colour, light and emissive
                          panel the room is drawn with
    world.ts              room dimensions, furniture, collision, interactables
    engine.ts             loop, input, movement, collision, focus detection
    render.ts             all drawing: room, character, lighting, atmosphere
  components/
    Experience.tsx        play / portfolio mode switch
    RoomStage.tsx         the room frame and its overlays
    ThemeToggle.tsx       the dark / bright switch
    GameCanvas.tsx        canvas + engine lifecycle
    InteractPrompt.tsx    the floating [E] label
    TouchControls.tsx     thumbstick + interact button
    PortfolioView.tsx     the plain reading version
    panels/               modal shell and the panel bodies
```

## Adding a project

1. Add an entry to `PROJECTS` in `src/content/portfolio.ts`.
2. Add its id to `PanelId` in `src/game/types.ts`.
3. Add an interactable to `INTERACTABLES` in `src/game/world.ts` (a `focus`
   point the player stands near, a `promptAt` point for the label, and `bounds`
   for the highlight), plus a solid in `SOLIDS` and a draw call in `render.ts`
   if it is a new piece of furniture.
4. Route the new id in `components/panels/PanelHost.tsx`.

The project shows up in the plain portfolio view automatically.

## Adding a theme

Add a `RoomTheme` to `src/game/theme.ts` — TypeScript will list any colour token
you forgot — then add matching CSS variables under a
`html[data-theme="..."]` block in `src/app/globals.css` for the page chrome.
No component knows which theme it is in.

## Mobile

Phones get the plain portfolio by default, since a 448×256 room on a portrait
screen is small. The room is still one tap away via **Play**, with a thumbstick
and an interact button underneath it.
