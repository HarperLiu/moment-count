import {
  cacheDirectory,
  writeAsStringAsync,
  getInfoAsync,
  EncodingType,
} from "expo-file-system/legacy";
import { BASE_URL } from "../app/api";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function buildPrompt(milestoneLabel: string, language: string): string {
  if (language === "zh") {
    return `创作一张温馨可爱的插画风格情侣庆祝横幅，主题是"${milestoneLabel}"。使用柔和的粉彩色调，浪漫温馨，不包含任何文字，16:9比例，适合作为卡片头图`;
  }
  return `Create a warm, cute illustration-style celebration banner for a couple's ${milestoneLabel}. Soft pastel colors, romantic, heartwarming, no text, 16:9 aspect ratio, suitable as a card header image`;
}

export async function getCelebrationImage(
  milestoneLabel: string,
  language: string
): Promise<string | null> {
  try {
    const key = `celebration_${todayKey()}_${simpleHash(milestoneLabel)}`;
    const filePath = `${cacheDirectory}${key}.jpg`;

    // Check cache
    const info = await getInfoAsync(filePath);
    if (info.exists) {
      return filePath;
    }

    // Call server proxy
    const prompt = buildPrompt(milestoneLabel, language);
    const response = await fetch(`${BASE_URL}/generate-celebration-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      console.warn("[CelebrationImage] API error:", response.status, await response.text().catch(() => ""));
      return null;
    }

    const { data: json } = await response.json();
    const parts = json?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) {
      console.warn("[CelebrationImage] Unexpected response:", JSON.stringify(json).slice(0, 300));
      return null;
    }

    // Find the image part
    const imagePart = parts.find(
      (p: any) => p.inlineData?.data && p.inlineData?.mimeType
    );
    if (!imagePart) {
      console.warn("[CelebrationImage] No image part in response");
      return null;
    }

    const base64Data: string = imagePart.inlineData.data;

    // Write base64 data to cache file
    await writeAsStringAsync(filePath, base64Data, {
      encoding: EncodingType.Base64,
    });

    // Verify file was written
    const written = await getInfoAsync(filePath);
    console.log("[CelebrationImage] File written:", filePath, "exists:", written.exists, "size:", (written as any).size);

    return filePath;
  } catch (err) {
    console.warn("[CelebrationImage] Error:", err);
    return null;
  }
}
