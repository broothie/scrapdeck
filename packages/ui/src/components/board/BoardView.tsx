import { useEffect } from "react";
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
    linkUrl,
    linkError,
    fileUploadError,
    placementIntent,
    setLinkUrl,
    closeLinkComposer,
    handleAddTextNote,
    handleAddFile,
    handleAddLink,
    handleSaveLink,
    handleImageFileChange,
    handlePlaceNote,
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

        {isAddingLink ? (
          <Card style={{ borderRadius: 16, borderWidth: 1 }}>
            <YStack gap="$3" style={{ padding: "1rem" }} role="dialog" aria-label="Add a link">
              <YStack gap="$1">
                <Text fontWeight="700">Save a link</Text>
                <Paragraph>
                  Paste a full URL and we&apos;ll create a link note for this board.
                </Paragraph>
              </YStack>
              <Input
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleSaveLink();
                  }

                  if (event.key === "Escape") {
                    closeLinkComposer();
                  }
                }}
                placeholder="https://example.com/article"
                keyboardType="url"
                disabled={isResolvingLink}
              />
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
                  {isResolvingLink ? "Fetching preview..." : "Save link"}
                </AppButton>
              </XStack>
            </YStack>
          </Card>
        ) : null}
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
      />

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
