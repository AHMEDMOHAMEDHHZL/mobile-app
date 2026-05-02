import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Screen } from "../components/Screen";
import { LoadingState, ErrorState, EmptyState } from "../components/StateViews";
import {
  approveCraftsman,
  approveVodafoneDeposit,
  deleteAdminReview,
  deleteAdminServiceRequest,
  getAdminCategories,
  getAdminCompanies,
  getAdminContactMessages,
  getAdminCraftsmen,
  getAdminDashboard,
  getAdminProducts,
  getAdminReviews,
  getAdminServiceRequests,
  getAdminServices,
  getAdminSystemOverview,
  getAdminUsers,
  getAdminVodafoneDeposits,
  markContactMessageRead,
  rejectCraftsman,
  rejectVodafoneDeposit,
  toggleCompanyApproval,
  toggleCompanyBlock,
  toggleCraftsmanBlock,
  toggleProductStatus,
  toggleUserBlock,
  updateAdminServiceRequest,
} from "../api/admin";
import { radius, spacing, typography } from "../theme";
import { useTheme } from "../providers/ThemeProvider";
import { useAuth } from "../auth/AuthContext";

type AdminTab =
  | "overview"
  | "requests"
  | "craftsmen"
  | "users"
  | "companies"
  | "services"
  | "products"
  | "reviews"
  | "categories"
  | "deposits"
  | "messages"
  | "system";

const TABS: Array<{ key: AdminTab; label: string; icon: string }> = [
  { key: "overview", label: "الرئيسية", icon: "📊" },
  { key: "requests", label: "الطلبات", icon: "📋" },
  { key: "craftsmen", label: "الصنايعية", icon: "🛠️" },
  { key: "users", label: "المستخدمين", icon: "👥" },
  { key: "companies", label: "الشركات", icon: "🏢" },
  { key: "services", label: "الخدمات", icon: "🔧" },
  { key: "products", label: "المنتجات", icon: "🛒" },
  { key: "reviews", label: "التقييمات", icon: "⭐" },
  { key: "categories", label: "الأقسام", icon: "🏷️" },
  { key: "deposits", label: "الإيداعات", icon: "💳" },
  { key: "messages", label: "الرسائل", icon: "✉️" },
  { key: "system", label: "النظام", icon: "🧭" },
];

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "معتمد",
  accepted: "مقبول",
  pending_negotiation: "بانتظار تفاوض",
  offer_sent: "تم إرسال العرض",
  awaiting_deposit: "بانتظار العربون",
  in_progress: "قيد التنفيذ",
  awaiting_final_payment: "بانتظار الباقي",
  completed: "مكتمل",
  rejected: "مرفوض",
  blocked: "محظور",
  active: "نشط",
  inactive: "غير نشط",
};

const STAT_LABELS: Record<string, string> = {
  total_users: "المستخدمين",
  total_craftsmen: "الصنايعية",
  total_companies: "الشركات",
  total_requests: "طلبات الخدمة",
  pending_craftsmen: "صنايعية بانتظار الاعتماد",
  total_products: "المنتجات",
  total_reviews: "التقييمات",
  admin_wallet_balance: "رصيد الإدارة",
  direct_request_deposits_total: "إجمالي العربون",
  pending_withdrawals: "سحوبات معلقة",
};

const asList = (value: any) => {
  const raw = value?.data ?? value;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
};

const safeText = (...values: any[]) =>
  values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") ?? "";

