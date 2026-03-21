import { Card, H2, Paragraph, Text, YStack } from "tamagui";

export function MissingSupabaseConfig() {
  return (
    <YStack
      style={{
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <Card width="100%" maxWidth={540} style={{ borderWidth: 1 }}>
        <Card.Header style={{ padding: "1.25rem" }}>
          <YStack gap="$3">
            <Text style={{ fontSize: 13, opacity: 0.7, textTransform: "uppercase", letterSpacing: 2 }}>
              Supabase setup
            </Text>
            <H2 style={{ margin: 0 }}>Auth is wired, but the client keys are missing</H2>
            <Paragraph style={{ margin: 0 }}>
              Add your Supabase project URL and publishable or anon key in
              <Text style={{ fontFamily: "monospace" }}> apps/web/.env.local</Text> and reload the dev
              server.
            </Paragraph>
            <YStack
              gap="$2"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                borderRadius: 12,
                padding: "0.9rem",
              }}
            >
              <Text style={{ fontFamily: "monospace" }}>VITE_SUPABASE_URL=...</Text>
              <Text style={{ fontFamily: "monospace" }}>
                VITE_SUPABASE_PUBLISHABLE_KEY=...
              </Text>
            </YStack>
          </YStack>
        </Card.Header>
      </Card>
    </YStack>
  );
}
