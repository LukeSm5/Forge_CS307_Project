export const forgeButtonThemes = {
  primary: {
    backgroundColor: '#2563eb',
    textColor: '#ffffff',
  },
  secondary: {
    backgroundColor: '#334155',
    textColor: '#ffffff',
  },
  success: {
    backgroundColor: '#16a34a',
    textColor: '#ffffff',
  },
  danger: {
    backgroundColor: '#dc2626',
    textColor: '#ffffff',
  },
  neutral: {
    backgroundColor: '#64748b',
    textColor: '#ffffff',
  },
  teal: {
    backgroundColor: '#0f766e',
    textColor: '#ffffff',
  },
} as const;

export type ForgeButtonThemeName = keyof typeof forgeButtonThemes;
