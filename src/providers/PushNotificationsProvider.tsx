import { useEffect } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { useAuth } from "../auth/AuthContext";
import { registerMobilePushToken } from "../api/notifications";

type ExpoNotifications = typeof import("expo-notifications");

let notificationsModule: ExpoNotifications | null = null;

async function loadNotifications() {
  if (Platform.OS === "web") return null;
  if (notificationsModule) return notificationsModule;

  notificationsModule = await import("expo-notifications");
  notificationsModule.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  return notificationsModule;
}

async function getExpoPushToken() {
  const Notifications = await loadNotifications();
  if (!Notifications) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Sanayei",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#5FA8D3",
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId;

  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return token.data;
}

export function PushNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, userType } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (Platform.OS === "web") return;

    let cancelled = false;

    getExpoPushToken()
      .then((token) => {
        if (!token || cancelled) return;
        return registerMobilePushToken(token, userType);
      })
      .catch((error) => {
        console.log("Push registration skipped", error?.message || error);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userType]);

  return <>{children}</>;
}
