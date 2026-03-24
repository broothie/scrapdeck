import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@plumboard/core";
import { supabase } from "../auth/supabase";
import { fetchBoards, saveBoards, type SaveBoardsChangeSet } from "./boards";

const SAVE_DEBOUNCE_MS = 250;
const REALTIME_REFRESH_DEBOUNCE_MS = 120;
const LOCAL_ECHO_WINDOW_MS = 2500;

type RealtimeTable = "boards" | "notes" | "board_members";

type RealtimePayload = {
  new?: {
    id?: string;
    board_id?: string;
  };
  old?: {
    id?: string;
    board_id?: string;
  };
};

function listDirtyIds(dirtyMap: Record<string, number>) {
  return Object.keys(dirtyMap);
}

function hasAnyDirtyIds(changeSet: SaveBoardsChangeSet) {
  return (
    changeSet.boardUpsertIds.length > 0
    || changeSet.boardDeleteIds.length > 0
    || changeSet.noteUpsertIds.length > 0
    || changeSet.noteDeleteIds.length > 0
  );
}

function buildEchoKey(table: RealtimeTable, id: string) {
  return `${table}:${id}`;
}

function pruneExpiredLocalEchoes(localEchoes: Map<string, number>) {
  const now = Date.now();
  for (const [key, expiresAt] of localEchoes.entries()) {
    if (expiresAt <= now) {
      localEchoes.delete(key);
    }
  }
}

function resolveRealtimeId(table: RealtimeTable, payload: RealtimePayload) {
  if (table === "board_members") {
    return payload.new?.board_id ?? payload.old?.board_id ?? "";
  }

  return payload.new?.id ?? payload.old?.id ?? "";
}

function shouldIgnoreRealtimeEcho(
  localEchoes: Map<string, number>,
  table: RealtimeTable,
  payload: RealtimePayload,
) {
  pruneExpiredLocalEchoes(localEchoes);

  const recordId = resolveRealtimeId(table, payload);
  if (!recordId) {
    return false;
  }

  const echoKey = buildEchoKey(table, recordId);
  const expiresAt = localEchoes.get(echoKey);
  if (!expiresAt) {
    return false;
  }

  if (expiresAt <= Date.now()) {
    localEchoes.delete(echoKey);
    return false;
  }

  return true;
}

function markLocalEchoes(
  localEchoes: Map<string, number>,
  changeSet: SaveBoardsChangeSet,
) {
  const expiresAt = Date.now() + LOCAL_ECHO_WINDOW_MS;
  const addedKeys: string[] = [];

  for (const boardId of changeSet.boardUpsertIds) {
    const boardEchoKey = buildEchoKey("boards", boardId);
    localEchoes.set(boardEchoKey, expiresAt);
    addedKeys.push(boardEchoKey);

    const boardMembershipEchoKey = buildEchoKey("board_members", boardId);
    localEchoes.set(boardMembershipEchoKey, expiresAt);
    addedKeys.push(boardMembershipEchoKey);
  }

  for (const boardId of changeSet.boardDeleteIds) {
    const boardEchoKey = buildEchoKey("boards", boardId);
    localEchoes.set(boardEchoKey, expiresAt);
    addedKeys.push(boardEchoKey);
  }

  for (const noteId of changeSet.noteUpsertIds) {
    const noteEchoKey = buildEchoKey("notes", noteId);
    localEchoes.set(noteEchoKey, expiresAt);
    addedKeys.push(noteEchoKey);
  }

  for (const noteId of changeSet.noteDeleteIds) {
    const noteEchoKey = buildEchoKey("notes", noteId);
    localEchoes.set(noteEchoKey, expiresAt);
    addedKeys.push(noteEchoKey);
  }

  return addedKeys;
}

