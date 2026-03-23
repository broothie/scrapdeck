import { useState } from "react";
import { Button, Card, H2, Input, Paragraph, Spinner, Text, XStack, YStack, useTheme } from "tamagui";
import { useAuth } from "./AuthProvider";

export function AuthScreen() {
  const brandLogoUrl = `${import.meta.env.BASE_URL}plumboard-logo.png`;
  const theme = useTheme();
  const { signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Enter an email address to continue.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setNotice("");

    const result = await signInWithMagicLink(trimmedEmail);

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setNotice(`Magic link sent to ${trimmedEmail}. Open the email to sign in.`);
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
            <XStack style={{ gap: "0.55rem", alignItems: "center" }}>
              <img
                src={brandLogoUrl}
                alt="Plumboard logo"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  objectFit: "cover",
                }}
              />
              <Text
                style={{
                  fontSize: 12,
                  letterSpacing: 2.1,
                  textTransform: "uppercase",
                  color: theme.textSecondary.val,
                }}
              >
                Plumboard
              </Text>
            </XStack>
            <H2 style={{ margin: 0, color: theme.textInk.val }}>Sign in to your boards</H2>
            <Paragraph style={{ margin: 0, color: theme.textSecondary.val }}>
              We&apos;ll send you a magic link and bring you right back into the prototype.
            </Paragraph>
          </YStack>
        </Card.Header>
        <Card.Footer style={{ padding: "1.25rem" }}>
          <YStack gap="$3" width="100%">
            <Input
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="$placeholderColor"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSubmit();
                }
              }}
              style={{
                borderColor: theme.borderDefault.val,
                backgroundColor: theme.surfaceHover.val,
                color: theme.textPrimary.val,
              }}
            />
            {error ? (
              <Text style={{ color: theme.danger.val }}>{error}</Text>
            ) : null}
            {notice ? (
              <Text style={{ color: theme.success.val }}>{notice}</Text>
            ) : null}
            <Button
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={{
                backgroundColor: theme.accentStrong.val,
                borderColor: theme.accentStrong.val,
                borderWidth: 1,
              }}
            >
              {isSubmitting ? (
                <Spinner color={theme.accentSubtle.val} />
              ) : (
                <Text style={{ color: theme.accentSubtle.val, fontWeight: 700 }}>
                  Send magic link
                </Text>
              )}
            </Button>
          </YStack>
        </Card.Footer>
      </Card>
    </YStack>
  );
}
