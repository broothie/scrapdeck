import { Card, H2, Paragraph, Text, YStack, useTheme } from "tamagui";

export function MissingSupabaseConfig() {
  const theme = useTheme();

  return (
    <YStack
      style={{
        width: "100%",
        minHeight: "var(--app-viewport-height)",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        backgroundColor: theme.canvas.val,
      }}
    >
      <Card
        width="100%"
        maxWidth={540}
        style={{
          borderWidth: 1,
          borderColor: theme.borderDefault.val,
          backgroundColor: theme.surface.val,
          boxShadow: "0 16px 34px rgba(20, 12, 38, 0.12)",
        }}
      >
        <Card.Header style={{ padding: "1.25rem" }}>
          <YStack gap="$3">
            <Text
              style={{
                fontSize: 12,
                letterSpacing: 2.1,
                textTransform: "uppercase",
                color: theme.textSecondary.val,
              }}
            >
              Supabase setup
            </Text>
            <H2 style={{ margin: 0, color: theme.textInk.val }}>
              Auth is wired, but the client keys are missing
            </H2>
            <Paragraph style={{ margin: 0, color: theme.textSecondary.val }}>
              Add your Supabase project URL and publishable or anon key in
              <Text style={{ fontFamily: "monospace", color: theme.textPrimary.val }}> apps/web/.env.local</Text> and reload the dev
              server.
            </Paragraph>
            <YStack
              gap="$2"
              style={{
                backgroundColor: theme.overlay.val,
                border: `1px solid ${theme.borderSubtle.val}`,
                borderRadius: 12,
                padding: "0.9rem",
              }}
            >
              <Text style={{ fontFamily: "monospace", color: theme.textPrimary.val }}>VITE_SUPABASE_URL=...</Text>
              <Text style={{ fontFamily: "monospace", color: theme.textPrimary.val }}>
                VITE_SUPABASE_PUBLISHABLE_KEY=...
              </Text>
            </YStack>
          </YStack>
        </Card.Header>
      </Card>
    </YStack>
  );
}
