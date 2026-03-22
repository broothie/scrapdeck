import { Anchor, Card, H4, Paragraph, SizableText, YStack, useTheme } from "tamagui";
import type { LinkScrap } from "@scrapdeck/core";

type LinkScrapCardProps = {
  scrap: LinkScrap;
};

export function LinkScrapCard({ scrap }: LinkScrapCardProps) {
  const theme = useTheme();
  const hasPreview = Boolean(scrap.previewImage);

  return (
    <Card
      height="100%"
      overflow="hidden"
      style={{ borderRadius: 18, borderWidth: 1, borderColor: theme.borderSubtle.val }}
    >
      {hasPreview ? (
        <img
          alt={scrap.title}
          src={scrap.previewImage}
          style={{
            width: "100%",
            height: "48%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : null}
      <YStack flex={1} gap="$2" style={{ padding: "1rem" }}>
        <SizableText size="$2" style={{ opacity: 0.7 }}>
          {scrap.siteName}
        </SizableText>
        <H4 style={{ margin: 0 }}>
          {scrap.title}
        </H4>
        {scrap.description ? <Paragraph>{scrap.description}</Paragraph> : null}
        <Anchor
          href={scrap.url}
          className="nodrag nopan"
          theme="blue"
          style={{ marginTop: "auto" }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {scrap.url}
        </Anchor>
      </YStack>
    </Card>
  );
}
