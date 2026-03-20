import { Card, H4, Paragraph, SizableText, YStack } from "tamagui";
import type { NoteScrap } from "@scrapdeck/core";

type NoteScrapCardProps = {
  scrap: NoteScrap;
};

export function NoteScrapCard({ scrap }: NoteScrapCardProps) {
  return (
    <Card height="100%" style={{ borderRadius: 18, borderWidth: 1 }}>
      <YStack
        gap="$2"
        height="100%"
        style={{ justifyContent: "space-between", padding: "1rem" }}
      >
        <SizableText size="$2" style={{ opacity: 0.7 }}>
          Note
        </SizableText>
        {scrap.title ? <H4>{scrap.title}</H4> : null}
        <Paragraph>{scrap.body}</Paragraph>
      </YStack>
    </Card>
  );
}
