# Photographer Portfolio — Prismic Template

A Next.js + Prismic (Slice Machine) rebuild of an animated photography
portfolio: a homepage with a scrolling project list and crossfading hero
image, category filtering, and project pages with a swipeable image
gallery and info drawer.

This is a **starting template**, not a pixel-exact clone of the original
minified bundle — the visual language and interaction model are the same,
but the code is written to be readable and editable in Prismic without
touching JavaScript for day-to-day content changes.

## What's inside

```
customtypes/         Prismic custom type JSON — import these in Slice Machine
  homepage/           Singleton: homepage slice zone + SEO fields
  project/            Repeatable: one per portfolio project
  about/              Singleton: about page
  navigation/         Singleton: header/drawer links
  settings/           Singleton: site title, default SEO, favicon, accent color

slices/               Slice model JSON (paired with src/slices/* components)
  ProjectGrid/         Homepage list + hero scroller. Auto-lists all Projects,
                       or lets an editor hand-pick and order them.
  Gallery/             Project page image gallery (single view + thumbnails)
  TextBlock/           Rich text, with a "Pull Quote" variation
  ImageBlock/          Single image or side-by-side pair

src/
  app/                 Next.js App Router pages (/, /projects/[uid], /about)
  components/          SiteChrome (nav/drawer), ProjectFrame (project page chrome)
  slices/              React components matching each slice model
  lib/prismicio.js      Prismic client + route resolver
  styles/globals.css    All styling, with design tokens at the top
```

## Setting up in Prismic

1. Create a repository at prismic.io (or use an existing one).
2. `npm install`
3. Copy `.env.local.example` to `.env.local` and set
   `NEXT_PUBLIC_PRISMIC_ENVIRONMENT` to your repo name.
4. `npm run slicemachine` — this opens Slice Machine's UI at
   `localhost:9999`. Push the custom types and slices from there to your
   Prismic repo (Slice Machine reads the JSON files already in
   `customtypes/` and `slices/`, so this is a one-click sync, not a
   rebuild from scratch).
5. `npm run dev` to run the site against your repo's content.

## Customising the look

Nearly all visual customisation lives in `src/styles/globals.css`:

- **Fonts** — replace the `@font-face` blocks and `--font` variable near
  the top. The Google Fonts import can be swapped or removed.
- **Colors** — `--color-black`, `--color-white`, `--color-grey`,
  `--color-orange` (accent). The accent also has a matching field in the
  Settings custom type (`accent_color`) if you want editors to change it
  without a deploy — wire that into `globals.css` via a small inline
  `<style>` in `layout.js` reading `settings.data.accent_color` if needed.
- **Spacing** — `--site-frame-xs` / `--site-frame-xl` control the outer
  page margins at mobile/desktop breakpoints.
- **Animation feel** — `--anim-time`, `--anim-spring`, and the
  `--easing-*` variables are used throughout for transitions.

## Content model notes

- **Project category filter**: the categories shown in the filter are
  derived automatically from whatever values exist in the `category`
  field across your Project documents — no separate taxonomy to manage.
  Add a new category by just typing it into a Project's Category field
  (it's a Select field in `customtypes/project/index.json`; add new
  options there if you want a fixed list instead of free text).
- **Homepage ordering**: by default `ProjectGrid` lists every published
  Project ordered by the `year` field (adjust in
  `src/slices/ProjectGrid/index.js`). Turn off "Auto-list all published
  Projects" on the slice to manually pick and reorder projects instead.
- **Gallery images**: the Gallery slice on a Project stores one image per
  repeatable item — drag to reorder in Prismic's editor to reorder the
  gallery.

## What was simplified from the original

The original theme used a hand-built SPA router (a small library called
"Fil Nomad") with page-transition choreography, a custom scroll-physics
engine for the mobile project list, and a Web Worker for progressive
image loading. This template keeps the *result* (crossfades, swipe
gestures, thumbnail strips) but implements it with plain React state and
GSAP tweens, and relies on Next.js routing + `next/image`-style Prismic
image optimisation instead of a custom image pipeline. This trades a
small amount of animation polish for something that's realistic to
maintain and extend inside a CMS workflow.

## Deployment

Any Next.js host works (Vercel is the path of least resistance). Set the
same `NEXT_PUBLIC_PRISMIC_ENVIRONMENT` env var in your host's dashboard,
and add a Prismic webhook to trigger rebuilds on publish if you want
static regeneration on content changes.
