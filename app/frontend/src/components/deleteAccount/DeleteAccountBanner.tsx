import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text, useScheme } from '@/components/Themed';

type Props = {
  visible: boolean;
  onFinished: () => void; // called after animation — redirect to login here
};

export default function AccountDeletedBanner({ visible, onFinished }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;
  const styles = useStyles();

  useEffect(() => {
    if (!visible) return;

    // Fade + slide in
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 160,
      }),
    ]).start();

    // Auto-redirect after 2.8s
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onFinished());
    }, 2800);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>✓</Text>
        </View>
        <Text style={styles.title}>Account Deleted</Text>
        <Text style={styles.subtitle}>
          Your account and all associated data have been permanently removed.
        </Text>
        <Pressable onPress={onFinished} style={styles.btn}>
          <Text style={styles.btnText}>Back to Login</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const useStyles = () => {
  const s = useScheme();
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: s.backdrop,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
      padding: 24,
    },
    banner: {
      width: '100%',
      backgroundColor: s.background,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: s.separator,
      padding: 28,
      alignItems: 'center',
      gap: 14,
      shadowColor: s.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
      elevation: 20,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: s.buttonBg,
      borderWidth: 1,
      borderColor: s.neutralColor,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    icon: {
      color: s.buttonText,
      fontSize: 26,
      fontWeight: '700',
    },
    title: {
      color: s.text,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    subtitle: {
      color: s.secondaryText,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 21,
    },
    btn: {
      marginTop: 8,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: s.buttonBg,
      borderWidth: 1,
      borderColor: s.neutralColor,
    },
    btnText: {
      color: s.buttonText,
      fontWeight: '700',
      fontSize: 14,
    },
  });
}
