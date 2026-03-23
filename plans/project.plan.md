# Plumboard

A frontend-first prototype for a spatial note board. The first goal is to prove the interaction model: a sidebar of boards, a large board area, and mixed content notes that feel good to browse and arrange.

---

## Product Goal

Build a believable prototype that answers one question well:

**Does Plumboard feel compelling when a user can switch between boards and arrange text notes, images, and website previews on a large visual surface?**

This phase is intentionally frontend-only. No auth, backend, uploads, or live scraping yet.

---

## Prototype MVP

### In Scope

- [ ] Left sidebar with a list of boards
- [ ] Board selection with active state
- [ ] Main board view filling most of the screen
- [ ] Render text notes
- [ ] Render image notes
- [ ] Render website preview notes
- [ ] Mixed board content from local mock data
- [ ] Freeform positioning of notes on the board
- [ ] Basic drag-to-move interaction for notes
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
3. See at least three note types on the board: text notes, images, and website previews
4. Move notes around and understand the spatial canvas concept without explanation

---

## Recommended MVP Shape

To keep risk low, the first text notes should be **styled text cards**, not full rich text editors. The goal is layout and interaction, not authoring depth.

Likewise, website previews should be rendered from **mock metadata** rather than fetched from real URLs. That still validates the visual model.

### Suggested MVP Slice

1. App shell with sidebar and board viewport
2. Mock board data and board switching
3. Board renderer with absolute-positioned notes
4. Three note components:
   - Note card
   - Image card
   - Website preview card
5. Dragging notes within the board
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
- Embedding custom text note, image, and website preview cards is easy to prototype in plain React
- A simpler board lets us iterate on visuals and layout faster
- We can still migrate to `tldraw` later if pan/zoom, selection, and richer manipulation become the bottleneck

---

## User Experience

### Layout

- Fixed left sidebar for board list
- Main content area dedicated to the active board
- Large board surface with subtle background texture or grid
- Note cards with distinct visual treatments by type

### Note Types

#### Text Note

- Title optional
- Body text preview
- Soft card styling
- Sized to feel quick and lightweight

#### Image Note

- Large image-first presentation
- Optional caption
- Rounded card container

#### Website Preview Note

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
  notes: Note[]
}

type Note = TextNote | ImageNote | LinkNote

type NoteBase = {
  id: string
  type: "text" | "image" | "link"
  x: number
  y: number
  width: number
  height: number
}

type TextNote = NoteBase & {
  type: "text"
  title?: string
  body: string
}

type ImageNote = NoteBase & {
  type: "image"
  src: string
  alt: string
  caption?: string
}

type LinkNote = NoteBase & {
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

- [ ] Render notes from local data
- [ ] Add text note component
- [ ] Add image note component
- [ ] Add website preview note component
- [ ] Add visual board background

### Phase 3: Interaction

- [ ] Make notes draggable
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
│   │   │   ├── NoteRenderer.tsx
│   │   │   └── notes/
│   │   │       ├── TextNote.tsx
│   │   │       ├── ImageNote.tsx
│   │   │       └── LinkNote.tsx
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
2. Create/edit/delete notes
3. Board creation
4. Real image upload flow
5. Real link preview fetching
6. Backend persistence and auth
