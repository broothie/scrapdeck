import { Button, H2, Paragraph, Text, YStack } from "tamagui";
import type { Board } from "@scrapdeck/core";

type BoardSidebarProps = {
  boards: Board[];
  activeBoardId: string;
  onSelectBoard: (boardId: string) => void;
  onCreateBoard?: () => void;
  accountUsername?: string;
  onSignOut?: () => void;
  isSigningOut?: boolean;
};

export function BoardSidebar({
  boards,
  activeBoardId,
  onSelectBoard,
  onCreateBoard,
  accountUsername,
  onSignOut,
  isSigningOut = false,
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
        {onCreateBoard ? (
          <Button theme="blue" onPress={onCreateBoard}>
            New board
          </Button>
        ) : null}

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

        {boards.length === 0 ? (
          <Paragraph style={{ margin: 0, opacity: 0.72 }}>
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
            borderTopColor: "rgba(255,255,255,0.08)",
          }}
        >
          <YStack style={{ gap: "0.25rem" }}>
            <Text style={{ opacity: 0.7, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>
              Signed in
            </Text>
            {accountUsername ? (
              <Text style={{ fontSize: 16, fontWeight: 700 }}>
                @{accountUsername}
              </Text>
            ) : null}
          </YStack>
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
