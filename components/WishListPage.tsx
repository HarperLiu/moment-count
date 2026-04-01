import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import {
  ArrowLeft,
  Plus,
  Star,
  Trash2,
  Gift,
  Plane,
  UtensilsCrossed,
  Target,
  Sparkles,
  MoreHorizontal,
  Check,
  Heart,
  Pencil,
  Camera,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import { api, Wish, WishCategory } from "../app/api";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";

const CATEGORIES: { key: WishCategory; icon: any }[] = [
  { key: "travel", icon: Plane },
  { key: "food", icon: UtensilsCrossed },
  { key: "gift", icon: Gift },
  { key: "experience", icon: Sparkles },
  { key: "goal", icon: Target },
  { key: "other", icon: MoreHorizontal },
];

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  travel: "wish.categoryTravel",
  food: "wish.categoryFood",
  gift: "wish.categoryGift",
  experience: "wish.categoryExperience",
  goal: "wish.categoryGoal",
  other: "wish.categoryOther",
};

function getCategoryIcon(category: string) {
  const found = CATEGORIES.find((c) => c.key === category);
  return found?.icon || MoreHorizontal;
}

interface WishListPageProps {
  onBack: () => void;
  onAddWish: () => void;
  onEditWish: (wish: Wish) => void;
  userId: string;
  linkKey: string | null;
  linkedUser: string | null;
}

