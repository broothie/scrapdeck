import { View, XStack } from "tamagui";
import { useAppStore } from "@scrapdeck/core";
import { BoardSidebar, BoardView } from "@scrapdeck/ui";

export function App() {
  const boards = useAppStore((state) => state.boards);
  const activeBoardId = useAppStore((state) => state.activeBoardId);
  const setActiveBoard = useAppStore((state) => state.setActiveBoard);

  const activeBoard =
    boards.find((board) => board.id === activeBoardId) ?? boards[0];

  return (
    <XStack
      style={{
        minHeight: "100vh",
        backgroundColor: "#091017",
        background:
          "radial-gradient(circle at top, rgba(242, 196, 114, 0.16), transparent 30%), linear-gradient(135deg, #1a2431 0%, #0f1319 50%, #091017 100%)",
      }}
    >
      <BoardSidebar
        activeBoardId={activeBoard.id}
        boards={boards}
        onSelectBoard={setActiveBoard}
      />
      <View style={{ flex: 1, padding: "1.5rem" }}>
        <BoardView board={activeBoard} />
      </View>
    </XStack>
  );
}
