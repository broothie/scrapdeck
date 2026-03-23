import type { Board, Database, Note } from "@plumboard/core";
import { supabase } from "../auth/supabase";

type BoardRow = Database["public"]["Tables"]["boards"]["Row"];
type BoardInsert = Database["public"]["Tables"]["boards"]["Insert"];
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
    user_id: userId,
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

export async function fetchBoards(userId: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const [{ data: boards, error: boardsError }, { data: notes, error: notesError }] =
    await Promise.all([
      supabase
        .from("boards")
        .select("id, user_id, title, description, created_at, updated_at, deleted_at")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
      supabase
        .from("notes")
        .select(
          "id, board_id, user_id, type, x, y, width, height, title, body, src, alt, caption, url, site_name, description, preview_image, created_at, updated_at, deleted_at",
        )
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
    ]);

  if (boardsError) {
    throw boardsError;
  }

  if (notesError) {
    throw notesError;
  }

  return assembleBoards(boards ?? [], notes ?? []);
}

export async function saveBoards(userId: string, boards: Board[]) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const boardRows = boards.map((board) => mapBoardToRow(userId, board));
  const noteRows = boards.flatMap((board) =>
    board.notes.map((note) => mapNoteToRow(userId, board.id, note)),
  );

  const boardSnapshotRows = boardRows.map((board) => ({
    id: board.id,
    title: board.title,
    description: board.description,
  }));
  const noteSnapshotRows = noteRows.map((note) => ({
    id: note.id,
    board_id: note.board_id,
    type: note.type,
    x: note.x,
    y: note.y,
    width: note.width,
    height: note.height,
    title: note.title,
    body: note.body,
    src: note.src,
    alt: note.alt,
    caption: note.caption,
    url: note.url,
    site_name: note.site_name,
    description: note.description,
    preview_image: note.preview_image,
  }));

  const { error } = await supabase.rpc("save_boards_snapshot", {
    p_user_id: userId,
    p_boards: boardSnapshotRows,
    p_notes: noteSnapshotRows,
  });

  if (error) {
    throw error;
  }
}
