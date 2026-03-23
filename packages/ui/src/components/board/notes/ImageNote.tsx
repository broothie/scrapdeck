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
            flex: 1,
            minHeight: 0,
            objectFit: "cover",
            display: "block",
          }}
        />
        {note.caption ? (
          <Paragraph
            style={{
              margin: 0,
              padding: "0.9rem 0.75rem",
              lineHeight: 1.3,
            }}
          >
            {note.caption}
          </Paragraph>
        ) : null}
      </YStack>
    </Card>
  );
}
