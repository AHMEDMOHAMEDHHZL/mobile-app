import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews";
import { useAuth } from "../auth/AuthContext";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "../api/notifications";
import { radius, spacing, typography } from "../theme";
import { useTheme } from "../providers/ThemeProvider";

function formatDate(value?: string) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return value;
  }
}

export function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { userType } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (spinner = true) => {
    if (spinner) setLoading(true);
    try {
      const data = await getNotifications(userType);
      setItems(data);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "تعذر تحميل الإشعارات");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userType]);

  useEffect(() => { load(); }, [load]);

  const markOne = async (id: number) => {
    try {
      await markNotificationRead(id);
      setItems((current) => current.map((n) => n.id === id ? { ...n, status: "read" } : n));
    } catch {
      Alert.alert("خطأ", "تعذر تحديث الإشعار");
    }
  };

  const markAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((current) => current.map((n) => ({ ...n, status: "read" })));
    } catch {
      Alert.alert("خطأ", "تعذر تحديث الإشعارات");
    }
  };

  if (loading) return <LoadingState message="جاري تحميل الإشعارات..." />;
  if (error) return <ErrorState message={error} onRetry={() => load()} />;

  return (
    <Screen noPadding>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={markAll}>
          <Text style={styles.headerButtonText}>قراءة الكل</Text>
        </Pressable>
        <View>
          <Text style={styles.title}>الإشعارات</Text>
          <Text style={styles.subtitle}>{items.filter((n) => n.status !== "read").length} غير مقروءة</Text>
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(false); }} tintColor={colors.primary} />}
      >
        {items.length === 0 ? (
          <EmptyState message="لا توجد إشعارات حالياً" icon="🔔" />
        ) : (
          items.map((item) => {
            const unread = item.status !== "read";
            return (
              <Pressable
                key={item.id}
                style={[styles.card, unread && styles.unreadCard]}
                onPress={() => unread && markOne(item.id)}
              >
                <View style={styles.cardTop}>
                  {unread ? <View style={styles.dot} /> : <View style={styles.dotPlaceholder} />}
                  <Text style={styles.cardTitle}>{item.title || "إشعار جديد"}</Text>
                </View>
                <Text style={styles.message}>{item.message || "لديك تحديث جديد"}</Text>
                <Text style={styles.date}>{formatDate(item.created_at)}</Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  header: {
    backgroundColor: colors.bgApp,
    borderBottomColor: colors.borderLight,
    borderBottomWidth: 1,
    padding: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontFamily: typography.bold, fontSize: typography.h3, color: colors.textHeading, textAlign: "right" },
  subtitle: { fontFamily: typography.regular, fontSize: typography.small, color: colors.textMuted, textAlign: "right" },
  headerButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerButtonText: { fontFamily: typography.bold, color: colors.white, fontSize: typography.small },
  list: { flex: 1, backgroundColor: colors.bgSection },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  unreadCard: { borderColor: colors.primary, backgroundColor: colors.slate50 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: spacing.sm },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },
  dotPlaceholder: { width: 9, height: 9 },
  cardTitle: { flex: 1, fontFamily: typography.bold, fontSize: typography.body, color: colors.textHeading, textAlign: "right" },
  message: { fontFamily: typography.regular, fontSize: typography.small, color: colors.textBase, lineHeight: 21, textAlign: "right" },
  date: { fontFamily: typography.regular, fontSize: typography.tiny, color: colors.textMuted, textAlign: "left" },
});
