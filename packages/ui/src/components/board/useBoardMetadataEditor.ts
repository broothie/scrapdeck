import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useAppStore, type Board } from "@scrapdeck/core";

export function useBoardMetadataEditor(board: Board) {
  const updateBoard = useAppStore((state) => state.updateBoard);
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [isEditingBoardDescription, setIsEditingBoardDescription] = useState(false);
  const [boardTitleDraft, setBoardTitleDraft] = useState(board.title);
  const [boardDescriptionDraft, setBoardDescriptionDraft] = useState(board.description);

  useEffect(() => {
    if (!isEditingBoardTitle) {
      setBoardTitleDraft(board.title);
    }
  }, [board.title, isEditingBoardTitle]);

  useEffect(() => {
    if (!isEditingBoardDescription) {
      setBoardDescriptionDraft(board.description);
    }
  }, [board.description, isEditingBoardDescription]);

  const handleSaveBoardTitle = () => {
    const nextTitle = boardTitleDraft.trim() || "Untitled board";
    updateBoard(board.id, { title: nextTitle });
    setIsEditingBoardTitle(false);
  };

  const handleCancelBoardTitle = () => {
    setBoardTitleDraft(board.title);
    setIsEditingBoardTitle(false);
  };

  const handleSaveBoardDescription = () => {
    updateBoard(board.id, { description: boardDescriptionDraft.trim() });
    setIsEditingBoardDescription(false);
  };

  const handleCancelBoardDescription = () => {
    setBoardDescriptionDraft(board.description);
    setIsEditingBoardDescription(false);
  };

  const handleBoardTitleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSaveBoardTitle();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      handleCancelBoardTitle();
    }
  };

  const handleBoardDescriptionKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      handleCancelBoardDescription();
      return;
    }

    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSaveBoardDescription();
    }
  };

  return {
    isEditingBoardTitle,
    isEditingBoardDescription,
    boardTitleDraft,
    boardDescriptionDraft,
    setBoardTitleDraft,
    setBoardDescriptionDraft,
    setIsEditingBoardTitle,
    setIsEditingBoardDescription,
    handleSaveBoardTitle,
    handleSaveBoardDescription,
    handleBoardTitleKeyDown,
    handleBoardDescriptionKeyDown,
  };
}
