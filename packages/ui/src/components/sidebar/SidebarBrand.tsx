import type { MouseEvent } from "react";
import { Text, XStack, YStack, useTheme } from "tamagui";

type SidebarBrandProps = {
  title: string;
  subtitle: string;
  logoUrl?: string;
  onOpenBoards?: () => void;
};

export function SidebarBrand({ title, subtitle, logoUrl, onOpenBoards }: SidebarBrandProps) {
  const theme = useTheme();
  const handleOpenBoards = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onOpenBoards) {
      return;
    }

    event.preventDefault();
    onOpenBoards();
  };

  return (
    <YStack style={{ gap: "0.5rem" }}>
      <a
        href="/"
        onClick={handleOpenBoards}
        aria-label="Go to boards page"
        style={{
          textDecoration: "none",
          alignSelf: "flex-start",
          cursor: "pointer",
        }}
      >
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
      </a>
      <a
        href="/"
        onClick={handleOpenBoards}
        aria-label="Go to boards page"
        style={{
          textDecoration: "none",
          alignSelf: "flex-start",
          cursor: "pointer",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontSize: 20,
            lineHeight: 24,
            fontWeight: 700,
            color: theme.textPrimary.val,
          }}
        >
          {title}
        </Text>
      </a>
    </YStack>
  );
}
