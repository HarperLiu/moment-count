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
} from "react-native";
import { ArrowLeft, Upload } from "lucide-react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { api } from "../app/api";
import { useThemeContext } from "../styles/ThemeContext";
import { useLanguageContext } from "../styles/LanguageContext";

interface EditProfilePageProps {
  onBack: () => void;
  onSave?: (data: { name: string; slogan: string; avatar?: string }) => void;
}

export function EditProfilePage({ onBack, onSave }: EditProfilePageProps) {
  const { theme } = useThemeContext();
  const { t } = useLanguageContext();
  const [name, setName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [avatar, setAvatar] = useState("");
  const [userUuid, setUserUuid] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleAvatarUpload = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(t("common.error"), t("editProfile.permissionError"));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          setIsUploading(true);
          try {
            const uploadResult = await api.uploadBase64Image({
              filename: `avatar_${Date.now()}.jpg`,
              base64: asset.base64,
              contentType: "image/jpeg",
            });
            setAvatar(uploadResult.url);
            Alert.alert(t("editProfile.successTitle"), t("editProfile.uploadSuccess"));
          } catch (error) {
            console.error("Upload failed:", error);
            Alert.alert(t("common.error"), t("editProfile.uploadFailed"));
          } finally {
            setIsUploading(false);
          }
        }
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert(t("common.error"), t("editProfile.uploadError"));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert(t("common.error"), t("editProfile.errorNoName"));
      return;
    }

    if (!userUuid) {
      Alert.alert(t("common.error"), t("editProfile.errorNoUser"));
      return;
    }

    setIsLoading(true);
    try {
      await api.upsertUser({
        uuid: userUuid,
        name: name.trim(),
        slogan: slogan.trim(),
        avatar: avatar,
      });

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const AsyncStorage = require("@react-native-async-storage/async-storage")
        .default as {
        setItem: (k: string, v: string) => Promise<void>;
      };
      const profile = {
        uuid: userUuid,
        name: name.trim(),
        slogan: slogan.trim(),
        avatar: avatar,
      };
      await AsyncStorage.setItem("user:profile", JSON.stringify(profile));

      onSave?.({ name: name.trim(), slogan: slogan.trim(), avatar });

      Alert.alert(t("editProfile.successTitle"), t("editProfile.successMessage"), [
        {
          text: t("editProfile.confirm"),
          onPress: () => onBack(),
        },
      ]);
    } catch (error: any) {
      console.error("Update profile failed:", error);
      Alert.alert(t("editProfile.errorTitle"), t("editProfile.errorMessage"));
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = name.trim();
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
            {t("editProfile.title")}
          </Text>
          <View style={styles.iconBtn} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={avatarSource}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
            {isUploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleAvatarUpload}
            style={[
              styles.uploadButton,
              {
                backgroundColor: theme.colorCard,
                borderColor: theme.colorBorder,
              },
            ]}
            activeOpacity={0.7}
            disabled={isUploading}
          >
            <Upload size={16} color={theme.colorPrimary} />
            <Text
              style={[
                styles.uploadButtonText,
                { color: theme.colorMutedForeground },
              ]}
            >
              {isUploading ? t("editProfile.uploading") : t("editProfile.changeAvatar")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Card */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: theme.colorCard,
              borderColor: theme.colorBorder,
            },
          ]}
        >
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colorMutedForeground }]}>
              {t("editProfile.name")} <Text style={{ color: theme.colorDestructive }}>*</Text>
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t("editProfile.namePlaceholder")}
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

          {/* Slogan Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colorMutedForeground }]}>
              {t("editProfile.slogan")}
            </Text>
            <TextInput
              value={slogan}
              onChangeText={setSlogan}
              placeholder={t("editProfile.sloganPlaceholder")}
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
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!isFormValid || isLoading}
          style={[
            styles.saveButton,
            { backgroundColor: theme.colorPrimary },
            (!isFormValid || isLoading) && styles.saveButtonDisabled,
          ]}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.saveButtonText}>{t("common.loading")}</Text>
            </>
          ) : (
            <Text style={styles.saveButtonText}>{t("editProfile.save")}</Text>
          )}
        </TouchableOpacity>
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
  avatarSection: {
    alignItems: "center",
    paddingVertical: 8,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
  },
  uploadButtonText: {
    fontSize: 14,
  },
  formCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
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
  saveButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
