import { useEffect, useState } from "react";
import { Card, H2, Paragraph, Spinner, Text, Theme, View, XStack, YStack, useTheme } from "tamagui";
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

type AppThemeMode = "light" | "dark";
type ThemePreference = "system" | AppThemeMode;

type AppShellProps = {
  themePreference: ThemePreference;
  onThemePreferenceChange: (nextPreference: ThemePreference) => void;
};

function resolveSystemThemeMode(): AppThemeMode {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }

  const savedPreference = window.localStorage.getItem("scrapdeck-theme-preference");

  if (savedPreference === "system" || savedPreference === "light" || savedPreference === "dark") {
    return savedPreference;
  }

  const legacyTheme = window.localStorage.getItem("scrapdeck-theme");
  if (legacyTheme === "light" || legacyTheme === "dark") {
    return legacyTheme;
  }

  return "system";
}

function AppShell({ themePreference, onThemePreferenceChange }: AppShellProps) {
  const theme = useTheme();
  const boards = useAppStore((state) => state.boards);
  const activeBoardId = useAppStore((state) => state.activeBoardId);
  const addBoard = useAppStore((state) => state.addBoard);
  const deleteBoard = useAppStore((state) => state.deleteBoard);
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
                Apply the SQL migrations in
                {" "}
                <Text style={{ fontFamily: "monospace" }}>
                  supabase/migrations
                </Text>
                {" "}
                to create/update the schema and RLS policies.
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

  const handleDeleteBoard = (boardId: string) => {
    const board = boards.find((candidate) => candidate.id === boardId);

    if (!board) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${board.title}"? The board will be hidden, and its scraps will be preserved for potential restore.`,
    );

    if (!confirmed) {
      return;
    }

    deleteBoard(boardId);
  };

  return (
    <XStack
      style={{
        minHeight: "100vh",
        backgroundColor: theme.canvas.val,
      }}
    >
      <BoardSidebar
        activeBoardId={activeBoard?.id ?? ""}
        boards={boards}
        onCreateBoard={handleCreateBoard}
        onSelectBoard={setActiveBoard}
        onDeleteBoard={handleDeleteBoard}
        accountUsername={username}
        themePreference={themePreference}
        onThemePreferenceChange={onThemePreferenceChange}
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
  const [themePreference, setThemePreference] = useState<ThemePreference>(() =>
    resolveStoredThemePreference(),
  );
  const [systemThemeMode, setSystemThemeMode] = useState<AppThemeMode>(() => resolveSystemThemeMode());
  const themeMode = themePreference === "system" ? systemThemeMode : themePreference;

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaQueryChange = () => {
      setSystemThemeMode(mediaQuery.matches ? "dark" : "light");
    };

    handleMediaQueryChange();
    mediaQuery.addEventListener("change", handleMediaQueryChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaQueryChange);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem("scrapdeck-theme-preference", themePreference);
    window.localStorage.removeItem("scrapdeck-theme");
    document.documentElement.style.colorScheme = themeMode;
  }, [themeMode, themePreference]);

  return (
    <Theme name={themeMode}>
      <AuthProvider>
        <AppShell
          themePreference={themePreference}
          onThemePreferenceChange={setThemePreference}
        />
      </AuthProvider>
    </Theme>
  );
}
