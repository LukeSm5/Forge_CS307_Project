import React from "react";
import {
  Text as DefaultText,
  View as DefaultView,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from "react-native";

import { Schemes } from "@/constants/Colors";
import { useColorScheme } from "./useColorScheme";
import { useAccessibility } from "@/core/accessibility";

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText["props"];
export type ViewProps = ThemeProps & DefaultView["props"];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Schemes.light & keyof typeof Schemes.dark
) {
  const theme = useColorScheme() ?? "light";
  const colorFromProps = props[theme];

  if (colorFromProps) return colorFromProps;
  return Schemes[theme][colorName];
}

function scaleTextStyle(style: TextStyle | TextStyle[] | undefined, scale: number): TextStyle[] {
  const flattened = StyleSheet.flatten(style) as TextStyle | undefined;

  // If no explicit fontSize is provided, we still apply a baseline scaling.
  const baseFontSize = flattened?.fontSize ?? 16;

  const next: TextStyle = {
    ...(flattened ?? {}),
    fontSize: baseFontSize * scale,
  };

  if (typeof flattened?.lineHeight === "number") {
    next.lineHeight = flattened.lineHeight * scale;
  }

  return [next];
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");
  const { textScale } = useAccessibility();

  const scaled = scaleTextStyle(style as any, textScale);
  return <DefaultText style={[{ color }, ...scaled]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, "background");

  return <DefaultView style={[{ backgroundColor }, style as ViewStyle]} {...otherProps} />;
}