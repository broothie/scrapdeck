import { defaultConfig } from "@tamagui/config/v5";
import { createTamagui } from "tamagui";

export const lightColors = {
  canvas: "#F8F5FC",
  surface: "#FFFFFF",
  surfaceHover: "#F0EAF8",
  overlay: "#E8E0F2",
  borderSubtle: "#E2D8EE",
  borderDefault: "#C8B8E0",
  borderStrong: "#A090C0",
  textMuted: "#A898B8",
  textSecondary: "#6A5880",
  textPrimary: "#2A1E3A",
  textInk: "#180E28",
  accentSubtle: "#F3EDFB",
  accentLight: "#DEC8F0",
  accentDefault: "#B890DC",
  accentLogo: "#7B3FB5",
  accentStrong: "#5A2888",
  accentText: "#3A1860",
  danger: "#D95030",
  dangerSubtle: "#FDEEE9",
  success: "#3A7D44",
  successSubtle: "#EAF3DC",
} as const;

export const darkColors = {
  canvas: "#2E2A34",
  surface: "#3A3542",
  surfaceHover: "#454050",
  overlay: "#524C60",
  borderSubtle: "#3E3848",
  borderDefault: "#544E62",
  borderStrong: "#6A6278",
  textMuted: "#6A6278",
  textSecondary: "#A898B8",
  textPrimary: "#D8D0E4",
  textInk: "#EEE8F8",
  accentSubtle: "#2A1848",
  accentLight: "#3E2860",
  accentDefault: "#6830A0",
  accentLogo: "#7B3FB5",
  accentStrong: "#7B3FB5",
  accentText: "#DEC8F0",
  danger: "#E06848",
  dangerSubtle: "#2A1208",
  success: "#5A9E64",
  successSubtle: "#0E2212",
} as const;

const config = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      ...lightColors,
      background: lightColors.canvas,
      backgroundHover: lightColors.surfaceHover,
      backgroundPress: lightColors.overlay,
      backgroundFocus: lightColors.overlay,
      color: lightColors.textPrimary,
      colorHover: lightColors.textInk,
      colorPress: lightColors.textInk,
      colorFocus: lightColors.textInk,
      borderColor: lightColors.borderDefault,
      borderColorHover: lightColors.borderStrong,
      borderColorFocus: lightColors.accentDefault,
      placeholderColor: lightColors.textMuted,
    },
    dark: {
      ...defaultConfig.themes.dark,
      ...darkColors,
      background: darkColors.canvas,
      backgroundHover: darkColors.surfaceHover,
      backgroundPress: darkColors.overlay,
      backgroundFocus: darkColors.overlay,
      color: darkColors.textPrimary,
      colorHover: darkColors.textInk,
      colorPress: darkColors.textInk,
      colorFocus: darkColors.textInk,
      borderColor: darkColors.borderDefault,
      borderColorHover: darkColors.borderStrong,
      borderColorFocus: darkColors.accentDefault,
      placeholderColor: darkColors.textMuted,
    },
  },
});

type AppConfig = typeof config;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
