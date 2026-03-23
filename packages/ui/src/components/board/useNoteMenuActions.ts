import { useCallback } from "react";
import { useAppStore, type Board } from "@plumboard/core";
import type { NoteContextMenuAction } from "./NoteActionMenu";
import { browserNoteEditAdapter, type NoteEditAdapter } from "./noteEditAdapter";

type UseNoteMenuActionsOptions = {
  onActionComplete?: (noteId: string, action: NoteContextMenuAction) => void;
  onEditLinkNote?: (noteId: string) => boolean;
  onViewImageNote?: (noteId: string) => boolean;
  editAdapter?: NoteEditAdapter;
};

export function useNoteMenuActions(board: Board, options: UseNoteMenuActionsOptions = {}) {
  const onActionComplete = options.onActionComplete;
  const onEditLinkNote = options.onEditLinkNote;
  const onViewImageNote = options.onViewImageNote;
  const editAdapter = options.editAdapter ?? browserNoteEditAdapter;
  const deleteNote = useAppStore((state) => state.deleteNote);
  const duplicateNote = useAppStore((state) => state.duplicateNote);
  const moveNoteToFront = useAppStore((state) => state.moveNoteToFront);
  const moveNoteToBack = useAppStore((state) => state.moveNoteToBack);
  const updateImageNote = useAppStore((state) => state.updateImageNote);
  const updateLinkNote = useAppStore((state) => state.updateLinkNote);

  const handleEditNote = useCallback((noteId: string) => {
    const note = board.notes.find((candidate) => candidate.id === noteId);

    if (!note) {
      return;
    }

    if (note.type === "text") {
      editAdapter.alert("Text notes are edited directly on the canvas.");
      return;
    }

    if (note.type === "image") {
      const nextCaption = editAdapter.prompt("Edit file caption", note.caption ?? "");

      if (nextCaption === null) {
        return;
      }

      updateImageNote(board.id, note.id, {
        caption: nextCaption.trim() || undefined,
      });
      return;
    }

    if (onEditLinkNote?.(note.id)) {
      return;
    }

    const nextUrlInput = editAdapter.prompt("Edit link URL", note.url);

    if (nextUrlInput === null) {
      return;
    }

    const trimmedUrl = nextUrlInput.trim();
    let normalizedUrl = note.url;

    if (trimmedUrl) {
      try {
        normalizedUrl = new URL(trimmedUrl).toString();
      } catch {
        editAdapter.alert("Enter a valid URL, including https://");
        return;
      }
    }

    const nextTitle = editAdapter.prompt("Edit link label", note.title);

    if (nextTitle === null) {
      return;
    }

    let nextSiteName = note.siteName;

    try {
      nextSiteName = new URL(normalizedUrl).hostname.replace(/^www\./, "") || nextSiteName;
    } catch {
      nextSiteName = note.siteName;
    }

    updateLinkNote(board.id, note.id, {
      url: normalizedUrl,
      siteName: nextSiteName,
      title: nextTitle.trim() || note.title,
      previewImage: normalizedUrl === note.url ? note.previewImage : undefined,
    });
  }, [
    board.id,
    board.notes,
    updateImageNote,
    updateLinkNote,
    onEditLinkNote,
    editAdapter,
  ]);

  const runNoteMenuAction = useCallback((noteId: string, action: NoteContextMenuAction) => {
    if (action === "view") {
      onViewImageNote?.(noteId);
      return;
    }

    if (action === "edit") {
      handleEditNote(noteId);
      return;
    }

    if (action === "duplicate") {
      duplicateNote(board.id, noteId);
      return;
    }

    if (action === "bring-front") {
      moveNoteToFront(board.id, noteId);
      return;
    }

    if (action === "send-back") {
      moveNoteToBack(board.id, noteId);
      onActionComplete?.(noteId, action);
      return;
    }

    deleteNote(board.id, noteId);
  }, [
    board.id,
    deleteNote,
    duplicateNote,
    handleEditNote,
    moveNoteToBack,
    moveNoteToFront,
    onActionComplete,
    onViewImageNote,
  ]);

  return {
    runNoteMenuAction,
  };
}
