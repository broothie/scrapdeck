import { useCallback, useEffect, useState } from "react";
import { Card, H2, Paragraph, Spinner, Text, Theme, View, XStack, YStack, useTheme } from "tamagui";
import { useAppStore } from "@plumboard/core";
import { BoardSidebar, BoardView } from "@plumboard/ui";
import { AuthProvider, useAuth } from "../auth/AuthProvider";
import { supabase } from "../auth/supabase";
import { AccountPage } from "./AccountPage";
import { BoardsPage } from "./BoardsPage";
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
type AppRoute =
  | { page: "boards" }
  | { page: "board"; boardId: string }
  | { page: "account" };

type AppShellProps = {
  themePreference: ThemePreference;
  onThemePreferenceChange: (nextPreference: ThemePreference) => void;
};

type LinkPreviewResponse = {
  url?: string;
  siteName?: string;
  title?: string;
  description?: string;
  previewImage?: string;
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

  const savedPreference = window.localStorage.getItem("plumboard-theme-preference");

  if (savedPreference === "system" || savedPreference === "light" || savedPreference === "dark") {
    return savedPreference;
  }

  const legacyTheme = window.localStorage.getItem("plumboard-theme");
  if (legacyTheme === "light" || legacyTheme === "dark") {
    return legacyTheme;
  }

  return "system";
}

function resolveRouteFromPath(pathname: string): AppRoute {
  if (pathname === "/account") {
    return { page: "account" };
  }

  const boardPrefix = "/board/";
  if (pathname.startsWith(boardPrefix)) {
    const boardId = decodeURIComponent(pathname.slice(boardPrefix.length));
    if (boardId) {
      return { page: "board", boardId };
    }
  }

  return { page: "boards" };
}

function routeToPath(route: AppRoute): string {
  if (route.page === "account") {
    return "/account";
  }

  if (route.page === "board") {
    return `/board/${encodeURIComponent(route.boardId)}`;
  }

  return "/";
}

