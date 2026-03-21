import { useState } from "react";
import { Spinner, View, XStack, YStack } from "tamagui";
import { useAppStore } from "@scrapdeck/core";
import { BoardSidebar, BoardView } from "@scrapdeck/ui";
import { AuthProvider, useAuth } from "../auth/AuthProvider";
import { AuthScreen } from "../auth/AuthScreen";
import { MissingSupabaseConfig } from "../auth/MissingSupabaseConfig";
import { UsernameSetupScreen } from "../auth/UsernameSetupScreen";

function AppShell() {
  const boards = useAppStore((state) => state.boards);
  const activeBoardId = useAppStore((state) => state.activeBoardId);
  const setActiveBoard = useAppStore((state) => state.setActiveBoard);
  const { isConfigured, isLoading, user, username, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
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
        activeBoardId={activeBoard.id}
        boards={boards}
        onSelectBoard={setActiveBoard}
        accountUsername={username}
        isSigningOut={isSigningOut}
        onSignOut={handleSignOut}
      />
      <View style={{ flex: 1, padding: "1.5rem" }}>
        <BoardView board={activeBoard} />
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
