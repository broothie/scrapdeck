import { Plus } from "lucide-react";
import { Button, Paragraph, Text, XStack, YStack, useTheme } from "tamagui";
import type { Board } from "@plumboard/core";

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
        <Button
          unstyled
          onPress={onCreateBoard}
          aria-label="Create a new board"
          style={{
            width: "100%",
            justifyContent: "flex-start",
            padding: "0.15rem 0.1rem",
            borderRadius: 12,
            cursor: "pointer",
            backgroundColor: "transparent",
            borderWidth: 0,
            borderColor: "transparent",
            outlineStyle: "none",
            boxShadow: "none",
          }}
          hoverStyle={{
            background: "transparent",
            borderColor: "transparent",
            boxShadow: "none",
          }}
          pressStyle={{
            background: "transparent",
            borderColor: "transparent",
            boxShadow: "none",
          }}
          focusStyle={{
            background: "transparent",
            borderColor: "transparent",
            boxShadow: "none",
          }}
        >
          <XStack style={{ alignItems: "center", gap: "0.6rem" }}>
            <XStack
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.accentLight.val,
                borderWidth: 1,
                borderColor: theme.accentDefault.val,
              }}
            >
              <Plus size={16} color={theme.accentText.val} strokeWidth={2.4} />
            </XStack>
            <Text
              style={{
                color: theme.textPrimary.val,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              New board
            </Text>
          </XStack>
        </Button>
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
                minHeight: 44,
                paddingVertical: 7,
                paddingHorizontal: 12,
                backgroundColor: isActive ? theme.accentSubtle.val : theme.surface.val,
                borderColor: isActive ? theme.accentDefault.val : theme.borderDefault.val,
                borderWidth: 1,
              }}
            >
              <YStack style={{ gap: 0 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: isActive ? theme.accentText.val : theme.textPrimary.val,
                  }}
                >
                  {board.title}
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
