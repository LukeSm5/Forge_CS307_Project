import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';

import { SocialPalette, SocialPanel } from './socialTypes';

type SocialActionButtonsProps = {
  activePanel: SocialPanel;
  colors: SocialPalette;
  onSelectPanel: (panel: SocialPanel) => void;
};

type FeedAction = {
  key: Extract<SocialPanel, 'friends' | 'gym'>;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accent: string;
};

const FEED_ACTIONS: FeedAction[] = [
  {
    key: 'friends',
    title: 'My Friends Posts',
    subtitle: 'See updates from friends',
    icon: 'people',
    accent: 'tint',
  },
  {
    key: 'gym',
    title: 'My Gym Posts',
    subtitle: 'Browse your gym community',
    icon: 'barbell',
    accent: 'buttonBg',
  },
];

export default function SocialActionButtons({
  activePanel,
  colors,
  onSelectPanel,
}: SocialActionButtonsProps) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={[styles.sectionLabel, { color: colors.tint }]}>QUICK FEEDS</Text>

      <View style={styles.row}>
        {FEED_ACTIONS.map((action) => {
          const isActive = activePanel === action.key;
          const accentColor = colors[action.accent as keyof SocialPalette] as string;

          return (
            <Pressable
              key={action.key}
              onPress={() => onSelectPanel(action.key)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: isActive ? colors.background : colors.secondaryBackground,
                  borderColor: isActive ? accentColor : colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: accentColor }]}> 
                <Ionicons name={action.icon} size={20} color={colors.buttonText} />
              </View>

              <Text style={[styles.title, { color: colors.text }]}>{action.title}</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>{action.subtitle}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionWrap: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    minHeight: 116,
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.85,
  },
});
