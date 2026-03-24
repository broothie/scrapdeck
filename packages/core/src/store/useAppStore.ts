import { create } from "zustand";
import { createNoteId } from "../noteTemplates";
import type { Board, ImageNote, LinkNote, TextNote, Note } from "../types";

type NoteLayoutPatch = Partial<Pick<Note, "x" | "y" | "width" | "height">>;
type TextNotePatch = Partial<Pick<TextNote, "title" | "body">>;
type ImageNotePatch = Partial<Pick<ImageNote, "src" | "alt" | "caption">>;
type LinkNotePatch = Partial<Pick<LinkNote, "url" | "siteName" | "title" | "description" | "previewImage">>;
type BoardPatch = Partial<Pick<Board, "title" | "description">>;
type DirtyRevisionMap = Record<string, number>;

export type SyncChangeSet = {
  boardUpsertIds: string[];
  boardDeleteIds: string[];
  noteUpsertIds: string[];
  noteDeleteIds: string[];
  upToRevision: number;
};

type AppState = {
  boards: Board[];
  activeBoardId: string;
  syncRevision: number;
  dirtyBoardUpserts: DirtyRevisionMap;
  dirtyBoardDeletes: DirtyRevisionMap;
  dirtyNoteUpserts: DirtyRevisionMap;
  dirtyNoteDeletes: DirtyRevisionMap;
  setBoards: (boards: Board[]) => void;
  clearSyncState: () => void;
  acknowledgeSyncChangeSet: (changeSet: SyncChangeSet) => void;
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

function nextRevision(currentRevision: number) {
  return currentRevision + 1;
}

function setDirtyId(
  map: DirtyRevisionMap,
  id: string,
  revision: number,
) {
  if (map[id] === revision) {
    return map;
  }

  return {
    ...map,
    [id]: revision,
  };
}

function removeDirtyId(
  map: DirtyRevisionMap,
  id: string,
) {
  if (!(id in map)) {
    return map;
  }

  const nextMap = { ...map };
  delete nextMap[id];
  return nextMap;
}

function acknowledgeDirtyIds(
  map: DirtyRevisionMap,
  ids: string[],
  upToRevision: number,
) {
  let nextMap = map;

  for (const id of ids) {
    const revision = nextMap[id];
    if (typeof revision === "number" && revision <= upToRevision) {
      nextMap = removeDirtyId(nextMap, id);
    }
  }

  return nextMap;
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
  syncRevision: 0,
  dirtyBoardUpserts: {},
  dirtyBoardDeletes: {},
  dirtyNoteUpserts: {},
  dirtyNoteDeletes: {},
  setBoards: (boards) =>
    set((state) => ({
      boards,
      activeBoardId: resolveActiveBoardId(boards, state.activeBoardId),
      syncRevision: 0,
      dirtyBoardUpserts: {},
      dirtyBoardDeletes: {},
      dirtyNoteUpserts: {},
      dirtyNoteDeletes: {},
    })),
  clearSyncState: () => set({
    syncRevision: 0,
    dirtyBoardUpserts: {},
    dirtyBoardDeletes: {},
    dirtyNoteUpserts: {},
    dirtyNoteDeletes: {},
  }),
  acknowledgeSyncChangeSet: (changeSet) =>
    set((state) => ({
      dirtyBoardUpserts: acknowledgeDirtyIds(
        state.dirtyBoardUpserts,
        changeSet.boardUpsertIds,
        changeSet.upToRevision,
      ),
      dirtyBoardDeletes: acknowledgeDirtyIds(
        state.dirtyBoardDeletes,
        changeSet.boardDeleteIds,
        changeSet.upToRevision,
      ),
      dirtyNoteUpserts: acknowledgeDirtyIds(
        state.dirtyNoteUpserts,
        changeSet.noteUpsertIds,
        changeSet.upToRevision,
      ),
      dirtyNoteDeletes: acknowledgeDirtyIds(
        state.dirtyNoteDeletes,
        changeSet.noteDeleteIds,
        changeSet.upToRevision,
      ),
    })),
  addBoard: (board) =>
    set((state) => {
      const revision = nextRevision(state.syncRevision);

      return {
        boards: [...state.boards, board],
        activeBoardId: state.activeBoardId || board.id,
        syncRevision: revision,
        dirtyBoardUpserts: setDirtyId(state.dirtyBoardUpserts, board.id, revision),
        dirtyBoardDeletes: removeDirtyId(state.dirtyBoardDeletes, board.id),
      };
    }),
  updateBoard: (boardId, patch) =>
    set((state) => {
      const hasBoard = state.boards.some((board) => board.id === boardId);
      if (!hasBoard) {
        return {};
      }

      const revision = nextRevision(state.syncRevision);

      return {
        boards: mapBoardById(state.boards, boardId, (board) => ({ ...board, ...patch })),
        syncRevision: revision,
        dirtyBoardUpserts: setDirtyId(state.dirtyBoardUpserts, boardId, revision),
      };
    }),
  deleteBoard: (boardId) =>
    set((state) => {
      const nextBoards = state.boards.filter((board) => board.id !== boardId);
      const deletedBoard = state.boards.find((board) => board.id === boardId);
      if (!deletedBoard) {
        return {};
      }

      const revision = nextRevision(state.syncRevision);
      let dirtyNoteUpserts = state.dirtyNoteUpserts;
      let dirtyNoteDeletes = state.dirtyNoteDeletes;

      for (const note of deletedBoard.notes) {
        dirtyNoteUpserts = removeDirtyId(dirtyNoteUpserts, note.id);
        dirtyNoteDeletes = removeDirtyId(dirtyNoteDeletes, note.id);
      }

      return {
        boards: nextBoards,
        activeBoardId: resolveActiveBoardId(nextBoards, state.activeBoardId),
        syncRevision: revision,
        dirtyBoardUpserts: removeDirtyId(state.dirtyBoardUpserts, boardId),
        dirtyBoardDeletes: setDirtyId(state.dirtyBoardDeletes, boardId, revision),
        dirtyNoteUpserts,
        dirtyNoteDeletes,
      };
    }),
  setActiveBoard: (boardId) => set({ activeBoardId: boardId }),
  addNote: (boardId, note) =>
    set((state) => {
      const hasBoard = state.boards.some((board) => board.id === boardId);
      if (!hasBoard) {
        return {};
      }

      const revision = nextRevision(state.syncRevision);
      return {
        boards: mapBoardNotesById(state.boards, boardId, (notes) => [...notes, note]),
        syncRevision: revision,
        dirtyNoteUpserts: setDirtyId(state.dirtyNoteUpserts, note.id, revision),
        dirtyNoteDeletes: removeDirtyId(state.dirtyNoteDeletes, note.id),
      };
    }),
  deleteNote: (boardId, noteId) =>
    set((state) => {
      const board = state.boards.find((candidate) => candidate.id === boardId);
      if (!board || !board.notes.some((note) => note.id === noteId)) {
        return {};
      }

      const revision = nextRevision(state.syncRevision);
      return {
        boards: mapBoardNotesById(
          state.boards,
          boardId,
          (notes) => notes.filter((note) => note.id !== noteId),
        ),
        syncRevision: revision,
        dirtyNoteUpserts: removeDirtyId(state.dirtyNoteUpserts, noteId),
        dirtyNoteDeletes: setDirtyId(state.dirtyNoteDeletes, noteId, revision),
      };
    }),
  updateTextNote: (boardId, noteId, patch) =>
    set((state) => {
      const board = state.boards.find((candidate) => candidate.id === boardId);
      if (!board || !board.notes.some((note) => note.id === noteId && note.type === "text")) {
        return {};
      }

      const revision = nextRevision(state.syncRevision);
      return {
        boards: mapBoardNotesById(
          state.boards,
          boardId,
          (notes) => patchNoteByType(notes, noteId, "text", patch),
        ),
        syncRevision: revision,
        dirtyNoteUpserts: setDirtyId(state.dirtyNoteUpserts, noteId, revision),
      };
    }),
  updateImageNote: (boardId, noteId, patch) =>
    set((state) => {
      const board = state.boards.find((candidate) => candidate.id === boardId);
      if (!board || !board.notes.some((note) => note.id === noteId && note.type === "image")) {
        return {};
      }

      const revision = nextRevision(state.syncRevision);
      return {
        boards: mapBoardNotesById(
          state.boards,
          boardId,
          (notes) => patchNoteByType(notes, noteId, "image", patch),
        ),
        syncRevision: revision,
        dirtyNoteUpserts: setDirtyId(state.dirtyNoteUpserts, noteId, revision),
      };
    }),
  updateLinkNote: (boardId, noteId, patch) =>
    set((state) => {
      const board = state.boards.find((candidate) => candidate.id === boardId);
      if (!board || !board.notes.some((note) => note.id === noteId && note.type === "link")) {
        return {};
      }

      const revision = nextRevision(state.syncRevision);
      return {
        boards: mapBoardNotesById(
          state.boards,
          boardId,
          (notes) => patchNoteByType(notes, noteId, "link", patch),
        ),
        syncRevision: revision,
        dirtyNoteUpserts: setDirtyId(state.dirtyNoteUpserts, noteId, revision),
      };
    }),
  updateNoteLayout: (boardId, noteId, patch) =>
    set((state) => {
      const board = state.boards.find((candidate) => candidate.id === boardId);
      if (!board || !board.notes.some((note) => note.id === noteId)) {
        return {};
      }

      const revision = nextRevision(state.syncRevision);
      return {
        boards: mapBoardNotesById(
          state.boards,
          boardId,
          (notes) => notes.map((note) => (note.id === noteId ? { ...note, ...patch } : note)),
        ),
        syncRevision: revision,
        dirtyNoteUpserts: setDirtyId(state.dirtyNoteUpserts, noteId, revision),
      };
    }),
  duplicateNote: (boardId, noteId) =>
    set((state) => {
      let duplicatedNoteId: string | null = null;
      const nextBoards = mapBoardById(state.boards, boardId, (board) => {
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
        duplicatedNoteId = duplicate.id;

        return {
          ...board,
          notes: [...board.notes, duplicate],
        };
      });

      if (!duplicatedNoteId) {
        return {};
      }

      const revision = nextRevision(state.syncRevision);
      return {
        boards: nextBoards,
        syncRevision: revision,
        dirtyNoteUpserts: setDirtyId(state.dirtyNoteUpserts, duplicatedNoteId, revision),
        dirtyNoteDeletes: removeDirtyId(state.dirtyNoteDeletes, duplicatedNoteId),
      };
    }),
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
