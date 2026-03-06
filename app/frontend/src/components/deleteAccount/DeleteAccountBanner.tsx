import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '@/components/Themed';

type Props = {
  visible: boolean;
  onFinished: () => void; // called after animation — redirect to login here
};

export default function AccountDeletedBanner({ visible, onFinished }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;

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

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    padding: 24,
  },
  banner: {
    width: '100%',
    backgroundColor: '#0f131a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#232834',
    padding: 28,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#14291f',
    borderWidth: 1,
    borderColor: '#22543d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    color: '#86efac',
    fontSize: 26,
    fontWeight: '700',
  },
  title: {
    color: '#f9fafb',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  btn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1a2236',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  btnText: {
    color: '#f9fafb',
    fontWeight: '700',
    fontSize: 14,
  },
});
