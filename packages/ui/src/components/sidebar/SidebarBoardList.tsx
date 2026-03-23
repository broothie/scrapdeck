import { MoreHorizontal, Plus } from "lucide-react";
import { Button, Paragraph, Text, XStack, YStack, useTheme } from "tamagui";
import type { Board } from "@plumboard/core";

type SidebarBoardListProps = {
  boards: Board[];
  activeBoardId: string;
  currentUserId?: string;
  onSelectBoard: (boardId: string) => void;
  onOpenBoardSettings?: (boardId: string) => void;
  onCreateBoard?: () => void;
};

export function SidebarBoardList({
  boards,
  activeBoardId,
  currentUserId,
  onSelectBoard,
  onOpenBoardSettings,
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
        const isBoardOwner = currentUserId ? (board.ownerUserId ?? currentUserId) === currentUserId : false;
        const showBoardSettings = Boolean(onOpenBoardSettings && isBoardOwner);

        return (
          <Button
            key={board.id}
            onPress={() => onSelectBoard(board.id)}
            variant={isActive ? undefined : "outlined"}
            style={{
              width: "100%",
              justifyContent: "flex-start",
              alignItems: "stretch",
              height: "auto",
              minHeight: 44,
              paddingVertical: 7,
              paddingLeft: 12,
              paddingRight: showBoardSettings ? 8 : 12,
              backgroundColor: isActive ? theme.accentSubtle.val : theme.surface.val,
              borderColor: isActive ? theme.accentDefault.val : theme.borderDefault.val,
              borderWidth: 1,
            }}
          >
            <XStack style={{ width: "100%", flex: 1, alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: isActive ? theme.accentText.val : theme.textPrimary.val,
                  textAlign: "left",
                  flex: 1,
                }}
              >
                {board.title}
              </Text>
              {showBoardSettings ? (
                <XStack
                  role="button"
                  tabIndex={0}
                  aria-label={`Edit ${board.title} settings`}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onOpenBoardSettings?.(board.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      onOpenBoardSettings?.(board.id);
                    }
                  }}
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: isActive ? theme.accentText.val : theme.textSecondary.val,
                    lineHeight: 0,
                    padding: 0,
                    borderRadius: 6,
                  }}
                >
                  <MoreHorizontal size={16} strokeWidth={2} />
                </XStack>
              ) : null}
            </XStack>
          </Button>
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
