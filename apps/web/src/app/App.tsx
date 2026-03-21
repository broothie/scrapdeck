import { useState } from "react";
import { Card, H2, Paragraph, Spinner, Text, View, XStack, YStack } from "tamagui";
import { useAppStore } from "@scrapdeck/core";
import { BoardSidebar, BoardView } from "@scrapdeck/ui";
import { AuthProvider, useAuth } from "../auth/AuthProvider";
import { EmptyBoardsState } from "./EmptyBoardsState";
import { AuthScreen } from "../auth/AuthScreen";
import { MissingSupabaseConfig } from "../auth/MissingSupabaseConfig";
import { UsernameSetupScreen } from "../auth/UsernameSetupScreen";
import { useBoardSync } from "../data/useBoardSync";

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function AppShell() {
  const boards = useAppStore((state) => state.boards);
  const activeBoardId = useAppStore((state) => state.activeBoardId);
  const addBoard = useAppStore((state) => state.addBoard);
  const setActiveBoard = useAppStore((state) => state.setActiveBoard);
  const { isConfigured, isLoading, user, username, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const {
    isLoading: isBoardLoading,
    error: boardError,
  } = useBoardSync(user?.id);

  const activeBoard =
    boards.find((board) => board.id === activeBoardId) ?? boards[0];

  if (!isConfigured) {
    return <MissingSupabaseConfig />;
  }

  if (isLoading) {
    return (
      <YStack style={{ minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <Spinner size="large" />
      </YStack>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!username) {
    return <UsernameSetupScreen />;
  }

  if (isBoardLoading) {
    return (
      <YStack style={{ minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <Spinner size="large" />
      </YStack>
    );
  }

  if (boardError) {
    return (
      <YStack
        style={{
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <Card width="100%" maxWidth={560} style={{ borderWidth: 1 }}>
          <Card.Header style={{ padding: "1.25rem" }}>
            <YStack gap="$3">
              <H2 style={{ margin: 0 }}>Board sync needs one more setup step</H2>
              <Paragraph style={{ margin: 0 }}>
                Supabase auth is working, but the app could not load boards from the database.
              </Paragraph>
              <Paragraph style={{ margin: 0 }}>
                {boardError}
              </Paragraph>
              <Paragraph style={{ margin: 0 }}>
                Apply the SQL migration in
                {" "}
                <Text style={{ fontFamily: "monospace" }}>
                  supabase/migrations/20260320183000_create_boards_and_scraps.sql
                </Text>
                {" "}
                to create the tables and RLS policies.
              </Paragraph>
            </YStack>
          </Card.Header>
        </Card>
      </YStack>
    );
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
  };

  const handleCreateBoard = () => {
    const boardId = createId("board");

    addBoard({
      id: boardId,
      title: "Untitled board",
      description: "A blank board ready for notes, images, and links.",
      scraps: [],
    });

    setActiveBoard(boardId);
  };

  return (
    <XStack
      style={{
        minHeight: "100vh",
        backgroundColor: "#091017",
        background:
          "radial-gradient(circle at top, rgba(242, 196, 114, 0.16), transparent 30%), linear-gradient(135deg, #1a2431 0%, #0f1319 50%, #091017 100%)",
      }}
    >
      <BoardSidebar
        activeBoardId={activeBoard?.id ?? ""}
        boards={boards}
        onCreateBoard={handleCreateBoard}
        onSelectBoard={setActiveBoard}
        accountUsername={username}
        isSigningOut={isSigningOut}
        onSignOut={handleSignOut}
      />
      <View style={{ flex: 1, padding: "1.5rem" }}>
        {activeBoard ? (
          <BoardView board={activeBoard} />
        ) : (
          <EmptyBoardsState onCreateBoard={handleCreateBoard} />
        )}
      </View>
    </XStack>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
