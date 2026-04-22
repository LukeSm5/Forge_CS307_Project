import { View } from "@/components/Themed";
import { Modal, ScrollView, StyleSheet, Text } from "react-native";

type AppModalProps = {
    visible: boolean;
    onClose?: () => void;
    title: string;
    children: React.ReactNode;
    actions: React.ReactNode;
    animationType?: "none" | "slide" | "fade"; 
    scrollStyle?: object;
}

export function AppModal({ visible, onClose, title, children, actions, scrollStyle, animationType }: AppModalProps) {
  const handleClose = () => {
    onClose?.();
  }
    return (
      <Modal visible={visible} transparent animationType={animationType} onRequestClose={handleClose}>
        <View style={styles.backdrop}>
            <View style={styles.card}>
                <Text style={styles.title}>{title}</Text>
                <ScrollView style = {scrollStyle}>{children}</ScrollView>
                <View style={styles.actions}>{actions}</View>
            </View>
        </View>
        </Modal>
    );
}
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    maxHeight: '85%',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 10,
    color: '#64748b',
  },
  modalScroll: {
    maxHeight: 420,
  },
  exerciseCard: {
    borderWidth: 1,
    borderColor: '#dbe3f0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  actions: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 10,
  },
});