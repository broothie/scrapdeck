import { useEffect, useMemo, useState } from "react";
import { Button, Card, H2, Input, Paragraph, Text, XStack, YStack } from "tamagui";
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
};

export function BoardView({ board }: BoardViewProps) {
  const addScrap = useAppStore((state) => state.addScrap);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [placementIntent, setPlacementIntent] = useState<PlacementIntent | null>(null);

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

  const addImageIntent = useMemo<PlacementIntent>(() => {
    const { width, height } = resolveScrapDefaults("image");

    return {
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
        src: "/demo-assets/studio-board.svg",
        alt: "Demo image scrap",
        caption: "Placeholder image for the prototype.",
      }),
    };
  }, []);

  const handleAddNote = () => {
    setPlacementIntent(addNoteIntent);
  };

  const handleAddImage = () => {
    setPlacementIntent(addImageIntent);
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

  return (
    <YStack gap="$4" height="100%">
      <XStack style={{ alignItems: "flex-end", justifyContent: "space-between", gap: "1rem" }}>
        <YStack style={{ gap: "0.25rem" }}>
          <Text style={{ opacity: 0.7, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>
            Active board
          </Text>
          <H2 style={{ margin: 0 }}>{board.title}</H2>
          <Paragraph style={{ margin: 0, maxWidth: 480 }}>
            {board.description}
          </Paragraph>
        </YStack>
        <XStack style={{ gap: "0.75rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button onPress={handleAddNote}>
            Add note
          </Button>
          <Button onPress={handleAddImage}>
            Add image
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