export function AdminScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [dashboard, setDashboard] = useState<any>({});
  const [rows, setRows] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = user?.name || "المدير";

  const load = useCallback(async (spinner = true) => {
    if (spinner) setLoading(true);
    try {
      if (tab === "overview") {
        setDashboard(await getAdminDashboard());
        setRows([]);
      } else if (tab === "craftsmen") {
        setRows(asList(await getAdminCraftsmen({ per_page: 30 })));
      } else if (tab === "users") {
        setRows(asList(await getAdminUsers({ per_page: 30 })));
      } else if (tab === "companies") {
        setRows(asList(await getAdminCompanies({ per_page: 30 })));
      } else if (tab === "requests") {
        setRows(asList(await getAdminServiceRequests({ per_page: 30 })));
      } else if (tab === "deposits") {
        setRows(asList(await getAdminVodafoneDeposits({ per_page: 30 })));
      } else if (tab === "services") {
        setRows(asList(await getAdminServices({ per_page: 40 })));
      } else if (tab === "products") {
        setRows(asList(await getAdminProducts({ per_page: 30 })));
      } else if (tab === "reviews") {
        setRows(asList(await getAdminReviews({ per_page: 30 })));
      } else if (tab === "categories") {
        setRows(asList(await getAdminCategories({ per_page: 40 })));
      } else if (tab === "messages") {
        setRows(asList(await getAdminContactMessages({ per_page: 30 })));
      } else if (tab === "system") {
        setDashboard(await getAdminSystemOverview());
        setRows([]);
      }
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "تعذر تحميل بيانات الإدارة");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const stats = dashboard?.stats ?? dashboard?.data?.stats ?? dashboard ?? {};
  const filteredRows = useMemo(() => {
    if (!query.trim()) return rows;
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(needle));
  }, [query, rows]);

  const runAction = async (action: () => Promise<any>, success = "تم تنفيذ العملية") => {
    try {
      await action();
      Alert.alert("تم", success);
      load(false);
    } catch (e: any) {
      Alert.alert("خطأ", e?.response?.data?.message || e?.message || "فشل تنفيذ العملية");
    }
  };

  if (loading) return <LoadingState message="جاري تحميل لوحة الإدارة..." />;
  if (error) return <ErrorState message={error} onRetry={() => load()} />;

  return (
    <Screen noPadding>
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>لوحة الإدارة</Text>
        <Text style={styles.heroTitle}>أهلاً، {displayName}</Text>
        <Text style={styles.heroText}>إدارة المستخدمين والطلبات والخدمات من تطبيق الموبايل بنفس روح لوحة الويب.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
        {TABS.map((item) => (
          <Pressable key={item.key} style={[styles.tab, tab === item.key && styles.tabActive]} onPress={() => { setTab(item.key); setQuery(""); }}>
            <Text style={styles.tabIcon}>{item.icon}</Text>
            <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(false); }} tintColor={colors.primary} />}
      >
        {tab === "overview" || tab === "system" ? (
          <AdminOverview stats={stats} dashboard={dashboard} tab={tab} />
        ) : (
          <>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="ابحث داخل القسم..."
              placeholderTextColor={colors.textMuted}
              style={styles.search}
              textAlign="right"
            />
            <Text style={styles.count}>{filteredRows.length} عنصر</Text>
            {filteredRows.length === 0 ? (
              <EmptyState message="لا توجد بيانات في هذا القسم" icon="📭" />
            ) : (
              filteredRows.map((row, index) => (
                <AdminRowCard
                  key={`${tab}-${row.id ?? index}`}
                  tab={tab}
                  row={row}
                  onAction={runAction}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function AdminOverview({ stats, dashboard, tab }: { stats: any; dashboard: any; tab: AdminTab }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const entries = Object.entries(stats || {}).filter(([, value]) => typeof value !== "object").slice(0, 12);
  const recentUsers = asList(dashboard?.recent_users);
  const recentCraftsmen = asList(dashboard?.recent_craftsmen);

  return (
    <>
      <View style={styles.grid}>
        {entries.map(([key, value]) => (
          <View key={key} style={styles.statCard}>
            <Text style={styles.statValue}>{String(value ?? 0)}</Text>
            <Text style={styles.statLabel}>{STAT_LABELS[key] ?? key}</Text>
          </View>
        ))}
      </View>

      {tab === "overview" && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>آخر النشاطات</Text>
          {[...recentUsers, ...recentCraftsmen].slice(0, 8).map((item: any, index: number) => (
            <View key={`${item.id}-${index}`} style={styles.miniRow}>
              <Text style={styles.miniTitle}>{safeText(item.name, item.company_name, `#${item.id}`)}</Text>
              <Text style={styles.miniMeta}>{safeText(item.email, item.phone, item.status, item.created_at)}</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

function AdminRowCard({
  tab,
  row,
  onAction,
}: {
  tab: AdminTab;
  row: any;
  onAction: (action: () => Promise<any>, success?: string) => void;
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const title = getRowTitle(tab, row);
  const meta = getRowMeta(tab, row);
  const status = getRowStatus(row);

  return (
    <View style={styles.rowCard}>
      <View style={styles.rowHead}>
        {status ? <StatusPill status={status} /> : null}
        <View style={styles.rowTitleBlock}>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowMeta}>{meta}</Text>
        </View>
      </View>

      <View style={styles.detailGrid}>
        {getRowDetails(tab, row).map((detail) => (
          <View key={detail.label} style={styles.detailItem}>
            <Text style={styles.detailLabel}>{detail.label}</Text>
            <Text style={styles.detailValue}>{detail.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        {tab === "craftsmen" && (
          <>
            <AdminButton label="قبول" onPress={() => onAction(() => approveCraftsman(row.id), "تم اعتماد الصنايعي")} />
            <AdminButton danger label="رفض" onPress={() => onAction(() => rejectCraftsman(row.id), "تم رفض الصنايعي")} />
            <AdminButton muted label="حظر/فك" onPress={() => onAction(() => toggleCraftsmanBlock(row.id), "تم تحديث حالة الصنايعي")} />
          </>
        )}
        {tab === "users" && <AdminButton label="حظر/فك حظر" onPress={() => onAction(() => toggleUserBlock(row.id), "تم تحديث حالة المستخدم")} />}
        {tab === "companies" && (
          <>
            <AdminButton label="اعتماد/إلغاء" onPress={() => onAction(() => toggleCompanyApproval(row.id), "تم تحديث اعتماد الشركة")} />
            <AdminButton muted label="حظر/فك" onPress={() => onAction(() => toggleCompanyBlock(row.id), "تم تحديث حالة الشركة")} />
          </>
        )}
        {tab === "requests" && (
          <>
            <AdminButton label="قيد التنفيذ" onPress={() => onAction(() => updateAdminServiceRequest(row.id, { status: "in_progress" }), "تم تحديث الطلب")} />
            <AdminButton label="مكتمل" onPress={() => onAction(() => updateAdminServiceRequest(row.id, { status: "completed" }), "تم إكمال الطلب")} />
            <AdminButton danger label="حذف" onPress={() => onAction(() => deleteAdminServiceRequest(row.id), "تم حذف الطلب")} />
          </>
        )}
        {tab === "products" && <AdminButton label="تفعيل/إيقاف" onPress={() => onAction(() => toggleProductStatus(row.id), "تم تحديث المنتج")} />}
        {tab === "reviews" && <AdminButton danger label="حذف" onPress={() => onAction(() => deleteAdminReview(row.id), "تم حذف التقييم")} />}
        {tab === "deposits" && (
          <>
            <AdminButton label="اعتماد" onPress={() => onAction(() => approveVodafoneDeposit(row.id), "تم اعتماد الإيداع")} />
            <AdminButton danger label="رفض" onPress={() => onAction(() => rejectVodafoneDeposit(row.id), "تم رفض الإيداع")} />
          </>
        )}
        {tab === "messages" && <AdminButton label="تعليم كمقروء" onPress={() => onAction(() => markContactMessageRead(row.id), "تم تعليم الرسالة كمقروءة")} />}
      </View>
    </View>
  );
}

function AdminButton({ label, onPress, danger, muted }: { label: string; onPress: () => void; danger?: boolean; muted?: boolean }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <Pressable style={[styles.actionBtn, danger && styles.dangerBtn, muted && styles.mutedBtn]} onPress={onPress}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function StatusPill({ status }: { status: string }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const isBad = ["rejected", "blocked", "inactive"].includes(status);
  const isGood = ["approved", "accepted", "completed", "active"].includes(status);
  return (
    <View style={[styles.statusPill, isBad && styles.statusBad, isGood && styles.statusGood]}>
      <Text style={[styles.statusText, isBad && styles.statusBadText, isGood && styles.statusGoodText]}>
        {STATUS_LABELS[status] ?? status}
      </Text>
    </View>
  );
}

function getRowTitle(tab: AdminTab, row: any) {
  if (tab === "requests") return safeText(row.name, row.user?.name, `طلب #${row.id}`);
  if (tab === "companies") return safeText(row.company_name, row.name, `شركة #${row.id}`);
  if (tab === "products") return safeText(row.name, row.title, `منتج #${row.id}`);
  if (tab === "reviews") return safeText(row.user?.name, row.name, `تقييم #${row.id}`);
  if (tab === "messages") return safeText(row.name, row.email, `رسالة #${row.id}`);
  return safeText(row.name, row.title, row.email, `#${row.id}`);
}

function getRowMeta(tab: AdminTab, row: any) {
  if (tab === "requests") return `${safeText(row.service?.name, "خدمة")} • ${safeText(row.phone, row.email, "بدون تواصل")}`;
  if (tab === "services") return safeText(row.description, "خدمة متاحة على المنصة");
  if (tab === "products") return safeText(row.category?.name, row.department?.name, row.status, "منتج متجر");
  if (tab === "reviews") return safeText(row.comment, row.review, "تقييم مستخدم");
  if (tab === "messages") return safeText(row.subject, row.message, "رسالة تواصل");
  return safeText(row.email, row.company_email, row.phone, row.status, row.created_at, "بيانات الإدارة");
}

function getRowStatus(row: any) {
  if (row.status) return String(row.status);
  if (typeof row.is_active === "boolean") return row.is_active ? "active" : "inactive";
  if (typeof row.approved === "boolean") return row.approved ? "approved" : "pending";
  return "";
}

function getRowDetails(tab: AdminTab, row: any) {
  if (tab === "requests") {
    return [
      { label: "الصنايعي", value: safeText(row.craftsman?.name, "غير محدد") },
      { label: "الموقع", value: safeText(row.province, row.address, "غير محدد") },
      { label: "الموعد", value: `${safeText(row.date, "-")} ${safeText(row.time, "")}` },
      { label: "الدفع", value: safeText(row.payment_method, "غير محدد") },
    ];
  }

  if (tab === "deposits") {
    return [
      { label: "المبلغ", value: `${safeText(row.amount, 0)} ج` },
      { label: "رقم التحويل", value: safeText(row.sender_phone, row.phone, "-") },
      { label: "التاريخ", value: safeText(row.created_at, "-") },
    ];
  }

  if (tab === "products") {
    return [
      { label: "السعر", value: `${safeText(row.price, 0)} ج` },
      { label: "المخزون", value: safeText(row.stock, row.quantity, "-") },
      { label: "الشركة", value: safeText(row.company?.company_name, row.company?.name, "-") },
    ];
  }

  if (tab === "reviews") {
    return [
      { label: "التقييم", value: safeText(row.rating, row.stars, "-") },
      { label: "الخدمة", value: safeText(row.service?.name, "-") },
      { label: "التاريخ", value: safeText(row.created_at, "-") },
    ];
  }

  return [
    { label: "الهاتف", value: safeText(row.phone, row.company_phone, "-") },
    { label: "البريد", value: safeText(row.email, row.company_email, "-") },
    { label: "تاريخ الإضافة", value: safeText(row.created_at, "-") },
  ];
}

const getStyles = (colors: any) => StyleSheet.create({
  hero: {
    backgroundColor: colors.navyDeep,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xs,
  },
  heroKicker: { fontFamily: typography.semiBold, fontSize: typography.small, color: colors.primary, textAlign: "right" },
  heroTitle: { fontFamily: typography.bold, fontSize: 24, color: colors.white, textAlign: "right" },
  heroText: { fontFamily: typography.regular, fontSize: typography.body, color: "rgba(255,255,255,0.72)", textAlign: "right", lineHeight: 22 },
  tabs: { flexGrow: 0, backgroundColor: colors.bgApp, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  tabsContent: { flexDirection: "row-reverse", gap: spacing.sm, padding: spacing.md },
  tab: { flexDirection: "row-reverse", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.bgSection },
  tabActive: { backgroundColor: colors.navyDeep },
  tabIcon: { fontSize: 14 },
  tabText: { fontFamily: typography.semiBold, fontSize: typography.small, color: colors.textMuted },
  tabTextActive: { color: colors.white },
  body: { flex: 1, backgroundColor: colors.bgSection },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  search: { backgroundColor: colors.bgApp, borderRadius: radius.full, borderWidth: 1, borderColor: colors.borderLight, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, fontFamily: typography.regular, fontSize: typography.body, color: colors.textBase },
  count: { fontFamily: typography.semiBold, color: colors.textMuted, textAlign: "right", fontSize: typography.small },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  statCard: { width: "47%", backgroundColor: colors.bgApp, borderRadius: radius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderLight, boxShadow: "0 2px 10px rgba(11,30,51,0.06)" },
  statValue: { fontFamily: typography.bold, fontSize: 22, color: colors.textHeading, textAlign: "right" },
  statLabel: { fontFamily: typography.regular, fontSize: typography.small, color: colors.textMuted, textAlign: "right", lineHeight: 18 },
  panel: { backgroundColor: colors.bgApp, borderRadius: radius.card, padding: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: colors.borderLight },
  panelTitle: { fontFamily: typography.bold, fontSize: typography.h4, color: colors.textHeading, textAlign: "right" },
  miniRow: { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: spacing.sm, gap: 2 },
  miniTitle: { fontFamily: typography.semiBold, fontSize: typography.body, color: colors.textHeading, textAlign: "right" },
  miniMeta: { fontFamily: typography.regular, fontSize: typography.small, color: colors.textMuted, textAlign: "right" },
  rowCard: { backgroundColor: colors.bgApp, borderRadius: radius.card, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderLight, gap: spacing.md, boxShadow: "0 2px 10px rgba(11,30,51,0.06)" },
  rowHead: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  rowTitleBlock: { flex: 1, alignItems: "flex-end", gap: 3 },
  rowTitle: { fontFamily: typography.bold, fontSize: typography.body, color: colors.textHeading, textAlign: "right" },
  rowMeta: { fontFamily: typography.regular, fontSize: typography.small, color: colors.textMuted, textAlign: "right", lineHeight: 19 },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  detailItem: { width: "47%", backgroundColor: colors.bgSection, borderRadius: radius.cardSm, padding: spacing.sm, alignItems: "flex-end" },
  detailLabel: { fontFamily: typography.regular, fontSize: typography.tiny, color: colors.textMuted },
  detailValue: { fontFamily: typography.semiBold, fontSize: typography.small, color: colors.textHeading, textAlign: "right" },
  actions: { flexDirection: "row-reverse", gap: spacing.sm, justifyContent: "flex-start", flexWrap: "wrap" },
  actionBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  dangerBtn: { backgroundColor: colors.error },
  mutedBtn: { backgroundColor: colors.navyDeep },
  actionText: { fontFamily: typography.bold, color: colors.white, fontSize: typography.small },
  statusPill: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: "#FFF8E1", borderWidth: 1, borderColor: "#FACC15" },
  statusText: { fontFamily: typography.bold, fontSize: typography.tiny, color: "#A16207" },
  statusGood: { backgroundColor: "#E8F5E9", borderColor: "#81C784" },
  statusGoodText: { color: colors.success },
  statusBad: { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" },
  statusBadText: { color: colors.error },
});
