import { Anchor, Card, YStack, useTheme } from "tamagui";
import type { LinkNote } from "@plumboard/core";

type LinkNoteCardProps = {
  note: LinkNote;
};

function hasMeaningfulLabel(value: string) {
  const alphanumericCount = (value.match(/[A-Za-z0-9]/g) ?? []).length;
  return alphanumericCount >= 3;
}

function getUrlLabel(url: string) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, "");
    const path = parsedUrl.pathname === "/" ? "" : parsedUrl.pathname;
    const summary = [hostname, path].filter(Boolean).join("");

    return summary || parsedUrl.toString();
  } catch {
    return url;
  }
}

export function LinkNoteCard({ note }: LinkNoteCardProps) {
  const theme = useTheme();
  const hasPreview = Boolean(note.previewImage);
  const rawTitle = note.title?.trim() || "";
  const linkLabel = hasMeaningfulLabel(rawTitle) ? rawTitle : getUrlLabel(note.url);

  return (
    <Card
      height="100%"
      overflow="hidden"
      style={{
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.borderSubtle.val,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <YStack height="100%">
        {hasPreview ? (
          <img
            alt={note.title}
            src={note.previewImage}
            style={{
              width: "100%",
              height: "calc(100% - 4.5rem)",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : null}
        <YStack
          style={{
            height: hasPreview ? "4.5rem" : "100%",
            padding: hasPreview ? "0.65rem 1rem" : "1rem",
            justifyContent: "center",
          }}
        >
        <Anchor
          href={note.url}
          target="_blank"
          rel="noreferrer"
          className="nodrag nopan"
          style={{
            display: "block",
            width: "100%",
            color: theme.textPrimary.val,
            fontSize: hasPreview ? "1.2rem" : "1.5rem",
            lineHeight: hasPreview ? 1.3 : 1.25,
            fontWeight: 700,
            textDecorationLine: "underline",
            textDecorationColor: theme.borderStrong.val,
            textUnderlineOffset: "0.2em",
            overflowWrap: "anywhere",
            maxHeight: hasPreview ? "2.6em" : undefined,
            overflow: hasPreview ? "hidden" : "visible",
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {linkLabel}
        </Anchor>
        </YStack>
      </YStack>
    </Card>
  );
}
