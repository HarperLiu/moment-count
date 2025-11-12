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

interface EditProfilePageProps {
  onBack: () => void;
  onSave?: (data: { name: string; slogan: string; avatar?: string }) => void;
}

export function EditProfilePage({ onBack, onSave }: EditProfilePageProps) {
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
      // 请求权限
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert("权限错误", "需要相册权限才能上传头像");
        return;
      }

      // 选择图片
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
            // 上传到服务器
            const uploadResult = await api.uploadBase64Image({
              filename: `avatar_${Date.now()}.jpg`,
              base64: asset.base64,
              contentType: "image/jpeg",
            });
            setAvatar(uploadResult.url);
            Alert.alert("成功", "头像上传成功");
          } catch (error) {
            console.error("Upload failed:", error);
            Alert.alert("上传失败", "头像上传失败，请重试");
          } finally {
            setIsUploading(false);
          }
        }
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("错误", "选择图片失败");
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("错误", "请输入姓名");
      return;
    }

    if (!userUuid) {
      Alert.alert("错误", "用户信息不完整，请重新登录");
      return;
    }

    setIsLoading(true);
    try {
      // 更新服务器数据
      await api.upsertUser({
        uuid: userUuid,
        name: name.trim(),
        slogan: slogan.trim(),
        avatar: avatar,
      });

      // 更新本地存储
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

      // 调用回调
      onSave?.({ name: name.trim(), slogan: slogan.trim(), avatar });

      Alert.alert("成功", "个人资料已更新", [
        {
          text: "确定",
          onPress: () => onBack(),
        },
      ]);
    } catch (error: any) {
      console.error("Update profile failed:", error);
      Alert.alert("更新失败", "更新个人资料失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = name.trim();
  const avatarSource = avatar ? { uri: avatar } : require("../assets/icon.png");

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Sticky Header */}
        <View style={styles.stickyHeader}>
          <View style={styles.stickyRow}>
            <View style={styles.leftGroup}>
              <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                <ArrowLeft size={20} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.pageTitle}>Edit Profile</Text>
            </View>
          </View>
        </View>

        {/* Form Content */}
        <View style={styles.formContent}>
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
              style={styles.uploadButton}
              activeOpacity={0.7}
              disabled={isUploading}
            >
              <Upload size={16} color="#F97316" />
              <Text style={styles.uploadButtonText}>
                {isUploading ? "Uploading..." : "Change Avatar"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              style={styles.input}
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Slogan Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Slogan</Text>
            <TextInput
              value={slogan}
              onChangeText={setSlogan}
              placeholder="What's your motto?"
              style={styles.input}
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isFormValid || isLoading}
            style={[
              styles.saveButton,
              (!isFormValid || isLoading) && styles.saveButtonDisabled,
            ]}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.saveButtonText}>Please wait...</Text>
              </>
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    paddingBottom: 20,
  },
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
    color: "#111827",
  },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
  },
  uploadButtonText: {
    fontSize: 14,
    color: "#475569",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    fontSize: 14,
    color: "#111827",
  },
  saveButton: {
    width: "100%",
    paddingVertical: 12,
    backgroundColor: "#F97316",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
