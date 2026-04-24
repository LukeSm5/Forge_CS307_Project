import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
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

type LocalMessage = {
  id: string;
  text: string;
  created_at: string;
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

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SocialChatsOverlay({
  visible,
  onClose,
  refreshKey = 0,
}: SocialChatsOverlayProps) {
  const scheme = useScheme();
  const scrollRef = useRef<ScrollView | null>(null);
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatListItem | null>(null);
  const [localMessagesByThread, setLocalMessagesByThread] = useState<
    Record<string, LocalMessage[]>
  >({});
  const [draftMessage, setDraftMessage] = useState("");
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
    } else {
      setSelectedChat(null);
      setDraftMessage("");
    }
  }, [visible, refreshKey, loadChats]);

  useEffect(() => {
    setDraftMessage("");
  }, [selectedChat?.thread_id]);

  const sendLocalMessage = useCallback(() => {
    if (!selectedChat) return;

    const trimmed = draftMessage.trim();
    if (!trimmed) return;

    const threadKey = String(selectedChat.thread_id);
    const newMessage: LocalMessage = {
      id: `${threadKey}-${Date.now()}`,
      text: trimmed,
      created_at: new Date().toISOString(),
    };

    setLocalMessagesByThread((current) => ({
      ...current,
      [threadKey]: [...(current[threadKey] ?? []), newMessage],
    }));
    setDraftMessage("");

    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [draftMessage, selectedChat]);

  const renderChatRoom = () => {
    if (!selectedChat) return null;

    const threadKey = String(selectedChat.thread_id);
    const messages = localMessagesByThread[threadKey] ?? [];

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.chatRoomContainer}
      >
        <View style={styles.chatRoomHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to chats"
            onPress={() => setSelectedChat(null)}
            style={({ pressed }) => [
              styles.backButton,
              {
                backgroundColor: scheme.secondaryBackground,
                borderColor: scheme.neutralColor,
              },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="chevron-back" size={24} color={scheme.text} />
          </Pressable>

          <View style={[styles.avatar, { backgroundColor: scheme.buttonBg }]}>
            <Text style={[styles.avatarText, { color: scheme.buttonText }]}>
              {getInitials(selectedChat.friend_username)}
            </Text>
          </View>

          <View style={styles.chatRoomTitleWrap}>
            <Text
              style={[styles.chatRoomName, { color: scheme.text }]}
              numberOfLines={1}
            >
              {selectedChat.friend_username}
            </Text>
            <Text
              style={[styles.chatRoomSubtitle, { color: scheme.secondaryText }]}
              numberOfLines={1}
            >
              Chat between you and {selectedChat.friend_username}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.messagesPanel,
            {
              backgroundColor: scheme.secondaryBackground,
              borderColor: scheme.neutralColor,
            },
          ]}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyMessagesWrap}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={44}
                color={scheme.buttonBg}
              />
              <Text style={[styles.placeholderTitle, { color: scheme.text }]}>
                No messages yet
              </Text>
              <Text
                style={[
                  styles.placeholderText,
                  { color: scheme.secondaryText },
                ]}
              >
                Type a message below to add it to this chat log.
              </Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.messagesList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                scrollRef.current?.scrollToEnd({ animated: true })
              }
            >
              {messages.map((message) => (
                <View key={message.id} style={styles.sentMessageRow}>
                  <View
                    style={[
                      styles.sentMessageBubble,
                      { backgroundColor: scheme.buttonBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sentMessageText,
                        { color: scheme.buttonText },
                      ]}
                    >
                      {message.text}
                    </Text>
                    <Text
                      style={[
                        styles.sentMessageTime,
                        { color: scheme.buttonText },
                      ]}
                    >
                      {formatMessageTime(message.created_at)}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View
          style={[
            styles.composer,
            {
              backgroundColor: scheme.secondaryBackground,
              borderColor: scheme.neutralColor,
            },
          ]}
        >
          <TextInput
            value={draftMessage}
            onChangeText={setDraftMessage}
            placeholder="Type a message..."
            placeholderTextColor={scheme.secondaryText}
            multiline
            style={[
              styles.messageInput,
              {
                color: scheme.text,
                backgroundColor: scheme.background,
                borderColor: scheme.neutralColor,
              },
            ]}
            returnKeyType="default"
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            onPress={sendLocalMessage}
            disabled={!draftMessage.trim()}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor: draftMessage.trim()
                  ? scheme.buttonBg
                  : scheme.neutralColor,
              },
              pressed && draftMessage.trim() && styles.pressed,
            ]}
          >
            <Ionicons name="send" size={18} color={scheme.buttonText} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const renderChatList = () => {
    if (loading) {
      return (
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
            style={[styles.placeholderText, { color: scheme.secondaryText }]}
          >
            Loading chats...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View
          style={[
            styles.placeholderBox,
            {
              backgroundColor: scheme.secondaryBackground,
              borderColor: scheme.neutralColor,
            },
          ]}
        >
          <Ionicons name="warning-outline" size={42} color={scheme.buttonBg} />
          <Text style={[styles.placeholderTitle, { color: scheme.text }]}>
            Could not load chats
          </Text>
          <Text
            style={[styles.placeholderText, { color: scheme.secondaryText }]}
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
      );
    }

    if (chats.length === 0) {
      return (
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
            style={[styles.placeholderText, { color: scheme.secondaryText }]}
          >
            No chats currently
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
      >
        {chats.map((chat) => (
          <Pressable
            key={chat.thread_id}
            accessibilityRole="button"
            accessibilityLabel={`Open chat with ${chat.friend_username}`}
            onPress={() => setSelectedChat(chat)}
            style={({ pressed }) => [
              styles.chatRow,
              {
                backgroundColor: scheme.secondaryBackground,
                borderColor: scheme.neutralColor,
              },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: scheme.buttonBg }]}>
              <Text style={[styles.avatarText, { color: scheme.buttonText }]}>
                {getInitials(chat.friend_username)}
              </Text>
            </View>

            <View style={styles.chatInfo}>
              <Text style={[styles.chatName, { color: scheme.text }]}>
                {chat.friend_username}
              </Text>
              <Text
                style={[styles.chatPreview, { color: scheme.secondaryText }]}
                numberOfLines={1}
              >
                New conversation
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={scheme.secondaryText}
            />
          </Pressable>
        ))}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={selectedChat ? () => setSelectedChat(null) : onClose}
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
          {!selectedChat ? (
            <>
              <View style={styles.headerRow}>
                <View>
                  <Text style={[styles.eyebrow, { color: scheme.buttonBg }]}>
                    MESSAGES
                  </Text>
                  <Text style={[styles.title, { color: scheme.text }]}>
                    Chats
                  </Text>
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

              {renderChatList()}
            </>
          ) : (
            renderChatRoom()
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
  chatRoomContainer: {
    flex: 1,
  },
  chatRoomHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chatRoomTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  chatRoomName: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 2,
  },
  chatRoomSubtitle: {
    fontSize: 12,
  },
  messagesPanel: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  emptyMessagesWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    gap: 10,
  },
  messagesList: {
    flexGrow: 1,
    justifyContent: "flex-end",
    padding: 12,
    gap: 10,
  },
  sentMessageRow: {
    width: "100%",
    alignItems: "flex-end",
  },
  sentMessageBubble: {
    maxWidth: "82%",
    borderRadius: 18,
    borderBottomRightRadius: 5,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  sentMessageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  sentMessageTime: {
    fontSize: 10,
    fontWeight: "700",
    opacity: 0.75,
    marginTop: 4,
    textAlign: "right",
  },
  composer: {
    borderWidth: 1,
    borderRadius: 18,
    marginTop: 12,
    padding: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  messageInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.8,
  },
});
