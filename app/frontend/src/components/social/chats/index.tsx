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
import { api, ChatListItem, ChatMessage } from "@/core/api";

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

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getChatPreview(chat: ChatListItem) {
  if (!chat.last_message_text) return "New conversation";

  const prefix =
    chat.last_sender_id === chat.friend_id
      ? `${chat.friend_username}: `
      : "You: ";
  return `${prefix}${chat.last_message_text}`;
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
  const [messagesByThread, setMessagesByThread] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [draftMessage, setDraftMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [chatError, setChatError] = useState("");

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

  const loadMessages = useCallback(
    async (threadId: number, showSpinner = true) => {
      try {
        if (showSpinner) setMessagesLoading(true);
        setChatError("");
        const rows = await api.getChatMessages(threadId);
        const threadKey = String(threadId);
        setMessagesByThread((current) => ({
          ...current,
          [threadKey]: rows,
        }));
        requestAnimationFrame(() => {
          scrollRef.current?.scrollToEnd({ animated: true });
        });
      } catch (e) {
        console.error(e);
        if (showSpinner) setChatError("Unable to load messages right now.");
      } finally {
        if (showSpinner) setMessagesLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (visible) {
      loadChats();
    } else {
      setSelectedChat(null);
      setDraftMessage("");
      setChatError("");
    }
  }, [visible, refreshKey, loadChats]);

  useEffect(() => {
    setDraftMessage("");
    setChatError("");
  }, [selectedChat?.thread_id]);

  useEffect(() => {
    if (!visible || !selectedChat) return;

    loadMessages(selectedChat.thread_id);
    const intervalId = setInterval(() => {
      loadMessages(selectedChat.thread_id, false);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [visible, selectedChat, loadMessages]);

  const sendMessage = useCallback(async () => {
    if (!selectedChat || sending) return;

    const trimmed = draftMessage.trim();
    if (!trimmed) return;

    try {
      setSending(true);
      setChatError("");
      const savedMessage = await api.sendChatMessage(
        selectedChat.thread_id,
        trimmed,
      );
      const threadKey = String(selectedChat.thread_id);

      setMessagesByThread((current) => {
        const existingMessages = current[threadKey] ?? [];
        if (
          existingMessages.some(
            (message) => message.message_id === savedMessage.message_id,
          )
        ) {
          return current;
        }

        return {
          ...current,
          [threadKey]: [...existingMessages, savedMessage],
        };
      });

      setChats((current) => {
        const updated = current.map((chat) =>
          chat.thread_id === selectedChat.thread_id
            ? {
                ...chat,
                last_message_at: savedMessage.created_at,
                last_message_text: savedMessage.message_text,
                last_sender_id: savedMessage.sender_id,
                updated_at: savedMessage.created_at,
              }
            : chat,
        );

        return updated.sort((a, b) => {
          const aTime = new Date(
            a.last_message_at ?? a.updated_at ?? a.created_at,
          ).getTime();
          const bTime = new Date(
            b.last_message_at ?? b.updated_at ?? b.created_at,
          ).getTime();
          return bTime - aTime;
        });
      });

      setDraftMessage("");
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    } catch (e) {
      console.error(e);
      setChatError("Unable to send message right now.");
    } finally {
      setSending(false);
    }
  }, [draftMessage, selectedChat, sending]);

  const renderChatRoom = () => {
    if (!selectedChat) return null;

    const threadKey = String(selectedChat.thread_id);
    const messages = messagesByThread[threadKey] ?? [];

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
              Messages save and reload automatically
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
          {messagesLoading ? (
            <View style={styles.emptyMessagesWrap}>
              <ActivityIndicator />
              <Text
                style={[
                  styles.placeholderText,
                  { color: scheme.secondaryText },
                ]}
              >
                Loading messages...
              </Text>
            </View>
          ) : messages.length === 0 ? (
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
                Type a message below to start this chat.
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
              {messages.map((message) => {
                const isMine = message.is_mine;

                return (
                  <View
                    key={message.message_id}
                    style={
                      isMine ? styles.sentMessageRow : styles.receivedMessageRow
                    }
                  >
                    {!isMine && (
                      <Text
                        style={[
                          styles.messageSender,
                          { color: scheme.secondaryText },
                        ]}
                      >
                        {message.sender_username}
                      </Text>
                    )}
                    <View
                      style={[
                        styles.messageBubble,
                        isMine
                          ? {
                              backgroundColor: scheme.buttonBg,
                              borderBottomRightRadius: 5,
                            }
                          : {
                              backgroundColor: scheme.background,
                              borderColor: scheme.neutralColor,
                              borderWidth: 1,
                              borderBottomLeftRadius: 5,
                            },
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          { color: isMine ? scheme.buttonText : scheme.text },
                        ]}
                      >
                        {message.message_text}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          {
                            color: isMine
                              ? scheme.buttonText
                              : scheme.secondaryText,
                          },
                        ]}
                      >
                        {formatMessageTime(message.created_at)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {!!chatError && (
          <Text style={[styles.chatError, { color: scheme.buttonBg }]}>
            {chatError}
          </Text>
        )}

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
            onPress={sendMessage}
            disabled={!draftMessage.trim() || sending}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor:
                  draftMessage.trim() && !sending
                    ? scheme.buttonBg
                    : scheme.neutralColor,
              },
              pressed && draftMessage.trim() && !sending && styles.pressed,
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color={scheme.buttonText} />
            ) : (
              <Ionicons name="send" size={18} color={scheme.buttonText} />
            )}
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
                {getChatPreview(chat)}
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
  receivedMessageRow: {
    width: "100%",
    alignItems: "flex-start",
  },
  messageSender: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 3,
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: "82%",
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    fontWeight: "700",
    opacity: 0.75,
    marginTop: 4,
    textAlign: "right",
  },
  chatError: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
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
