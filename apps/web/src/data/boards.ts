import type { Board, Database, Note } from "@plumboard/core";
import { supabase } from "../auth/supabase";

type BoardRow = Database["public"]["Tables"]["boards"]["Row"];
type BoardInsert = Database["public"]["Tables"]["boards"]["Insert"];
type BoardMemberRow = Database["public"]["Tables"]["board_members"]["Row"];
type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
type NoteInsert = Database["public"]["Tables"]["notes"]["Insert"];
type NoteSoftDeleteCandidate = Pick<NoteRow, "id" | "board_id" | "deleted_at">;

function assertUnreachable(value: never): never {
  throw new Error(`Unsupported note row type: ${value}`);
}

export function mapNoteRowToNote(row: NoteRow): Note {
  if (row.type === "text") {
    return {
      id: row.id,
      type: "text",
      x: row.x,
      y: row.y,
      width: row.width,
      height: row.height,
      title: row.title ?? undefined,
      body: row.body ?? "",
    };
  }

  if (row.type === "image") {
    return {
      id: row.id,
      type: "image",
      x: row.x,
      y: row.y,
      width: row.width,
      height: row.height,
      src: row.src ?? "",
      alt: row.alt ?? "",
      caption: row.caption ?? undefined,
    };
  }

  if (row.type === "link") {
    return {
      id: row.id,
      type: "link",
      x: row.x,
      y: row.y,
      width: row.width,
      height: row.height,
      url: row.url ?? "",
      siteName: row.site_name ?? "",
      title: row.title ?? "",
      description: row.description ?? undefined,
      previewImage: row.preview_image ?? undefined,
    };
  }

  return assertUnreachable(row.type as never);
}

export function mapNoteToRow(userId: string, boardId: string, note: Note): NoteInsert {
  return {
    id: note.id,
    board_id: boardId,
    user_id: userId,
    type: note.type,
    x: note.x,
    y: note.y,
    width: note.width,
    height: note.height,
    title: "title" in note ? note.title ?? null : null,
    body: note.type === "text" ? note.body : null,
    src: note.type === "image" ? note.src : null,
    alt: note.type === "image" ? note.alt : null,
    caption: note.type === "image" ? note.caption ?? null : null,
    url: note.type === "link" ? note.url : null,
    site_name: note.type === "link" ? note.siteName : null,
    description: note.type === "link" ? note.description ?? null : null,
    preview_image: note.type === "link" ? note.previewImage ?? null : null,
    deleted_at: null,
  };
}

export function mapBoardToRow(userId: string, board: Board): BoardInsert {
  return {
    id: board.id,
    user_id: board.ownerUserId ?? userId,
    title: board.title,
    description: board.description,
    deleted_at: null,
  };
}

export function assembleBoards(boardRows: BoardRow[], noteRows: NoteRow[]): Board[] {
  return boardRows.map((board) => ({
    id: board.id,
    title: board.title,
    description: board.description,
    ownerUserId: board.user_id,
    notes: noteRows
      .filter((note) => note.board_id === board.id)
      .map(mapNoteRowToNote),
  }));
}

export function resolveNoteIdsToSoftDelete(
  existingNotes: NoteSoftDeleteCandidate[],
  boardIds: Set<string>,
  noteIds: Set<string>,
) {
  return existingNotes
    .filter((note) => !note.deleted_at)
    .filter((note) => !noteIds.has(note.id))
    .filter((note) => boardIds.has(note.board_id))
    .map((note) => note.id);
}

type FetchBoardsOptions = {
  noteBoardId?: string | null;
};

export async function fetchBoards(userId: string, options: FetchBoardsOptions = {}) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("board_members")
    .select("board_id, user_id, role, invited_by, created_at")
    .eq("user_id", userId);

  if (membershipsError) {
    throw membershipsError;
  }

  const memberBoardIds = [...new Set((memberships ?? []).map((membership: BoardMemberRow) => membership.board_id))];

  const [{ data: ownedBoards, error: ownedBoardsError }, { data: sharedBoards, error: sharedBoardsError }] =
    await Promise.all([
      supabase
        .from("boards")
        .select("id, user_id, title, description, created_at, updated_at, deleted_at")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
      memberBoardIds.length > 0
        ? supabase
          .from("boards")
          .select("id, user_id, title, description, created_at, updated_at, deleted_at")
          .in("id", memberBoardIds)
          .is("deleted_at", null)
          .order("created_at", { ascending: true })
        : Promise.resolve({ data: [] as BoardRow[], error: null }),
    ]);

  if (ownedBoardsError) {
    throw ownedBoardsError;
  }

  if (sharedBoardsError) {
    throw sharedBoardsError;
  }

  const boardsById = new Map<string, BoardRow>();
  for (const board of ownedBoards ?? []) {
    boardsById.set(board.id, board);
  }
  for (const board of sharedBoards ?? []) {
    boardsById.set(board.id, board);
  }

  const boards = [...boardsById.values()];
  const boardIds = boards.map((board) => board.id);

  if (boardIds.length === 0) {
    return [];
  }

  const requestedNoteBoardId = options.noteBoardId ?? null;
  const noteBoardIds = requestedNoteBoardId && boardIds.includes(requestedNoteBoardId)
    ? [requestedNoteBoardId]
    : [];

  if (noteBoardIds.length === 0) {
    return assembleBoards(boards, []);
  }

  const { data: notes, error: notesError } = await supabase
    .from("notes")
    .select(
      "id, board_id, user_id, type, x, y, width, height, title, body, src, alt, caption, url, site_name, description, preview_image, created_at, updated_at, deleted_at",
    )
    .in("board_id", noteBoardIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (notesError) {
    throw notesError;
  }

  return assembleBoards(boards, notes ?? []);
}

