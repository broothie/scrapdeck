import type { Board } from "../../types";

type BoardSidebarProps = {
  boards: Board[];
  activeBoardId: string;
  onSelectBoard: (boardId: string) => void;
};

export function BoardSidebar({
  boards,
  activeBoardId,
  onSelectBoard,
}: BoardSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <p className="sidebar__eyebrow">Scrapdeck</p>
        <h1>Boards</h1>
        <p className="sidebar__copy">
          Spatial collections for notes, images, and saved links.
        </p>
      </div>

      <nav className="sidebar__nav" aria-label="Boards">
        {boards.map((board) => {
          const isActive = board.id === activeBoardId;

          return (
            <button
              key={board.id}
              className={`board-nav-item${isActive ? " is-active" : ""}`}
              onClick={() => onSelectBoard(board.id)}
              type="button"
            >
              <span className="board-nav-item__title">{board.title}</span>
              <span className="board-nav-item__meta">
                {board.scraps.length} scraps
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
