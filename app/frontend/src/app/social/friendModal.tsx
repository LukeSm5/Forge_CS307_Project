import { View, Text } from "@/components/Themed";
import { Pressable, ActivityIndicator, Modal } from "react-native";
import { FriendModalState } from "@/components/social/socialTypes";
import { styles } from "@/components/social/socialStyles";
import { useSocialColors } from "@/components/social/useSocialColors";

type Props = {
    state: FriendModalState;
    onClose(): void;
    onConfirm(): void;
};
    export default function FriendModal({ state, onClose, onConfirm }: Props) {
        const colors = useSocialColors();
        const modalTitle = 
          state.action === "remove" ? "Remove Friend" :
          state.action === "send" ? "Send Friend Request" :
          state.action === "cancel" ? "Cancel Friend Request" :
          state.action === "accept" ? "Accept Friend Request" : "";
        
        const modalBody =
          state.profile && state.action === "remove" ? `Remove @${state.profile.username} from your friends list?` :
          state.profile && state.action === "send" ? `Send a friend request to @${state.profile.username}?` :
          state.profile && state.action === "cancel" ? `Cancel your pending request to @${state.profile.username}?` :
          state.profile && state.action === "accept" ? `Accept @${state.profile.username}'s friend request?` : "";

    return (
        <Modal
            visible={state.visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
        <View
          style={[
            styles.modalBackdrop,
            { backgroundColor: colors.modalBackdrop },
          ]}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.modalCardBg,
                borderColor: colors.border,
              },
            ]}
          >
            {state.loading || !state.action ? (
              <View style={styles.modalLoadingWrap}>
                <ActivityIndicator size="small" />
                <Text style={[styles.modalBodyText, { color: colors.muted }]}>
                  Checking friendship status...
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {modalTitle}
                </Text>
                <Text style={[styles.modalBodyText, { color: colors.muted }]}>
                  {modalBody}
                </Text>

                <View style={styles.modalButtonRow}>
                  <Pressable
                    onPress={onClose}
                    style={({ pressed }) => [
                      styles.modalButton,
                      {
                        backgroundColor: colors.modalSecondaryBg,
                        borderColor: colors.border,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalSecondaryButtonText,
                        { color: colors.text },
                      ]}
                    >
                      No
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={onConfirm}
                    style={({ pressed }) => [
                      styles.modalButton,
                      {
                        backgroundColor:
                          state.action === "remove"
                            ? colors.red
                            : colors.orange,
                        borderColor:
                          state.action === "remove"
                            ? colors.red
                            : colors.orange,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={
                        state.action === "remove"
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
    );
}