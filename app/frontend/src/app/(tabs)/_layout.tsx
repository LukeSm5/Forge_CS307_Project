import React, { useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';
import { Schemes } from '@/constants/Colors';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useAppColorScheme } from '@/core/accessibility';
import { loadToken } from '@/core/api';
import AntDesign from '@expo/vector-icons/AntDesign';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  focused: boolean;
}) {
  return (
    <Ionicons
      size={24}
      style={{ marginBottom: -2, opacity: props.focused ? 1 : 0.82 }}
      {...props}
    />
  );
}

export default function TabLayout() {
  const colorScheme = useAppColorScheme();

  useEffect(() => {
    loadToken();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Schemes[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Schemes[colorScheme ?? 'light'].tabIconDefault,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: Schemes[colorScheme ?? 'light'].background,
          borderTopColor: colorScheme === 'dark' ? '#1f2937' : '#e5e7eb',
        },
        tabBarItemStyle: {
          backgroundColor: Schemes[colorScheme ?? 'light'].background,
        },
        headerStyle: {
          backgroundColor: Schemes[colorScheme ?? 'light'].background,
        },
        headerTintColor: Schemes[colorScheme ?? 'light'].text,
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
          ),
          headerRight: () => (
            <Link href="/settings" asChild>
              <Pressable>
                {({ pressed }) => (
                  <Ionicons
                    name="settings-outline"
                    size={24}
                    color={Schemes[colorScheme ?? 'light'].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Workout',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'barbell' : 'barbell-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="diet"
        options={{
          title: 'Diet',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'restaurant' : 'restaurant-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'people' : 'people-outline'} color={color} focused={focused} />
          ),
          headerRight: () => (
            <Link href="/notifications" asChild>
              <Pressable>
                {({ pressed }) => (
                  <AntDesign 
                    name="bell" 
                    size={24} 
                    color={Schemes[colorScheme ?? 'light'].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }} 
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
    </Tabs>
  );
}