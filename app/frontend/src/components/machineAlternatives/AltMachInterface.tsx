import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View as RNView,
} from "react-native";

import { Text, useScheme, View } from "@/components/Themed";
import AltMachResult from "@/components/machineAlternatives/AltMachResult";
import { api, AltMachResponse } from "@/core/api";
import ForgeButton from "@/components/ForgeButton";

export default function AltMachInterface({
  visible,
  setVisible,
  exercise,
}: {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  exercise: string;
}) {
  const [results, setResults] = useState<AltMachResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const s = useScheme();

  useEffect(() => {
    if (!visible) return;

    let mounted = true;
    setLoading(true);

    api
      .machineAlternative({ exercise })
      .then((data) => {
        if (mounted) {
          setResults(data ?? []);
        }
      })
      .catch((err) => {
        if (mounted) {
          alert(err);
          setResults([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [exercise, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
    >
      <RNView style={[styles.overlay, { backgroundColor: s.backdrop }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setVisible(false)}
        />

        <View style={styles.modalCard}>
          <Text style={styles.title}>Exercise Alternatives</Text>
          <View
            style={styles.separator}
            lightColor="#eee"
            darkColor="rgba(255,255,255,0.1)"
          />

          <ScrollView
            style={styles.resultsScroll}
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator
          >
            {loading ? (
              <Text style={styles.statusText}>Loading results...</Text>
            ) : results.length > 0 ? (
              results.map((item: AltMachResponse, idx: number) => (
                <AltMachResult
                  key={`${item.name}-${idx}`}
                  name={item.name}
                  desc={item.desc}
                />
              ))
            ) : (
              <Text style={styles.statusText}>No alternatives found.</Text>
            )}
          </ScrollView>

          <ForgeButton
            text="Close Exercise Alternatives"
            onPress={() => setVisible(false)}
            style={styles.closeButton}
          />
        </View>
      </RNView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "82%",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 14,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  separator: {
    marginTop: 14,
    marginBottom: 12,
    height: 1,
    width: "100%",
  },
  resultsScroll: {
    flexGrow: 0,
    maxHeight: "100%",
  },
  resultsContent: {
    paddingBottom: 8,
  },
  statusText: {
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 16,
  },
  closeButton: {
    marginTop: 10,
  },
});
