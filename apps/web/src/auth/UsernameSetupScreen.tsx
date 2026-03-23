import { useState } from "react";
import { Card, H2, Input, Paragraph, Text, YStack, useTheme } from "tamagui";
import { AppButton } from "@plumboard/ui";
import { useAuth } from "./AuthProvider";

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function UsernameSetupScreen() {
  const theme = useTheme();
  const { user, saveUsername, signOut } = useAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSave = async () => {
    const normalizedUsername = normalizeUsername(username);

    if (normalizedUsername.length < 3) {
      setError("Choose a username with at least 3 letters, numbers, or underscores.");
      return;
    }

    if (normalizedUsername.length > 24) {
      setError("Keep the username under 24 characters.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    const result = await saveUsername(normalizedUsername);

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
  };

  return (
    <YStack
      style={{
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        backgroundColor: theme.canvas.val,
      }}
    >
      <Card
        width="100%"
        maxWidth={460}
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
              Finish setup
            </Text>
            <H2 style={{ margin: 0, color: theme.textInk.val }}>Pick a username</H2>
            <Paragraph style={{ margin: 0, color: theme.textSecondary.val }}>
              This gives your account a human-friendly handle before you enter the app.
            </Paragraph>
            {user?.email ? (
              <Text style={{ color: theme.textMuted.val }}>
                Signed in as {user.email}
              </Text>
            ) : null}
          </YStack>
        </Card.Header>
        <Card.Footer style={{ padding: "1.25rem" }}>
          <YStack gap="$3" width="100%">
            <Input
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="andrew_booth"
              placeholderTextColor="$placeholderColor"
              value={username}
              onChange={(event) => {
                setUsername(normalizeUsername(event.target.value));
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSave();
                }
              }}
              style={{
                borderColor: theme.borderDefault.val,
                backgroundColor: theme.surfaceHover.val,
                color: theme.textPrimary.val,
              }}
            />
            <Text style={{ color: theme.textSecondary.val }}>
              Lowercase letters, numbers, and underscores only.
            </Text>
            {error ? (
              <Text style={{ color: theme.danger.val }}>{error}</Text>
            ) : null}
            <YStack gap="$2">
              <AppButton
                onPress={handleSave}
                variant="cta"
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                Save username
              </AppButton>
              <AppButton
                variant="outline"
                onPress={handleSignOut}
                disabled={isSigningOut}
                loading={isSigningOut}
              >
                Sign out
              </AppButton>
            </YStack>
          </YStack>
        </Card.Footer>
      </Card>
    </YStack>
  );
}
