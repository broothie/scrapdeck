import { useEffect, useMemo, useState } from "react";
import { supabase } from "../auth/supabase";

type BoardPresenceUser = {
  userId: string;
  username: string;
  avatarHash?: string;
};

type BoardPresenceState = {
  userId?: string;
  username?: string;
  avatarHash?: string;
  joinedAt?: string;
};

type PresenceOptions = {
  boardId: string | null;
  userId: string | null;
  username: string | null;
  emailHash: string | null;
};

export function useBoardPresence({
  boardId,
  userId,
  username,
  emailHash,
}: PresenceOptions): BoardPresenceUser[] {
  const [participants, setParticipants] = useState<BoardPresenceUser[]>([]);

  useEffect(() => {
    const realtimeClient = supabase;

    if (!realtimeClient || !boardId || !userId || !username) {
      setParticipants([]);
      return;
    }

    const channel = realtimeClient.channel(`presence:board:${boardId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    const syncParticipants = () => {
      const presenceState = channel.presenceState<BoardPresenceState>();
      const nextParticipantsById = new Map<string, BoardPresenceUser>();

      Object.values(presenceState).forEach((presenceEntries) => {
        presenceEntries.forEach((entry) => {
          if (!entry.userId || !entry.username) {
            return;
          }

          nextParticipantsById.set(entry.userId, {
            userId: entry.userId,
            username: entry.username,
            avatarHash: entry.avatarHash,
          });
        });
      });

      setParticipants(
        [...nextParticipantsById.values()].sort((left, right) =>
          left.username.localeCompare(right.username)),
      );
    };

    channel
      .on("presence", { event: "sync" }, syncParticipants)
      .on("presence", { event: "join" }, syncParticipants)
      .on("presence", { event: "leave" }, syncParticipants)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId,
            username,
            avatarHash: emailHash || userId.toLowerCase().replace(/-/g, ""),
            joinedAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      setParticipants([]);
      void realtimeClient.removeChannel(channel);
    };
  }, [boardId, emailHash, userId, username]);

  return useMemo(() => participants, [participants]);
}
