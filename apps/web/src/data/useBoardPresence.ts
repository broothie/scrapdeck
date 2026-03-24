import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../auth/supabase";

type BoardPresenceUser = {
  sessionId: string;
  userId: string;
  username: string;
  avatarHash?: string;
  isCurrentSession: boolean;
  cursor?: {
    x: number;
    y: number;
  } | null;
  selectedNoteIds: string[];
};

type BoardPresenceState = {
  sessionId?: string;
  userId?: string;
  username?: string;
  avatarHash?: string;
  cursor?: {
    x?: number;
    y?: number;
  } | null;
  selectedNoteIds?: string[];
  joinedAt?: string;
};

type PresenceOptions = {
  boardId: string | null;
  userId: string | null;
  username: string | null;
  emailHash: string | null;
  cursor?: {
    x: number;
    y: number;
  } | null;
  selectedNoteIds?: string[];
};

function normalizeCursor(cursor: PresenceOptions["cursor"]) {
  if (!cursor) {
    return null;
  }

  if (!Number.isFinite(cursor.x) || !Number.isFinite(cursor.y)) {
    return null;
  }

  return {
    x: Math.round(cursor.x),
    y: Math.round(cursor.y),
  };
}

function normalizeSelectedNoteIds(ids: string[] | undefined) {
  if (!ids || ids.length === 0) {
    return [];
  }

  return [...new Set(ids.filter((id) => typeof id === "string" && id.length > 0))].sort();
}

function serializePresenceKey(
  avatarHash: string,
  cursor: { x: number; y: number } | null,
  selectedNoteIds: string[],
) {
  const cursorKey = cursor ? `${cursor.x},${cursor.y}` : "none";
  return `${avatarHash}|${cursorKey}|${selectedNoteIds.join(",")}`;
}

function sortParticipants(participants: Map<string, BoardPresenceUser>) {
  return [...participants.values()].sort((left, right) =>
    left.username.localeCompare(right.username));
}

function resolveCursorValue(
  incomingCursor: { x?: number; y?: number } | null | undefined,
  fallbackCursor: { x: number; y: number } | null | undefined,
) {
  if (incomingCursor === null) {
    return null;
  }

  if (
    incomingCursor
    && typeof incomingCursor.x === "number"
    && typeof incomingCursor.y === "number"
  ) {
    return { x: incomingCursor.x, y: incomingCursor.y };
  }

  return fallbackCursor ?? null;
}

