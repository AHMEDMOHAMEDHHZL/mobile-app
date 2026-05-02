import { Platform } from "react-native";
import * as Linking from "expo-linking";

export function getGoogleAuthRedirectUrl() {
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return Linking.createURL("");
}
