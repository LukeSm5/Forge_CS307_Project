const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export type ColorScheme = {
  text: string,
  background: string,
  secondaryBackground: string,
  tint: string,
  tabIconDefault: string,
  tabIconSelected: string,
  buttonBg: string,
  buttonSecondaryBg: string,
  neutralColor: string,
  dangerColor: string,
  hyperlink: string,
  buttonText: string,
  secondaryText: string,
}

export type ColorSchemes = Record<string, ColorScheme>

export const Schemes: ColorSchemes = {
  light: {
    text: '#000',
    background: '#fff',
    secondaryBackground: '#eee',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    buttonText: '#fff',
    buttonBg: '#ffb300',
    buttonSecondaryBg: '#69bc11',
    neutralColor: '#b2b2b2',
    dangerColor: '#dc2626',
    hyperlink: '#ad6206',
    secondaryText: '#6d6d6d',
  },
  dark: {
    text: '#fff',
    background: '#000',
    secondaryBackground: '#111',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    buttonText: '#fff',
    buttonBg: '#cc8801',
    buttonSecondaryBg: '#18c900',
    neutralColor: '#555',
    dangerColor: '#dc2626',
    hyperlink: '#d3a605',
    secondaryText: '#bcbcbc',
  },
};
