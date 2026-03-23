import { create } from "zustand";
import { createNoteId } from "../noteTemplates";
import type { Board, ImageNote, LinkNote, TextNote, Note } from "../types";

type NoteLayoutPatch = Partial<Pick<Note, "x" | "y" | "width" | "height">>;
type TextNotePatch = Partial<Pick<TextNote, "title" | "body">>;
type ImageNotePatch = Partial<Pick<ImageNote, "src" | "alt" | "caption">>;
type LinkNotePatch = Partial<Pick<LinkNote, "url" | "siteName" | "title" | "description" | "previewImage">>;
type BoardPatch = Partial<Pick<Board, "title" | "description">>;

type AppState = {
  boards: Board[];
  activeBoardId: string;
  setBoards: (boards: Board[]) => void;
  addBoard: (board: Board) => void;
  updateBoard: (boardId: string, patch: BoardPatch) => void;
  deleteBoard: (boardId: string) => void;
  setActiveBoard: (boardId: string) => void;
  addNote: (boardId: string, note: Note) => void;
  deleteNote: (boardId: string, noteId: string) => void;
  updateTextNote: (
    boardId: string,
    noteId: string,
    patch: TextNotePatch,
  ) => void;
  updateImageNote: (
    boardId: string,
    noteId: string,
    patch: ImageNotePatch,
  ) => void;
  updateLinkNote: (
    boardId: string,
    noteId: string,
    patch: LinkNotePatch,
  ) => void;
  updateNoteLayout: (
    boardId: string,
    noteId: string,
    patch: NoteLayoutPatch,
  ) => void;
  duplicateNote: (boardId: string, noteId: string) => void;
  moveNoteToFront: (boardId: string, noteId: string) => void;
  moveNoteToBack: (boardId: string, noteId: string) => void;
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

function mapBoardNotesById(
  boards: Board[],
  boardId: string,
  updateNotes: (notes: Note[]) => Note[],
) {
  return mapBoardById(boards, boardId, (board) => ({
    ...board,
    notes: updateNotes(board.notes),
  }));
}

function patchNoteByType<TPatch>(
  notes: Note[],
  noteId: string,
  noteType: Note["type"],
  patch: TPatch,
) {
  return notes.map((note) =>
    note.id === noteId && note.type === noteType
      ? { ...note, ...patch }
      : note,
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
  addNote: (boardId, note) =>
    set((state) => ({
      boards: mapBoardNotesById(state.boards, boardId, (notes) => [...notes, note]),
    })),
  deleteNote: (boardId, noteId) =>
    set((state) => ({
      boards: mapBoardNotesById(
        state.boards,
        boardId,
        (notes) => notes.filter((note) => note.id !== noteId),
      ),
    })),
  updateTextNote: (boardId, noteId, patch) =>
    set((state) => ({
      boards: mapBoardNotesById(
        state.boards,
        boardId,
        (notes) => patchNoteByType(notes, noteId, "text", patch),
      ),
    })),
  updateImageNote: (boardId, noteId, patch) =>
    set((state) => ({
      boards: mapBoardNotesById(
        state.boards,
        boardId,
        (notes) => patchNoteByType(notes, noteId, "image", patch),
      ),
    })),
  updateLinkNote: (boardId, noteId, patch) =>
    set((state) => ({
      boards: mapBoardNotesById(
        state.boards,
        boardId,
        (notes) => patchNoteByType(notes, noteId, "link", patch),
      ),
    })),
  updateNoteLayout: (boardId, noteId, patch) =>
    set((state) => ({
      boards: mapBoardNotesById(
        state.boards,
        boardId,
        (notes) => notes.map((note) => (note.id === noteId ? { ...note, ...patch } : note)),
      ),
    })),
  duplicateNote: (boardId, noteId) =>
    set((state) => ({
      boards: mapBoardById(state.boards, boardId, (board) => {
        const sourceNote = board.notes.find((note) => note.id === noteId);
        if (!sourceNote) {
          return board;
        }

        const duplicate: Note = {
          ...sourceNote,
          id: createNoteId(sourceNote.type),
          x: sourceNote.x + 24,
          y: sourceNote.y + 24,
        };

        return {
          ...board,
          notes: [...board.notes, duplicate],
        };
      }),
    })),
  moveNoteToFront: (boardId, noteId) =>
    set((state) => ({
      boards: mapBoardById(state.boards, boardId, (board) => {
        const targetNote = board.notes.find((note) => note.id === noteId);
        if (!targetNote) {
          return board;
        }

        return {
          ...board,
          notes: [
            ...board.notes.filter((note) => note.id !== noteId),
            targetNote,
          ],
        };
      }),
    })),
  moveNoteToBack: (boardId, noteId) =>
    set((state) => ({
      boards: mapBoardById(state.boards, boardId, (board) => {
        const targetNote = board.notes.find((note) => note.id === noteId);
        if (!targetNote) {
          return board;
        }

        return {
          ...board,
          notes: [
            targetNote,
            ...board.notes.filter((note) => note.id !== noteId),
          ],
        };
      }),
    })),
}));
