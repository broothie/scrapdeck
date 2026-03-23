import { useEffect, useState } from "react";
import { Card, H2, Input, Paragraph, Text, ToggleGroup, XStack, YStack, useTheme } from "tamagui";
import { AppButton } from "@plumboard/ui";

type ThemePreference = "system" | "light" | "dark";

type AccountPageProps = {
  username: string;
  email?: string | null;
  themePreference: ThemePreference;
  onThemePreferenceChange: (nextPreference: ThemePreference) => void;
  onSaveUsername: (nextUsername: string) => Promise<{ error?: string }>;
  onSignOut: () => void;
  isSigningOut?: boolean;
};

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function AccountPage({
  username,
  email,
  themePreference,
  onThemePreferenceChange,
  onSaveUsername,
  onSignOut,
  isSigningOut = false,
}: AccountPageProps) {
  const theme = useTheme();
  const [usernameDraft, setUsernameDraft] = useState(username);
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  useEffect(() => {
    setUsernameDraft(username);
  }, [username]);

  const handleSaveUsername = async () => {
    const normalizedUsername = normalizeUsername(usernameDraft);

    if (normalizedUsername.length < 3) {
      setUsernameError("Choose a username with at least 3 letters, numbers, or underscores.");
      setUsernameSuccess("");
      return;
    }

    if (normalizedUsername.length > 24) {
      setUsernameError("Keep the username under 24 characters.");
      setUsernameSuccess("");
      return;
    }

    if (normalizedUsername === username) {
      setUsernameError("");
      setUsernameSuccess("Username is already up to date.");
      return;
    }

    setIsSavingUsername(true);
    setUsernameError("");
    setUsernameSuccess("");

    const result = await onSaveUsername(normalizedUsername);

    setIsSavingUsername(false);

    if (result.error) {
      setUsernameError(result.error);
      return;
    }

    setUsernameDraft(normalizedUsername);
    setUsernameSuccess("Username updated.");
  };

  return (
    <YStack
      style={{
        flex: 1,
        minHeight: 0,
        padding: "1.5rem",
        gap: "1rem",
        backgroundColor: theme.canvas.val,
      }}
    >
      <YStack style={{ gap: "0.25rem" }}>
        <H2 style={{ margin: 0 }}>Account</H2>
        <Paragraph style={{ margin: 0, color: theme.textSecondary.val }}>
          Manage your profile details and app preferences.
        </Paragraph>
      </YStack>

      <Card
        style={{
          width: "100%",
          maxWidth: 640,
          borderWidth: 1,
          borderColor: theme.borderDefault.val,
          backgroundColor: theme.surface.val,
        }}
      >
        <Card.Header style={{ padding: "1.1rem 1.2rem" }}>
          <YStack gap="$4">
            <YStack style={{ gap: "0.15rem" }}>
              <Text style={{ color: theme.textMuted.val, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" }}>
                Username
              </Text>
              <Input
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="your_username"
                placeholderTextColor="$placeholderColor"
                value={usernameDraft}
                onChange={(event) => {
                  setUsernameDraft(normalizeUsername(event.target.value));
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleSaveUsername();
                  }
                }}
                style={{
                  borderColor: theme.borderDefault.val,
                  backgroundColor: theme.surfaceHover.val,
                  color: theme.textPrimary.val,
                  maxWidth: 320,
                }}
                disabled={isSavingUsername}
              />
              <Text style={{ color: theme.textSecondary.val, fontSize: 13 }}>
                Lowercase letters, numbers, and underscores only.
              </Text>
              {usernameError ? (
                <Text style={{ color: theme.danger.val, fontSize: 13 }}>
                  {usernameError}
                </Text>
              ) : null}
              {usernameSuccess ? (
                <Text style={{ color: theme.success.val, fontSize: 13 }}>
                  {usernameSuccess}
                </Text>
              ) : null}
              <XStack style={{ justifyContent: "flex-start" }}>
                <AppButton
                  variant="outline"
                  onPress={() => void handleSaveUsername()}
                  disabled={isSavingUsername}
                  loading={isSavingUsername}
                >
                  Save username
                </AppButton>
              </XStack>
            </YStack>

            <YStack style={{ gap: "0.15rem" }}>
              <Text style={{ color: theme.textMuted.val, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" }}>
                Email
              </Text>
              <Text style={{ fontSize: 16 }}>
                {email ?? "No email provided"}
              </Text>
            </YStack>

            <YStack gap="$2">
              <Text style={{ color: theme.textMuted.val, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" }}>
                Theme
              </Text>
              <ToggleGroup
                type="single"
                orientation="horizontal"
                value={themePreference}
                onValueChange={(nextValue) => {
                  if (nextValue === "system" || nextValue === "dark" || nextValue === "light") {
                    onThemePreferenceChange(nextValue);
                  }
                }}
                disableDeactivation
                style={{
                  width: "100%",
                  maxWidth: 300,
                  flexDirection: "row",
                  borderRadius: 10,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: theme.borderDefault.val,
                  backgroundColor: theme.surfaceHover.val,
                }}
              >
                <ToggleGroup.Item
                  value="system"
                  aria-label="Follow system theme"
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    borderRadius: 0,
                    backgroundColor: themePreference === "system" ? theme.accentSubtle.val : "transparent",
                    color: themePreference === "system" ? theme.textPrimary.val : theme.textSecondary.val,
                    fontWeight: themePreference === "system" ? 600 : 500,
                  }}
                >
                  <Text>OS</Text>
                </ToggleGroup.Item>
                <ToggleGroup.Item
                  value="dark"
                  aria-label="Use dark theme"
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    borderRadius: 0,
                    borderLeftWidth: 1,
                    borderRightWidth: 1,
                    borderColor: theme.borderDefault.val,
                    backgroundColor: themePreference === "dark" ? theme.accentSubtle.val : "transparent",
                    color: themePreference === "dark" ? theme.textPrimary.val : theme.textSecondary.val,
                    fontWeight: themePreference === "dark" ? 600 : 500,
                  }}
                >
                  <Text>Dark</Text>
                </ToggleGroup.Item>
                <ToggleGroup.Item
                  value="light"
                  aria-label="Use light theme"
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    borderRadius: 0,
                    backgroundColor: themePreference === "light" ? theme.accentSubtle.val : "transparent",
                    color: themePreference === "light" ? theme.textPrimary.val : theme.textSecondary.val,
                    fontWeight: themePreference === "light" ? 600 : 500,
                  }}
                >
                  <Text>Light</Text>
                </ToggleGroup.Item>
              </ToggleGroup>
            </YStack>

            <YStack gap="$2">
              <Text style={{ color: theme.textMuted.val, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase" }}>
                Sign out
              </Text>
              <XStack style={{ justifyContent: "flex-start" }}>
                <AppButton
                  variant="outline"
                  onPress={onSignOut}
                  disabled={isSigningOut}
                  loading={isSigningOut}
                >
                  Sign out
                </AppButton>
              </XStack>
            </YStack>
          </YStack>
        </Card.Header>
      </Card>
    </YStack>
  );
}
