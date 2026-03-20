import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import { ArrowLeft, Link, X, CalendarHeart } from "lucide-react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { api } from "../app/api";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";

interface UserLinkPageProps {
  onBack: () => void;
  currentLinkedUser: string | null;
  relationshipStartDate: Date | null;
  onUpdateLink: (
    username: string | null,
    startDate?: Date | null,
    linkKey?: string | null
  ) => void;
}

export function UserLinkPage({
  onBack,
  currentLinkedUser,
  relationshipStartDate,
  onUpdateLink,
}: UserLinkPageProps) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();
  const [linkUsername, setLinkUsername] = useState(currentLinkedUser || "");
  const [startDate, setStartDate] = useState<Date | undefined>(
    relationshipStartDate || undefined
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [name, setName] = useState<string>("");
  const [slogan, setSlogan] = useState<string>("");
  const [avatar, setAvatar] = useState<string>("");
  const [userUuid, setUserUuid] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default as {
            getItem: (k: string) => Promise<string | null>;
          };
        const raw = await AsyncStorage.getItem("user:profile");
        const uuid = await AsyncStorage.getItem("user:uuid");
        if (raw) {
          const p = JSON.parse(raw);
          setName(p?.name || "");
          setSlogan(p?.slogan || "");
          setAvatar(p?.avatar || "");
        }
        if (uuid) {
          setUserUuid(uuid);
        }
      } catch {}
    })();
  }, []);

  const handleSave = async () => {
    const trimmedUsername = linkUsername.trim();
    if (!trimmedUsername) {
      Alert.alert(t("common.error"), t("userLink.errorNoUsername"));
      return;
    }

    if (!userUuid) {
      Alert.alert(t("common.error"), t("userLink.errorNoUser"));
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.linkUser({
        userUuid,
        partnerName: trimmedUsername,
        relationshipStartDate: startDate?.toISOString(),
      });

      onUpdateLink(trimmedUsername, startDate || null, result.linkKey);
      Alert.alert(t("userLink.successTitle"), t("userLink.successMessage"), [
        {
          text: t("userLink.confirm"),
          onPress: () => onBack(),
        },
      ]);
    } catch (error: any) {
      console.error("Link failed:", error);
      let errorMessage = t("userLink.errorDefault");

      if (error.message.includes("404")) {
        errorMessage = t("userLink.errorNotFound");
      } else if (error.message.includes("409")) {
        errorMessage = t("userLink.errorAlreadyLinked");
      } else if (error.message.includes("400")) {
        errorMessage = t("userLink.errorSelf");
      }

      Alert.alert(t("userLink.errorTitle"), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!userUuid) {
      Alert.alert(t("common.error"), t("userLink.errorNoUser"));
      return;
    }

    Alert.alert(t("userLink.unlinkConfirmTitle"), t("userLink.unlinkConfirmMessage"), [
      {
        text: t("userLink.unlinkCancel"),
        style: "cancel",
      },
      {
        text: t("userLink.unlinkConfirm"),
        style: "destructive",
        onPress: async () => {
          setIsLoading(true);
          try {
            await api.unlinkUser({ userUuid });

            onUpdateLink(null, null, null);
            setLinkUsername("");
            setStartDate(undefined);
            Alert.alert(t("userLink.unlinkSuccessTitle"), t("userLink.unlinkSuccessMessage"), [
              {
                text: t("userLink.confirm"),
                onPress: () => onBack(),
              },
            ]);
          } catch (error: any) {
            console.error("Unlink failed:", error);
            Alert.alert(t("userLink.unlinkErrorTitle"), t("userLink.unlinkErrorMessage"));
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event.type === "set" && selectedDate) {
        setStartDate(selectedDate);
      }
    } else {
      // iOS: 只更新临时日期，不关闭选择器
      if (selectedDate) {
        setStartDate(selectedDate);
      }
    }
  };

  const handleConfirmDate = () => {
    setShowDatePicker(false);
  };

  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

  const avatarSource = avatar ? { uri: avatar } : require("../assets/icon.png");

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colorSecondary }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Sticky Header */}
        <View
          style={[
            styles.stickyHeader,
            {
              backgroundColor: theme.colorSecondary,
              borderBottomColor: theme.colorBorder,
            },
          ]}
        >
          <View style={styles.stickyRow}>
            <View style={styles.leftGroup}>
              <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ArrowLeft size={20} color={theme.colorForeground} />
              </TouchableOpacity>
              <Text
                style={[styles.pageTitle, { color: theme.colorForeground }]}
              >
                {t("userLink.title")}
              </Text>
            </View>
          </View>
        </View>

        {/* Profile Section */}
        <View
          style={[styles.profileSection, { backgroundColor: theme.colorCard }]}
        >
          <View style={styles.profileRow}>
            <Image
              source={avatarSource}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
            <View style={styles.profileInfo}>
              <Text
                style={[styles.profileName, { color: theme.colorForeground }]}
              >
                {name || "User"}
              </Text>
              {!!slogan && (
                <Text
                  style={[
                    styles.profileSlogan,
                    { color: theme.colorMutedForeground },
                  ]}
                >
                  {slogan}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Link Section */}
        <View style={styles.linkSection}>
          <View style={[styles.linkCard, { backgroundColor: theme.colorCard }]}>
            <View style={styles.linkCardHeader}>
              <Link size={20} color="#F97316" />
              <Text
                style={[styles.linkCardTitle, { color: theme.colorForeground }]}
              >
                {t("userLink.linkWithSomeone")}
              </Text>
            </View>

            <Text
              style={[
                styles.linkDescription,
                { color: theme.colorMutedForeground },
              ]}
            >
              {t("userLink.description")}
            </Text>

            {currentLinkedUser ? (
              <View>
                <View
                  style={[
                    styles.linkedBox,
                    {
                      backgroundColor: theme.colorSecondary,
                      borderColor: theme.colorBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.linkedLabel,
                      { color: theme.colorMutedForeground },
                    ]}
                  >
                    {t("userLink.currentlyLinkedWith")}
                  </Text>
                  <View style={styles.partnerRow}>
                    <Image
                      source={avatarSource}
                      style={styles.partnerAvatar}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                    <View style={styles.partnerInfo}>
                      <Text
                        style={[
                          styles.partnerName,
                          { color: theme.colorForeground },
                        ]}
                      >
                        {currentLinkedUser}
                      </Text>
                      <Text
                        style={[
                          styles.partnerSubtitle,
                          { color: theme.colorMutedForeground },
                        ]}
                      >
                        {t("userLink.sharingMoments")}
                      </Text>
                    </View>
                  </View>
                  {relationshipStartDate && (
                    <View
                      style={[
                        styles.dateInfoRow,
                        { borderTopColor: theme.colorBorder },
                      ]}
                    >
                      <CalendarHeart size={16} color="#F97316" />
                      <Text
                        style={[
                          styles.dateInfoText,
                          { color: theme.colorMutedForeground },
                        ]}
                      >
                        {t("userLink.started")}{" "}
                        <Text
                          style={[
                            styles.dateInfoValue,
                            { color: theme.colorForeground },
                          ]}
                        >
                          {relationshipStartDate.toLocaleDateString()}
                        </Text>
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handleUnlink}
                  style={styles.unlinkButton}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.unlinkButtonText}>
                        {t("common.loading")}
                      </Text>
                    </>
                  ) : (
                    <>
                      <X size={16} color="#FFFFFF" />
                      <Text style={styles.unlinkButtonText}>{t("userLink.unlink")}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.inputGroup}>
                  <Text
                    style={[
                      styles.label,
                      { color: theme.colorMutedForeground },
                    ]}
                  >
                    {t("userLink.partnerUsername")}
                  </Text>
                  <TextInput
                    value={linkUsername}
                    onChangeText={setLinkUsername}
                    placeholder={t("userLink.usernamePlaceholder")}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colorSecondary,
                        color: theme.colorForeground,
                      },
                    ]}
                    placeholderTextColor={theme.colorMutedForeground}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text
                    style={[
                      styles.label,
                      { color: theme.colorMutedForeground },
                    ]}
                  >
                    {t("userLink.startDate")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    style={[
                      styles.datePickerButton,
                      { backgroundColor: theme.colorSecondary },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.datePickerText,
                        { color: theme.colorForeground },
                        !startDate && {
                          ...styles.datePickerPlaceholder,
                          color: theme.colorMutedForeground,
                        },
                      ]}
                    >
                      {startDate
                        ? startDate.toLocaleDateString()
                        : t("userLink.selectDate")}
                    </Text>
                    <CalendarHeart
                      size={16}
                      color={theme.colorMutedForeground}
                    />
                  </TouchableOpacity>
                </View>

                {Platform.OS === "ios" && (
                  <Modal
                    visible={showDatePicker}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={handleCancelDate}
                  >
                    <View style={styles.datePickerModal}>
                      <TouchableOpacity
                        style={styles.datePickerBackdrop}
                        activeOpacity={1}
                        onPress={handleCancelDate}
                      />
                      <View
                        style={[
                          styles.datePickerContainer,
                          { backgroundColor: theme.colorCard },
                        ]}
                      >
                        <View
                          style={[
                            styles.datePickerHeader,
                            { borderBottomColor: theme.colorBorder },
                          ]}
                        >
                          <TouchableOpacity onPress={handleCancelDate}>
                            <Text
                              style={[
                                styles.datePickerCancelText,
                                { color: theme.colorMutedForeground },
                              ]}
                            >
                              {t("userLink.cancelDate")}
                            </Text>
                          </TouchableOpacity>
                          <Text
                            style={[
                              styles.datePickerTitle,
                              { color: theme.colorForeground },
                            ]}
                          >
                            {t("userLink.selectDateTitle")}
                          </Text>
                          <TouchableOpacity onPress={handleConfirmDate}>
                            <Text style={styles.datePickerConfirmText}>
                              {t("userLink.confirmDate")}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={startDate || new Date()}
                          mode="date"
                          display="spinner"
                          onChange={handleDateChange}
                          maximumDate={new Date()}
                        />
                      </View>
                    </View>
                  </Modal>
                )}

                {showDatePicker && Platform.OS === "android" && (
                  <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}

                <TouchableOpacity
                  onPress={handleSave}
                  disabled={!linkUsername.trim() || isLoading}
                  style={[
                    styles.linkButton,
                    (!linkUsername.trim() || isLoading) &&
                      styles.linkButtonDisabled,
                  ]}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.linkButtonText}>{t("common.loading")}</Text>
                    </>
                  ) : (
                    <Text style={styles.linkButtonText}>{t("userLink.linkNow")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.footerNote}>
            <Text
              style={[styles.footerText, { color: theme.colorMutedForeground }]}
            >
              {currentLinkedUser
                ? t("userLink.footerLinked")
                : t("userLink.footerUnlinked")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  stickyHeader: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stickyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    marginLeft: 12,
    fontSize: 20,
    fontWeight: "700",
  },
  profileSection: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  profileSlogan: {
    fontSize: 12,
  },
  linkSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  linkCard: {
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  linkCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  linkCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8,
  },
  linkDescription: {
    fontSize: 12,
    marginBottom: 16,
  },
  linkedBox: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  linkedLabel: {
    fontSize: 12,
    marginBottom: 12,
  },
  partnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  partnerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  partnerSubtitle: {
    fontSize: 12,
  },
  dateInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
  },
  dateInfoText: {
    fontSize: 12,
  },
  dateInfoValue: {
    fontWeight: "600",
  },
  unlinkButton: {
    width: "100%",
    paddingVertical: 12,
    backgroundColor: "#EF4444",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  unlinkButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 14,
  },
  datePickerButton: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  datePickerText: {
    fontSize: 14,
  },
  datePickerPlaceholder: {},
  datePickerModal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  datePickerBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  datePickerContainer: {
    borderRadius: 16,
    paddingBottom: 20,
    width: "100%",
    maxWidth: 400,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  datePickerCancelText: {
    fontSize: 16,
  },
  datePickerConfirmText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F97316",
  },
  linkButton: {
    width: "100%",
    paddingVertical: 12,
    backgroundColor: "#F97316",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  linkButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  linkButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  footerNote: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
  },
});
