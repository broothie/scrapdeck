import { Card, H2, Paragraph, Text, YStack, useTheme } from "tamagui";
import type { Board } from "@plumboard/core";

type BoardsPageProps = {
  boards: Board[];
  onOpenBoard: (boardId: string) => void;
};

export function BoardsPage({ boards, onOpenBoard }: BoardsPageProps) {
  const theme = useTheme();

  return (
    <YStack
      style={{
        flex: 1,
        minHeight: 0,
        padding: "1.5rem",
        gap: "0.9rem",
        overflowY: "auto",
      }}
    >
      <YStack style={{ gap: "0.25rem" }}>
        <H2 style={{ margin: 0 }}>Boards</H2>
        <Paragraph style={{ margin: 0, color: theme.textSecondary.val }}>
          Pick a board to open and continue where you left off.
        </Paragraph>
      </YStack>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
          gap: "0.85rem",
        }}
      >
        {boards.map((board) => (
          <a
            key={board.id}
            href={`/board/${encodeURIComponent(board.id)}`}
            onClick={(event) => {
              event.preventDefault();
              onOpenBoard(board.id);
            }}
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "block",
              cursor: "pointer",
            }}
          >
            <Card
              style={{
                borderWidth: 1,
                borderColor: theme.borderDefault.val,
                backgroundColor: theme.surface.val,
              }}
            >
              <Card.Header style={{ padding: "0.95rem 1rem" }}>
                <YStack style={{ gap: "0.5rem" }}>
                  <Text style={{ fontSize: 21, lineHeight: 26, fontWeight: 800, color: theme.textPrimary.val }}>
                    {board.title}
                  </Text>
                  <Paragraph style={{ margin: 0, color: theme.textSecondary.val }}>
                    {board.description || "No description yet."}
                  </Paragraph>
                </YStack>
              </Card.Header>
            </Card>
          </a>
        ))}
      </div>
    </YStack>
  );
}
