import {
  Button,
  H2,
  Paragraph,
  Text,
  ToggleGroup,
  XStack,
  YStack,
  useTheme,
} from "tamagui";
import type { Board } from "@scrapdeck/core";

type ThemePreference = "system" | "light" | "dark";

type BoardSidebarProps = {
  boards: Board[];
  activeBoardId: string;
  onSelectBoard: (boardId: string) => void;
  onDeleteBoard?: (boardId: string) => void;
  onCreateBoard?: () => void;
  accountUsername?: string;
  themePreference?: ThemePreference;
  onThemePreferenceChange?: (nextPreference: ThemePreference) => void;
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
  themePreference = "system",
  onThemePreferenceChange,
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
          {onThemePreferenceChange ? (
            <YStack gap="$2">
              <Text style={{ color: theme.textSecondary.val, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase" }}>
                Theme
              </Text>
              <ToggleGroup
                type="single"
                orientation="horizontal"
                value={themePreference}
                onValueChange={(nextValue) => {
                  if (nextValue === "system" || nextValue === "dark" || nextValue === "light") {
                    onThemePreferenceChange(nextValue);
                  }
                }}
                disableDeactivation
                style={{
                  width: "100%",
                  flexDirection: "row",
                  borderRadius: 10,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: theme.borderDefault.val,
                  backgroundColor: theme.surfaceHover.val,
                }}
              >
                <ToggleGroup.Item
                  value="system"
                  aria-label="Follow system theme"
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    borderRadius: 0,
                    backgroundColor:
                      themePreference === "system" ? theme.accentSubtle.val : "transparent",
                    color: themePreference === "system" ? theme.textPrimary.val : theme.textSecondary.val,
                    fontWeight: themePreference === "system" ? 600 : 500,
                  }}
                >
                  OS
                </ToggleGroup.Item>
                <ToggleGroup.Item
                  value="dark"
                  aria-label="Use dark theme"
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    borderRadius: 0,
                    borderLeftWidth: 1,
                    borderRightWidth: 1,
                    borderColor: theme.borderDefault.val,
                    backgroundColor:
                      themePreference === "dark" ? theme.accentSubtle.val : "transparent",
                    color: themePreference === "dark" ? theme.textPrimary.val : theme.textSecondary.val,
                    fontWeight: themePreference === "dark" ? 600 : 500,
                  }}
                >
                  Dark
                </ToggleGroup.Item>
                <ToggleGroup.Item
                  value="light"
                  aria-label="Use light theme"
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    borderRadius: 0,
                    backgroundColor:
                      themePreference === "light" ? theme.accentSubtle.val : "transparent",
                    color: themePreference === "light" ? theme.textPrimary.val : theme.textSecondary.val,
                    fontWeight: themePreference === "light" ? 600 : 500,
                  }}
                >
                  Light
                </ToggleGroup.Item>
              </ToggleGroup>
            </YStack>
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
