import { useState } from "react";
import { Card, H2, Paragraph, Text, XStack, YStack, useTheme } from "tamagui";
import { AppButton } from "@plumboard/ui";
import { useAuth } from "./AuthProvider";

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.38 3.61v3h3.84c2.25-2.07 3.59-5.12 3.59-8.64Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.84-3c-1.07.72-2.44 1.15-4.09 1.15-3.14 0-5.8-2.12-6.75-4.97H1.29v3.08A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.25 14.28A7.21 7.21 0 0 1 4.87 12c0-.79.14-1.55.38-2.28V6.64H1.29A12 12 0 0 0 0 12c0 1.94.46 3.78 1.29 5.36l3.96-3.08Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.81l3.45-3.45C17.94 1.13 15.24 0 12 0A12 12 0 0 0 1.29 6.64l3.96 3.08c.95-2.85 3.61-4.95 6.75-4.95Z"
      />
    </svg>
  );
}

export function AuthScreen() {
  const brandLogoUrl = `${import.meta.env.BASE_URL}plumboard-logo.png`;
  const theme = useTheme();
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setError("");

    const result = await signInWithGoogle();

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    }
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
              Continue with your Google account to access Plumboard.
            </Paragraph>
          </YStack>
        </Card.Header>
        <Card.Footer style={{ padding: "1.25rem" }}>
          <YStack gap="$3" width="100%">
            {error ? (
              <Text style={{ color: theme.danger.val }}>{error}</Text>
            ) : null}
            <AppButton
              variant="google"
              onPress={handleGoogleSignIn}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={{
                width: "100%",
                minHeight: 42,
              }}
            >
              <XStack style={{ gap: "0.65rem", alignItems: "center", justifyContent: "center" }}>
                <GoogleLogo />
                <Text
                  style={{
                    color: "#3c4043",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  Sign in with Google
                </Text>
              </XStack>
            </AppButton>
          </YStack>
        </Card.Footer>
      </Card>
    </YStack>
  );
}