export type SaveBoardsChangeSet = {
  boardUpsertIds: string[];
  boardDeleteIds: string[];
  noteUpsertIds: string[];
  noteDeleteIds: string[];
};

type BoardNoteRef = {
  boardId: string;
  note: Note;
};

function mapBoardNotesById(boards: Board[]) {
  const notesById = new Map<string, BoardNoteRef>();

  for (const board of boards) {
    for (const note of board.notes) {
      notesById.set(note.id, { boardId: board.id, note });
    }
  }

  return notesById;
}

function resolveDefaultChangeSet(boards: Board[]): SaveBoardsChangeSet {
  return {
    boardUpsertIds: boards.map((board) => board.id),
    boardDeleteIds: [],
    noteUpsertIds: boards.flatMap((board) => board.notes.map((note) => note.id)),
    noteDeleteIds: [],
  };
}

export async function saveBoards(
  userId: string,
  boards: Board[],
  changes?: SaveBoardsChangeSet,
) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  const supabaseClient = supabase;

  const boardById = new Map(boards.map((board) => [board.id, board]));
  const noteById = mapBoardNotesById(boards);
  const changeSet = changes ?? resolveDefaultChangeSet(boards);

  const boardRowsToUpsert = changeSet.boardUpsertIds
    .map((boardId) => boardById.get(boardId))
    .filter((board): board is Board => Boolean(board))
    .map((board) => mapBoardToRow(userId, board));

  if (boardRowsToUpsert.length > 0) {
    const boardUpdateResults = await Promise.all(
      boardRowsToUpsert.map((boardRow) => (
        supabaseClient
          .from("boards")
          .update({
            title: boardRow.title,
            description: boardRow.description,
            deleted_at: null,
          })
          .eq("id", boardRow.id)
          .select("id")
          .limit(1)
      )),
    );

    const boardRowsToInsert: BoardInsert[] = [];

    for (const [index, boardUpdateResult] of boardUpdateResults.entries()) {
      if (boardUpdateResult.error) {
        throw boardUpdateResult.error;
      }

      if (!boardUpdateResult.data || boardUpdateResult.data.length === 0) {
        boardRowsToInsert.push(boardRowsToUpsert[index]);
      }
    }

    if (boardRowsToInsert.length > 0) {
      const boardInsertResults = await Promise.all(
        boardRowsToInsert.map((boardRow) => (
          supabaseClient
            .from("boards")
            .insert(boardRow)
        )),
      );

      for (const boardInsertResult of boardInsertResults) {
        if (boardInsertResult.error && boardInsertResult.error.code !== "23505") {
          throw boardInsertResult.error;
        }
      }
    }
  }

  const boardIdsToSoftDelete = [...new Set(changeSet.boardDeleteIds)];

  if (boardIdsToSoftDelete.length > 0) {
    const { error: boardDeleteError } = await supabaseClient
      .from("boards")
      .update({ deleted_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("deleted_at", null)
      .in("id", boardIdsToSoftDelete);

    if (boardDeleteError) {
      throw boardDeleteError;
    }
  }

  const noteRowsToUpsert = changeSet.noteUpsertIds
    .map((noteId) => {
      const noteRef = noteById.get(noteId);
      if (!noteRef) {
        return null;
      }

      return mapNoteToRow(userId, noteRef.boardId, noteRef.note);
    })
    .filter((row): row is NoteInsert => Boolean(row));

  if (noteRowsToUpsert.length > 0) {
    const { error: noteUpsertError } = await supabaseClient
      .from("notes")
      .upsert(noteRowsToUpsert, { onConflict: "id" });

    if (noteUpsertError) {
      throw noteUpsertError;
    }
  }

  const noteIdsToSoftDelete = [...new Set(changeSet.noteDeleteIds)];

  if (noteIdsToSoftDelete.length > 0) {
    const { error: noteDeleteError } = await supabaseClient
      .from("notes")
      .update({ deleted_at: new Date().toISOString() })
      .is("deleted_at", null)
      .in("id", noteIdsToSoftDelete);

    if (noteDeleteError) {
      throw noteDeleteError;
    }
  }
}
