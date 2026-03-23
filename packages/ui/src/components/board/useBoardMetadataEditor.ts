import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useAppStore, type Board } from "@plumboard/core";

export function useBoardMetadataEditor(board: Board) {
  const updateBoard = useAppStore((state) => state.updateBoard);
  const [isEditingBoardMetadata, setIsEditingBoardMetadata] = useState(false);
  const [boardTitleDraft, setBoardTitleDraft] = useState(board.title);
  const [boardDescriptionDraft, setBoardDescriptionDraft] = useState(board.description);

  useEffect(() => {
    if (!isEditingBoardMetadata) {
      setBoardTitleDraft(board.title);
      setBoardDescriptionDraft(board.description);
    }
  }, [board.description, board.title, isEditingBoardMetadata]);

  const openBoardMetadataEditor = () => {
    setBoardTitleDraft(board.title);
    setBoardDescriptionDraft(board.description);
    setIsEditingBoardMetadata(true);
  };

  const handleSaveBoardMetadata = () => {
    const nextTitle = boardTitleDraft.trim() || "Untitled board";
    updateBoard(board.id, {
      title: nextTitle,
      description: boardDescriptionDraft.trim(),
    });
    setIsEditingBoardMetadata(false);
  };

  const handleCancelBoardMetadata = () => {
    setBoardTitleDraft(board.title);
    setBoardDescriptionDraft(board.description);
    setIsEditingBoardMetadata(false);
  };

  const handleBoardMetadataTitleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSaveBoardMetadata();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      handleCancelBoardMetadata();
    }
  };

  const handleBoardMetadataDescriptionKeyDown = (
    event: ReactKeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancelBoardMetadata();
      return;
    }

    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSaveBoardMetadata();
    }
  };

  return {
    isEditingBoardMetadata,
    boardTitleDraft,
    boardDescriptionDraft,
    setBoardTitleDraft,
    setBoardDescriptionDraft,
    openBoardMetadataEditor,
    handleSaveBoardMetadata,
    handleCancelBoardMetadata,
    handleBoardMetadataTitleKeyDown,
    handleBoardMetadataDescriptionKeyDown,
  };
}
