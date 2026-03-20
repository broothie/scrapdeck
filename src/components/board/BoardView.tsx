import type { Board } from "../../types";
import { BoardSurface } from "./BoardSurface";
import { useAppStore } from "../../store/useAppStore";

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

type BoardViewProps = {
  board: Board;
};

export function BoardView({ board }: BoardViewProps) {
  const addScrap = useAppStore((state) => state.addScrap);

  const nextPlacement = () => {
    const offset = board.scraps.length * 22;

    return {
      x: 72 + (offset % 220),
      y: 88 + (offset % 180),
    };
  };

  const handleAddNote = () => {
    const { x, y } = nextPlacement();

    addScrap(board.id, {
      id: createId("note"),
      type: "note",
      x,
      y,
      width: 260,
      height: 190,
      title: "Fresh note",
      body: "Drop quick thoughts here and drag them into place.",
    });
  };

  const handleAddImage = () => {
    const { x, y } = nextPlacement();

    addScrap(board.id, {
      id: createId("image"),
      type: "image",
      x,
      y,
      width: 320,
      height: 250,
      src: "/demo-assets/studio-board.svg",
      alt: "Demo image scrap",
      caption: "Placeholder image for the prototype.",
    });
  };

  const handleAddLink = () => {
    const { x, y } = nextPlacement();

    addScrap(board.id, {
      id: createId("link"),
      type: "link",
      x,
      y,
      width: 360,
      height: 244,
      url: "https://example.com/new-reference",
      siteName: "Saved Link",
      title: "New website preview",
      description: "A placeholder saved link for testing composition on the board.",
      previewImage: "/demo-assets/design-dispatch.svg",
    });
  };

  return (
    <section className="board-view">
      <header className="board-view__header">
        <div className="board-view__title-block">
          <p className="board-view__eyebrow">Active board</p>
          <h2>{board.title}</h2>
          <p className="board-view__summary">{board.description}</p>
        </div>
        <div className="board-toolbar" aria-label="Create scraps">
          <button className="board-toolbar__button" onClick={handleAddNote} type="button">
            Add note
          </button>
          <button className="board-toolbar__button" onClick={handleAddImage} type="button">
            Add image
          </button>
          <button className="board-toolbar__button" onClick={handleAddLink} type="button">
            Add link
          </button>
        </div>
      </header>

      <BoardSurface board={board} />
    </section>
  );
}
