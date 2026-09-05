# Furkan Eroğlu — playable portfolio

A portfolio that is a small top-down room. You walk around with **WASD / arrow
keys** and press **E** to inspect things. Each object opens a panel with real
portfolio content. Anyone who would rather just read gets the same content
through **View Portfolio**.

Next.js (App Router) · TypeScript · Tailwind CSS · plain Canvas 2D. No game
engine, no sprite assets, no audio files — the room is drawn from code and every
sound is synthesised at runtime.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## What is in the room

| Object | What it does |
| --- | --- |
| Laptop | Moriqa — the production SaaS |
| Wall screen / dev station | The co-op horror prototype |
| Workbench | Skills |
| Door | Contact |
| Server rack | Settings: volume, sound effects, language, key bindings |
| Display case | The bug collection |
| Water cooler | Fill a cup, then water the plants |
| Light switch | Day / night — this is the theme toggle |

And a few things that are just alive: a ball that takes a kick and bounces off
the furniture, bugs that wander in now and then and can be caught by walking
into them, and three plants that perk up once watered.

## Themes

Daylight is the default. The switch on the back wall turns the lights off and
puts the room into its night palette; the choice is remembered in
`localStorage` and applied before the first paint, so there is no flash of the
wrong room. There is deliberately no theme button in the page header — the
switch on the wall is the control. That does mean the plain portfolio view
inherits whatever the room was last set to.

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

## Language

The settings panel switches the interface between English and Turkish. That
covers the game and UI chrome: prompts, settings, the collection, the footer and
the mode switch. Project descriptions stay in English — they are portfolio
content rather than interface. To translate them too, give `PROJECTS` a per
-language variant and pick it with `settings.language`.

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
    engine.ts             loop, input, movement, ball physics, bugs, watering
    render.ts             all drawing: room, character, lighting, atmosphere
    audio.ts              synthesised footsteps, bumps and chimes
    settings.ts           volume, language and key bindings + persistence
    i18n.ts               the English and Turkish string tables
  components/
    Experience.tsx        play / portfolio mode switch
    RoomStage.tsx         the room frame and its overlays
    GameCanvas.tsx        canvas + engine lifecycle
    InteractPrompt.tsx    the floating [E] label
    KeyHint.tsx           key caps used in the footer and the prompt
    TouchControls.tsx     thumbstick + interact button
    PortfolioView.tsx     the plain reading version
    panels/               modal shell, settings, collection and content bodies
```

## Adding a project

1. Add an entry to `PROJECTS` in `src/content/portfolio.ts`.
2. Add its id to `PanelId` in `src/game/types.ts`.
3. Add an interactable to `INTERACTABLES` in `src/game/world.ts` — `bounds` for
   the reach test and the highlight, `promptAt` for the label — plus a solid in
   `SOLIDS` and a draw call in `render.ts` if it is new furniture.
4. Route the new id in `components/panels/PanelHost.tsx`.

Objects are reachable from every side: the prompt measures distance to the
object's whole rectangle, not to one hand-placed spot.

## Adding a theme

Add a `RoomTheme` to `src/game/theme.ts` — TypeScript will list any colour token
you forgot — then add matching CSS variables under an `html[data-theme="..."]`
block in `src/app/globals.css` for the page chrome. No component knows which
theme it is in.

## Mobile

Phones get the plain portfolio by default, since a 448×256 room on a portrait
screen is small. The room is still one tap away via **Play**, with a thumbstick
and an interact button underneath it.
