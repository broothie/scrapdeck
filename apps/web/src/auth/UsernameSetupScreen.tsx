import { useState } from "react";
import { Button, Card, H2, Input, Paragraph, Spinner, Text, YStack } from "tamagui";
import { useAuth } from "./AuthProvider";

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function UsernameSetupScreen() {
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
      }}
    >
      <Card width="100%" maxWidth={460} style={{ borderWidth: 1 }}>
        <Card.Header style={{ padding: "1.25rem" }}>
          <YStack gap="$3">
            <Text style={{ fontSize: 13, opacity: 0.7, textTransform: "uppercase", letterSpacing: 2 }}>
              Finish setup
            </Text>
            <H2 style={{ margin: 0 }}>Pick a username</H2>
            <Paragraph style={{ margin: 0 }}>
              This gives your account a human-friendly handle before you enter the app.
            </Paragraph>
            {user?.email ? (
              <Text style={{ opacity: 0.72 }}>
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
              value={username}
              onChange={(event) => {
                setUsername(normalizeUsername(event.target.value));
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSave();
                }
              }}
            />
            <Text style={{ opacity: 0.68 }}>
              Lowercase letters, numbers, and underscores only.
            </Text>
            {error ? (
              <Text color="$red10">{error}</Text>
            ) : null}
            <YStack gap="$2">
              <Button theme="blue" onPress={handleSave} disabled={isSubmitting}>
                {isSubmitting ? <Spinner color="white" /> : "Save username"}
              </Button>
              <Button
                variant="outlined"
                onPress={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? <Spinner /> : "Sign out"}
              </Button>
            </YStack>
          </YStack>
        </Card.Footer>
      </Card>
    </YStack>
  );
}
