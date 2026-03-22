import { create } from "zustand";
import type { Board, NoteScrap, Scrap } from "../types";

type ScrapLayoutPatch = Partial<Pick<Scrap, "x" | "y" | "width" | "height">>;
type NoteScrapPatch = Partial<Pick<NoteScrap, "title" | "body">>;
type BoardPatch = Partial<Pick<Board, "title" | "description">>;

type AppState = {
  boards: Board[];
  activeBoardId: string;
  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;
  updateBoard: (boardId: string, patch: BoardPatch) => void;
  deleteBoard: (boardId: string) => void;
  setActiveBoard: (boardId: string) => void;
  addScrap: (boardId: string, scrap: Scrap) => void;
  deleteScrap: (boardId: string, scrapId: string) => void;
  updateNoteScrap: (
    boardId: string,
    scrapId: string,
    patch: NoteScrapPatch,
  ) => void;
  updateScrapLayout: (
    boardId: string,
    scrapId: string,
    patch: ScrapLayoutPatch,
  ) => void;
};

function resolveActiveBoardId(
  nextBoards: Board[],
  previousActiveBoardId: string,
): string {
  return (
    nextBoards.find((board) => board.id === previousActiveBoardId)?.id ??
    nextBoards[0]?.id ??
    ""
  );
}

export const useAppStore = create<AppState>((set) => ({
  boards: [],
  activeBoardId: "",
  setBoards: (boards) =>
    set((state) => ({
      boards,
      activeBoardId: resolveActiveBoardId(boards, state.activeBoardId),
    })),
  addBoard: (board) =>
    set((state) => ({
      boards: [...state.boards, board],
      activeBoardId: state.activeBoardId || board.id,
    })),
  updateBoard: (boardId, patch) =>
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId ? { ...board, ...patch } : board,
      ),
    })),
  deleteBoard: (boardId) =>
    set((state) => {
      const nextBoards = state.boards.filter((board) => board.id !== boardId);

      return {
        boards: nextBoards,
        activeBoardId: resolveActiveBoardId(nextBoards, state.activeBoardId),
      };
    }),
  setActiveBoard: (boardId) => set({ activeBoardId: boardId }),
  addScrap: (boardId, scrap) =>
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId
          ? { ...board, scraps: [...board.scraps, scrap] }
          : board,
      ),
    })),
  deleteScrap: (boardId, scrapId) =>
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              scraps: board.scraps.filter((scrap) => scrap.id !== scrapId),
            }
          : board,
      ),
    })),
  updateNoteScrap: (boardId, scrapId, patch) =>
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              scraps: board.scraps.map((scrap) =>
                scrap.id === scrapId && scrap.type === "note"
                  ? { ...scrap, ...patch }
                  : scrap,
              ),
            }
          : board,
      ),
    })),
  updateScrapLayout: (boardId, scrapId, patch) =>
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              scraps: board.scraps.map((scrap) =>
                scrap.id === scrapId ? { ...scrap, ...patch } : scrap,
              ),
            }
          : board,
      ),
    })),
}));
