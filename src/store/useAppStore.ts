import { create } from "zustand";
import { mockBoards } from "../data/mockBoards";

type AppState = {
  activeBoardId: string;
  setActiveBoard: (boardId: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  activeBoardId: mockBoards[0].id,
  setActiveBoard: (boardId) => set({ activeBoardId: boardId }),
}));
