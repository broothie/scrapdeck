import { useEffect, useState } from "react";
import { Card, H2, Input, Paragraph, Spinner, Text, Theme, View, XStack, YStack, useTheme } from "tamagui";
import { useAppStore } from "@plumboard/core";
import { BoardSidebar, BoardView } from "@plumboard/ui";
import { Navigate, Route, Routes, useMatch, useNavigate, useParams } from "react-router-dom";
import md5 from "blueimp-md5";
import { AuthProvider, useAuth } from "../auth/AuthProvider";
import { supabase } from "../auth/supabase";
import { AccountPage } from "./AccountPage";
import { BoardsPage } from "./BoardsPage";
import { EmptyBoardsState } from "./EmptyBoardsState";
import { AuthScreen } from "../auth/AuthScreen";
import { MissingSupabaseConfig } from "../auth/MissingSupabaseConfig";
import { UsernameSetupScreen } from "../auth/UsernameSetupScreen";
import { useBoardPresence } from "../data/useBoardPresence";
import { useBoardSync } from "../data/useBoardSync";
import { createRandomBoardTitle } from "./createBoardTitle";

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

type AppThemeMode = "light" | "dark";
type ThemePreference = "system" | AppThemeMode;

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

const MOBILE_LAYOUT_MEDIA_QUERY = [
  "(max-width: 1024px)",
  "(max-height: 640px) and (orientation: landscape)",
].join(", ");

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

function resolveIsMobileLayout() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(MOBILE_LAYOUT_MEDIA_QUERY).matches;
}

function normalizeGravatarHash(input: string) {
  const normalized = input.toLowerCase().replace(/[^a-f0-9]/g, "");

  if (normalized.length >= 32) {
    return normalized.slice(0, 32);
  }

  return normalized.padEnd(32, "0");
}

function resolveGravatarUrl(hash: string) {
  return `https://www.gravatar.com/avatar/${hash}?s=40&d=identicon&r=pg`;
}

function resolveEmailHash(email: string | undefined) {
  if (!email) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  return md5(normalizedEmail);
}

