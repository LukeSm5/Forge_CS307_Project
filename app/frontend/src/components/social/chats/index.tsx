import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text, useScheme } from "@/components/Themed";
import { api, ChatListItem } from "@/core/api";

type SocialChatsOverlayProps = {
  visible: boolean;
  onClose: () => void;
  refreshKey?: number;
};

function getInitials(username: string) {
  return (
    username
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export default function SocialChatsOverlay({
  visible,
  onClose,
  refreshKey = 0,
}: SocialChatsOverlayProps) {
  const scheme = useScheme();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const rows = await api.getChats();
      setChats(rows);
    } catch (e) {
      console.error(e);
      setError("Unable to load chats right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadChats();
    }
  }, [visible, refreshKey, loadChats]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[
          styles.backdrop,
          { backgroundColor: scheme.backdrop ?? "rgba(0,0,0,0.45)" },
        ]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: scheme.background,
              borderColor: scheme.neutralColor,
              shadowColor: scheme.shadow,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.eyebrow, { color: scheme.buttonBg }]}>
                MESSAGES
              </Text>
              <Text style={[styles.title, { color: scheme.text }]}>Chats</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close chats"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: scheme.secondaryBackground,
                  borderColor: scheme.neutralColor,
                },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="close" size={24} color={scheme.text} />
            </Pressable>
          </View>

          {loading ? (
            <View
              style={[
                styles.placeholderBox,
                {
                  backgroundColor: scheme.secondaryBackground,
                  borderColor: scheme.neutralColor,
                },
              ]}
            >
              <ActivityIndicator />
              <Text
                style={[
                  styles.placeholderText,
                  { color: scheme.secondaryText },
                ]}
              >
                Loading chats...
              </Text>
            </View>
          ) : error ? (
            <View
              style={[
                styles.placeholderBox,
                {
                  backgroundColor: scheme.secondaryBackground,
                  borderColor: scheme.neutralColor,
                },
              ]}
            >
              <Ionicons
                name="warning-outline"
                size={42}
                color={scheme.buttonBg}
              />
              <Text style={[styles.placeholderTitle, { color: scheme.text }]}>
                Could not load chats
              </Text>
              <Text
                style={[
                  styles.placeholderText,
                  { color: scheme.secondaryText },
                ]}
              >
                {error}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retry loading chats"
                onPress={loadChats}
                style={({ pressed }) => [
                  styles.retryButton,
                  { backgroundColor: scheme.buttonBg },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[styles.retryButtonText, { color: scheme.buttonText }]}
                >
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : chats.length === 0 ? (
            <View
              style={[
                styles.placeholderBox,
                {
                  backgroundColor: scheme.secondaryBackground,
                  borderColor: scheme.neutralColor,
                },
              ]}
            >
              <Ionicons
                name="chatbubbles-outline"
                size={42}
                color={scheme.buttonBg}
              />
              <Text style={[styles.placeholderTitle, { color: scheme.text }]}>
                Chat list goes here
              </Text>
              <Text
                style={[
                  styles.placeholderText,
                  { color: scheme.secondaryText },
                ]}
              >
                No chats currently
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.chatList}
              showsVerticalScrollIndicator={false}
            >
              {chats.map((chat) => (
                <View
                  key={chat.thread_id}
                  style={[
                    styles.chatRow,
                    {
                      backgroundColor: scheme.secondaryBackground,
                      borderColor: scheme.neutralColor,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: scheme.buttonBg },
                    ]}
                  >
                    <Text
                      style={[styles.avatarText, { color: scheme.buttonText }]}
                    >
                      {getInitials(chat.friend_username)}
                    </Text>
                  </View>

                  <View style={styles.chatInfo}>
                    <Text style={[styles.chatName, { color: scheme.text }]}>
                      {chat.friend_username}
                    </Text>
                    <Text
                      style={[
                        styles.chatPreview,
                        { color: scheme.secondaryText },
                      ]}
                      numberOfLines={1}
                    >
                      New conversation
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    padding: 16,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    gap: 10,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center",
  },
  placeholderText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  retryButton: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
  chatList: {
    gap: 12,
    paddingBottom: 24,
  },
  chatRow: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "900",
  },
  chatInfo: {
    flex: 1,
    minWidth: 0,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  chatPreview: {
    fontSize: 13,
  },
  pressed: {
    opacity: 0.8,
  },
});