function AppShell({ themePreference, onThemePreferenceChange }: AppShellProps) {
  const theme = useTheme();
  const brandLogoUrl = `${import.meta.env.BASE_URL}plumboard-logo.png`;
  const boards = useAppStore((state) => state.boards);
  const activeBoardId = useAppStore((state) => state.activeBoardId);
  const addBoard = useAppStore((state) => state.addBoard);
  const deleteBoard = useAppStore((state) => state.deleteBoard);
  const setActiveBoard = useAppStore((state) => state.setActiveBoard);
  const { isConfigured, isLoading, user, username, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [boardIdNeedingMetadataEdit, setBoardIdNeedingMetadataEdit] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<AppRoute>(() =>
    typeof window === "undefined" ? { page: "boards" } : resolveRouteFromPath(window.location.pathname),
  );
  const {
    isLoading: isBoardLoading,
    loadError: boardLoadError,
    saveError: boardSaveError,
  } = useBoardSync(user?.id);

  const navigateToRoute = useCallback((nextRoute: AppRoute) => {
    setActiveRoute(nextRoute);

    if (typeof window === "undefined") {
      return;
    }

    const nextPath = routeToPath(nextRoute);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncRouteWithLocation = () => {
      setActiveRoute(resolveRouteFromPath(window.location.pathname));
    };

    syncRouteWithLocation();
    window.addEventListener("popstate", syncRouteWithLocation);

    return () => {
      window.removeEventListener("popstate", syncRouteWithLocation);
    };
  }, []);

  const routeBoardId = activeRoute.page === "board" ? activeRoute.boardId : null;
  const activeBoard = routeBoardId
    ? boards.find((board) => board.id === routeBoardId) ?? null
    : boards.find((board) => board.id === activeBoardId) ?? boards[0] ?? null;

  useEffect(() => {
    if (activeRoute.page !== "board") {
      return;
    }

    const boardStillExists = boards.some((board) => board.id === activeRoute.boardId);
    if (!boardStillExists) {
      navigateToRoute({ page: "boards" });
    }
  }, [activeRoute, boards, navigateToRoute]);

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

  if (boardLoadError) {
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
                {boardLoadError}
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
      description: "A blank board ready for text notes, files, and links.",
      notes: [],
    });

    setActiveBoard(boardId);
    setBoardIdNeedingMetadataEdit(boardId);
    navigateToRoute({ page: "board", boardId });
  };

  const handleSelectBoard = (boardId: string) => {
    setActiveBoard(boardId);
    navigateToRoute({ page: "board", boardId });
  };

  const handleDeleteBoard = (boardId: string) => {
    const board = boards.find((candidate) => candidate.id === boardId);

    if (!board) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${board.title}"? The board will be hidden, and its notes will be preserved for potential restore.`,
    );

    if (!confirmed) {
      return;
    }

    deleteBoard(boardId);
    setBoardIdNeedingMetadataEdit((current) => (current === boardId ? null : current));

    if (activeRoute.page === "board" && activeRoute.boardId === boardId) {
      navigateToRoute({ page: "boards" });
    }
  };

  const handleUploadImage = async (file: File) => {
    if (!supabase || !user) {
      throw new Error("You must be signed in to upload files.");
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
    const randomId = typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);
    const objectPath = `${user.id}/${Date.now()}-${randomId}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("note-images")
      .upload(objectPath, file, {
        upsert: false,
        contentType: file.type || undefined,
        cacheControl: "3600",
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from("note-images")
      .getPublicUrl(objectPath);

    return {
      src: data.publicUrl,
      alt: file.name || "Uploaded file",
      caption: file.name || undefined,
    };
  };

  const handleResolveLinkPreview = async (url: string): Promise<LinkPreviewResponse> => {
    if (!supabase) {
      return {};
    }

    const { data, error } = await supabase.functions.invoke<LinkPreviewResponse>("link-preview", {
      body: { url },
    });

    if (error || !data || typeof data !== "object") {
      return {};
    }

    return {
      url: typeof data.url === "string" ? data.url : undefined,
      siteName: typeof data.siteName === "string" ? data.siteName : undefined,
      title: typeof data.title === "string" ? data.title : undefined,
      description: typeof data.description === "string" ? data.description : undefined,
      previewImage: typeof data.previewImage === "string" ? data.previewImage : undefined,
    };
  };

  return (
    <XStack
      style={{
        height: "100vh",
        backgroundColor: theme.canvas.val,
      }}
    >
      <BoardSidebar
        brandLogoUrl={brandLogoUrl}
        activeBoardId={activeRoute.page === "board" ? activeRoute.boardId : ""}
        boards={boards}
        onOpenBoards={() => navigateToRoute({ page: "boards" })}
        onCreateBoard={handleCreateBoard}
        onSelectBoard={handleSelectBoard}
        accountUsername={username}
        onOpenAccount={() => navigateToRoute({ page: "account" })}
      />
      {activeRoute.page === "account" ? (
        <AccountPage
          username={username}
          email={user.email}
          themePreference={themePreference}
          onThemePreferenceChange={onThemePreferenceChange}
          onSignOut={handleSignOut}
          isSigningOut={isSigningOut}
        />
      ) : activeRoute.page === "boards" ? (
        boards.length > 0 ? (
          <BoardsPage
            boards={boards}
            onOpenBoard={handleSelectBoard}
          />
        ) : (
          <YStack style={{ flex: 1, minHeight: 0 }}>
            <EmptyBoardsState onCreateBoard={handleCreateBoard} />
          </YStack>
        )
      ) : (
        <YStack style={{ flex: 1, minHeight: 0 }}>
          {boardSaveError ? (
            <Card
              style={{
                borderWidth: 1,
                borderColor: theme.danger.val,
                borderRadius: 0,
              }}
            >
              <Card.Header style={{ padding: "0.7rem 1rem" }}>
                <Paragraph style={{ margin: 0 }}>
                  {`Could not save latest board changes: ${boardSaveError}`}
                </Paragraph>
              </Card.Header>
            </Card>
          ) : null}
          <View style={{ flex: 1, minHeight: 0 }}>
            {activeBoard ? (
              <BoardView
                board={activeBoard}
                shouldOpenMetadataEditor={boardIdNeedingMetadataEdit === activeBoard.id}
                onMetadataEditorOpenHandled={() => {
                  setBoardIdNeedingMetadataEdit((current) =>
                    current === activeBoard.id ? null : current,
                  );
                }}
                onDeleteBoard={handleDeleteBoard}
                onUploadImage={handleUploadImage}
                onResolveLinkPreview={handleResolveLinkPreview}
              />
            ) : (
              <EmptyBoardsState onCreateBoard={handleCreateBoard} />
            )}
          </View>
        </YStack>
      )}
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
    window.localStorage.setItem("plumboard-theme-preference", themePreference);
    window.localStorage.removeItem("plumboard-theme");
    document.documentElement.style.colorScheme = themeMode;
    document.documentElement.dataset.themeMode = themeMode;
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
