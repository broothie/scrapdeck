import { Button, Text, ToggleGroup, YStack, useTheme } from "tamagui";

type ThemePreference = "system" | "light" | "dark";

type SidebarAccountSectionProps = {
  accountUsername?: string;
  themePreference?: ThemePreference;
  onThemePreferenceChange?: (nextPreference: ThemePreference) => void;
  onSignOut?: () => void;
  isSigningOut?: boolean;
};

export function SidebarAccountSection({
  accountUsername,
  themePreference = "system",
  onThemePreferenceChange,
  onSignOut,
  isSigningOut = false,
}: SidebarAccountSectionProps) {
  const theme = useTheme();

  if (!accountUsername) {
    return null;
  }

  return (
    <YStack
      gap="$3"
      style={{
        marginTop: "auto",
        paddingTop: "0.75rem",
        borderTopWidth: 1,
        borderTopColor: theme.borderSubtle.val,
      }}
    >
      <YStack style={{ gap: "0.25rem" }}>
        <Text style={{ fontSize: 16, fontWeight: 700 }}>
          @{accountUsername}
        </Text>
      </YStack>
      {onThemePreferenceChange ? (
        <YStack gap="$2">
          <Text style={{ color: theme.textSecondary.val, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase" }}>
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
                backgroundColor:
                  themePreference === "system" ? theme.accentSubtle.val : "transparent",
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
                backgroundColor:
                  themePreference === "dark" ? theme.accentSubtle.val : "transparent",
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
                backgroundColor:
                  themePreference === "light" ? theme.accentSubtle.val : "transparent",
                color: themePreference === "light" ? theme.textPrimary.val : theme.textSecondary.val,
                fontWeight: themePreference === "light" ? 600 : 500,
              }}
            >
              <Text>Light</Text>
            </ToggleGroup.Item>
          </ToggleGroup>
        </YStack>
      ) : null}
      {onSignOut ? (
        <Button
          onPress={onSignOut}
          variant="outlined"
          disabled={isSigningOut}
        >
          Sign out
        </Button>
      ) : null}
    </YStack>
  );
}
