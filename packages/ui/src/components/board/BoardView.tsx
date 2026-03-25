import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, H2, Input, Paragraph, Text, XStack, YStack, useTheme } from "tamagui";
import type { Board } from "@plumboard/core";
import { BoardSurface } from "./BoardSurface";
import { useBoardMetadataEditor } from "./useBoardMetadataEditor";
import { useNoteComposer } from "./useNoteComposer";
import { AppButton } from "../primitives/AppButton";
import { ImageNoteCard } from "./notes/ImageNote";
import { LinkNoteCard } from "./notes/LinkNote";

type BoardViewProps = {
  board: Board;
  ownerUsername?: string;
  presenceParticipants?: Array<{
    id: string;
    name: string;
    avatarUrl?: string;
    color?: string;
    isCurrentUser?: boolean;
    isCurrentSession?: boolean;
    userId?: string;
    cursor?: {
      x: number;
      y: number;
    } | null;
    selectedNoteIds?: string[];
  }>;
  shouldOpenMetadataEditor?: boolean;
  onMetadataEditorOpenHandled?: () => void;
  onDeleteBoard?: (boardId: string) => void;
  onInviteCollaborator?: (email: string) => Promise<{ error?: string }>;
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
  isMobileLayout?: boolean;
  onLocalCursorPositionChange?: (position: { x: number; y: number } | null) => void;
  onLocalSelectedNoteIdsChange?: (noteIds: string[]) => void;
};

