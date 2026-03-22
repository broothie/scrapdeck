import type { Board, Database, Scrap } from "@plumboard/core";
import { supabase } from "../auth/supabase";

type BoardRow = Database["public"]["Tables"]["boards"]["Row"];
type BoardInsert = Database["public"]["Tables"]["boards"]["Insert"];
type ScrapRow = Database["public"]["Tables"]["scraps"]["Row"];
type ScrapInsert = Database["public"]["Tables"]["scraps"]["Insert"];
type ScrapSoftDeleteCandidate = Pick<ScrapRow, "id" | "board_id" | "deleted_at">;

function assertUnreachable(value: never): never {
  throw new Error(`Unsupported scrap row type: ${value}`);
}

export function mapScrapRowToScrap(row: ScrapRow): Scrap {
  if (row.type === "note") {
    return {
      id: row.id,
      type: "note",
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

export function mapScrapToRow(userId: string, boardId: string, scrap: Scrap): ScrapInsert {
  return {
    id: scrap.id,
    board_id: boardId,
    user_id: userId,
    type: scrap.type,
    x: scrap.x,
    y: scrap.y,
    width: scrap.width,
    height: scrap.height,
    title: "title" in scrap ? scrap.title ?? null : null,
    body: scrap.type === "note" ? scrap.body : null,
    src: scrap.type === "image" ? scrap.src : null,
    alt: scrap.type === "image" ? scrap.alt : null,
    caption: scrap.type === "image" ? scrap.caption ?? null : null,
    url: scrap.type === "link" ? scrap.url : null,
    site_name: scrap.type === "link" ? scrap.siteName : null,
    description: scrap.type === "link" ? scrap.description ?? null : null,
    preview_image: scrap.type === "link" ? scrap.previewImage ?? null : null,
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

export function assembleBoards(boardRows: BoardRow[], scrapRows: ScrapRow[]): Board[] {
  return boardRows.map((board) => ({
    id: board.id,
    title: board.title,
    description: board.description,
    scraps: scrapRows
      .filter((scrap) => scrap.board_id === board.id)
      .map(mapScrapRowToScrap),
  }));
}

export function resolveScrapIdsToSoftDelete(
  existingScraps: ScrapSoftDeleteCandidate[],
  boardIds: Set<string>,
  scrapIds: Set<string>,
) {
  return existingScraps
    .filter((scrap) => !scrap.deleted_at)
    .filter((scrap) => !scrapIds.has(scrap.id))
    .filter((scrap) => boardIds.has(scrap.board_id))
    .map((scrap) => scrap.id);
}

export async function fetchBoards(userId: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const [{ data: boards, error: boardsError }, { data: scraps, error: scrapsError }] =
    await Promise.all([
      supabase
        .from("boards")
        .select("id, user_id, title, description, created_at, updated_at, deleted_at")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
      supabase
        .from("scraps")
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

  if (scrapsError) {
    throw scrapsError;
  }

  return assembleBoards(boards ?? [], scraps ?? []);
}

export async function saveBoards(userId: string, boards: Board[]) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const boardRows = boards.map((board) => mapBoardToRow(userId, board));
  const scrapRows = boards.flatMap((board) =>
    board.scraps.map((scrap) => mapScrapToRow(userId, board.id, scrap)),
  );

  const boardSnapshotRows = boardRows.map((board) => ({
    id: board.id,
    title: board.title,
    description: board.description,
  }));
  const scrapSnapshotRows = scrapRows.map((scrap) => ({
    id: scrap.id,
    board_id: scrap.board_id,
    type: scrap.type,
    x: scrap.x,
    y: scrap.y,
    width: scrap.width,
    height: scrap.height,
    title: scrap.title,
    body: scrap.body,
    src: scrap.src,
    alt: scrap.alt,
    caption: scrap.caption,
    url: scrap.url,
    site_name: scrap.site_name,
    description: scrap.description,
    preview_image: scrap.preview_image,
  }));

  const { error } = await supabase.rpc("save_boards_snapshot", {
    p_user_id: userId,
    p_boards: boardSnapshotRows,
    p_scraps: scrapSnapshotRows,
  });

  if (error) {
    throw error;
  }
}
