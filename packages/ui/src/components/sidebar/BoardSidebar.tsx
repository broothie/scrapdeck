import { YStack, useTheme } from "tamagui";
import type { Board } from "@plumboard/core";
import { SidebarAccountSection } from "./SidebarAccountSection";
import { SidebarBoardList } from "./SidebarBoardList";
import { SidebarBrand } from "./SidebarBrand";

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
        backgroundColor: theme.canvas.val,
        backdropFilter: "blur(24px)",
      }}
    >
      <SidebarBrand title="Boards" subtitle="Plumboard" />
      <SidebarBoardList
        boards={boards}
        activeBoardId={activeBoardId}
        onSelectBoard={onSelectBoard}
        onDeleteBoard={onDeleteBoard}
        onCreateBoard={onCreateBoard}
      />
      <SidebarAccountSection
        accountUsername={accountUsername}
        themePreference={themePreference}
        onThemePreferenceChange={onThemePreferenceChange}
        onSignOut={onSignOut}
        isSigningOut={isSigningOut}
      />
    </YStack>
  );
}
