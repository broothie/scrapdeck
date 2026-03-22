import { defaultConfig } from "@tamagui/config/v5";
import { createTamagui } from "tamagui";

export const lightColors = {
  canvas: "#F8F6F1",
  surface: "#FFFFFF",
  surfaceHover: "#F3F1EC",
  overlay: "#EDEBE4",
  borderSubtle: "#E8E5DE",
  borderDefault: "#D5D1C8",
  borderStrong: "#B8B3A8",
  textMuted: "#A8A49C",
  textSecondary: "#706C63",
  textPrimary: "#2C2A25",
  textInk: "#18170F",
  accentSubtle: "#F5EEF2",
  accentLight: "#E2C8D8",
  accentDefault: "#C098B4",
  accentStrong: "#7A4868",
  accentText: "#4A2840",
  danger: "#D95030",
  dangerSubtle: "#FDEEE9",
  success: "#3A7D44",
  successSubtle: "#EAF3DC",
} as const;

export const darkColors = {
  canvas: "#16150F",
  surface: "#1F1D16",
  surfaceHover: "#272520",
  overlay: "#2E2C24",
  borderSubtle: "#2A2820",
  borderDefault: "#3A3830",
  borderStrong: "#524F45",
  textMuted: "#5A5850",
  textSecondary: "#9A968C",
  textPrimary: "#D8D4CB",
  textInk: "#F0EDE4",
  accentSubtle: "#281428",
  accentLight: "#3A1C30",
  accentDefault: "#68385888",
  accentStrong: "#C098B4",
  accentText: "#E2C8D8",
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
