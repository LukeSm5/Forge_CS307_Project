const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export type ColorScheme = {
  separator: string;
  shadow: string;
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
  backdrop: string,
  keyboard: 'light' | 'dark',
}

export type ColorSchemes = Record<string, ColorScheme>

export const Schemes: ColorSchemes = {
  light: {
    separator: '#eee',
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
    backdrop: 'rgba(0,0,0,0.5)',
    keyboard: 'light',
    shadow: '#0007',
  },
  dark: {
    separator: '#555',
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
    backdrop: 'rgba(255,255,255,0.5)',
    keyboard: 'dark',
    shadow: '#fff7',
  },
};
