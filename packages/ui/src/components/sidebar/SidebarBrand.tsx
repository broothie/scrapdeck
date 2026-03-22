import { H2, Text, XStack, YStack, useTheme } from "tamagui";

type SidebarBrandProps = {
  title: string;
  subtitle: string;
  logoUrl?: string;
};

export function SidebarBrand({ title, subtitle, logoUrl }: SidebarBrandProps) {
  const theme = useTheme();

  return (
    <YStack style={{ gap: "0.5rem" }}>
      <XStack style={{ gap: "0.5rem", alignItems: "center" }}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${subtitle} logo`}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              objectFit: "cover",
            }}
          />
        ) : null}
        <Text
          style={{
            color: theme.textSecondary.val,
            fontSize: 12,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {subtitle}
        </Text>
      </XStack>
      <H2 style={{ margin: 0 }}>
        {title}
      </H2>
    </YStack>
  );
}
