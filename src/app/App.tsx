import { BoardView } from "../components/board/BoardView";
import { BoardSidebar } from "../components/sidebar/BoardSidebar";
import { useAppStore } from "../store/useAppStore";

export function App() {
  const boards = useAppStore((state) => state.boards);
  const activeBoardId = useAppStore((state) => state.activeBoardId);
  const setActiveBoard = useAppStore((state) => state.setActiveBoard);

  const activeBoard =
    boards.find((board) => board.id === activeBoardId) ?? boards[0];

  return (
    <div className="app-shell">
      <BoardSidebar
        activeBoardId={activeBoard.id}
        boards={boards}
        onSelectBoard={setActiveBoard}
      />
      <main className="main-panel">
        <BoardView board={activeBoard} />
      </main>
    </div>
  );
}
