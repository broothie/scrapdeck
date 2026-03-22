import { Card, Paragraph, YStack, useTheme } from "tamagui";
import type { ImageScrap } from "@plumboard/core";

type ImageScrapCardProps = {
  scrap: ImageScrap;
};

export function ImageScrapCard({ scrap }: ImageScrapCardProps) {
  const theme = useTheme();

  return (
    <Card
      height="100%"
      overflow="hidden"
      style={{ borderRadius: 18, borderWidth: 1, borderColor: theme.borderSubtle.val }}
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
