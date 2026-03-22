import { Anchor, Card, YStack, useTheme } from "tamagui";
import type { LinkScrap } from "@plumboard/core";

type LinkScrapCardProps = {
  scrap: LinkScrap;
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

export function LinkScrapCard({ scrap }: LinkScrapCardProps) {
  const theme = useTheme();
  const hasPreview = Boolean(scrap.previewImage);
  const rawTitle = scrap.title?.trim() || "";
  const linkLabel = hasMeaningfulLabel(rawTitle) ? rawTitle : getUrlLabel(scrap.url);

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
            alt={scrap.title}
            src={scrap.previewImage}
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
          href={scrap.url}
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
