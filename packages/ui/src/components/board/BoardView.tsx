import { useCallback, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
import { Card, H2, Input, Paragraph, Text, XStack, YStack, useTheme } from "tamagui";
import type { Board } from "@plumboard/core";
import { BoardSurface } from "./BoardSurface";
import { useBoardMetadataEditor } from "./useBoardMetadataEditor";
import { useNoteComposer } from "./useNoteComposer";
import { AppButton } from "../primitives/AppButton";

type BoardViewProps = {
  board: Board;
  shouldOpenMetadataEditor?: boolean;
  onMetadataEditorOpenHandled?: () => void;
  onDeleteBoard?: (boardId: string) => void;
  onUploadImage?: (file: File) => Promise<{
    src: string;
    alt?: string;
    caption?: string;
  }>;
  onResolveLinkPreview?: (url: string) => Promise<{
    url?: string;
    siteName?: string;
    title?: string;
    description?: string;
    previewImage?: string;
  }>;
};

export function BoardView({
  board,
  shouldOpenMetadataEditor = false,
  onMetadataEditorOpenHandled,
  onDeleteBoard,
  onUploadImage,
  onResolveLinkPreview,
}: BoardViewProps) {
  const theme = useTheme();
  const {
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
  } = useBoardMetadataEditor(board);
  const {
    imageInputRef,
    isAddingLink,
    isResolvingLink,
    isUploadingFile,
    isEditingLink,
    linkUrl,
    linkTitle,
    linkDescription,
    linkError,
    fileUploadError,
    placementIntent,
    setLinkUrl,
    setLinkTitle,
    setLinkDescription,
    closeLinkComposer,
    handleAddTextNote,
    handleAddFile,
    handleAddLink,
    handleEditLink,
    handleSaveLink,
    handleImageFileChange,
    handlePlaceNote,
    handleDropFileAtPosition,
    handleDropLinkAtPosition,
    clearPlacementIntent,
  } = useNoteComposer({
    boardId: board.id,
    onUploadImage,
    onResolveLinkPreview,
  });

  useEffect(() => {
    if (!placementIntent && !isAddingLink) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearPlacementIntent();
        closeLinkComposer();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [clearPlacementIntent, closeLinkComposer, isAddingLink, placementIntent]);

  useEffect(() => {
    if (!shouldOpenMetadataEditor) {
      return;
    }

    openBoardMetadataEditor();
    onMetadataEditorOpenHandled?.();
  }, [onMetadataEditorOpenHandled, openBoardMetadataEditor, shouldOpenMetadataEditor]);

  useEffect(() => {
    if (!isEditingBoardMetadata) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCancelBoardMetadata();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [handleCancelBoardMetadata, isEditingBoardMetadata]);

  const handleEditLinkFromContextMenu = useCallback((noteId: string) => {
    const note = board.notes.find((candidate) => candidate.id === noteId);

    if (!note || note.type !== "link") {
      return false;
    }

    handleEditLink(note);
    return true;
  }, [board.notes, handleEditLink]);

  return (
    <YStack flex={1} style={{ minHeight: 0 }}>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageFileChange}
        style={{ display: "none" }}
      />
      <YStack
        style={{
          padding: "1.25rem 1.5rem 1rem",
          gap: "1rem",
          borderBottomWidth: 1,
          borderBottomColor: theme.borderSubtle.val,
        }}
      >
        <XStack style={{ alignItems: "flex-end", gap: "1rem" }}>
          <YStack style={{ gap: "0.25rem" }}>
            <XStack style={{ alignItems: "center", gap: "0.35rem", width: "fit-content" }}>
              <H2 style={{ margin: 0 }}>
                {board.title}
              </H2>
              <div
                role="button"
                tabIndex={0}
                aria-label="Edit board details"
                onClick={openBoardMetadataEditor}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openBoardMetadataEditor();
                  }
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: theme.textSecondary.val,
                  lineHeight: 0,
                }}
              >
                <MoreHorizontal size={18} strokeWidth={2.1} />
              </div>
            </XStack>
            <Paragraph style={{ margin: 0, maxWidth: 480 }}>
              {board.description}
            </Paragraph>
          </YStack>
        </XStack>
        {fileUploadError ? (
          <Text theme="red" fontSize={14}>
            {fileUploadError}
          </Text>
        ) : null}
      </YStack>

      <BoardSurface
        board={board}
        isUploadingFile={isUploadingFile}
        onCreateTextNote={handleAddTextNote}
        onCreateFile={handleAddFile}
        onCreateLink={handleAddLink}
        onEditLinkNote={handleEditLinkFromContextMenu}
        placementPreview={
          placementIntent
            ? {
                type: placementIntent.type,
                width: placementIntent.width,
                height: placementIntent.height,
              }
            : null
        }
        onPlaceNote={handlePlaceNote}
        onDropFileAtPosition={handleDropFileAtPosition}
        onDropLinkAtPosition={handleDropLinkAtPosition}
      />

      {isAddingLink ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isEditingLink ? "Edit link note" : "Add link note"}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeLinkComposer();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.25rem",
            backgroundColor: "rgba(16, 12, 24, 0.5)",
            zIndex: 58,
          }}
        >
          <Card
            style={{
              width: "100%",
              maxWidth: 620,
              borderWidth: 1,
              borderColor: theme.borderDefault.val,
              backgroundColor: theme.surface.val,
              boxShadow: "0 20px 40px rgba(14, 10, 22, 0.28)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <YStack gap="$3" style={{ padding: "1rem" }}>
              <YStack gap="$1">
                <Text fontWeight="700">{isEditingLink ? "Edit link note" : "Add link note"}</Text>
                <Paragraph style={{ margin: 0, color: theme.textSecondary.val }}>
                  Enter a URL and optional title/description. If you leave title or description
                  blank, we&apos;ll use link metadata when available.
                </Paragraph>
              </YStack>

              <YStack gap="$2">
                <Text style={{ fontWeight: 600 }}>URL</Text>
                <Input
                  autoFocus
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleSaveLink();
                    }
                  }}
                  placeholder="https://example.com/article"
                  keyboardType="url"
                  disabled={isResolvingLink}
                />
              </YStack>

              <YStack gap="$2">
                <Text style={{ fontWeight: 600 }}>Title (optional)</Text>
                <Input
                  value={linkTitle}
                  onChange={(event) => setLinkTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleSaveLink();
                    }
                  }}
                  placeholder="Custom title override"
                  disabled={isResolvingLink}
                />
              </YStack>

              <YStack gap="$2">
                <Text style={{ fontWeight: 600 }}>Description (optional)</Text>
                <textarea
                  value={linkDescription}
                  onChange={(event) => setLinkDescription(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                      event.preventDefault();
                      void handleSaveLink();
                    }
                  }}
                  placeholder="Custom description override"
                  style={{
                    margin: 0,
                    width: "100%",
                    minHeight: 100,
                    resize: "vertical",
                    borderRadius: 12,
                    border: `1px solid ${theme.borderDefault.val}`,
                    backgroundColor: theme.surfaceHover.val,
                    color: theme.textPrimary.val,
                    font: "inherit",
                    lineHeight: 1.5,
                    padding: "0.75rem 0.85rem",
                    outline: "none",
                  }}
                />
              </YStack>

              {linkError ? (
                <Text theme="red" fontSize={14}>
                  {linkError}
                </Text>
              ) : null}

              <XStack style={{ justifyContent: "flex-end", gap: "0.75rem" }}>
                <AppButton variant="outline" onPress={closeLinkComposer} disabled={isResolvingLink}>
                  Cancel
                </AppButton>
                <AppButton
                  variant="cta"
                  onPress={() => void handleSaveLink()}
                  disabled={isResolvingLink}
                  loading={isResolvingLink}
                >
                  {isResolvingLink
                    ? "Fetching metadata..."
                    : (isEditingLink ? "Save link note" : "Create link note")}
                </AppButton>
              </XStack>
            </YStack>
          </Card>
        </div>
      ) : null}

      {isEditingBoardMetadata ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit board details"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleCancelBoardMetadata();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.25rem",
            backgroundColor: "rgba(16, 12, 24, 0.5)",
            zIndex: 60,
          }}
        >
          <Card
            style={{
              width: "100%",
              maxWidth: 560,
              borderWidth: 1,
              borderColor: theme.borderDefault.val,
              backgroundColor: theme.surface.val,
              boxShadow: "0 20px 40px rgba(14, 10, 22, 0.28)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <YStack gap="$3" style={{ padding: "1rem" }}>
              <YStack gap="$1">
                <Text fontWeight="700">Edit board details</Text>
                <Paragraph style={{ margin: 0, color: theme.textSecondary.val }}>
                  Update this board&apos;s title and description.
                </Paragraph>
              </YStack>

              <YStack gap="$2">
                <Text style={{ fontWeight: 600 }}>Board title</Text>
                <Input
                  autoFocus
                  aria-label="Board title"
                  value={boardTitleDraft}
                  onChange={(event) => setBoardTitleDraft(event.currentTarget.value)}
                  onKeyDown={handleBoardMetadataTitleKeyDown}
                  style={{ width: "100%" }}
                />
              </YStack>

              <YStack gap="$2">
                <Text style={{ fontWeight: 600 }}>Description</Text>
                <textarea
                  aria-label="Board description"
                  value={boardDescriptionDraft}
                  onChange={(event) => setBoardDescriptionDraft(event.currentTarget.value)}
                  onKeyDown={handleBoardMetadataDescriptionKeyDown}
                  placeholder="Describe what this board is for"
                  style={{
                    margin: 0,
                    width: "100%",
                    minHeight: 120,
                    resize: "vertical",
                    borderRadius: 12,
                    border: `1px solid ${theme.borderDefault.val}`,
                    backgroundColor: theme.surfaceHover.val,
                    color: theme.textPrimary.val,
                    font: "inherit",
                    lineHeight: 1.5,
                    padding: "0.75rem 0.85rem",
                    outline: "none",
                  }}
                />
                <Text style={{ fontSize: 12, color: theme.textMuted.val }}>
                  Press Ctrl/Cmd + Enter to save quickly.
                </Text>
              </YStack>

              <XStack style={{ justifyContent: "flex-end", gap: "0.75rem" }}>
                {onDeleteBoard ? (
                  <AppButton
                    variant="danger"
                    onPress={() => {
                      handleCancelBoardMetadata();
                      onDeleteBoard(board.id);
                    }}
                    style={{ marginRight: "auto" }}
                  >
                    Delete board
                  </AppButton>
                ) : null}
                <AppButton variant="outline" onPress={handleCancelBoardMetadata}>
                  Cancel
                </AppButton>
                <AppButton variant="cta" onPress={handleSaveBoardMetadata}>
                  Save changes
                </AppButton>
              </XStack>
            </YStack>
          </Card>
        </div>
      ) : null}
    </YStack>
  );
}
