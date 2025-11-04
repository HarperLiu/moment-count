import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
} from "react-native";
import { ArrowLeft, Plus } from "lucide-react-native";

type MemoryPhoto = { url: string; alt: string };
type MemoryEntry = {
  id: number;
  headline: string;
  details: string;
  date: string;
  photos: MemoryPhoto[];
};

function HeadlineAndDetails({
  headline,
  details,
  date,
}: {
  headline: string;
  details: string;
  date: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <View style={styles.headlineRow}>
        <Text style={styles.cardTitle}>{headline}</Text>
        <Text style={styles.cardDate}>{date}</Text>
      </View>
      <Text style={styles.cardDetails}>{details}</Text>
    </View>
  );
}

function PhotoGrid({ photos }: { photos: MemoryPhoto[] }) {
  return (
    <View style={styles.grid2}>
      {photos.map((p, i) => (
        <View key={i} style={styles.gridItem}>
          <Image source={{ uri: p.url }} style={styles.gridPhoto} />
        </View>
      ))}
    </View>
  );
}

function MemoryCard({ memory }: { memory: MemoryEntry }) {
  return (
    <View style={styles.card}>
      <HeadlineAndDetails
        headline={memory.headline}
        details={memory.details}
        date={memory.date}
      />
      <PhotoGrid photos={memory.photos} />
    </View>
  );
}

export function MemoryListPage({
  onBack,
  onAddMemory,
}: {
  onBack: () => void;
  onAddMemory: () => void;
}) {
  const memories = useMemo<MemoryEntry[]>(
    () => [
      {
        id: 1,
        headline: "Romantic Evening",
        details:
          "A perfect night under the stars, filled with laughter and joy. These are the moments we cherish forever.",
        date: "Oct 28, 2024",
        photos: [
          {
            url: "https://images.unsplash.com/photo-1758874089376-f8b08abd2c3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjByb21hbnRpYyUyMG1vbWVudHxlbnwxfHx8fDE3NjE4NTI1MjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
            alt: "Romantic moment",
          },
          {
            url: "https://images.unsplash.com/photo-1726251903562-4af66fc61634?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjBiZWFjaCUyMHN1bnNldHxlbnwxfHx8fDE3NjE4NTc1MTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
            alt: "Beach sunset",
          },
          {
            url: "https://images.unsplash.com/photo-1562593326-19d00710d9bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjBoYXBweSUyMHRvZ2V0aGVyfGVufDF8fHx8MTc2MTgwNjMzMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
            alt: "Happy together",
          },
          {
            url: "https://images.unsplash.com/photo-1575390130709-7b5fee2919e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjBkaW5uZXIlMjBkYXRlfGVufDF8fHx8MTc2MTg5MTQ3NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
            alt: "Dinner date",
          },
        ],
      },
      {
        id: 2,
        headline: "Adventure Days",
        details:
          "Exploring new places together, creating memories that will last a lifetime. Every journey is special with you.",
        date: "Oct 15, 2024",
        photos: [
          {
            url: "https://images.unsplash.com/photo-1739312023925-19eca8ca00aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjB0cmF2ZWwlMjBhZHZlbnR1cmV8ZW58MXx8fHwxNzYxODQyNjQzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
            alt: "Travel adventure",
          },
          {
            url: "https://images.unsplash.com/photo-1710950284428-b58302c09b0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjBjaXR5JTIwd2Fsa2luZ3xlbnwxfHx8fDE3NjE4OTE0Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
            alt: "City walking",
          },
          {
            url: "https://images.unsplash.com/photo-1758874089376-f8b08abd2c3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjByb21hbnRpYyUyMG1vbWVudHxlbnwxfHx8fDE3NjE4NTI1MjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
            alt: "Romantic moment",
          },
          {
            url: "https://images.unsplash.com/photo-1726251903562-4af66fc61634?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjBiZWFjaCUyMHN1bnNldHxlbnwxfHx8fDE3NjE4NTc1MTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
            alt: "Beach sunset",
          },
        ],
      },
      {
        id: 3,
        headline: "Cozy Moments",
        details:
          "Sometimes the best memories are made in the simplest moments. Just being together is enough.",
        date: "Sep 30, 2024",
        photos: [
          {
            url: "https://images.unsplash.com/photo-1575390130709-7b5fee2919e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjBkaW5uZXIlMjBkYXRlfGVufDF8fHx8MTc2MTg5MTQ3NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
            alt: "Dinner date",
          },
          {
            url: "https://images.unsplash.com/photo-1562593326-19d00710d9bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjBoYXBweSUyMHRvZ2V0aGVyfGVufDF8fHx8MTc2MTgwNjMzMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
            alt: "Happy together",
          },
          {
            url: "https://images.unsplash.com/photo-1710950284428-b58302c09b0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjBjaXR5JTIwd2Fsa2luZ3xlbnwxfHx8fDE3NjE4OTE0Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
            alt: "City walking",
          },
          {
            url: "https://images.unsplash.com/photo-1739312023925-19eca8ca00aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VwbGUlMjB0cmF2ZWwlMjBhZHZlbnR1cmV8ZW58MXx8fHwxNzYxODQyNjQzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
            alt: "Travel adventure",
          },
        ],
      },
    ],
    []
  );

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView stickyHeaderIndices={[0]}>
        <View style={styles.stickyHeader}>
          <View style={styles.stickyRow}>
            <View style={styles.leftGroup}>
              <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ArrowLeft size={20} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.pageTitle}>Memory</Text>
            </View>
            <TouchableOpacity onPress={onAddMemory} style={styles.iconBtn}>
              <Plus size={20} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.feed}>
          {memories.map((m) => (
            <View key={m.id} style={{ marginBottom: 16 }}>
              <MemoryCard memory={m} />
            </View>
          ))}
          <View style={styles.endRow}>
            <View style={styles.endLine} />
            <Text style={styles.endText}>More is coming</Text>
            <View style={styles.endLine} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  stickyHeader: {
    backgroundColor: "#F8FAFC",
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  stickyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftGroup: { flexDirection: "row", alignItems: "center" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  feed: { paddingHorizontal: 20, paddingVertical: 16 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 12,
  },
  headlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  cardDate: { fontSize: 12, color: "#94A3B8" },
  cardDetails: { fontSize: 14, color: "#475569", lineHeight: 20 },

  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 12 as any },
  gridItem: { width: "48%", borderRadius: 12, overflow: "hidden" },
  gridPhoto: { width: "100%", aspectRatio: 1, backgroundColor: "#E5E7EB" },

  endRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12 as any,
    marginVertical: 12,
  },
  endLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
  },
  endText: { fontSize: 13, color: "#94A3B8" },
});
