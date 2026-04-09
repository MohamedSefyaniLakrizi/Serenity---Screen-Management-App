import {
  accent,
  darkBg,
  darkBorder,
  darkText,
  habitAccent,
  lightBg,
  lightBorder,
  lightText,
  status,
} from "./colors";

export const darkTheme = {
  bg: darkBg,
  text: darkText,
  accent,
  status,
  habitAccent,
  border: darkBorder,
  statusBar: "light-content" as const,
} as const;

export const lightTheme = {
  bg: lightBg,
  text: lightText,
  accent,
  status,
  habitAccent,
  border: lightBorder,
  statusBar: "dark-content" as const,
} as const;

export type Theme = typeof darkTheme;
