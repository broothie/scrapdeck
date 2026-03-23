import { Card, Paragraph, YStack, useTheme } from "tamagui";
import type { ImageNote } from "@plumboard/core";

type ImageNoteCardProps = {
  note: ImageNote;
};

export function ImageNoteCard({ note }: ImageNoteCardProps) {
  const theme = useTheme();

  return (
    <Card
      height="100%"
      overflow="hidden"
      style={{ borderRadius: 18, borderWidth: 1, borderColor: theme.borderSubtle.val }}
    >
      <YStack height="100%">
        <img
          alt={note.alt}
          src={note.src}
          style={{
            width: "100%",
            height: note.caption ? "calc(100% - 4rem)" : "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        {note.caption ? (
          <Paragraph style={{ padding: "0.75rem" }}>
            {note.caption}
          </Paragraph>
        ) : null}
      </YStack>
    </Card>
  );
}
