import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Separator, Text, useScheme, View } from "@/components/Themed";
import CardioMachineResult from "@/components/cardioSearch/CardioMachineResult";
import { api, SearchCardioMachineResponse } from "@/core/api";
import ForgeButton from "../ForgeButton";

export default function CardioSearchInterface({
  visible,
  setVisible,
}: {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}) {
  const [results, setResults] = useState<SearchCardioMachineResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const s = useScheme();

  async function searchPrompt() {
    const res = await api.searchCardioMachine({ desc: searchTerm });
    setResults(res);
  }

  if (!visible) return <></>;

  return (
    <Modal transparent animationType="slide">
      <View style={[styles.container, { backgroundColor: s.backdrop }]}>
        <View
          style={[
            styles.popup,
            { backgroundColor: s.background ?? s.backdrop },
          ]}
        >
          <Text style={styles.title}>Cardio Machine Search</Text>
          <Separator />

          <View style={styles.searchRow}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  borderColor: "gray",
                  color: s.text,
                  backgroundColor: s.cardBg ?? s.background,
                },
              ]}
              placeholder="Search cardio machines"
              placeholderTextColor={s.text + "99"}
              maxLength={150}
              onChangeText={setSearchTerm}
              value={searchTerm}
            />
            <View style={styles.searchButtonWrap}>
              <ForgeButton text="Search" onPress={searchPrompt} />
            </View>
          </View>

          <Separator />
          <Text style={styles.sectionTitle}>Search Results</Text>
          <Separator />

          <View
            style={[
              styles.searchResults,
              { boxShadow: `inset 3px 3px 10px ${s.shadow}` },
            ]}
          >
            <ScrollView contentContainerStyle={styles.searchResultsContent}>
              {results.length > 0 ? (
                results.map(
                  (item: SearchCardioMachineResponse, idx: number) => (
                    <CardioMachineResult
                      key={idx}
                      name={item.name}
                      desc={item.desc}
                    />
                  ),
                )
              ) : (
                <Text style={styles.emptyStateText}>No search results.</Text>
              )}
            </ScrollView>
          </View>

          <View style={styles.closeButtonWrap}>
            <ForgeButton
              text="Close Cardio Machine Search"
              onPress={() => setVisible(false)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    paddingVertical: 20,
  },
  popup: {
    flex: 1,
    alignItems: "center",
    width: "94%",
    marginVertical: "2%",
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 16,
    zIndex: 100,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    width: "100%",
    flexShrink: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  searchRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginVertical: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 60,
    borderWidth: 1,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  searchButtonWrap: {
    width: 140,
  },
  searchResults: {
    width: "100%",
    flex: 1,
    minHeight: 0,
    borderRadius: 10,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  searchResultsContent: {
    paddingBottom: 8,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 20,
  },
  closeButtonWrap: {
    width: "100%",
    marginTop: 4,
  },
  questionContainer: {
    alignItems: "center",
    marginHorizontal: 50,
  },
  questionText: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
  },
});
