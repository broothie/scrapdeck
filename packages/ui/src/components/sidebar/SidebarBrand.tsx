import { H2, Text, YStack, useTheme } from "tamagui";

type SidebarBrandProps = {
  title: string;
  subtitle: string;
};

export function SidebarBrand({ title, subtitle }: SidebarBrandProps) {
  const theme = useTheme();

  return (
    <YStack style={{ gap: "0.5rem" }}>
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
      <H2 style={{ margin: 0 }}>
        {title}
      </H2>
    </YStack>
  );
}
