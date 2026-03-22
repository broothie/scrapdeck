import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@scrapdeck/core";
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

  return {
    isLoading,
    loadError,
    saveError,
  };
}