type BoardRoutePageProps = {
  boards: ReturnType<typeof useAppStore.getState>["boards"];
  currentUserId: string;
  currentUsername: string;
  currentUserEmailHash: string | null;
  boardSaveError: string | null;
  boardIdNeedingMetadataEdit: string | null;
  onMetadataEditorOpenHandled: (boardId: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onInviteCollaborator: (boardId: string, email: string) => Promise<{ error?: string }>;
  onUploadImage: (file: File) => Promise<{
    src: string;
    alt?: string;
    caption?: string;
  }>;
  onResolveLinkPreview: (url: string) => Promise<LinkPreviewResponse>;
  isMobileLayout?: boolean;
};

function BoardRoutePage({
  boards,
  currentUserId,
  currentUsername,
  currentUserEmailHash,
  boardSaveError,
  boardIdNeedingMetadataEdit,
  onMetadataEditorOpenHandled,
  onDeleteBoard,
  onInviteCollaborator,
  onUploadImage,
  onResolveLinkPreview,
  isMobileLayout = false,
}: BoardRoutePageProps) {
  const theme = useTheme();
  const { boardId = "" } = useParams<{ boardId: string }>();
  const board = boards.find((candidate) => candidate.id === boardId) ?? null;
  const presenceUsers = useBoardPresence({
    boardId: board?.id ?? null,
    userId: currentUserId,
    username: currentUsername,
    emailHash: currentUserEmailHash,
  }).map((participant) => ({
    id: participant.userId,
    name: participant.username,
    avatarUrl: resolveGravatarUrl(normalizeGravatarHash(participant.avatarHash ?? participant.userId)),
    isCurrentUser: participant.userId === currentUserId,
  }));
  const isBoardOwner = (board?.ownerUserId ?? currentUserId) === currentUserId;
  const ownerLabel = isBoardOwner ? currentUsername : "collaborator";

  if (!board) {
    return (
      <YStack
        style={{
          flex: 1,
          minHeight: 0,
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <Card width="100%" maxWidth={560} style={{ borderWidth: 1 }}>
          <Card.Header style={{ padding: "1.25rem" }}>
            <YStack gap="$3">
              <H2 style={{ margin: 0 }}>Board not found</H2>
              <Paragraph style={{ margin: 0 }}>
                This board might have been deleted, or it has not loaded yet.
              </Paragraph>
              <Paragraph style={{ margin: 0 }}>
                Open a board from the sidebar, or go back to the boards page.
              </Paragraph>
            </YStack>
          </Card.Header>
        </Card>
      </YStack>
    );
  }

  return (
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
        <BoardView
          board={board}
          ownerUsername={ownerLabel}
          presenceParticipants={presenceUsers}
          shouldOpenMetadataEditor={boardIdNeedingMetadataEdit === board.id}
          onMetadataEditorOpenHandled={() => {
            onMetadataEditorOpenHandled(board.id);
          }}
          onDeleteBoard={isBoardOwner ? onDeleteBoard : undefined}
          onInviteCollaborator={isBoardOwner ? ((email) => onInviteCollaborator(board.id, email)) : undefined}
          onUploadImage={onUploadImage}
          onResolveLinkPreview={onResolveLinkPreview}
          isMobileLayout={isMobileLayout}
        />
      </View>
    </YStack>
  );
}

function AppShell({ themePreference, onThemePreferenceChange }: AppShellProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const boardRouteMatch = useMatch("/board/:boardId");
  const routeBoardId = boardRouteMatch?.params.boardId ?? null;
  const brandLogoUrl = `${import.meta.env.BASE_URL}plumboard-logo.png`;
  const boards = useAppStore((state) => state.boards);
  const activeBoardId = useAppStore((state) => state.activeBoardId);
  const addBoard = useAppStore((state) => state.addBoard);
  const deleteBoard = useAppStore((state) => state.deleteBoard);
  const setActiveBoard = useAppStore((state) => state.setActiveBoard);
  const { isConfigured, isLoading, user, username, saveUsername, signOut } = useAuth();
  const [isMobileLayout, setIsMobileLayout] = useState(resolveIsMobileLayout);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [boardIdNeedingMetadataEdit, setBoardIdNeedingMetadataEdit] = useState<string | null>(null);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const {
    isLoading: isBoardLoading,
    loadError: boardLoadError,
    saveError: boardSaveError,
  } = useBoardSync(user?.id, routeBoardId);

  useEffect(() => {
    if (!routeBoardId || isBoardLoading || boardLoadError) {
      return;
    }

    if (activeBoardId !== routeBoardId && boards.some((board) => board.id === routeBoardId)) {
      setActiveBoard(routeBoardId);
    }
  }, [activeBoardId, boardLoadError, boards, isBoardLoading, routeBoardId, setActiveBoard]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia(MOBILE_LAYOUT_MEDIA_QUERY);
    const syncMobileLayout = () => {
      setIsMobileLayout(mediaQuery.matches);
    };

    syncMobileLayout();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncMobileLayout);
    } else {
      mediaQuery.addListener(syncMobileLayout);
    }

    window.addEventListener("resize", syncMobileLayout);
    window.addEventListener("orientationchange", syncMobileLayout);
    window.visualViewport?.addEventListener("resize", syncMobileLayout);

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", syncMobileLayout);
      } else {
        mediaQuery.removeListener(syncMobileLayout);
      }

      window.removeEventListener("resize", syncMobileLayout);
      window.removeEventListener("orientationchange", syncMobileLayout);
      window.visualViewport?.removeEventListener("resize", syncMobileLayout);
    };
  }, []);

  useEffect(() => {
    if (!isCreatingBoard) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCreatingBoard(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isCreatingBoard]);

  if (!isConfigured) {
    return <MissingSupabaseConfig />;
  }

  if (isLoading) {
    return (
      <YStack
        style={{
          width: "100%",
          minHeight: "var(--app-viewport-height)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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
      <YStack
        style={{
          width: "100%",
          minHeight: "var(--app-viewport-height)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner size="large" />
      </YStack>
    );
  }

  if (boardLoadError) {
    return (
      <YStack
        style={{
          width: "100%",
          minHeight: "var(--app-viewport-height)",
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

  const handleSaveUsername = async (nextUsername: string) => saveUsername(nextUsername);

  const handleOpenCreateBoardModal = () => {
    setNewBoardTitle(createRandomBoardTitle());
    setNewBoardDescription("");
    setIsCreatingBoard(true);
  };

  const handleCreateBoard = () => {
    const boardId = createId("board");
    const nextTitle = newBoardTitle.trim() || createRandomBoardTitle();
    const nextDescription = newBoardDescription.trim();

    addBoard({
      id: boardId,
      title: nextTitle,
      description: nextDescription,
      ownerUserId: user.id,
      notes: [],
    });

    setActiveBoard(boardId);
    setIsCreatingBoard(false);
    navigate(`/board/${encodeURIComponent(boardId)}`);
  };

  const handleSelectBoard = (boardId: string) => {
    setActiveBoard(boardId);
    navigate(`/board/${encodeURIComponent(boardId)}`);
  };

  const handleOpenBoardSettings = (boardId: string) => {
    setActiveBoard(boardId);
    setBoardIdNeedingMetadataEdit(boardId);
    navigate(`/board/${encodeURIComponent(boardId)}`);
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

    if (routeBoardId === boardId) {
      navigate("/", { replace: true });
    }
  };

  const handleInviteCollaborator = async (boardId: string, email: string) => {
    if (!supabase) {
      return { error: "Supabase is not configured." };
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return { error: "Enter an email address." };
    }

    const { error } = await supabase.rpc("invite_board_member", {
      p_board_id: boardId,
      p_invitee_email: normalizedEmail,
      p_role: "editor",
    });

    return error ? { error: error.message } : {};
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
        width: "100%",
        height: "var(--app-viewport-height)",
        backgroundColor: theme.canvas.val,
      }}
    >
      {!isMobileLayout ? (
        <BoardSidebar
          brandLogoUrl={brandLogoUrl}
          activeBoardId={routeBoardId ?? ""}
          currentUserId={user.id}
          boards={boards}
          onOpenBoards={() => navigate("/")}
          onCreateBoard={handleOpenCreateBoardModal}
          onSelectBoard={handleSelectBoard}
          onOpenBoardSettings={handleOpenBoardSettings}
          accountUsername={username}
          onOpenAccount={() => navigate("/account")}
        />
      ) : null}
      <View style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <Routes>
          <Route
            path="/account"
            element={(
              <AccountPage
                username={username}
                email={user.email}
                themePreference={themePreference}
                onThemePreferenceChange={onThemePreferenceChange}
                onSaveUsername={handleSaveUsername}
                onSignOut={handleSignOut}
                isSigningOut={isSigningOut}
              />
            )}
          />
          <Route
            path="/"
            element={boards.length > 0
              ? (
                <BoardsPage
                  boards={boards}
                  onOpenBoard={handleSelectBoard}
                />
              )
              : (
                <YStack style={{ flex: 1, minHeight: 0 }}>
                  <EmptyBoardsState onCreateBoard={handleOpenCreateBoardModal} />
                </YStack>
              )}
          />
          <Route
            path="/board/:boardId"
            element={(
              <BoardRoutePage
                boards={boards}
                currentUserId={user.id}
                currentUsername={username}
                currentUserEmailHash={resolveEmailHash(user.email)}
                boardSaveError={boardSaveError}
                boardIdNeedingMetadataEdit={boardIdNeedingMetadataEdit}
                onMetadataEditorOpenHandled={(boardId) => {
                  setBoardIdNeedingMetadataEdit((current) => (current === boardId ? null : current));
                }}
                onDeleteBoard={handleDeleteBoard}
                onInviteCollaborator={handleInviteCollaborator}
                onUploadImage={handleUploadImage}
                onResolveLinkPreview={handleResolveLinkPreview}
                isMobileLayout={isMobileLayout}
              />
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </View>
      {isCreatingBoard ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create board"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsCreatingBoard(false);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.25rem",
            backgroundColor: "rgba(16, 12, 24, 0.5)",
            zIndex: 70,
          }}
        >
          <Card
            style={{
              width: "100%",
              maxWidth: 560,
              borderWidth: 1,
              borderColor: theme.borderDefault.val,
              backgroundColor: theme.surface.val,
              boxShadow: "0 20px 40px rgba(14, 10, 22, 0.28)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <YStack gap="$3" style={{ padding: "1rem" }}>
              <YStack gap="$1">
                <Text fontWeight="700">Create board</Text>
                <Paragraph style={{ margin: 0, color: theme.textSecondary.val }}>
                  Choose a title and optional description for your new board.
                </Paragraph>
              </YStack>

              <YStack gap="$2">
                <Text style={{ fontWeight: 600 }}>Board title</Text>
                <Input
                  autoFocus
                  aria-label="New board title"
                  value={newBoardTitle}
                  onFocus={(event) => {
                    event.currentTarget.select();
                  }}
                  onChange={(event) => setNewBoardTitle(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleCreateBoard();
                    }
                  }}
                  style={{ width: "100%" }}
                />
              </YStack>

              <YStack gap="$2">
                <Text style={{ fontWeight: 600 }}>Description</Text>
                <textarea
                  aria-label="New board description"
                  value={newBoardDescription}
                  onChange={(event) => setNewBoardDescription(event.currentTarget.value)}
                  placeholder="Describe what this board is for"
                  style={{
                    margin: 0,
                    width: "100%",
                    minHeight: 120,
                    resize: "vertical",
                    borderRadius: 12,
                    border: `1px solid ${theme.borderDefault.val}`,
                    backgroundColor: theme.surfaceHover.val,
                    color: theme.textPrimary.val,
                    font: "inherit",
                    lineHeight: 1.5,
                    padding: "0.75rem 0.85rem",
                    outline: "none",
                  }}
                />
              </YStack>

              <XStack style={{ justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setIsCreatingBoard(false)}
                  style={{
                    cursor: "pointer",
                    padding: "0.6rem 0.9rem",
                    borderRadius: 10,
                    border: `1px solid ${theme.borderDefault.val}`,
                    background: theme.surfaceHover.val,
                    color: theme.textPrimary.val,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateBoard}
                  style={{
                    cursor: "pointer",
                    padding: "0.6rem 0.9rem",
                    borderRadius: 10,
                    border: `1px solid ${theme.accentDefault.val}`,
                    background: theme.accentLight.val,
                    color: theme.accentText.val,
                    fontWeight: 600,
                  }}
                >
                  Create board
                </button>
              </XStack>
            </YStack>
          </Card>
        </div>
      ) : null}
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
