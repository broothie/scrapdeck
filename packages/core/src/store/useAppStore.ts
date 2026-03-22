import { create } from "zustand";
import { createScrapId } from "../scrapTemplates";
import type { Board, ImageScrap, LinkScrap, NoteScrap, Scrap } from "../types";

type ScrapLayoutPatch = Partial<Pick<Scrap, "x" | "y" | "width" | "height">>;
type NoteScrapPatch = Partial<Pick<NoteScrap, "title" | "body">>;
type ImageScrapPatch = Partial<Pick<ImageScrap, "src" | "alt" | "caption">>;
type LinkScrapPatch = Partial<Pick<LinkScrap, "url" | "siteName" | "title" | "description" | "previewImage">>;
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
  updateImageScrap: (
    boardId: string,
    scrapId: string,
    patch: ImageScrapPatch,
  ) => void;
  updateLinkScrap: (
    boardId: string,
    scrapId: string,
    patch: LinkScrapPatch,
  ) => void;
  updateScrapLayout: (
    boardId: string,
    scrapId: string,
    patch: ScrapLayoutPatch,
  ) => void;
  duplicateScrap: (boardId: string, scrapId: string) => void;
  moveScrapToFront: (boardId: string, scrapId: string) => void;
  moveScrapToBack: (boardId: string, scrapId: string) => void;
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

function mapBoardById(
  boards: Board[],
  boardId: string,
  updateBoard: (board: Board) => Board,
) {
  return boards.map((board) => (board.id === boardId ? updateBoard(board) : board));
}

function mapBoardScrapsById(
  boards: Board[],
  boardId: string,
  updateScraps: (scraps: Scrap[]) => Scrap[],
) {
  return mapBoardById(boards, boardId, (board) => ({
    ...board,
    scraps: updateScraps(board.scraps),
  }));
}

function patchScrapByType<TPatch>(
  scraps: Scrap[],
  scrapId: string,
  scrapType: Scrap["type"],
  patch: TPatch,
) {
  return scraps.map((scrap) =>
    scrap.id === scrapId && scrap.type === scrapType
      ? { ...scrap, ...patch }
      : scrap,
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
      boards: mapBoardById(state.boards, boardId, (board) => ({ ...board, ...patch })),
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
      boards: mapBoardScrapsById(state.boards, boardId, (scraps) => [...scraps, scrap]),
    })),
  deleteScrap: (boardId, scrapId) =>
    set((state) => ({
      boards: mapBoardScrapsById(
        state.boards,
        boardId,
        (scraps) => scraps.filter((scrap) => scrap.id !== scrapId),
      ),
    })),
  updateNoteScrap: (boardId, scrapId, patch) =>
    set((state) => ({
      boards: mapBoardScrapsById(
        state.boards,
        boardId,
        (scraps) => patchScrapByType(scraps, scrapId, "note", patch),
      ),
    })),
  updateImageScrap: (boardId, scrapId, patch) =>
    set((state) => ({
      boards: mapBoardScrapsById(
        state.boards,
        boardId,
        (scraps) => patchScrapByType(scraps, scrapId, "image", patch),
      ),
    })),
  updateLinkScrap: (boardId, scrapId, patch) =>
    set((state) => ({
      boards: mapBoardScrapsById(
        state.boards,
        boardId,
        (scraps) => patchScrapByType(scraps, scrapId, "link", patch),
      ),
    })),
  updateScrapLayout: (boardId, scrapId, patch) =>
    set((state) => ({
      boards: mapBoardScrapsById(
        state.boards,
        boardId,
        (scraps) => scraps.map((scrap) => (scrap.id === scrapId ? { ...scrap, ...patch } : scrap)),
      ),
    })),
  duplicateScrap: (boardId, scrapId) =>
    set((state) => ({
      boards: mapBoardById(state.boards, boardId, (board) => {
        const sourceScrap = board.scraps.find((scrap) => scrap.id === scrapId);
        if (!sourceScrap) {
          return board;
        }

        const duplicate: Scrap = {
          ...sourceScrap,
          id: createScrapId(sourceScrap.type),
          x: sourceScrap.x + 24,
          y: sourceScrap.y + 24,
        };

        return {
          ...board,
          scraps: [...board.scraps, duplicate],
        };
      }),
    })),
  moveScrapToFront: (boardId, scrapId) =>
    set((state) => ({
      boards: mapBoardById(state.boards, boardId, (board) => {
        const targetScrap = board.scraps.find((scrap) => scrap.id === scrapId);
        if (!targetScrap) {
          return board;
        }

        return {
          ...board,
          scraps: [
            ...board.scraps.filter((scrap) => scrap.id !== scrapId),
            targetScrap,
          ],
        };
      }),
    })),
  moveScrapToBack: (boardId, scrapId) =>
    set((state) => ({
      boards: mapBoardById(state.boards, boardId, (board) => {
        const targetScrap = board.scraps.find((scrap) => scrap.id === scrapId);
        if (!targetScrap) {
          return board;
        }

        return {
          ...board,
          scraps: [
            targetScrap,
            ...board.scraps.filter((scrap) => scrap.id !== scrapId),
          ],
        };
      }),
    })),
}));
