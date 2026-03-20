import { create } from "zustand";
import { mockBoards } from "../data/mockBoards";
import type { Board, Scrap } from "../types";

type AppState = {
  boards: Board[];
  activeBoardId: string;
  setActiveBoard: (boardId: string) => void;
  addScrap: (boardId: string, scrap: Scrap) => void;
  updateScrapPosition: (
    boardId: string,
    scrapId: string,
    x: number,
    y: number,
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
  updateScrapPosition: (boardId, scrapId, x, y) =>
    set((state) => ({
      boards: state.boards.map((board) =>
        board.id === boardId
          ? {
              ...board,
              scraps: board.scraps.map((scrap) =>
                scrap.id === scrapId ? { ...scrap, x, y } : scrap,
              ),
            }
          : board,
      ),
    })),
}));
