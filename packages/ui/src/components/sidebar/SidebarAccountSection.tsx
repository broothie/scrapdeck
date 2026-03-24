import { Button, Text, XStack, YStack, useTheme } from "tamagui";

type SidebarAccountSectionProps = {
  accountUsername?: string;
  accountAvatarUrl?: string;
  onOpenAccount?: () => void;
};

export function SidebarAccountSection({
  accountUsername,
  accountAvatarUrl,
  onOpenAccount,
}: SidebarAccountSectionProps) {
  const theme = useTheme();

  if (!accountUsername) {
    return null;
  }

  return (
    <YStack
      style={{
        marginTop: "auto",
      }}
    >
      <Button
        unstyled
        onPress={onOpenAccount}
        aria-label="Open account page"
        disabled={!onOpenAccount}
        style={{
          alignSelf: "flex-start",
          paddingTop: 6,
          paddingBottom: 6,
          paddingLeft: 0,
          paddingRight: 0,
          appearance: "none",
          WebkitAppearance: "none",
          backgroundColor: "transparent",
          borderWidth: 0,
          borderColor: "transparent",
          boxShadow: "none",
          outlineStyle: "none",
          cursor: onOpenAccount ? "pointer" : "default",
          opacity: 1,
        }}
        hoverStyle={{
          background: "transparent",
          borderColor: "transparent",
          boxShadow: "none",
        }}
        pressStyle={{
          background: "transparent",
          borderColor: "transparent",
          boxShadow: "none",
        }}
        focusStyle={{
          background: "transparent",
          borderColor: "transparent",
          boxShadow: "none",
        }}
      >
        <XStack style={{ alignItems: "center", gap: "0.55rem" }}>
          {accountAvatarUrl ? (
            <img
              src={accountAvatarUrl}
              alt={`${accountUsername} avatar`}
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                objectFit: "cover",
                border: `1px solid ${theme.borderDefault.val}`,
                display: "block",
              }}
            />
          ) : null}
          <Text
            style={{
              fontSize: 20,
              lineHeight: 24,
              fontWeight: 800,
              color: onOpenAccount ? theme.textInk.val : theme.textSecondary.val,
            }}
          >
            {accountUsername}
          </Text>
        </XStack>
      </Button>
    </YStack>
  );
}
