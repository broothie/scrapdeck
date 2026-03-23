import { useState } from "react";
import { Button, Card, H2, Input, Paragraph, Spinner, Text, XStack, YStack, useTheme } from "tamagui";
import { useAuth } from "./AuthProvider";

export function AuthScreen() {
  const brandLogoUrl = `${import.meta.env.BASE_URL}plumboard-logo.png`;
  const theme = useTheme();
  const { signInWithMagicLink, signInWithPassword, signUpWithPassword } = useAuth();
  const [authMode, setAuthMode] = useState<"password" | "magic-link">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingAction, setPendingAction] = useState<"sign-in" | "sign-up" | "magic-link" | null>(null);
  const isSubmitting = pendingAction !== null;

  const validateCredentials = () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Enter an email address to continue.");
      return null;
    }

    if (!password) {
      setError("Enter your password to continue.");
      return null;
    }

    if (password.length < 6) {
      setError("Passwords must be at least 6 characters.");
      return null;
    }

    return {
      email: trimmedEmail,
      password,
    };
  };

  const handlePasswordSignIn = async () => {
    const credentials = validateCredentials();

    if (!credentials) {
      return;
    }

    setPendingAction("sign-in");
    setError("");
    setNotice("");

    const result = await signInWithPassword(credentials.email, credentials.password);

    setPendingAction(null);

    if (result.error) {
      setError(result.error);
      return;
    }
  };

  const handlePasswordSignUp = async () => {
    const credentials = validateCredentials();

    if (!credentials) {
      return;
    }

    setPendingAction("sign-up");
    setError("");
    setNotice("");

    const result = await signUpWithPassword(credentials.email, credentials.password);

    setPendingAction(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    setNotice(
      result.requiresEmailConfirmation
        ? `Account created for ${credentials.email}. Check your inbox to confirm your email, then sign in.`
        : "Account created. You can sign in now.",
    );
  };

  const handleMagicLinkSignIn = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Enter an email address to continue.");
      return;
    }

    setPendingAction("magic-link");
    setError("");
    setNotice("");

    const result = await signInWithMagicLink(trimmedEmail);

    setPendingAction(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    setNotice(`Magic link sent to ${trimmedEmail}. Open the email to sign in.`);
  };

  const handleSwapMode = () => {
    setAuthMode((currentMode) => (currentMode === "password" ? "magic-link" : "password"));
    setError("");
    setNotice("");
    setPendingAction(null);
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
              {authMode === "password"
                ? "Use email + password to sign in or create a new account."
                : "Use a magic link for passwordless sign-in."}
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
                  if (authMode === "password") {
                    handlePasswordSignIn();
                    return;
                  }

                  handleMagicLinkSignIn();
                }
              }}
              style={{
                borderColor: theme.borderDefault.val,
                backgroundColor: theme.surfaceHover.val,
                color: theme.textPrimary.val,
              }}
            />
            {authMode === "password" ? (
              <Input
                autoCapitalize="none"
                autoComplete="current-password"
                secureTextEntry
                placeholder="Password"
                placeholderTextColor="$placeholderColor"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handlePasswordSignIn();
                  }
                }}
                style={{
                  borderColor: theme.borderDefault.val,
                  backgroundColor: theme.surfaceHover.val,
                  color: theme.textPrimary.val,
                }}
              />
            ) : null}
            {error ? (
              <Text style={{ color: theme.danger.val }}>{error}</Text>
            ) : null}
            {notice ? (
              <Text style={{ color: theme.success.val }}>{notice}</Text>
            ) : null}
            {authMode === "password" ? (
              <YStack gap="$2">
                <Button
                  onPress={handlePasswordSignIn}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: theme.accentStrong.val,
                    borderColor: theme.accentStrong.val,
                    borderWidth: 1,
                  }}
                >
                  {pendingAction === "sign-in" ? (
                    <Spinner color={theme.accentSubtle.val} />
                  ) : (
                    <Text style={{ color: theme.accentSubtle.val, fontWeight: 700 }}>
                      Sign in
                    </Text>
                  )}
                </Button>
                <Button
                  variant="outlined"
                  onPress={handlePasswordSignUp}
                  disabled={isSubmitting}
                  style={{
                    borderColor: theme.borderDefault.val,
                    backgroundColor: theme.surface.val,
                  }}
                >
                  {pendingAction === "sign-up" ? (
                    <Spinner color={theme.textPrimary.val} />
                  ) : (
                    <Text style={{ color: theme.textPrimary.val, fontWeight: 600 }}>
                      Create account
                    </Text>
                  )}
                </Button>
              </YStack>
            ) : (
              <Button
                onPress={handleMagicLinkSignIn}
                disabled={isSubmitting}
                style={{
                  backgroundColor: theme.accentStrong.val,
                  borderColor: theme.accentStrong.val,
                  borderWidth: 1,
                }}
              >
                {pendingAction === "magic-link" ? (
                  <Spinner color={theme.accentSubtle.val} />
                ) : (
                  <Text style={{ color: theme.accentSubtle.val, fontWeight: 700 }}>
                    Send magic link
                  </Text>
                )}
              </Button>
            )}
          </YStack>
        </Card.Footer>
      </Card>
      <Button
        variant="outlined"
        onPress={handleSwapMode}
        disabled={isSubmitting}
        style={{
          marginTop: "0.85rem",
          borderColor: theme.borderDefault.val,
          backgroundColor: theme.surface.val,
        }}
      >
        <Text style={{ color: theme.textSecondary.val }}>
          {authMode === "password"
            ? "Use passwordless magic link"
            : "Use email + password"}
        </Text>
      </Button>
    </YStack>
  );
}
