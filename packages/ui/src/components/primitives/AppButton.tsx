import type { ComponentProps, ReactNode } from "react";
import { Button, Spinner, Text, useTheme } from "tamagui";

type ButtonVariant = "primary" | "cta" | "outline" | "secondary" | "danger" | "google";

type AppButtonProps = Omit<ComponentProps<typeof Button>, "children" | "variant"> & {
  variant?: ButtonVariant;
  loading?: boolean;
  children?: ReactNode;
};

type VariantStyles = {
  background: string;
  border: string;
  text: string;
  hoverBackground: string;
  hoverBorder: string;
  pressBackground: string;
  pressBorder: string;
  fontWeight: number;
};

function resolveVariantStyles(variant: ButtonVariant, theme: ReturnType<typeof useTheme>): VariantStyles {
  switch (variant) {
    case "primary":
      return {
        background: theme.accentLight.val,
        border: theme.accentDefault.val,
        text: theme.accentText.val,
        hoverBackground: theme.accentDefault.val,
        hoverBorder: theme.accentStrong.val,
        pressBackground: theme.accentDefault.val,
        pressBorder: theme.accentStrong.val,
        fontWeight: 700,
      };
    case "cta":
      return {
        background: theme.accentLight.val,
        border: theme.accentDefault.val,
        text: theme.accentText.val,
        hoverBackground: theme.accentDefault.val,
        hoverBorder: theme.accentStrong.val,
        pressBackground: theme.accentDefault.val,
        pressBorder: theme.accentStrong.val,
        fontWeight: 700,
      };
    case "secondary":
      return {
        background: theme.surfaceHover.val,
        border: theme.borderDefault.val,
        text: theme.textPrimary.val,
        hoverBackground: theme.overlay.val,
        hoverBorder: theme.borderStrong.val,
        pressBackground: theme.surfaceHover.val,
        pressBorder: theme.borderStrong.val,
        fontWeight: 600,
      };
    case "danger":
      return {
        background: theme.dangerSubtle.val,
        border: theme.danger.val,
        text: theme.danger.val,
        hoverBackground: theme.dangerSubtle.val,
        hoverBorder: theme.danger.val,
        pressBackground: theme.dangerSubtle.val,
        pressBorder: theme.danger.val,
        fontWeight: 700,
      };
    case "google":
      return {
        background: "#ffffff",
        border: "#dadce0",
        text: "#3c4043",
        hoverBackground: "#f8f9fa",
        hoverBorder: "#dadce0",
        pressBackground: "#f1f3f4",
        pressBorder: "#dadce0",
        fontWeight: 600,
      };
    case "outline":
    default:
      return {
        background: theme.surface.val,
        border: theme.borderDefault.val,
        text: theme.textPrimary.val,
        hoverBackground: theme.surfaceHover.val,
        hoverBorder: theme.borderStrong.val,
        pressBackground: theme.surfaceHover.val,
        pressBorder: theme.borderStrong.val,
        fontWeight: 600,
      };
  }
}

export function AppButton({
  variant = "outline",
  loading = false,
  disabled = false,
  children,
  style,
  ...buttonProps
}: AppButtonProps) {
  const theme = useTheme();
  const styles = resolveVariantStyles(variant, theme);

  return (
    <Button
      {...buttonProps}
      disabled={disabled || loading}
      style={{
        backgroundColor: styles.background,
        borderColor: styles.border,
        borderWidth: 1,
        color: styles.text,
        ...(style as Record<string, unknown> | undefined),
      }}
      hoverStyle={{
        background: styles.hoverBackground as never,
        borderColor: styles.hoverBorder as never,
      }}
      pressStyle={{
        background: styles.pressBackground as never,
        borderColor: styles.pressBorder as never,
      }}
    >
      {loading ? (
        <Spinner color={styles.text} />
      ) : typeof children === "string" || typeof children === "number" ? (
        <Text style={{ color: styles.text, fontWeight: styles.fontWeight }}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Button>
  );
}
