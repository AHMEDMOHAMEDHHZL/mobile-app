import { Platform } from "react-native";
import { api } from "./client";
import { authStorage } from "../auth/auth.storage";
import type { UserRole } from "../auth/auth.types";

export interface AppNotification {
  id: number;
  title?: string | null;
  message?: string | null;
  type?: string | null;
  status?: "read" | "unread" | string;
  created_at?: string;
}

const getNotificationsPath = async (role?: UserRole) => {
  const currentRole = role ?? (await authStorage.getUserType());
  if (currentRole === "craftsman") return "/craftsmen/notifications";
  if (currentRole === "company") return "/company/notifications";
  if (currentRole === "admin") return "/admin/notifications";
  return "/user/notifications";
};

export async function getNotifications(role?: UserRole): Promise<AppNotification[]> {
  const res = await api.get(await getNotificationsPath(role));
  const raw = res.data?.data ?? res.data ?? [];
  return Array.isArray(raw) ? raw : raw?.data ?? [];
}

export async function markNotificationRead(id: number) {
  const res = await api.post(`/notifications/${id}/mark-read`);
  return res.data;
}

export async function markAllNotificationsRead() {
  const res = await api.post("/notifications/mark-all-read");
  return res.data;
}

export async function registerMobilePushToken(token: string, role?: UserRole) {
  const res = await api.post("/mobile-push/tokens", {
    token,
    provider: "expo",
    platform: Platform.OS,
    role,
  });
  return res.data;
}

export async function unregisterMobilePushToken(token: string) {
  const res = await api.delete("/mobile-push/tokens", { data: { token } });
  return res.data;
}
