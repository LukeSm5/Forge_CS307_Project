import { useScheme } from "../Themed";

  export function useSocialColors() {
    const scheme = useScheme();
    return {
    screenBg: scheme.secondaryBackground,
    cardBg: scheme.background,
    text: scheme.text,
    muted: scheme.secondaryText,
    border: scheme.neutralColor,
    soft: scheme.secondaryBackground,
    inputBg: scheme.background,
    inputBorder: scheme.neutralColor,
    placeholder: scheme.secondaryText,
    orange: scheme.buttonBg,
    orangeGlow: scheme.buttonBg,
    red: scheme.dangerColor,
    friendBg: scheme.secondaryBackground,
    friendBorder: scheme.tint,
    flagBg: scheme.secondaryBackground,
    flagBorder: scheme.dangerColor,
    modalBackdrop: scheme.backdrop,
    modalCardBg: scheme.background,
    modalSecondaryBg: scheme.secondaryBackground,
    buttonBg: scheme.buttonBg,
    buttonSecondaryBg: scheme.buttonSecondaryBg,
    buttonText: scheme.buttonText,
  };
}