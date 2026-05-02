import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

const fallbackApiBaseUrl = "https://sanay3i.net/api";

export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || fallbackApiBaseUrl,
  projectName: String(extra.projectName || "Sanayei"),
  designSource: String(extra.designSource || ""),
};
