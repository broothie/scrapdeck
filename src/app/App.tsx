import { BoardView } from "../components/board/BoardView";
import { BoardSidebar } from "../components/sidebar/BoardSidebar";
import { mockBoards } from "../data/mockBoards";
import { useAppStore } from "../store/useAppStore";

export function App() {
  const activeBoardId = useAppStore((state) => state.activeBoardId);
  const setActiveBoard = useAppStore((state) => state.setActiveBoard);

  const activeBoard =
    mockBoards.find((board) => board.id === activeBoardId) ?? mockBoards[0];

  return (
    <div className="app-shell">
      <BoardSidebar
        activeBoardId={activeBoard.id}
        boards={mockBoards}
        onSelectBoard={setActiveBoard}
      />
      <main className="main-panel">
        <BoardView board={activeBoard} />
      </main>
    </div>
  );
}
