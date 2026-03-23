import { Button, Paragraph, Text, XStack, YStack, useTheme } from "tamagui";
import type { Board } from "@plumboard/core";
import { AppButton } from "../primitives/AppButton";

type SidebarBoardListProps = {
  boards: Board[];
  activeBoardId: string;
  onSelectBoard: (boardId: string) => void;
  onCreateBoard?: () => void;
};

export function SidebarBoardList({
  boards,
  activeBoardId,
  onSelectBoard,
  onCreateBoard,
}: SidebarBoardListProps) {
  const theme = useTheme();

  return (
    <YStack aria-label="Boards" style={{ gap: "0.75rem" }}>
      {onCreateBoard ? (
        <AppButton
          onPress={onCreateBoard}
          variant="primary"
        >
          New board
        </AppButton>
      ) : null}

      {boards.map((board) => {
        const isActive = board.id === activeBoardId;

        return (
          <XStack key={board.id} style={{ width: "100%", gap: "0.5rem", alignItems: "stretch" }}>
            <Button
              onPress={() => onSelectBoard(board.id)}
              variant={isActive ? undefined : "outlined"}
              style={{
                flex: 1,
                justifyContent: "flex-start",
                height: "auto",
                minHeight: 76,
                backgroundColor: isActive ? theme.accentSubtle.val : theme.surface.val,
                borderColor: isActive ? theme.accentDefault.val : theme.borderDefault.val,
                borderWidth: 1,
              }}
            >
              <YStack style={{ gap: "0.25rem" }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: isActive ? theme.accentText.val : theme.textPrimary.val,
                  }}
                >
                  {board.title}
                </Text>
                <Text
                  style={{
                    color: isActive ? theme.accentStrong.val : theme.textSecondary.val,
                    fontSize: 14,
                  }}
                >
                  {board.notes.length} notes
                </Text>
              </YStack>
            </Button>
          </XStack>
        );
      })}

      {boards.length === 0 ? (
        <Paragraph style={{ margin: 0, color: theme.textSecondary.val }}>
          No boards yet. Create your first one to start arranging notes.
        </Paragraph>
      ) : null}
    </YStack>
  );
}
