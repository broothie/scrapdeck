import { Anchor, Card, Text, YStack, useTheme } from "tamagui";
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
  const urlLabel = getUrlLabel(note.url);
  const linkLabel = hasMeaningfulLabel(rawTitle) ? rawTitle : urlLabel;
  const description = note.description?.trim() || "";

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
              flex: "1 1 auto",
              minHeight: 0,
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : null}
        <YStack
          style={{
            height: hasPreview ? "auto" : "100%",
            flexShrink: 0,
            padding: hasPreview ? "0.58rem 0.9rem 0.56rem" : "0.75rem",
            justifyContent: "flex-start",
            gap: "0.18rem",
          }}
        >
        <Text
          style={{
            margin: 0,
            fontSize: hasPreview ? "0.68rem" : "0.76rem",
            lineHeight: "1.2em",
            fontWeight: 600,
            color: theme.textMuted.val,
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {urlLabel}
        </Text>
        <Anchor
          href={note.url}
          target="_blank"
          rel="noreferrer"
          className="nodrag nopan"
          style={{
            width: "100%",
            margin: 0,
            color: theme.textPrimary.val,
            fontSize: hasPreview ? "1rem" : "1.25rem",
            lineHeight: hasPreview ? "1.2em" : "1.25em",
            fontWeight: 700,
            textDecorationLine: "underline",
            textDecorationColor: theme.borderStrong.val,
            textUnderlineOffset: "0.2em",
            overflowWrap: "anywhere",
            display: "-webkit-box",
            WebkitLineClamp: hasPreview ? 2 : 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {linkLabel}
        </Anchor>
        {description ? (
          <Text
            style={{
              margin: 0,
              fontSize: hasPreview ? "0.82rem" : "0.95rem",
              lineHeight: "1.35em",
              color: theme.textSecondary.val,
              display: "-webkit-box",
              WebkitLineClamp: hasPreview ? 2 : 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {description}
          </Text>
        ) : null}
        </YStack>
      </YStack>
    </Card>
  );
}
