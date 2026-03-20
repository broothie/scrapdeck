import { create } from "zustand";
import { mockBoards } from "../data/mockBoards";
import type { Board, Scrap } from "../types";

type ScrapLayoutPatch = Partial<Pick<Scrap, "x" | "y" | "width" | "height">>;

type AppState = {
  boards: Board[];
  activeBoardId: string;
  setActiveBoard: (boardId: string) => void;
  addScrap: (boardId: string, scrap: Scrap) => void;
  updateScrapLayout: (
    boardId: string,
    scrapId: string,
    patch: ScrapLayoutPatch,
  ) => void;
};

export const useAppStore = create<AppState>((set) => ({
  boards: mockBoards,
  activeBoardId: mockBoards[0].id,
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
