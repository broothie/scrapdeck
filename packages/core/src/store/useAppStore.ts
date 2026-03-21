import { create } from "zustand";
import type { Board, Scrap } from "../types";

type ScrapLayoutPatch = Partial<Pick<Scrap, "x" | "y" | "width" | "height">>;

type AppState = {
  boards: Board[];
  activeBoardId: string;
  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;
  setActiveBoard: (boardId: string) => void;
  addScrap: (boardId: string, scrap: Scrap) => void;
  updateScrapLayout: (
    boardId: string,
    scrapId: string,
    patch: ScrapLayoutPatch,
  ) => void;
};

export const useAppStore = create<AppState>((set) => ({
  boards: [],
  activeBoardId: "",
  setBoards: (boards) =>
    set((state) => ({
      boards,
      activeBoardId:
        boards.find((board) => board.id === state.activeBoardId)?.id ??
        boards[0]?.id ??
        "",
    })),
  addBoard: (board) =>
    set((state) => ({
      boards: [...state.boards, board],
      activeBoardId: state.activeBoardId || board.id,
    })),
  setActiveBoard: (boardId) => set({ activeBoardId: boardId }),
  addScrap: (boardId, scrap) =>
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId
          ? { ...board, scraps: [...board.scraps, scrap] }
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
