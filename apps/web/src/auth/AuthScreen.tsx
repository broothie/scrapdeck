import { useState } from "react";
import { Button, Card, H2, Input, Paragraph, Spinner, Text, YStack } from "tamagui";
import { useAuth } from "./AuthProvider";

export function AuthScreen() {
  const brandLogoUrl = `${import.meta.env.BASE_URL}plumboard-logo.png`;
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
      }}
    >
      <Card width="100%" maxWidth={460} style={{ borderWidth: 1 }}>
        <Card.Header style={{ padding: "1.25rem" }}>
          <YStack gap="$3">
            <img
              src={brandLogoUrl}
              alt="Plumboard logo"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                objectFit: "cover",
              }}
            />
            <Text style={{ fontSize: 13, opacity: 0.7, textTransform: "uppercase", letterSpacing: 2 }}>
              Plumboard
            </Text>
            <H2 style={{ margin: 0 }}>Sign in to your boards</H2>
            <Paragraph style={{ margin: 0 }}>
              Start with passwordless email auth. We&apos;ll send you a magic link and
              bring you right back into the prototype.
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
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSubmit();
                }
              }}
            />
            {error ? (
              <Text color="$red10">{error}</Text>
            ) : null}
            {notice ? (
              <Text color="$green10">{notice}</Text>
            ) : null}
            <Button theme="blue" onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Spinner color="white" /> : "Send magic link"}
            </Button>
          </YStack>
        </Card.Footer>
      </Card>
    </YStack>
  );
}