export function useBoardPresence({
  boardId,
  userId,
  username,
  emailHash,
  cursor = null,
  selectedNoteIds = [],
}: PresenceOptions): BoardPresenceUser[] {
  const [participants, setParticipants] = useState<BoardPresenceUser[]>([]);
  const normalizedCursor = useMemo(() => normalizeCursor(cursor), [cursor]);
  const normalizedSelectedNoteIds = useMemo(
    () => normalizeSelectedNoteIds(selectedNoteIds),
    [selectedNoteIds],
  );
  const normalizedAvatarHash = emailHash || userId?.toLowerCase().replace(/-/g, "") || "";
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const lastTrackedPresenceKeyRef = useRef("");
  const latestCursorRef = useRef<{ x: number; y: number } | null>(normalizedCursor);
  const latestSelectedNoteIdsRef = useRef<string[]>(normalizedSelectedNoteIds);
  const joinedAtRef = useRef(new Date().toISOString());
  const sessionIdRef = useRef(
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `session-${Math.random().toString(36).slice(2, 10)}`,
  );

  useEffect(() => {
    latestCursorRef.current = normalizedCursor;
    latestSelectedNoteIdsRef.current = normalizedSelectedNoteIds;
  }, [normalizedCursor, normalizedSelectedNoteIds]);

  useEffect(() => {
    const realtimeClient = supabase;

    if (!realtimeClient || !boardId || !userId || !username) {
      setParticipants([]);
      channelRef.current = null;
      isSubscribedRef.current = false;
      lastTrackedPresenceKeyRef.current = "";
      return;
    }

    const topic = `presence:board:${boardId}`;
    for (const existingChannel of realtimeClient.getChannels()) {
      if (existingChannel.topic === topic) {
        void realtimeClient.removeChannel(existingChannel);
      }
    }

    const channel = realtimeClient.channel(topic, {
      config: {
        presence: {
          key: sessionIdRef.current,
        },
      },
    });
    channelRef.current = channel;
    isSubscribedRef.current = false;
    lastTrackedPresenceKeyRef.current = "";
    joinedAtRef.current = new Date().toISOString();

    const syncParticipants = () => {
      const presenceState = channel.presenceState<BoardPresenceState>();

      setParticipants((previousParticipants) => {
        const previousBySessionId = new Map(
          previousParticipants.map((participant) => [participant.sessionId, participant]),
        );
        const nextBySessionId = new Map<string, BoardPresenceUser>();

        Object.entries(presenceState).forEach(([sessionKey, entries]) => {
          entries.forEach((entry) => {
            if (!entry.userId || !entry.username) {
              return;
            }

            const resolvedSessionId = entry.sessionId || sessionKey;
            if (!resolvedSessionId) {
              return;
            }

            const previousParticipant = previousBySessionId.get(resolvedSessionId);
            nextBySessionId.set(resolvedSessionId, {
              sessionId: resolvedSessionId,
              userId: entry.userId,
              username: entry.username,
              avatarHash: entry.avatarHash ?? previousParticipant?.avatarHash,
              isCurrentSession: resolvedSessionId === sessionIdRef.current,
              cursor: resolveCursorValue(entry.cursor, previousParticipant?.cursor),
              selectedNoteIds: entry.selectedNoteIds
                ? normalizeSelectedNoteIds(entry.selectedNoteIds)
                : (previousParticipant?.selectedNoteIds ?? []),
            });
          });
        });

        return sortParticipants(nextBySessionId);
      });
    };

    channel
      .on("presence", { event: "sync" }, syncParticipants)
      .on("presence", { event: "join" }, syncParticipants)
      .on("presence", { event: "leave" }, syncParticipants)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          isSubscribedRef.current = true;

          await channel.track({
            sessionId: sessionIdRef.current,
            userId,
            username,
            avatarHash: normalizedAvatarHash,
            cursor: latestCursorRef.current,
            selectedNoteIds: latestSelectedNoteIdsRef.current,
            joinedAt: joinedAtRef.current,
          });
          return;
        }

        if (status === "TIMED_OUT" || status === "CLOSED" || status === "CHANNEL_ERROR") {
          isSubscribedRef.current = false;
        }
      });

    return () => {
      if (channelRef.current === channel) {
        channelRef.current = null;
      }
      isSubscribedRef.current = false;
      setParticipants([]);
      void realtimeClient.removeChannel(channel);
    };
  }, [boardId, normalizedAvatarHash, userId, username]);

  useEffect(() => {
    if (!boardId || !userId || !username) {
      return;
    }

    const channel = channelRef.current;
    if (!channel || !isSubscribedRef.current) {
      return;
    }

    const nextPresenceKey = serializePresenceKey(
      normalizedAvatarHash,
      normalizedCursor,
      normalizedSelectedNoteIds,
    );

    if (nextPresenceKey === lastTrackedPresenceKeyRef.current) {
      return;
    }

    lastTrackedPresenceKeyRef.current = nextPresenceKey;

    void channel.track({
      sessionId: sessionIdRef.current,
      userId,
      username,
      avatarHash: normalizedAvatarHash,
      cursor: normalizedCursor,
      selectedNoteIds: normalizedSelectedNoteIds,
      joinedAt: joinedAtRef.current,
    });
  }, [
    boardId,
    normalizedAvatarHash,
    normalizedCursor,
    normalizedSelectedNoteIds,
    userId,
    username,
  ]);

  return useMemo(() => participants, [participants]);
}
