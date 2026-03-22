import { Button, H2, Paragraph, Text, XStack, YStack, useTheme } from "tamagui";
import type { Board } from "@scrapdeck/core";

type BoardSidebarProps = {
  boards: Board[];
  activeBoardId: string;
  onSelectBoard: (boardId: string) => void;
  onDeleteBoard?: (boardId: string) => void;
  onCreateBoard?: () => void;
  accountUsername?: string;
  themeMode?: "light" | "dark";
  onToggleTheme?: () => void;
  onSignOut?: () => void;
  isSigningOut?: boolean;
};

export function BoardSidebar({
  boards,
  activeBoardId,
  onSelectBoard,
  onDeleteBoard,
  onCreateBoard,
  accountUsername,
  themeMode,
  onToggleTheme,
  onSignOut,
  isSigningOut = false,
}: BoardSidebarProps) {
  const theme = useTheme();

  return (
    <YStack
      style={{
        gap: "1.5rem",
        width: 290,
        minWidth: 250,
        padding: "1.5rem",
        borderRight: `1px solid ${theme.borderSubtle.val}`,
        backgroundColor: theme.surface.val,
        backdropFilter: "blur(24px)",
      }}
    >
      <YStack style={{ gap: "0.5rem" }}>
        <Text
          style={{
            color: theme.textSecondary.val,
            fontSize: 12,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Scrapdeck
        </Text>
        <H2 style={{ margin: 0 }}>
          Boards
        </H2>
      </YStack>

      <YStack aria-label="Boards" style={{ gap: "0.75rem" }}>
        {onCreateBoard ? (
          <Button
            onPress={onCreateBoard}
            style={{
              backgroundColor: theme.accentDefault.val,
              borderColor: theme.accentStrong.val,
              borderWidth: 1,
              color: theme.accentText.val,
            }}
          >
            New board
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
                    {board.scraps.length} scraps
                  </Text>
                </YStack>
              </Button>
              {onDeleteBoard ? (
                <Button
                  aria-label={`Delete board ${board.title}`}
                  onPress={() => onDeleteBoard(board.id)}
                  variant="outlined"
                  style={{ width: 42, minWidth: 42, paddingHorizontal: 0 }}
                >
                  Del
                </Button>
              ) : null}
            </XStack>
          );
        })}

        {boards.length === 0 ? (
          <Paragraph style={{ margin: 0, color: theme.textSecondary.val }}>
            No boards yet. Create your first one to start arranging scraps.
          </Paragraph>
        ) : null}
      </YStack>

      {accountUsername ? (
        <YStack
          gap="$3"
          style={{
            marginTop: "auto",
            paddingTop: "0.75rem",
            borderTopWidth: 1,
            borderTopColor: theme.borderSubtle.val,
          }}
        >
          <YStack style={{ gap: "0.25rem" }}>
            {accountUsername ? (
              <Text style={{ fontSize: 16, fontWeight: 700 }}>
                @{accountUsername}
              </Text>
            ) : null}
          </YStack>
          {onToggleTheme ? (
            <Button onPress={onToggleTheme} variant="outlined">
              {themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            </Button>
          ) : null}
          {onSignOut ? (
            <Button
              onPress={onSignOut}
              variant="outlined"
              disabled={isSigningOut}
            >
              Sign out
            </Button>
          ) : null}
        </YStack>
      ) : null}
    </YStack>
  );
}
