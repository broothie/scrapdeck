import { useCallback } from "react";
import { useAppStore, type Board } from "@scrapdeck/core";
import type { ScrapContextMenuAction } from "./ScrapActionMenu";
import { browserScrapEditAdapter, type ScrapEditAdapter } from "./scrapEditAdapter";

type UseScrapMenuActionsOptions = {
  onActionComplete?: (scrapId: string, action: ScrapContextMenuAction) => void;
  editAdapter?: ScrapEditAdapter;
};

export function useScrapMenuActions(board: Board, options: UseScrapMenuActionsOptions = {}) {
  const onActionComplete = options.onActionComplete;
  const editAdapter = options.editAdapter ?? browserScrapEditAdapter;
  const deleteScrap = useAppStore((state) => state.deleteScrap);
  const duplicateScrap = useAppStore((state) => state.duplicateScrap);
  const moveScrapToFront = useAppStore((state) => state.moveScrapToFront);
  const moveScrapToBack = useAppStore((state) => state.moveScrapToBack);
  const updateNoteScrap = useAppStore((state) => state.updateNoteScrap);
  const updateImageScrap = useAppStore((state) => state.updateImageScrap);
  const updateLinkScrap = useAppStore((state) => state.updateLinkScrap);

  const handleEditScrap = useCallback((scrapId: string) => {
    const scrap = board.scraps.find((candidate) => candidate.id === scrapId);

    if (!scrap) {
      return;
    }

    if (scrap.type === "note") {
      const nextTitle = editAdapter.prompt("Edit note title", scrap.title ?? "");

      if (nextTitle === null) {
        return;
      }

      const nextBody = editAdapter.prompt("Edit note text", scrap.body);

      if (nextBody === null) {
        return;
      }

      updateNoteScrap(board.id, scrap.id, {
        title: nextTitle.trim() || undefined,
        body: nextBody,
      });
      return;
    }

    if (scrap.type === "image") {
      const nextCaption = editAdapter.prompt("Edit file caption", scrap.caption ?? "");

      if (nextCaption === null) {
        return;
      }

      updateImageScrap(board.id, scrap.id, {
        caption: nextCaption.trim() || undefined,
      });
      return;
    }

    const nextUrlInput = editAdapter.prompt("Edit link URL", scrap.url);

    if (nextUrlInput === null) {
      return;
    }

    const trimmedUrl = nextUrlInput.trim();
    let normalizedUrl = scrap.url;

    if (trimmedUrl) {
      try {
        normalizedUrl = new URL(trimmedUrl).toString();
      } catch {
        editAdapter.alert("Enter a valid URL, including https://");
        return;
      }
    }

    const nextTitle = editAdapter.prompt("Edit link label", scrap.title);

    if (nextTitle === null) {
      return;
    }

    let nextSiteName = scrap.siteName;

    try {
      nextSiteName = new URL(normalizedUrl).hostname.replace(/^www\./, "") || nextSiteName;
    } catch {
      nextSiteName = scrap.siteName;
    }

    updateLinkScrap(board.id, scrap.id, {
      url: normalizedUrl,
      siteName: nextSiteName,
      title: nextTitle.trim() || scrap.title,
      previewImage: normalizedUrl === scrap.url ? scrap.previewImage : undefined,
    });
  }, [
    board.id,
    board.scraps,
    updateImageScrap,
    updateLinkScrap,
    updateNoteScrap,
    editAdapter,
  ]);

  const runScrapMenuAction = useCallback((scrapId: string, action: ScrapContextMenuAction) => {
    if (action === "edit") {
      handleEditScrap(scrapId);
      return;
    }

    if (action === "duplicate") {
      duplicateScrap(board.id, scrapId);
      return;
    }

    if (action === "bring-front") {
      moveScrapToFront(board.id, scrapId);
      return;
    }

    if (action === "send-back") {
      moveScrapToBack(board.id, scrapId);
      onActionComplete?.(scrapId, action);
      return;
    }

    deleteScrap(board.id, scrapId);
  }, [
    board.id,
    deleteScrap,
    duplicateScrap,
    handleEditScrap,
    moveScrapToBack,
    moveScrapToFront,
    onActionComplete,
  ]);

  return {
    runScrapMenuAction,
  };
}
