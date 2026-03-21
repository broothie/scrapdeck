import { Button, Card, H2, Paragraph, Text, YStack } from "tamagui";

type EmptyBoardsStateProps = {
  onCreateBoard: () => void;
};

export function EmptyBoardsState({ onCreateBoard }: EmptyBoardsStateProps) {
  return (
    <YStack
      style={{
        minHeight: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card width="100%" maxWidth={520} style={{ borderWidth: 1 }}>
        <Card.Header style={{ padding: "1.25rem" }}>
          <YStack gap="$3">
            <Text style={{ fontSize: 13, opacity: 0.7, textTransform: "uppercase", letterSpacing: 2 }}>
              Fresh workspace
            </Text>
            <H2 style={{ margin: 0 }}>No boards yet</H2>
            <Paragraph style={{ margin: 0 }}>
              Start from a blank canvas. Create a board, then add notes, images, and links as you go.
            </Paragraph>
            <Button theme="blue" onPress={onCreateBoard} style={{ alignSelf: "flex-start" }}>
              Create your first board
            </Button>
          </YStack>
        </Card.Header>
      </Card>
    </YStack>
  );
}
