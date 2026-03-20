import type { Board } from "../../types";
import { BoardSurface } from "./BoardSurface";

type BoardViewProps = {
  board: Board;
};

export function BoardView({ board }: BoardViewProps) {
  return (
    <section className="board-view">
      <header className="board-view__header">
        <div>
          <p className="board-view__eyebrow">Active board</p>
          <h2>{board.title}</h2>
        </div>
        <p className="board-view__summary">{board.description}</p>
      </header>

      <BoardSurface board={board} />
    </section>
  );
}
