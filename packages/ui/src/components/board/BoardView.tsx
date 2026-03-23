import { useEffect } from "react";
import { Card, H2, Input, Paragraph, Text, XStack, YStack, useTheme } from "tamagui";
import type { Board } from "@plumboard/core";
import { BoardSurface } from "./BoardSurface";
import { useBoardMetadataEditor } from "./useBoardMetadataEditor";
import { useScrapComposer } from "./useScrapComposer";
import { AppButton } from "../primitives/AppButton";

type BoardViewProps = {
  board: Board;
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

export function BoardView({ board, onUploadImage, onResolveLinkPreview }: BoardViewProps) {
  const theme = useTheme();
  const {
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
    handleAddNote,
    handleAddFile,
    handleAddLink,
    handleSaveLink,
    handleImageFileChange,
    handlePlaceScrap,
    clearPlacementIntent,
  } = useScrapComposer({
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
        <XStack style={{ alignItems: "flex-end", justifyContent: "space-between", gap: "1rem" }}>
          <YStack style={{ gap: "0.25rem" }}>
            {isEditingBoardTitle ? (
              <Input
                autoFocus
                aria-label="Board title"
                value={boardTitleDraft}
                onChange={(event) => setBoardTitleDraft(event.currentTarget.value)}
                onBlur={handleSaveBoardTitle}
                onKeyDown={handleBoardTitleKeyDown}
                style={{ maxWidth: 480 }}
              />
            ) : (
              <H2
                style={{ margin: 0, cursor: "text" }}
                onDoubleClick={() => setIsEditingBoardTitle(true)}
              >
                {board.title}
              </H2>
            )}
            {isEditingBoardDescription ? (
              <textarea
                autoFocus
                aria-label="Board description"
                value={boardDescriptionDraft}
                onChange={(event) => setBoardDescriptionDraft(event.currentTarget.value)}
                onBlur={handleSaveBoardDescription}
                onKeyDown={handleBoardDescriptionKeyDown}
                style={{
                  margin: 0,
                  maxWidth: 480,
                  minWidth: 320,
                  minHeight: 72,
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
            ) : (
              <Paragraph
                style={{ margin: 0, maxWidth: 480, cursor: "text" }}
                onDoubleClick={() => setIsEditingBoardDescription(true)}
              >
                {board.description}
              </Paragraph>
            )}
          </YStack>
        </XStack>

        {isAddingLink ? (
          <Card style={{ borderRadius: 16, borderWidth: 1 }}>
            <YStack gap="$3" style={{ padding: "1rem" }} role="dialog" aria-label="Add a link">
              <YStack gap="$1">
                <Text fontWeight="700">Save a link</Text>
                <Paragraph>
                  Paste a full URL and we&apos;ll create a link scrap for this board.
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
                  variant="primary"
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
        onCreateNote={handleAddNote}
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
        onPlaceScrap={handlePlaceScrap}
      />
    </YStack>
  );
}
