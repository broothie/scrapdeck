import { Card, Paragraph, YStack } from "tamagui";
import type { ImageScrap } from "@scrapdeck/core";

type ImageScrapCardProps = {
  scrap: ImageScrap;
};

export function ImageScrapCard({ scrap }: ImageScrapCardProps) {
  return (
    <Card
      height="100%"
      overflow="hidden"
      style={{ borderRadius: 18, borderWidth: 1 }}
    >
      <YStack height="100%">
        <img
          alt={scrap.alt}
          src={scrap.src}
          style={{
            width: "100%",
            height: scrap.caption ? "calc(100% - 4rem)" : "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        {scrap.caption ? (
          <Paragraph style={{ padding: "0.75rem" }}>
            {scrap.caption}
          </Paragraph>
        ) : null}
      </YStack>
    </Card>
  );
}
