const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export type ColorScheme = {
  text: string,
  background: string,
  tint: string,
  tabIconDefault: string,
  tabIconSelected: string
}

export type ColorSchemes = Record<string, ColorScheme>

export const Schemes: ColorSchemes = {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};
