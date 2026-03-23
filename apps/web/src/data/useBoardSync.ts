import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@plumboard/core";
import { supabase } from "../auth/supabase";
import { fetchBoards, saveBoards } from "./boards";

function serializeBoards(value: unknown) {
  return JSON.stringify(value);
}

export function useBoardSync(userId: string | undefined) {
  const boards = useAppStore((state) => state.boards);
  const setBoards = useAppStore((state) => state.setBoards);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const isHydratingRef = useRef(false);
  const hydratedUserIdRef = useRef<string | null>(null);
  const lastSavedSnapshotRef = useRef<string>("");
  const saveTimeoutRef = useRef<number | null>(null);
  const realtimeRefreshTimeoutRef = useRef<number | null>(null);
  const boardSnapshot = useMemo(() => serializeBoards(boards), [boards]);

  useEffect(() => {
    if (!userId) {
      hydratedUserIdRef.current = null;
      lastSavedSnapshotRef.current = "";
      setBoards([]);
      setIsLoading(false);
      setLoadError(null);
      setSaveError(null);
      return;
    }

    let isCancelled = false;
    isHydratingRef.current = true;
    setIsLoading(true);
    setLoadError(null);

    fetchBoards(userId)
      .then((nextBoards) => {
        if (isCancelled) {
          return;
        }

        setBoards(nextBoards);
        hydratedUserIdRef.current = userId;
        lastSavedSnapshotRef.current = serializeBoards(nextBoards);
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
  }, [setBoards, userId]);

  useEffect(() => {
    if (!userId || hydratedUserIdRef.current !== userId || isHydratingRef.current) {
      return;
    }

    if (boardSnapshot === lastSavedSnapshotRef.current) {
      return;
    }

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      saveBoards(userId, boards)
        .then(() => {
          lastSavedSnapshotRef.current = boardSnapshot;
          setSaveError(null);
        })
        .catch((nextError: Error) => {
          setSaveError(nextError.message);
        });
    }, 250);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [boardSnapshot, boards, userId]);

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
        fetchBoards(userId)
          .then((nextBoards) => {
            if (isDisposed) {
              return;
            }

            setBoards(nextBoards);
            hydratedUserIdRef.current = userId;
            lastSavedSnapshotRef.current = serializeBoards(nextBoards);
            setLoadError(null);
            setSaveError(null);
          })
          .catch((nextError: Error) => {
            if (isDisposed) {
              return;
            }

            setLoadError(nextError.message);
          });
      }, 120);
    };

    const channel = realtimeClient
      .channel(`plumboard-sync-${userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "boards",
      }, scheduleRealtimeRefresh)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "notes",
      }, scheduleRealtimeRefresh)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "board_members",
        filter: `user_id=eq.${userId}`,
      }, scheduleRealtimeRefresh)
      .subscribe();

    return () => {
      isDisposed = true;

      if (realtimeRefreshTimeoutRef.current) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current);
      }

      void realtimeClient.removeChannel(channel);
    };
  }, [setBoards, userId]);

  return {
    isLoading,
    loadError,
    saveError,
  };
}
