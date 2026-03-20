import { Anchor, Card, H4, Paragraph, SizableText, YStack } from "tamagui";
import type { LinkScrap } from "../../../types";

type LinkScrapCardProps = {
  scrap: LinkScrap;
};

export function LinkScrapCard({ scrap }: LinkScrapCardProps) {
  const hasPreview = Boolean(scrap.previewImage);

  return (
    <Card
      height="100%"
      overflow="hidden"
      style={{ borderRadius: 18, borderWidth: 1 }}
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
            borderBottom: "1px solid #d7c7ad",
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
