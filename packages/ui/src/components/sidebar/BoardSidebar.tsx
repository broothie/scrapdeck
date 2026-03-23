import { YStack, useTheme } from "tamagui";
import type { Board } from "@plumboard/core";
import { SidebarAccountSection } from "./SidebarAccountSection";
import { SidebarBoardList } from "./SidebarBoardList";
import { SidebarBrand } from "./SidebarBrand";

type BoardSidebarProps = {
  boards: Board[];
  activeBoardId: string;
  currentUserId?: string;
  brandLogoUrl?: string;
  onOpenBoards?: () => void;
  onSelectBoard: (boardId: string) => void;
  onOpenBoardSettings?: (boardId: string) => void;
  onCreateBoard?: () => void;
  accountUsername?: string;
  onOpenAccount?: () => void;
};

export function BoardSidebar({
  boards,
  activeBoardId,
  currentUserId,
  brandLogoUrl,
  onOpenBoards,
  onSelectBoard,
  onOpenBoardSettings,
  onCreateBoard,
  accountUsername,
  onOpenAccount,
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
      <SidebarBrand
        title="Boards"
        subtitle="Plumboard"
        logoUrl={brandLogoUrl}
        onOpenBoards={onOpenBoards}
      />
      <SidebarBoardList
        boards={boards}
        activeBoardId={activeBoardId}
        currentUserId={currentUserId}
        onSelectBoard={onSelectBoard}
        onOpenBoardSettings={onOpenBoardSettings}
        onCreateBoard={onCreateBoard}
      />
      <SidebarAccountSection
        accountUsername={accountUsername}
        onOpenAccount={onOpenAccount}
      />
    </YStack>
  );
}
