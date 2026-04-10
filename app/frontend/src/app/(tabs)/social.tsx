import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from 'react-native';

import ForgeButton from '@/components/ForgeButton';
import { Text } from '@/components/Themed';
import { useAppColorScheme } from '@/core/accessibility';
// import { api } from '../../core/api'; // wire up later

type ProfileSearchResult = {
  id: number | string;
  username: string;
  gymLocation?: string | null;
  bio?: string | null;
};

type FriendshipAction = 'send' | 'remove';

type FriendModalState = {
  visible: boolean;
  loading: boolean;
  profile: ProfileSearchResult | null;
  action: FriendshipAction | null;
};

export default function ProfilesTab() {
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    screenBg: isDark ? '#101114' : '#f3f4f6',
    cardBg: isDark ? '#161616' : '#fffdfb',
    text: isDark ? '#ffffff' : '#111111',
    muted: isDark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.68)',
    border: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.16)',
    soft: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    inputBg: isDark ? '#0f0f0f' : '#ffffff',
    inputBorder: isDark ? 'rgba(255,255,255,0.16)' : '#d7d7d7',
    placeholder: isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.35)',
    orange: '#0a49e8ff',
    orangeGlow: '#2f66d3ff',
    red: '#C94040',
    friendBg: isDark ? 'rgba(47,128,237,0.12)' : '#eef4ff',
    friendBorder: isDark ? 'rgba(47,128,237,0.40)' : '#2f66d3ff',
    flagBg: isDark ? 'rgba(201,64,64,0.12)' : '#fff1f1',
    flagBorder: isDark ? 'rgba(201,64,64,0.38)' : '#ef9a9a',
    modalBackdrop: 'rgba(0,0,0,0.35)',
    modalCardBg: isDark ? '#161616' : '#ffffff',
    modalSecondaryBg: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
  };

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<ProfileSearchResult[]>([]);
  const [friendModal, setFriendModal] = useState<FriendModalState>({
    visible: false,
    loading: false,
    profile: null,
    action: null,
  });

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  const handleSearch = async () => {
    if (!trimmedQuery) {
      setError('Enter a username to search.');
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const mockResults: ProfileSearchResult[] = [
        {
          id: 1,
          username: `${trimmedQuery}_lifts`,
          gymLocation: 'Forge Downtown',
          bio: 'Powerlifting, early morning sessions, always chasing a bigger total.',
        },
        {
          id: 2,
          username: `${trimmedQuery}_fit`,
          gymLocation: 'Northside Barbell',
          bio: 'Hybrid training, nutrition-focused, down for training partners.',
        },
        {
          id: 3,
          username: `${trimmedQuery}_strong`,
          gymLocation: 'West End Fitness',
          bio: 'Bodybuilding split, likes high-volume sessions and consistency.',
        },
      ];

      setResults(mockResults);
    } catch (e) {
      console.error(e);
      setError('Unable to search profiles right now.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setError('');
    setResults([]);
  };

  const closeFriendModal = () => {
    setFriendModal({
      visible: false,
      loading: false,
      profile: null,
      action: null,
    });
  };

  const mockCheckFriendship = async (profile: ProfileSearchResult): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 350));

    const numericId =
      typeof profile.id === 'number' ? profile.id : Number(String(profile.id).replace(/\D/g, '') || '0');

    return numericId % 2 === 0;
  };

  const handleFriendPress = async (profile: ProfileSearchResult) => {
    try {
      setFriendModal({
        visible: true,
        loading: true,
        profile,
        action: null,
      });

      const isFriend = await mockCheckFriendship(profile);

      setFriendModal({
        visible: true,
        loading: false,
        profile,
        action: isFriend ? 'remove' : 'send',
      });
    } catch (e) {
      console.error(e);
      closeFriendModal();
      setError('Unable to check friendship status right now.');
    }
  };

  const handleConfirmFriendAction = async () => {
    if (!friendModal.profile || !friendModal.action) return;

    try {
      setFriendModal((prev) => ({
        ...prev,
        loading: true,
      }));

      await new Promise((resolve) => setTimeout(resolve, 500));

      closeFriendModal();
    } catch (e) {
      console.error(e);
      setFriendModal((prev) => ({
        ...prev,
        loading: false,
      }));
      setError('Unable to complete that action right now.');
    }
  };

  const handleFlag = (profile: ProfileSearchResult) => {
    console.log('flag pressed for', profile.username);
  };

  const modalTitle =
  friendModal.action === 'remove'
    ? 'Remove Friend?'
    : friendModal.action === 'send'
      ? 'Send Friend Request?'
      : '';

  const modalBody =
  friendModal.profile && friendModal.action === 'remove'
    ? `Do you want to remove @${friendModal.profile.username} from your friends list?`
    : friendModal.profile && friendModal.action === 'send'
      ? `Do you want to send a friend request to @${friendModal.profile.username}?`
      : '';

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: colors.screenBg }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.eyebrow, { color: colors.orange }]}>PROFILE SEARCH</Text>

          <View style={styles.searchRow}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Enter username"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              keyboardAppearance={isDark ? 'dark' : 'light'}
              style={[
                styles.searchInput,
                {
                  color: colors.text,
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                },
              ]}
            />
          </View>

          <View style={styles.buttonRow}>
            <View style={styles.buttonWrap}>
              <ForgeButton onPress={handleSearch} text="Search" />
            </View>
            <View style={styles.buttonWrap}>
              <ForgeButton onPress={handleClear} text="Clear" />
            </View>
          </View>

          {error ? <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text> : null}

          <View style={styles.inlineResults}>
            {loading ? (
              <View
                style={[
                  styles.centerState,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.border,
                  },
                ]}
              >
                <ActivityIndicator size="small" />
                <Text style={[styles.stateText, { color: colors.muted }]}>Searching profiles...</Text>
              </View>
            ) : (
              <View style={styles.resultsList}>
                {results.map((profile) => (
                  <View
                    key={profile.id}
                    style={[
                      styles.profileRow,
                      {
                        backgroundColor: colors.soft,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.profileMain}>
                      <Text style={[styles.usernameText, { color: colors.text }]}>
                        @{profile.username}
                      </Text>

                      <Text style={[styles.locationText, { color: colors.orange }]}>
                        {profile.gymLocation || 'No gym location provided'}
                      </Text>

                      <Text style={[styles.bioText, { color: colors.muted }]} numberOfLines={2}>
                        {profile.bio || 'No bio provided'}
                      </Text>
                    </View>

                    <View style={styles.actionsCol}>
                      <Pressable
                        onPress={() => handleFriendPress(profile)}
                        style={({ pressed }) => [
                          styles.iconButton,
                          {
                            backgroundColor: colors.friendBg,
                            borderColor: colors.friendBorder,
                          },
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.friendButtonText, { color: colors.orange }]}>👤</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleFlag(profile)}
                        style={({ pressed }) => [
                          styles.iconButton,
                          {
                            backgroundColor: colors.flagBg,
                            borderColor: colors.flagBorder,
                          },
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.flagButtonText, { color: colors.red }]}>⚑</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={friendModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeFriendModal}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: colors.modalBackdrop }]}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.modalCardBg,
                borderColor: colors.border,
              },
            ]}
          >
            {friendModal.loading || !friendModal.action ? (
              <View style={styles.modalLoadingWrap}>
                <ActivityIndicator size="small" />
                <Text style={[styles.modalBodyText, { color: colors.muted }]}>
                  Checking friendship status...
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{modalTitle}</Text>
                <Text style={[styles.modalBodyText, { color: colors.muted }]}>{modalBody}</Text>

                <View style={styles.modalButtonRow}>
                  <Pressable
                    onPress={closeFriendModal}
                    style={({ pressed }) => [
                      styles.modalButton,
                      {
                        backgroundColor: colors.modalSecondaryBg,
                        borderColor: colors.border,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.modalSecondaryButtonText, { color: colors.text }]}>No</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleConfirmFriendAction}
                    style={({ pressed }) => [
                      styles.modalButton,
                      {
                        backgroundColor:
                          friendModal.action === 'remove' ? colors.red : colors.orange,
                        borderColor:
                          friendModal.action === 'remove' ? colors.red : colors.orange,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={
                        friendModal.action === 'remove'
                          ? styles.modalDangerButtonText
                          : styles.modalPrimaryButtonText
                      }
                    >
                      Yes
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  content: {
    padding: 16,
  },

  headerCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  searchRow: {
    marginTop: 4,
  },

  searchInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  buttonWrap: {
    flex: 1,
  },

  errorText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },

  inlineResults: {
    marginTop: 16,
  },

  centerState: {
    paddingVertical: 28,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
  },

  stateText: {
    fontSize: 14,
    textAlign: 'center',
  },

  resultsList: {
    gap: 10,
  },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },

  profileMain: {
    flex: 1,
  },

  usernameText: {
    fontSize: 16,
    fontWeight: '700',
  },

  locationText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },

  bioText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  actionsCol: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  friendButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },

  flagButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.8,
  },

  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },

  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },

  modalLoadingWrap: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },

  modalBodyText: {
    fontSize: 14,
    lineHeight: 20,
  },

  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },

  modalButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  modalSecondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },

  modalPrimaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },

  modalDangerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
});