export function BoardView({
  board,
  ownerUsername = "you",
  presenceParticipants = [],
  shouldOpenMetadataEditor = false,
  onMetadataEditorOpenHandled,
  onDeleteBoard,
  onInviteCollaborator,
  onUploadImage,
  onResolveLinkPreview,
  isMobileLayout = false,
  onLocalCursorPositionChange,
  onLocalSelectedNoteIdsChange,
}: BoardViewProps) {
  const theme = useTheme();
  const [activeLightboxImageNoteId, setActiveLightboxImageNoteId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [isInvitingCollaborator, setIsInvitingCollaborator] = useState(false);
  const otherPresenceParticipants = useMemo(
    () => presenceParticipants.filter((participant) => !participant.isCurrentUser),
    [presenceParticipants],
  );
  const extraPresenceCount = Math.max(0, otherPresenceParticipants.length - 4);
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
    isAddingFile,
    isAddingLink,
    isResolvingLink,
    isUploadingFile,
    isEditingFile,
    isEditingLink,
    fileCaption,
    pendingFileName,
    linkUrl,
    linkTitle,
    linkDescription,
    linkError,
    fileUploadError,
    placementIntent,
    autoEditTextNoteId,
    setFileCaption,
    setLinkUrl,
    setLinkTitle,
    setLinkDescription,
    closeFileComposer,
    closeLinkComposer,
    handleAddTextNote,
    handleAddTextNoteAtPosition,
    handleAddFile,
    handleAddFileAtPosition,
    handleAddLink,
    handleAddLinkAtPosition,
    handleEditFile,
    handleEditLink,
    handleFileInputChange,
    handleSaveFile,
    handleSaveLink,
    handlePlaceNote,
    handleDropFileAtPosition,
    handleDropLinkAtPosition,
    clearPlacementIntent,
    handleAutoEditTextNoteHandled,
  } = useNoteComposer({
    boardId: board.id,
    onUploadImage,
    onResolveLinkPreview,
  });

  useEffect(() => {
    setActiveLightboxImageNoteId(null);
    setInviteEmail("");
    setInviteError("");
    setInviteSuccess("");
    setIsInvitingCollaborator(false);
  }, [board.id]);

  useEffect(() => {
    if (!placementIntent && !isAddingLink && !isAddingFile) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearPlacementIntent();
        closeFileComposer();
        closeLinkComposer();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [clearPlacementIntent, closeFileComposer, closeLinkComposer, isAddingFile, isAddingLink, placementIntent]);

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

  const handleInviteCollaboratorSave = async () => {
    if (!onInviteCollaborator || isInvitingCollaborator) {
      return;
    }

    const normalizedEmail = inviteEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setInviteError("Enter an email address.");
      setInviteSuccess("");
      return;
    }

    setIsInvitingCollaborator(true);
    setInviteError("");
    setInviteSuccess("");

    const result = await onInviteCollaborator(normalizedEmail);

    setIsInvitingCollaborator(false);

    if (result.error) {
      setInviteError(result.error);
      return;
    }

    setInviteEmail("");
    setInviteSuccess("Collaborator added.");
  };

  const handleEditLinkFromContextMenu = useCallback((noteId: string) => {
    const note = board.notes.find((candidate) => candidate.id === noteId);

    if (!note || note.type !== "link") {
      return false;
    }

    handleEditLink(note);
    return true;
  }, [board.notes, handleEditLink]);

  const handleEditFileFromContextMenu = useCallback((noteId: string) => {
    const note = board.notes.find((candidate) => candidate.id === noteId);

    if (!note || note.type !== "image") {
      return false;
    }

    handleEditFile(note);
    return true;
  }, [board.notes, handleEditFile]);

  const handleViewImageFromContextMenu = useCallback((noteId: string) => {
    const note = board.notes.find((candidate) => candidate.id === noteId);

    if (!note || note.type !== "image") {
      return false;
    }

    setActiveLightboxImageNoteId(noteId);
    return true;
  }, [board.notes]);
  const handleLightboxImageNoteHandledForSurface = useCallback((noteId: string) => {
    setActiveLightboxImageNoteId((current) => (current === noteId ? null : current));
  }, []);
  const handleAutoEditTextNoteHandledForSurface = useCallback((noteId: string) => {
    handleAutoEditTextNoteHandled(noteId);
  }, [handleAutoEditTextNoteHandled]);
  const sortedNotesForMobile = useMemo(() =>
    [...board.notes].sort((leftNote, rightNote) => {
      if (leftNote.y !== rightNote.y) {
        return leftNote.y - rightNote.y;
      }

      return leftNote.x - rightNote.x;
    }), [board.notes]);

  return (
    <YStack flex={1} style={{ minHeight: 0 }}>
      <YStack
        style={{
          padding: "1.25rem 1.5rem 1rem",
          gap: "1rem",
          borderBottomWidth: 1,
          borderBottomColor: theme.borderSubtle.val,
        }}
      >
        <YStack style={{ gap: "0.25rem" }}>
          <XStack
            style={{
              alignItems: isMobileLayout ? "flex-start" : "center",
              justifyContent: "space-between",
              flexDirection: isMobileLayout ? "column" : "row",
              gap: "1rem",
              width: "100%",
            }}
          >
            <XStack style={{ alignItems: "baseline", gap: "0.35rem", minWidth: 0 }}>
              <H2 style={{ margin: 0 }}>
                {board.title}
              </H2>
              <Text style={{ fontSize: 12, color: theme.textMuted.val }}>
                {`Owned by ${ownerUsername}`}
              </Text>
            </XStack>
            {otherPresenceParticipants.length > 0 ? (
              <XStack
                style={{
                  alignItems: "center",
                  justifyContent: isMobileLayout ? "flex-start" : "flex-end",
                  flexWrap: "wrap",
                  gap: "0.4rem",
                  maxWidth: isMobileLayout ? "100%" : 340,
                }}
              >
                {otherPresenceParticipants.slice(0, 4).map((participant) => (
                  <XStack
                    key={participant.id}
                    style={{
                      alignItems: "center",
                      borderRadius: 999,
                      border: `1px solid ${participant.color ?? theme.borderDefault.val}`,
                      backgroundColor: participant.isCurrentSession ? theme.accentLight.val : theme.surfaceHover.val,
                      padding: "0.2rem 0.45rem 0.2rem 0.3rem",
                      gap: "0.35rem",
                    }}
                  >
                    {participant.avatarUrl ? (
                      <img
                        src={participant.avatarUrl}
                        alt={`${participant.name} avatar`}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          border: `1px solid ${participant.color ?? theme.borderSubtle.val}`,
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : null}
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        flexShrink: 0,
                        backgroundColor: participant.color ?? theme.accentDefault.val,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: participant.isCurrentSession ? theme.accentText.val : theme.textSecondary.val,
                      }}
                    >
                      {participant.name}
                    </Text>
                  </XStack>
                ))}
                {extraPresenceCount > 0 ? (
                  <Text style={{ fontSize: 12, color: theme.textMuted.val }}>
                    {`+${extraPresenceCount}`}
                  </Text>
                ) : null}
              </XStack>
            ) : null}
          </XStack>
          <Paragraph style={{ margin: 0, maxWidth: 720 }}>
            {board.description}
          </Paragraph>
        </YStack>
        {fileUploadError ? (
          <Text theme="red" fontSize={14}>
            {fileUploadError}
          </Text>
        ) : null}
      </YStack>

      {isMobileLayout ? (
        <YStack
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "0.95rem",
            backgroundColor: theme.surface.val,
          }}
        >
          <YStack gap="$3">
            {sortedNotesForMobile.length === 0 ? (
              <Card style={{ borderWidth: 1, borderColor: theme.borderDefault.val }}>
                <Card.Header style={{ padding: "1rem" }}>
                  <Paragraph style={{ margin: 0, color: theme.textSecondary.val }}>
                    No notes yet on this board.
                  </Paragraph>
                </Card.Header>
              </Card>
            ) : sortedNotesForMobile.map((note) => (
              <div
                key={note.id}
                style={{
                  width: "100%",
                }}
              >
                {note.type === "text" ? (
                  <Card
                    style={{
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: theme.borderSubtle.val,
                    }}
                  >
                    <Card.Header style={{ padding: "0.72rem 0.8rem" }}>
                      <div
                        className="plumboard-note-prose"
                        style={{
                          color: theme.textPrimary.val,
                          lineHeight: 1.35,
                          overflowWrap: "anywhere",
                        }}
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{ __html: normalizeTextNoteBodyForRead(note.body) }}
                      />
                    </Card.Header>
                  </Card>
                ) : null}
                {note.type === "image" ? (
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: resolveMobileCardAspectRatio(note.width, note.height),
                    }}
                  >
                    <ImageNoteCard note={note} />
                  </div>
                ) : null}
                {note.type === "link" ? (
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: resolveMobileCardAspectRatio(note.width, note.height),
                    }}
                  >
                    <LinkNoteCard note={note} />
                  </div>
                ) : null}
              </div>
            ))}
          </YStack>
        </YStack>
      ) : (
        <>
          <BoardSurface
            board={board}
            remotePresenceParticipants={presenceParticipants.filter((participant) => !participant.isCurrentSession)}
            isUploadingFile={isUploadingFile}
            onCursorPositionChange={onLocalCursorPositionChange}
            onSelectedNoteIdsChange={onLocalSelectedNoteIdsChange}
            onCreateTextNote={handleAddTextNote}
            onCreateTextNoteAtPosition={handleAddTextNoteAtPosition}
            onCreateFile={handleAddFile}
            onCreateFileAtPosition={handleAddFileAtPosition}
            onCreateLink={handleAddLink}
            onCreateLinkAtPosition={handleAddLinkAtPosition}
            onEditImageNote={handleEditFileFromContextMenu}
            onEditLinkNote={handleEditLinkFromContextMenu}
            onViewImageNote={handleViewImageFromContextMenu}
            activeLightboxImageNoteId={activeLightboxImageNoteId}
            onLightboxImageNoteHandled={handleLightboxImageNoteHandledForSurface}
            autoEditTextNoteId={autoEditTextNoteId}
            onAutoEditTextNoteHandled={handleAutoEditTextNoteHandledForSurface}
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

          {isAddingFile ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isEditingFile ? "Edit file note" : "Add file note"}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeFileComposer();
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
                <Text fontWeight="700">{isEditingFile ? "Edit file note" : "Add file note"}</Text>
                <Paragraph style={{ margin: 0, color: theme.textSecondary.val }}>
                  {isEditingFile
                    ? "Update the caption, or replace the file."
                    : "Choose a file and optional caption."}
                </Paragraph>
              </YStack>

              <YStack gap="$2">
                <Text style={{ fontWeight: 600 }}>
                  {isEditingFile ? "Replace file (optional)" : "File"}
                </Text>
                <Input
                  type="file"
                  onChange={handleFileInputChange}
                  disabled={isUploadingFile}
                />
                {pendingFileName ? (
                  <Text style={{ fontSize: 12, color: theme.textMuted.val }}>
                    {`Selected: ${pendingFileName}`}
                  </Text>
                ) : null}
              </YStack>

              <YStack gap="$2">
                <Text style={{ fontWeight: 600 }}>Caption (optional)</Text>
                <Input
                  value={fileCaption}
                  onChange={(event) => setFileCaption(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleSaveFile();
                    }
                  }}
                  placeholder="Add a caption"
                  disabled={isUploadingFile}
                />
              </YStack>

              {fileUploadError ? (
                <Text theme="red" fontSize={14}>
                  {fileUploadError}
                </Text>
              ) : null}

              <XStack style={{ justifyContent: "flex-end", gap: "0.75rem" }}>
                <AppButton variant="outline" onPress={closeFileComposer} disabled={isUploadingFile}>
                  Cancel
                </AppButton>
                <AppButton
                  variant="cta"
                  onPress={() => void handleSaveFile()}
                  disabled={isUploadingFile}
                  loading={isUploadingFile}
                >
                  {isUploadingFile
                    ? "Uploading..."
                    : (isEditingFile ? "Save file note" : "Create file note")}
                </AppButton>
              </XStack>
            </YStack>
          </Card>
        </div>
          ) : null}

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
        </>
      )}

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

              {onInviteCollaborator ? (
                <YStack gap="$2">
                  <Text style={{ fontWeight: 600 }}>Collaborators</Text>
                  <XStack style={{ gap: "0.5rem", alignItems: "center" }}>
                    <Input
                      aria-label="Collaborator email"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.currentTarget.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleInviteCollaboratorSave();
                        }
                      }}
                      placeholder="name@example.com"
                      autoCapitalize="none"
                      autoCorrect={false}
                      disabled={isInvitingCollaborator}
                      style={{ width: "100%" }}
                    />
                    <AppButton
                      variant="outline"
                      onPress={() => {
                        void handleInviteCollaboratorSave();
                      }}
                      disabled={isInvitingCollaborator}
                      loading={isInvitingCollaborator}
                    >
                      Add
                    </AppButton>
                  </XStack>
                  {inviteError ? (
                    <Text style={{ color: theme.danger.val }}>{inviteError}</Text>
                  ) : null}
                  {!inviteError && inviteSuccess ? (
                    <Text style={{ color: theme.accentStrong.val }}>{inviteSuccess}</Text>
                  ) : null}
                </YStack>
              ) : null}

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

function resolveMobileCardAspectRatio(width: number, height: number) {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 1;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 1;

  return `${safeWidth} / ${safeHeight}`;
}

function normalizeTextNoteBodyForRead(body: string) {
  const trimmed = body.trim();

  if (!trimmed) {
    return "<p></p>";
  }

  if (/<\/?[a-z][\s\S]*>/i.test(body)) {
    return body;
  }

  return `<p>${escapeHtml(body).replace(/\n/g, "<br/>")}</p>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
