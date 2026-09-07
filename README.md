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
| Water cooler | Hold interact for three seconds to fill a cup |
| Light switch | Day / night — this is the theme toggle |

And a few things that are just alive: a ball that takes a kick and bounces off
the furniture — hover it for a **reset** label, or click it, to send it home —
bugs that wander in now and then and can be caught by walking into them, and
three plants that perk up once watered. Filling a cup and emptying it over a pot
are both three-second holds, with a progress bar over the character and an
animation to match.

## Themes

Daylight is the default. The switch on the back wall turns the lights off and
puts the room into its night palette; the choice is remembered in
`localStorage` and applied before the first paint, so there is no flash of the
wrong room. There is deliberately no theme button in the page header — the
switch on the wall is the control. That does mean the plain portfolio view
inherits whatever the room was last set to.

## Content

Everything a visitor reads lives in
[`src/content/portfolio.ts`](src/content/portfolio.ts): profile, projects,
skills and the links in `LINKS` (email, GitHub, LinkedIn, CV path, gameplay
video). A link left empty renders as a disabled `· soon` button rather than a
dead one, so a half-filled entry never ships broken.

## Deploying

The whole site prerenders to static output, so any host works; Vercel needs no
configuration. Two things worth knowing:

- **Share card.** [`src/app/opengraph-image.tsx`](src/app/opengraph-image.tsx)
  draws the card at build time with `next/og`. Its absolute URL comes from
  `metadataBase`, which reads `NEXT_PUBLIC_SITE_URL` and otherwise falls back to
  Vercel's own production URL. On a custom domain, set `NEXT_PUBLIC_SITE_URL`.
- **Favicon.** [`src/app/icon.svg`](src/app/icon.svg) is the character from the
  room, drawn on a 16px grid so it survives at tab size.

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
  app/
    icon.svg              favicon
    opengraph-image.tsx   the share card, drawn with next/og
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

## Moving things around

Everything sits where [`src/game/layout.ts`](src/game/layout.ts) says it does:
spawn points, the rug, the wall screen, the furniture and the plant pots.
Everything else — solids, interaction boxes, prompt anchors, the dev station
highlight — is derived from those numbers in `world.ts`, so a piece only ever
has one position.

Run `npm run dev` and open **/editor** to drag them. Select a box and nudge it
with the arrow keys, hold Shift for eight at a time, or type a width and height.
**Save to layout.ts** rewrites the file and the room hot-reloads.

The editor is development only. A production build answers 404 for both
`/editor` and the `/api/layout` route that writes the file, so a deployed site
has no way to rewrite its own source.

## Adding a theme

Add a `RoomTheme` to `src/game/theme.ts` — TypeScript will list any colour token
you forgot — then add matching CSS variables under an `html[data-theme="..."]`
block in `src/app/globals.css` for the page chrome. No component knows which
theme it is in.

## Mobile

Phones get the plain portfolio by default, since a 448×256 room on a portrait
screen is small. The room is still one tap away via **Play**, with a thumbstick
and an interact button underneath it.
