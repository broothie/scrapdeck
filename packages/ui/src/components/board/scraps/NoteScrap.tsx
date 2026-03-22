import { Card, Input, SizableText, YStack, useTheme } from "tamagui";
import { useAppStore, type NoteScrap } from "@scrapdeck/core";

type NoteScrapCardProps = {
  boardId: string;
  scrap: NoteScrap;
};

export function NoteScrapCard({ boardId, scrap }: NoteScrapCardProps) {
  const theme = useTheme();
  const updateNoteScrap = useAppStore((state) => state.updateNoteScrap);

  return (
    <Card height="100%" style={{ borderRadius: 18, borderWidth: 1 }}>
      <YStack
        gap="$2"
        height="100%"
        style={{ padding: "1rem" }}
      >
        <SizableText size="$2" style={{ opacity: 0.7 }}>
          Note
        </SizableText>
        <Input
          className="nodrag nopan"
          placeholder="Untitled note"
          value={scrap.title ?? ""}
          onChange={(event) => {
            const nextTitle = event.currentTarget.value;

            updateNoteScrap(boardId, scrap.id, {
              title: nextTitle.trim() ? nextTitle : undefined,
            });
          }}
          onPointerDown={(event) => event.stopPropagation()}
        />
        <textarea
          className="nodrag nopan"
          placeholder="Write your note here"
          value={scrap.body}
          onChange={(event) => {
            updateNoteScrap(boardId, scrap.id, {
              body: event.currentTarget.value,
            });
          }}
          onPointerDown={(event) => event.stopPropagation()}
          style={{
            flex: 1,
            minHeight: 0,
            resize: "none",
            borderRadius: 12,
            border: `1px solid ${theme.borderDefault.val}`,
            backgroundColor: theme.surfaceHover.val,
            color: theme.textPrimary.val,
            font: "inherit",
            lineHeight: 1.5,
            padding: "0.75rem 0.85rem",
            outline: "none",
          }}
        />
      </YStack>
    </Card>
  );
}