export function useBoardSync(userId: string | undefined, focusedBoardId: string | null = null) {
  const boards = useAppStore((state) => state.boards);
  const setBoards = useAppStore((state) => state.setBoards);
  const clearSyncState = useAppStore((state) => state.clearSyncState);
  const acknowledgeSyncChangeSet = useAppStore((state) => state.acknowledgeSyncChangeSet);
  const syncRevision = useAppStore((state) => state.syncRevision);
  const dirtyBoardUpserts = useAppStore((state) => state.dirtyBoardUpserts);
  const dirtyBoardDeletes = useAppStore((state) => state.dirtyBoardDeletes);
  const dirtyNoteUpserts = useAppStore((state) => state.dirtyNoteUpserts);
  const dirtyNoteDeletes = useAppStore((state) => state.dirtyNoteDeletes);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const isHydratingRef = useRef(false);
  const hydratedUserIdRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const realtimeRefreshTimeoutRef = useRef<number | null>(null);
  const localEchoesRef = useRef<Map<string, number>>(new Map());

  const changeSet: SaveBoardsChangeSet = {
    boardUpsertIds: listDirtyIds(dirtyBoardUpserts),
    boardDeleteIds: listDirtyIds(dirtyBoardDeletes),
    noteUpsertIds: listDirtyIds(dirtyNoteUpserts),
    noteDeleteIds: listDirtyIds(dirtyNoteDeletes),
  };
  const hasPendingLocalChanges = hasAnyDirtyIds(changeSet);

  useEffect(() => {
    if (!userId) {
      hydratedUserIdRef.current = null;
      setBoards([]);
      clearSyncState();
      setIsLoading(false);
      setLoadError(null);
      setSaveError(null);
      return;
    }

    const isInitialLoad = hydratedUserIdRef.current !== userId;
    if (!isInitialLoad && hasPendingLocalChanges) {
      return;
    }

    let isCancelled = false;
    isHydratingRef.current = true;
    if (isInitialLoad) {
      setIsLoading(true);
    }
    setLoadError(null);

    fetchBoards(userId, { noteBoardId: focusedBoardId })
      .then((nextBoards) => {
        if (isCancelled) {
          return;
        }

        setBoards(nextBoards);
        clearSyncState();
        hydratedUserIdRef.current = userId;
        setIsLoading(false);
      })
      .catch((nextError: Error) => {
        if (isCancelled) {
          return;
        }

        setLoadError(nextError.message);
        setIsLoading(false);
      })
      .finally(() => {
        if (!isCancelled) {
          isHydratingRef.current = false;
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [clearSyncState, focusedBoardId, hasPendingLocalChanges, setBoards, userId]);

  useEffect(() => {
    if (!userId || hydratedUserIdRef.current !== userId || isHydratingRef.current) {
      return;
    }

    if (!hasAnyDirtyIds(changeSet)) {
      return;
    }

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    const changeSetWithRevision = {
      ...changeSet,
      upToRevision: syncRevision,
    };

    saveTimeoutRef.current = window.setTimeout(() => {
      const echoKeys = markLocalEchoes(localEchoesRef.current, changeSet);

      saveBoards(userId, boards, changeSet)
        .then(() => {
          acknowledgeSyncChangeSet(changeSetWithRevision);
          setSaveError(null);
        })
        .catch((nextError: Error) => {
          for (const echoKey of echoKeys) {
            localEchoesRef.current.delete(echoKey);
          }
          setSaveError(nextError.message);
        });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    acknowledgeSyncChangeSet,
    boards,
    changeSet,
    syncRevision,
    userId,
  ]);

  useEffect(() => {
    const realtimeClient = supabase;

    if (!userId || !realtimeClient) {
      return;
    }

    let isDisposed = false;
    const scheduleRealtimeRefresh = () => {
      if (realtimeRefreshTimeoutRef.current) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current);
      }

      realtimeRefreshTimeoutRef.current = window.setTimeout(() => {
        fetchBoards(userId, { noteBoardId: focusedBoardId })
          .then((nextBoards) => {
            if (isDisposed) {
              return;
            }

            setBoards(nextBoards);
            clearSyncState();
            hydratedUserIdRef.current = userId;
            setLoadError(null);
            setSaveError(null);
          })
          .catch((nextError: Error) => {
            if (isDisposed) {
              return;
            }

            setLoadError(nextError.message);
          });
      }, REALTIME_REFRESH_DEBOUNCE_MS);
    };

    const channel = realtimeClient.channel(`plumboard-sync-${userId}`);

    channel.on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "boards",
    }, (payload) => {
      if (shouldIgnoreRealtimeEcho(localEchoesRef.current, "boards", payload as RealtimePayload)) {
        return;
      }
      scheduleRealtimeRefresh();
    });

    if (focusedBoardId) {
      channel.on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "notes",
        filter: `board_id=eq.${focusedBoardId}`,
      }, (payload) => {
        if (shouldIgnoreRealtimeEcho(localEchoesRef.current, "notes", payload as RealtimePayload)) {
          return;
        }
        scheduleRealtimeRefresh();
      });
    }

    channel.on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "board_members",
      filter: `user_id=eq.${userId}`,
    }, (payload) => {
      if (shouldIgnoreRealtimeEcho(localEchoesRef.current, "board_members", payload as RealtimePayload)) {
        return;
      }
      scheduleRealtimeRefresh();
    });

    channel.subscribe();

    return () => {
      isDisposed = true;

      if (realtimeRefreshTimeoutRef.current) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current);
      }

      void realtimeClient.removeChannel(channel);
    };
  }, [clearSyncState, focusedBoardId, setBoards, userId]);

  return {
    isLoading,
    loadError,
    saveError,
  };
}
