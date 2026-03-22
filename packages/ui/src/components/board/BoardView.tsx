import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Button, Card, H2, Input, Paragraph, Text, XStack, YStack, useTheme } from "tamagui";
import {
  createScrapId,
  resolveScrapDefaults,
  useAppStore,
  type Board,
  type Scrap,
} from "@scrapdeck/core";
import { BoardSurface } from "./BoardSurface";

type PlacementIntent = {
  type: Scrap["type"];
  width: number;
  height: number;
  create: (position: { x: number; y: number }) => Scrap;
};

type BoardViewProps = {
  board: Board;
  onUploadImage?: (file: File) => Promise<{
    src: string;
    alt?: string;
    caption?: string;
  }>;
};

export function BoardView({ board, onUploadImage }: BoardViewProps) {
  const theme = useTheme();
  const addScrap = useAppStore((state) => state.addScrap);
  const updateBoard = useAppStore((state) => state.updateBoard);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [imageUploadError, setImageUploadError] = useState("");
  const [placementIntent, setPlacementIntent] = useState<PlacementIntent | null>(null);
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [isEditingBoardDescription, setIsEditingBoardDescription] = useState(false);
  const [boardTitleDraft, setBoardTitleDraft] = useState(board.title);
  const [boardDescriptionDraft, setBoardDescriptionDraft] = useState(board.description);

  const closeLinkComposer = () => {
    setIsAddingLink(false);
    setLinkUrl("");
    setLinkError("");
  };

  useEffect(() => {
    if (!placementIntent && !isAddingLink) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPlacementIntent(null);
        closeLinkComposer();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [closeLinkComposer, isAddingLink, placementIntent]);

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

  const addNoteIntent = useMemo<PlacementIntent>(() => {
    const { width, height } = resolveScrapDefaults("note");

    return {
      type: "note",
      width,
      height,
      create: ({ x, y }: { x: number; y: number }) => ({
        id: createScrapId("note"),
        type: "note",
        x,
        y,
        width,
        height,
        title: "Fresh note",
        body: "Drop quick thoughts here and drag them into place.",
      }),
    };
  }, []);

  const handleAddNote = () => {
    setPlacementIntent(addNoteIntent);
  };

  const handleAddImage = () => {
    if (!imageInputRef.current) {
      return;
    }

    setImageUploadError("");
    imageInputRef.current.click();
  };

  const handleAddLink = () => {
    setIsAddingLink(true);
    setLinkError("");
  };

  const handleSaveLink = () => {
    const trimmedUrl = linkUrl.trim();

    if (!trimmedUrl) {
      setLinkError("Enter a URL to save.");
      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      setLinkError("Enter a valid URL, including https://");
      return;
    }

    const hostname = parsedUrl.hostname.replace(/^www\./, "");
    const path = parsedUrl.pathname === "/" ? "" : parsedUrl.pathname;
    const summary = [hostname, path].filter(Boolean).join("");

    const { width, height } = resolveScrapDefaults("link");

    setPlacementIntent({
      type: "link",
      width,
      height,
      create: ({ x, y }) => ({
        id: createScrapId("link"),
        type: "link",
        x,
        y,
        width,
        height,
        url: parsedUrl.toString(),
        siteName: hostname || "Saved Link",
        title: summary || parsedUrl.toString(),
        description: "Saved from a pasted URL.",
      }),
    });

    closeLinkComposer();
  };

  const handlePlaceScrap = (position: { x: number; y: number }) => {
    if (!placementIntent) {
      return;
    }

    addScrap(board.id, placementIntent.create(position));
    setPlacementIntent(null);
  };

  const handleImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!onUploadImage) {
      setImageUploadError("Image upload is not configured.");
      return;
    }

    setIsUploadingImage(true);
    setImageUploadError("");

    try {
      const uploadedImage = await onUploadImage(file);
      const { width, height } = resolveScrapDefaults("image");

      setPlacementIntent({
        type: "image",
        width,
        height,
        create: ({ x, y }: { x: number; y: number }) => ({
          id: createScrapId("image"),
          type: "image",
          x,
          y,
          width,
          height,
          src: uploadedImage.src,
          alt: uploadedImage.alt ?? file.name ?? "Uploaded image",
          caption: uploadedImage.caption ?? file.name ?? undefined,
        }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload image.";
      setImageUploadError(message);
    } finally {
      setIsUploadingImage(false);
    }
  };

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
          <XStack style={{ gap: "0.75rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Button onPress={handleAddNote}>
              Add note
            </Button>
            <Button onPress={handleAddImage} disabled={isUploadingImage}>
              {isUploadingImage ? "Uploading..." : "Add image"}
            </Button>
            <Button onPress={handleAddLink}>
              Add link
            </Button>
          </XStack>
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
                    handleSaveLink();
                  }

                  if (event.key === "Escape") {
                    closeLinkComposer();
                  }
                }}
                placeholder="https://example.com/article"
                keyboardType="url"
              />
              {linkError ? (
                <Text theme="red" fontSize={14}>
                  {linkError}
                </Text>
              ) : null}
              <XStack style={{ justifyContent: "flex-end", gap: "0.75rem" }}>
                <Button onPress={closeLinkComposer}>
                  Cancel
                </Button>
                <Button theme="blue" onPress={handleSaveLink}>
                  Save link
                </Button>
              </XStack>
            </YStack>
          </Card>
        ) : null}
        {imageUploadError ? (
          <Text theme="red" fontSize={14}>
            {imageUploadError}
          </Text>
        ) : null}
      </YStack>

      <BoardSurface
        board={board}
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
