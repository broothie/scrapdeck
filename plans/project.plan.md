# Plumboard

A frontend-first prototype for a spatial note board. The first goal is to prove the interaction model: a sidebar of boards, a large board area, and mixed content scraps that feel good to browse and arrange.

---

## Product Goal

Build a believable prototype that answers one question well:

**Does Plumboard feel compelling when a user can switch between boards and arrange notes, images, and website previews on a large visual surface?**

This phase is intentionally frontend-only. No auth, backend, uploads, or live scraping yet.

---

## Prototype MVP

### In Scope

- [ ] Left sidebar with a list of boards
- [ ] Board selection with active state
- [ ] Main board view filling most of the screen
- [ ] Render note scraps
- [ ] Render image scraps
- [ ] Render website preview scraps
- [ ] Mixed board content from local mock data
- [ ] Freeform positioning of scraps on the board
- [ ] Basic drag-to-move interaction for scraps
- [ ] Simple board pan and zoom, if supported cheaply by the canvas choice

### Explicitly Out of Scope

- [ ] Auth
- [ ] Persistence to a backend
- [ ] Real uploads
- [ ] Real Open Graph scraping
- [ ] Thoughtstream
- [ ] Multiplayer
- [ ] Mobile polish
- [ ] Rich text editing
- [ ] Keyboard shortcuts
- [ ] Export

### Demo Standard

The prototype is successful if a user can:

1. Open the app and immediately see multiple boards in a sidebar
2. Switch between boards and feel that each board has a different personality
3. See at least three scrap types on the board: notes, images, and website previews
4. Move scraps around and understand the spatial canvas concept without explanation

---

## Recommended MVP Shape

To keep risk low, the first note scraps should be **styled text cards**, not full rich text editors. The goal is layout and interaction, not authoring depth.

Likewise, website previews should be rendered from **mock metadata** rather than fetched from real URLs. That still validates the visual model.

### Suggested MVP Slice

1. App shell with sidebar and board viewport
2. Mock board data and board switching
3. Board renderer with absolute-positioned scraps
4. Three scrap components:
   - Note card
   - Image card
   - Website preview card
5. Dragging scraps within the board
6. Optional: lightweight pan/zoom

---

## Tech Direction

### Best Fit for the Prototype

- **React**
- **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Zustand** for local UI state

### Canvas Decision

For the frontend-only prototype, start with a **simple custom board surface** using absolute-positioned elements inside a pannable container.

Do **not** begin with `tldraw` unless we specifically want to prototype advanced canvas mechanics right away. `tldraw` is still a strong option later, but it adds integration complexity before we know whether the product feel works.

### Why Not Start with `tldraw`

- The hardest part of the app is content rendering and interaction design, not infinite-canvas infrastructure
- Embedding custom note, image, and website preview cards is easy to prototype in plain React
- A simpler board lets us iterate on visuals and layout faster
- We can still migrate to `tldraw` later if pan/zoom, selection, and richer manipulation become the bottleneck

---

## User Experience

### Layout

- Fixed left sidebar for board list
- Main content area dedicated to the active board
- Large board surface with subtle background texture or grid
- Scrap cards with distinct visual treatments by type

### Scrap Types

#### Note Scrap

- Title optional
- Body text preview
- Soft card styling
- Sized to feel quick and lightweight

#### Image Scrap

- Large image-first presentation
- Optional caption
- Rounded card container

#### Website Preview Scrap

- Site hostname / favicon area
- Preview image if available
- Title and description
- Strong “saved link” feel rather than generic card UI

---

## Frontend Data Model

Use local TypeScript objects for the prototype.

```ts
type Board = {
  id: string
  title: string
  scraps: Scrap[]
}

type Scrap = NoteScrap | ImageScrap | LinkScrap

type ScrapBase = {
  id: string
  type: "note" | "image" | "link"
  x: number
  y: number
  width: number
  height: number
}

type NoteScrap = ScrapBase & {
  type: "note"
  title?: string
  body: string
}

type ImageScrap = ScrapBase & {
  type: "image"
  src: string
  alt: string
  caption?: string
}

type LinkScrap = ScrapBase & {
  type: "link"
  url: string
  siteName: string
  title: string
  description?: string
  previewImage?: string
}
```

---

## Implementation Plan

### Phase 1: Shell

- [ ] Create app scaffold
- [ ] Build sidebar
- [ ] Build board viewport layout
- [ ] Add seeded mock boards

### Phase 2: Board Rendering

- [ ] Render scraps from local data
- [ ] Add note scrap component
- [ ] Add image scrap component
- [ ] Add website preview scrap component
- [ ] Add visual board background

### Phase 3: Interaction

- [ ] Make scraps draggable
- [ ] Keep drag state local in memory
- [ ] Add active / hover styling
- [ ] Optional pan and zoom

### Phase 4: Demo Polish

- [ ] Create 2-4 boards with varied sample content
- [ ] Refine spacing, sizing, and typography
- [ ] Make the board visually interesting enough for screenshots or a short demo

---

## Suggested Project Structure

```
plumboard/
├── src/
│   ├── app/
│   │   └── App.tsx
│   ├── components/
│   │   ├── board/
│   │   │   ├── BoardView.tsx
│   │   │   ├── BoardSurface.tsx
│   │   │   ├── ScrapRenderer.tsx
│   │   │   └── scraps/
│   │   │       ├── NoteScrap.tsx
│   │   │       ├── ImageScrap.tsx
│   │   │       └── LinkScrap.tsx
│   │   └── sidebar/
│   │       └── BoardSidebar.tsx
│   ├── data/
│   │   └── mockBoards.ts
│   ├── store/
│   │   └── useAppStore.ts
│   ├── types/
│   │   └── index.ts
│   ├── styles/
│   │   └── globals.css
│   └── main.tsx
├── public/
│   └── demo-assets/
└── ...config files
```

---

## Decisions

- **Frontend-only first** keeps focus on product feel instead of infrastructure
- **Mock data over backend** is enough to validate layout and interaction
- **Styled text cards over rich text editing** reduces early complexity
- **Mock website metadata over live preview fetches** makes the prototype deterministic
- **Custom board surface first** is the fastest route to a convincing MVP

---

## Next MVP After the Prototype

If the prototype works, the next real MVP can add:

1. Local persistence
2. Create/edit/delete scraps
3. Board creation
4. Real image upload flow
5. Real link preview fetching
6. Backend persistence and auth
