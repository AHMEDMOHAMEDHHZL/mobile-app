import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { LoadingState, ErrorState } from "../components/StateViews";
import {
  approveCraftsman,
  approveVodafoneDeposit,
  getAdminCompanies,
  getAdminCraftsmen,
  getAdminDashboard,
  getAdminServiceRequests,
  getAdminUsers,
  getAdminVodafoneDeposits,
  rejectCraftsman,
  rejectVodafoneDeposit,
  toggleCompanyApproval,
  toggleUserBlock,
} from "../api/admin";
import { radius, spacing, typography } from "../theme";
import { useTheme } from "../providers/ThemeProvider";

type AdminTab = "overview" | "craftsmen" | "users" | "companies" | "requests" | "deposits";

const TABS: Array<{ key: AdminTab; label: string }> = [
  { key: "overview", label: "الرئيسية" },
  { key: "craftsmen", label: "الصنايعية" },
  { key: "users", label: "المستخدمين" },
  { key: "companies", label: "الشركات" },
  { key: "requests", label: "الطلبات" },
  { key: "deposits", label: "الإيداعات" },
];

const asList = (value: any) => {
  const raw = value?.data ?? value;
  return Array.isArray(raw) ? raw : raw?.data ?? [];
};

export function AdminScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [tab, setTab] = useState<AdminTab>("overview");
  const [dashboard, setDashboard] = useState<any>({});
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (spinner = true) => {
    if (spinner) setLoading(true);
    try {
      if (tab === "overview") {
        setDashboard(await getAdminDashboard());
        setRows([]);
      }
      if (tab === "craftsmen") setRows(asList(await getAdminCraftsmen()));
      if (tab === "users") setRows(asList(await getAdminUsers()));
      if (tab === "companies") setRows(asList(await getAdminCompanies()));
      if (tab === "requests") setRows(asList(await getAdminServiceRequests()));
      if (tab === "deposits") setRows(asList(await getAdminVodafoneDeposits()));
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "تعذر تحميل بيانات الإدارة");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const runAction = async (action: () => Promise<any>, success = "تم تنفيذ العملية") => {
    try {
      await action();
      Alert.alert("تم", success);
      load(false);
    } catch (e: any) {
      Alert.alert("خطأ", e?.response?.data?.message || "فشل تنفيذ العملية");
    }
  };

  if (loading) return <LoadingState message="جاري تحميل لوحة الإدارة..." />;
  if (error) return <ErrorState message={error} onRetry={() => load()} />;

  return (
    <Screen noPadding>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
        {TABS.map((item) => (
          <Pressable key={item.key} style={[styles.tab, tab === item.key && styles.tabActive]} onPress={() => setTab(item.key)}>
            <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(false); }} tintColor={colors.primary} />}
      >
        {tab === "overview" ? (
          <View style={styles.grid}>
            {Object.entries(dashboard).slice(0, 12).map(([key, value]) => (
              <View key={key} style={styles.statCard}>
                <Text style={styles.statValue}>{typeof value === "object" ? JSON.stringify(value).slice(0, 24) : String(value ?? 0)}</Text>
                <Text style={styles.statLabel}>{key}</Text>
              </View>
            ))}
          </View>
        ) : (
          rows.map((row) => (
            <View key={row.id} style={styles.rowCard}>
              <Text style={styles.rowTitle}>{row.name || row.company_name || row.service?.name || `#${row.id}`}</Text>
              <Text style={styles.rowMeta}>{row.email || row.company_email || row.phone || row.status || row.created_at || "بيانات الإدارة"}</Text>
              <View style={styles.actions}>
                {tab === "craftsmen" && (
                  <>
                    <AdminButton label="قبول" onPress={() => runAction(() => approveCraftsman(row.id))} />
                    <AdminButton danger label="رفض" onPress={() => runAction(() => rejectCraftsman(row.id))} />
                  </>
                )}
                {tab === "users" && <AdminButton label="حظر/فك حظر" onPress={() => runAction(() => toggleUserBlock(row.id))} />}
                {tab === "companies" && <AdminButton label="اعتماد/إلغاء" onPress={() => runAction(() => toggleCompanyApproval(row.id))} />}
                {tab === "deposits" && (
                  <>
                    <AdminButton label="اعتماد" onPress={() => runAction(() => approveVodafoneDeposit(row.id))} />
                    <AdminButton danger label="رفض" onPress={() => runAction(() => rejectVodafoneDeposit(row.id))} />
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function AdminButton({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <Pressable style={[styles.actionBtn, danger && styles.dangerBtn]} onPress={onPress}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  tabs: { flexGrow: 0, backgroundColor: colors.bgApp, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  tabsContent: { flexDirection: "row", gap: spacing.sm, padding: spacing.md },
  tab: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.bgSection },
  tabActive: { backgroundColor: colors.navyDeep },
  tabText: { fontFamily: typography.semiBold, fontSize: typography.small, color: colors.textMuted },
  tabTextActive: { color: colors.white },
  body: { flex: 1, backgroundColor: colors.bgSection },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  statCard: { width: "47%", backgroundColor: colors.bgApp, borderRadius: radius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderLight },
  statValue: { fontFamily: typography.bold, fontSize: typography.h3, color: colors.textHeading, textAlign: "right" },
  statLabel: { fontFamily: typography.regular, fontSize: typography.tiny, color: colors.textMuted, textAlign: "right" },
  rowCard: { backgroundColor: colors.bgApp, borderRadius: radius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderLight, gap: spacing.sm },
  rowTitle: { fontFamily: typography.bold, fontSize: typography.body, color: colors.textHeading, textAlign: "right" },
  rowMeta: { fontFamily: typography.regular, fontSize: typography.small, color: colors.textMuted, textAlign: "right" },
  actions: { flexDirection: "row", gap: spacing.sm, justifyContent: "flex-end", flexWrap: "wrap" },
  actionBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  dangerBtn: { backgroundColor: colors.error },
  actionText: { fontFamily: typography.bold, color: colors.white, fontSize: typography.small },
});
