import { useState } from "react";
import { Button, Card, H2, Input, Paragraph, Text, XStack, YStack } from "tamagui";
import type { Board } from "../../types";
import { BoardSurface } from "./BoardSurface";
import { useAppStore } from "../../store/useAppStore";

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

type BoardViewProps = {
  board: Board;
};

export function BoardView({ board }: BoardViewProps) {
  const addScrap = useAppStore((state) => state.addScrap);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");

  const closeLinkComposer = () => {
    setIsAddingLink(false);
    setLinkUrl("");
    setLinkError("");
  };

  const nextPlacement = () => {
    const offset = board.scraps.length * 22;

    return {
      x: 72 + (offset % 220),
      y: 88 + (offset % 180),
    };
  };

  const handleAddNote = () => {
    const { x, y } = nextPlacement();

    addScrap(board.id, {
      id: createId("note"),
      type: "note",
      x,
      y,
      width: 260,
      height: 190,
      title: "Fresh note",
      body: "Drop quick thoughts here and drag them into place.",
    });
  };

  const handleAddImage = () => {
    const { x, y } = nextPlacement();

    addScrap(board.id, {
      id: createId("image"),
      type: "image",
      x,
      y,
      width: 320,
      height: 250,
      src: "/demo-assets/studio-board.svg",
      alt: "Demo image scrap",
      caption: "Placeholder image for the prototype.",
    });
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

    const { x, y } = nextPlacement();
    const hostname = parsedUrl.hostname.replace(/^www\./, "");
    const path = parsedUrl.pathname === "/" ? "" : parsedUrl.pathname;
    const summary = [hostname, path].filter(Boolean).join("");

    addScrap(board.id, {
      id: createId("link"),
      type: "link",
      x,
      y,
      width: 360,
      height: 208,
      url: parsedUrl.toString(),
      siteName: hostname || "Saved Link",
      title: summary || parsedUrl.toString(),
      description: "Saved from a pasted URL.",
    });

    closeLinkComposer();
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

      <BoardSurface board={board} />
    </YStack>
  );
}
