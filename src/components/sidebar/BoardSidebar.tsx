import { Button, H2, Paragraph, Text, YStack } from "tamagui";
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
    <YStack
      style={{
        gap: "1.5rem",
        width: 290,
        minWidth: 250,
        padding: "1.5rem",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(10,14,20,0.74)",
        backdropFilter: "blur(24px)",
      }}
    >
      <YStack style={{ gap: "0.5rem" }}>
        <Text style={{ opacity: 0.7, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>
          Scrapdeck
        </Text>
        <H2 style={{ margin: 0 }}>
          Boards
        </H2>
        <Paragraph style={{ margin: 0 }}>
          Spatial collections for notes, images, and saved links.
        </Paragraph>
      </YStack>

      <YStack aria-label="Boards" style={{ gap: "0.75rem" }}>
        {boards.map((board) => {
          const isActive = board.id === activeBoardId;

          return (
            <Button
              key={board.id}
              onPress={() => onSelectBoard(board.id)}
              theme={isActive ? "blue" : undefined}
              variant={isActive ? undefined : "outlined"}
              style={{
                width: "100%",
                justifyContent: "flex-start",
                height: "auto",
                minHeight: 76,
              }}
            >
              <YStack style={{ gap: "0.25rem" }}>
                <Text style={{ fontSize: 16, fontWeight: 700 }}>
                  {board.title}
                </Text>
                <Text style={{ opacity: 0.7, fontSize: 14 }}>
                  {board.scraps.length} scraps
                </Text>
              </YStack>
            </Button>
          );
        })}
      </YStack>
    </YStack>
  );
}