export function WishListPage({
  onBack,
  onAddWish,
  onEditWish,
  userId,
  linkKey,
  linkedUser,
}: WishListPageProps) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"mine" | "partner">("mine");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [fulfillModal, setFulfillModal] = useState<Wish | null>(null);
  const [fulfillNote, setFulfillNote] = useState("");
  const [fulfillPhoto, setFulfillPhoto] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadWishes = useCallback(async () => {
    if (!linkKey) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.getWishes(linkKey, userId);
      setWishes(data);
    } catch (err) {
      console.warn("Failed to load wishes", err);
    } finally {
      setLoading(false);
    }
  }, [linkKey, userId]);

  useEffect(() => {
    loadWishes();
  }, [loadWishes]);

  const myWishes = wishes.filter((w) => w.creatorId === userId);
  const partnerWishes = wishes.filter((w) => w.creatorId !== userId);
  const displayWishes = activeTab === "mine" ? myWishes : partnerWishes;

  const filtered = filterCategory
    ? displayWishes.filter((w) => w.category === filterCategory)
    : displayWishes;

  // Sort: open first (by priority desc), then fulfilled
  const sorted = [...filtered].sort((a, b) => {
    if (a.status === "fulfilled" && b.status !== "fulfilled") return 1;
    if (a.status !== "fulfilled" && b.status === "fulfilled") return -1;
    return b.priority - a.priority;
  });

  const handleDelete = (wish: Wish) => {
    Alert.alert(t("wish.deleteConfirm"), t("wish.deleteConfirmMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteWish(wish.id, userId);
            setWishes((prev) => prev.filter((w) => w.id !== wish.id));
          } catch (err) {
            Alert.alert(t("common.error"), String(err));
          }
        },
      },
    ]);
  };

  const handleClaim = async (wish: Wish) => {
    setActionLoading(wish.id);
    try {
      const updated = await api.claimWish(wish.id, userId);
      setWishes((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    } catch (err) {
      Alert.alert(t("common.error"), String(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnclaim = async (wish: Wish) => {
    setActionLoading(wish.id);
    try {
      const updated = await api.unclaimWish(wish.id, userId);
      setWishes((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    } catch (err) {
      Alert.alert(t("common.error"), String(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handlePickFulfillPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1280 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        const base64 = manipulated.base64 ||
          await FileSystem.readAsStringAsync(manipulated.uri, { encoding: "base64" as any });
        const { url } = await api.uploadBase64Image({
          filename: `wish-fulfill-${Date.now()}.jpg`,
          base64,
          contentType: "image/jpeg",
        });
        setFulfillPhoto(url);
      } catch {
        setFulfillPhoto(asset.uri);
      }
    }
  };

  const handleFulfill = async () => {
    if (!fulfillModal) return;
    setActionLoading(fulfillModal.id);
    try {
      const updated = await api.fulfillWish(fulfillModal.id, {
        userId,
        fulfillmentNote: fulfillNote || undefined,
        fulfillmentPhoto: fulfillPhoto || undefined,
      });
      setWishes((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      setFulfillModal(null);
      setFulfillNote("");
      setFulfillPhoto(null);
    } catch (err) {
      Alert.alert(t("common.error"), String(err));
    } finally {
      setActionLoading(null);
    }
  };

  const renderPriorityStars = (priority: number) => {
    return (
      <View style={{ flexDirection: "row", gap: 2 }}>
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            size={12}
            color={i <= priority ? "#FFB800" : theme.colorBorder}
            fill={i <= priority ? "#FFB800" : "transparent"}
          />
        ))}
      </View>
    );
  };

  const renderWishCard = (wish: Wish) => {
    const isMine = wish.creatorId === userId;
    const isClaimed = wish.claimedBy === userId;
    const isFulfilled = wish.status === "fulfilled";
    const CatIcon = getCategoryIcon(wish.category);

    return (
      <View
        key={wish.id}
        style={[
          styles.card,
          {
            backgroundColor: theme.colorCard,
            borderColor: theme.colorBorder,
            opacity: isFulfilled ? 0.7 : 1,
          },
        ]}
      >
        {/* Cover image */}
        {wish.coverImage && (
          <Image
            source={{ uri: wish.coverImage }}
            style={styles.coverImage}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        )}

        <View style={styles.cardContent}>
          {/* Top row: category + priority */}
          <View style={styles.cardTopRow}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: theme.colorAccent },
              ]}
            >
              <CatIcon size={12} color={theme.colorForeground} />
              <Text
                style={[styles.categoryText, { color: theme.colorForeground }]}
              >
                {t(CATEGORY_LABEL_KEYS[wish.category] || "wish.categoryOther")}
              </Text>
            </View>
            {renderPriorityStars(wish.priority)}
          </View>

          {/* Title */}
          <Text
            style={[styles.cardTitle, { color: theme.colorForeground }]}
            numberOfLines={2}
          >
            {wish.title}
          </Text>

          {/* Note */}
          {wish.note ? (
            <Text
              style={[styles.cardNote, { color: theme.colorMutedForeground }]}
              numberOfLines={2}
            >
              {wish.note}
            </Text>
          ) : null}

          {/* Status badges */}
          {isClaimed && !isFulfilled && (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: theme.colorPrimary + "20" },
              ]}
            >
              <Heart size={12} color={theme.colorPrimary} fill={theme.colorPrimary} />
              <Text style={[styles.statusText, { color: theme.colorPrimary }]}>
                {t("wish.claimedByYou")}
              </Text>
            </View>
          )}

          {isFulfilled && (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: "#22C55E20" },
              ]}
            >
              <Check size={12} color="#22C55E" />
              <Text style={[styles.statusText, { color: "#22C55E" }]}>
                {t("wish.fulfilledBy")}
              </Text>
            </View>
          )}

          {/* Fulfillment details */}
          {isFulfilled && wish.fulfillmentNote && (
            <Text
              style={[
                styles.fulfillmentNote,
                { color: theme.colorMutedForeground },
              ]}
              numberOfLines={2}
            >
              {wish.fulfillmentNote}
            </Text>
          )}

          {/* Fulfillment photo */}
          {isFulfilled && wish.fulfillmentPhoto && (
            <Image
              source={{ uri: wish.fulfillmentPhoto }}
              style={styles.fulfillmentPhoto}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          )}

          {/* Actions */}
          <View style={styles.cardActions}>
            {isMine && !isFulfilled && (
              <>
                <TouchableOpacity
                  onPress={() => onEditWish(wish)}
                  style={[styles.actionBtn, { backgroundColor: theme.colorBackground }]}
                >
                  <Pencil size={14} color={theme.colorPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(wish)}
                  style={[styles.actionBtn, { backgroundColor: theme.colorBackground }]}
                >
                  <Trash2 size={14} color={theme.colorDestructive} />
                </TouchableOpacity>
              </>
            )}

            {!isMine && !isFulfilled && !isClaimed && (
              <TouchableOpacity
                onPress={() => handleClaim(wish)}
                disabled={actionLoading === wish.id}
                style={[
                  styles.claimBtn,
                  { backgroundColor: theme.colorPrimary },
                ]}
              >
                <Heart size={14} color="#fff" />
                <Text style={styles.claimBtnText}>{t("wish.claim")}</Text>
              </TouchableOpacity>
            )}

            {!isMine && isClaimed && !isFulfilled && (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleUnclaim(wish)}
                  disabled={actionLoading === wish.id}
                  style={[
                    styles.actionBtnOutline,
                    { borderColor: theme.colorBorder },
                  ]}
                >
                  <Text
                    style={[
                      styles.actionBtnOutlineText,
                      { color: theme.colorMutedForeground },
                    ]}
                  >
                    {t("wish.unclaim")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setFulfillModal(wish);
                    setFulfillNote("");
                    setFulfillPhoto(null);
                  }}
                  disabled={actionLoading === wish.id}
                  style={[
                    styles.claimBtn,
                    { backgroundColor: "#22C55E" },
                  ]}
                >
                  <Check size={14} color="#fff" />
                  <Text style={styles.claimBtnText}>{t("wish.fulfill")}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Creator can self-fulfill */}
            {isMine && !isFulfilled && (
              <TouchableOpacity
                onPress={() => {
                  setFulfillModal(wish);
                  setFulfillNote("");
                }}
                disabled={actionLoading === wish.id}
                style={[
                  styles.actionBtnOutline,
                  { borderColor: "#22C55E", marginLeft: 4 },
                ]}
              >
                <Check size={14} color="#22C55E" />
                <Text style={[styles.actionBtnOutlineText, { color: "#22C55E" }]}>
                  {t("wish.fulfill")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colorBackground }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colorBorder }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.colorForeground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colorForeground }]}>
          {t("wish.title")}
        </Text>
        <TouchableOpacity onPress={onAddWish} style={styles.backBtn}>
          <Plus size={22} color={theme.colorPrimary} />
        </TouchableOpacity>
      </View>

      {/* Tab Switcher: My Wishes / Partner's Wishes */}
      {linkedUser && (
        <View style={[styles.tabRow, { borderBottomColor: theme.colorBorder }]}>
          <TouchableOpacity
            onPress={() => setActiveTab("mine")}
            style={[
              styles.tab,
              activeTab === "mine" && {
                borderBottomColor: theme.colorPrimary,
                borderBottomWidth: 2,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "mine"
                      ? theme.colorPrimary
                      : theme.colorMutedForeground,
                },
              ]}
            >
              {t("wish.myWishes")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("partner")}
            style={[
              styles.tab,
              activeTab === "partner" && {
                borderBottomColor: theme.colorPrimary,
                borderBottomWidth: 2,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "partner"
                      ? theme.colorPrimary
                      : theme.colorMutedForeground,
                },
              ]}
            >
              {t("wish.partnerWishes")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Category Filter — only show when there are wishes */}
      {!loading && displayWishes.length > 0 && (
      <View style={styles.filterWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <TouchableOpacity
          onPress={() => setFilterCategory(null)}
          style={[
            styles.filterChip,
            {
              backgroundColor:
                filterCategory === null
                  ? theme.colorPrimary
                  : theme.colorCard,
              borderColor: theme.colorBorder,
            },
          ]}
        >
          <Text
            style={{
              color: filterCategory === null ? "#fff" : theme.colorForeground,
              fontSize: 13,
              fontWeight: "500",
            }}
          >
            {t("common.all")}
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map(({ key, icon: Icon }) => (
          <TouchableOpacity
            key={key}
            onPress={() =>
              setFilterCategory(filterCategory === key ? null : key)
            }
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filterCategory === key
                    ? theme.colorPrimary
                    : theme.colorCard,
                borderColor: theme.colorBorder,
              },
            ]}
          >
            <Icon
              size={13}
              color={
                filterCategory === key ? "#fff" : theme.colorForeground
              }
            />
            <Text
              style={{
                color:
                  filterCategory === key ? "#fff" : theme.colorForeground,
                fontSize: 13,
                fontWeight: "500",
                marginLeft: 4,
              }}
            >
              {t(CATEGORY_LABEL_KEYS[key])}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colorPrimary} />
        </View>
      ) : sorted.length === 0 ? (
        <View style={styles.centered}>
          <Star size={40} color={theme.colorMuted} />
          <Text
            style={[
              styles.emptyTitle,
              { color: theme.colorForeground },
            ]}
          >
            {t("wish.emptyTitle")}
          </Text>
          <Text
            style={[
              styles.emptySubtitle,
              { color: theme.colorMutedForeground },
            ]}
          >
            {t("wish.emptySubtitle")}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {sorted.map(renderWishCard)}
        </ScrollView>
      )}

      {/* Fulfill Modal */}
      <Modal
        visible={!!fulfillModal}
        transparent
        animationType="fade"
        onRequestClose={() => setFulfillModal(null)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colorCard },
            ]}
          >
            <Text
              style={[styles.modalTitle, { color: theme.colorForeground }]}
            >
              {t("wish.fulfillTitle")}
            </Text>
            {fulfillModal && (
              <Text
                style={[
                  styles.modalWishTitle,
                  { color: theme.colorMutedForeground },
                ]}
              >
                {fulfillModal.title}
              </Text>
            )}
            {/* Photo upload */}
            <TouchableOpacity
              onPress={handlePickFulfillPhoto}
              style={[
                styles.modalPhotoPicker,
                {
                  backgroundColor: theme.colorInputBackground,
                  borderColor: theme.colorBorder,
                },
              ]}
            >
              {fulfillPhoto ? (
                <Image
                  source={{ uri: fulfillPhoto }}
                  style={styles.modalPhotoPreview}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.modalPhotoPlaceholder}>
                  <Camera size={22} color={theme.colorMutedForeground} />
                  <Text style={{ color: theme.colorMutedForeground, fontSize: 12, marginTop: 4 }}>
                    {t("wish.fulfillPhotoLabel")}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              value={fulfillNote}
              onChangeText={setFulfillNote}
              placeholder={t("wish.fulfillNotePlaceholder")}
              placeholderTextColor={theme.colorMutedForeground}
              style={[
                styles.modalInput,
                {
                  backgroundColor: theme.colorInputBackground,
                  color: theme.colorForeground,
                  borderColor: theme.colorBorder,
                },
              ]}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setFulfillModal(null)}
                style={[
                  styles.modalBtn,
                  { borderColor: theme.colorBorder, borderWidth: 1 },
                ]}
              >
                <Text style={{ color: theme.colorForeground }}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleFulfill}
                disabled={actionLoading === fulfillModal?.id}
                style={[styles.modalBtn, { backgroundColor: "#22C55E" }]}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  {t("wish.fulfill")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
  },
  filterWrapper: {
    flexShrink: 0,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 6,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  coverImage: {
    width: "100%",
    height: 140,
  },
  cardContent: {
    padding: 14,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardNote: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  fulfillmentNote: {
    fontSize: 13,
    fontStyle: "italic",
    marginBottom: 8,
  },
  fulfillmentPhoto: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  claimBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  claimBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  actionBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  actionBtnOutlineText: {
    fontSize: 13,
    fontWeight: "500",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  // Fulfill Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  modalWishTitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  modalPhotoPicker: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    overflow: "hidden",
    marginBottom: 12,
  },
  modalPhotoPreview: {
    width: "100%",
    height: "100%",
  },
  modalPhotoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
});
