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
      if (selectedDate) {
        setStartDate(selectedDate);
      }
    }
  };

  const handleConfirmDate = () => {
    if (!startDate) setStartDate(new Date());
    setShowDatePicker(false);
  };

  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

  const avatarSource = avatar ? { uri: avatar } : require("../assets/icon.jpg");

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colorBackground }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.colorBorder },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <ArrowLeft size={22} color={theme.colorForeground} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: theme.colorForeground }]}>
            {t("userLink.title")}
          </Text>
          <View style={styles.iconBtn} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: theme.colorCard,
              borderColor: theme.colorBorder,
            },
          ]}
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

        {/* Link Card */}
        <View
          style={[
            styles.linkCard,
            {
              backgroundColor: theme.colorCard,
              borderColor: theme.colorBorder,
            },
          ]}
        >
          <View style={styles.linkCardHeader}>
            <View
              style={[
                styles.linkIconContainer,
                { backgroundColor: theme.colorPrimary + "15" },
              ]}
            >
              <Link size={18} color={theme.colorPrimary} />
            </View>
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
                    backgroundColor: theme.colorInputBackground,
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
                    <CalendarHeart size={16} color={theme.colorPrimary} />
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
                style={[
                  styles.unlinkButton,
                  { backgroundColor: theme.colorDestructive },
                ]}
                activeOpacity={0.7}
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
                      backgroundColor: theme.colorInputBackground,
                      borderColor: theme.colorBorder,
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
                    {
                      backgroundColor: theme.colorInputBackground,
                      borderColor: theme.colorBorder,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.datePickerText,
                      { color: theme.colorForeground },
                      !startDate && { color: theme.colorMutedForeground },
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
                        {
                          backgroundColor: theme.colorCard,
                          borderColor: theme.colorBorder,
                        },
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
                          <Text
                            style={[
                              styles.datePickerConfirmText,
                              { color: theme.colorPrimary },
                            ]}
                          >
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
                  { backgroundColor: theme.colorPrimary },
                  (!linkUsername.trim() || isLoading) &&
                    styles.linkButtonDisabled,
                ]}
                activeOpacity={0.7}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  profileCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 3,
  },
  profileSlogan: {
    fontSize: 13,
  },
  linkCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  linkCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  linkIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  linkCardTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  linkDescription: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  linkedBox: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  linkedLabel: {
    fontSize: 12,
    marginBottom: 12,
  },
  partnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  partnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 15,
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
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dateInfoText: {
    fontSize: 13,
  },
  dateInfoValue: {
    fontWeight: "600",
  },
  unlinkButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  unlinkButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    fontSize: 15,
  },
  datePickerButton: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  datePickerText: {
    fontSize: 15,
  },
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
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingBottom: 20,
    width: "100%",
    maxWidth: 400,
    zIndex: 10,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  datePickerCancelText: {
    fontSize: 15,
  },
  datePickerConfirmText: {
    fontSize: 15,
    fontWeight: "600",
  },
  linkButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  linkButtonDisabled: {
    opacity: 0.5,
  },
  linkButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  footerNote: {
    paddingHorizontal: 8,
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
