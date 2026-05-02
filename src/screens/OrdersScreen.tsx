// ─────────────────────────────────────────────────────────────────────────────
// OrdersScreen — mirrors MyOrdersPage.tsx from the web
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, Alert, Image,
} from "react-native";
import { useAuth } from "../auth/AuthContext";
import { Screen } from "../components/Screen";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";
import { LoadingState, EmptyState, ErrorState } from "../components/StateViews";
import { Button } from "../components/Button";
import {
  fetchOrdersForRole,
  updateServiceRequestStatus,
  cancelServiceRequest,
  completeServiceRequest,
  payFinalAmount,
  sendOffer,
} from "../api/orders";
import { spacing, typography, radius } from "../theme";
import { useTheme } from "../providers/ThemeProvider";

// ─── Status tabs config ───────────────────────────────────────────────────────
const ACTIVE_STATUSES = [
  "accepted", "pending_negotiation", "offer_sent",
  "awaiting_deposit", "in_progress", "awaiting_final_payment",
];

const TABS = [
  { key: "all",       label: "الكل"       },
  { key: "pending",   label: "انتظار"     },
  { key: "accepted",  label: "نشطة"       },
  { key: "completed", label: "مكتملة"     },
  { key: "rejected",  label: "ملغاة"      },
];

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({
  order,
  isCraftsman,
  onAccept,
  onReject,
  onCancel,
  onComplete,
  onPayFinal,
}: {
  order: any;
  isCraftsman: boolean;
  onAccept: () => void;
  onReject: () => void;
  onCancel: () => void;
  onComplete: () => void;
  onPayFinal: () => void;
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const serviceName  = order.service?.name || order.service_name || "خدمة صيانة";
  const requester    = order.company?.company_name || order.company?.name || order.user?.name || "العميل";
  const craftsmanN   = order.craftsman?.name || "صنايعي";
  const totalPrice   = Number(order.price || order.offer_price || 0);
  const depositAmt   = Number(order.deposit_amount || 0);
  const remaining    = Number(order.remaining_amount ?? Math.max(totalPrice - depositAmt, 0));
  const tracking     = order.tracking_number ?? order.reference_id ?? order.id;
  const canChat      = ACTIVE_STATUSES.includes(order.status);

  return (
    <SectionCard style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardService}>{serviceName}</Text>
          <Text style={styles.cardTracking}>رقم الطلب: #{tracking}</Text>
        </View>
        <StatusBadge status={order.status} />
      </View>

      {/* Warning banners */}
      {order.status === "awaiting_final_payment" && (
        <View style={styles.warningBanner}>
          <Text style={styles.bannerText}>
            💰{" "}
            {isCraftsman
              ? `العميل أكد الانتهاء. فاضل ${remaining.toFixed(2)} ج من العميل وبعدها صافيك يتحوّل لمحفظتك.`
              : `الشغل خلص! ادفع الباقي ${remaining.toFixed(2)} ج من محفظتك.`}
          </Text>
        </View>
      )}
      {order.status === "completed" && (
        <View style={styles.successBanner}>
          <Text style={styles.bannerText}>✨ الطلب اتقفل بالكامل</Text>
        </View>
      )}

      {/* Info grid */}
      <View style={styles.infoGrid}>
        <InfoRow icon="👤" label={isCraftsman ? "العميل" : "الصنايعي"} value={isCraftsman ? requester : craftsmanN} />
        <InfoRow icon="📍" label="الموقع"     value={order.province || order.governorate || order.city || "غير محدد"} />
        <InfoRow icon="⏰" label="التوقيت"    value={order.date ? `${order.date}${order.time ? " - " + order.time : ""}` : "غير محدد"} />
        {totalPrice > 0 && (
          <InfoRow icon="💵" label="السعر" value={`${totalPrice} جنيه`} />
        )}
        {order.payment_method && (
          <InfoRow icon="💳" label="طريقة الدفع" value={order.payment_method === "wallet" ? "محفظة التطبيق" : "دفع عند الزيارة"} />
        )}
      </View>

      {/* Problem description */}
      {order.problem_description ? (
        <View style={styles.descBox}>
          <Text style={styles.descLabel}>💬 وصف المشكلة</Text>
          <Text style={styles.descText}>{order.problem_description}</Text>
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        {/* Craftsman: accept / reject pending */}
        {isCraftsman && order.status === "pending" && (
          <View style={styles.actRow}>
            <Button label="قبول الطلب" onPress={onAccept} variant="success" style={{ flex: 1 }} />
            <Button label="رفض"        onPress={onReject} variant="danger"  style={{ flex: 1 }} />
          </View>
        )}

        {/* User: cancel pending */}
        {!isCraftsman && order.status === "pending" && (
          <Button label="إلغاء الطلب" onPress={onCancel} variant="outline" />
        )}

        {/* User: mark complete while in_progress */}
        {!isCraftsman && order.status === "in_progress" && (
          <Button label="الشغل خلص ✅" onPress={onComplete} variant="success" />
        )}

        {/* User: pay final amount */}
        {!isCraftsman && order.status === "awaiting_final_payment" && (
          <Button label="ادفع باقي الفلوس 💰" onPress={onPayFinal} variant="primary" />
        )}
      </View>
    </SectionCard>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoLabel}>{icon} {label}</Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export function OrdersScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const { user, userType } = useAuth();
  const isCraftsman = userType === "craftsman";

  const [orders, setOrders]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [activeTab, setTab]     = useState("all");
  const [refreshing, setRefresh] = useState(false);
  const fetchingRef = useRef(false);

  const load = useCallback(async (showSpinner = true) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    if (showSpinner) setLoading(true);
    try {
      const data = await fetchOrdersForRole(userType);
      setOrders(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "تعذر تحميل الطلبات");
    } finally {
      fetchingRef.current = false;
      if (showSpinner) setLoading(false);
      setRefresh(false);
    }
  }, [userType]);

  useEffect(() => { load(); }, [load]);

  // auto-refresh every 45 s
  useEffect(() => {
    const id = setInterval(() => load(false), 45_000);
    return () => clearInterval(id);
  }, [load]);

  const filtered = useMemo(() => {
    if (activeTab === "all")      return orders;
    if (activeTab === "accepted") return orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  const stats = useMemo(() => ({
    all:       orders.length,
    pending:   orders.filter((o) => o.status === "pending").length,
    accepted:  orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
    completed: orders.filter((o) => o.status === "completed").length,
    rejected:  orders.filter((o) => o.status === "rejected").length,
  }), [orders]);

  const handleAccept = async (id: number) => {
    try {
      await updateServiceRequestStatus(id, "accepted");
      setOrders((p) => p.map((o) => o.id === id ? { ...o, status: "accepted" } : o));
    } catch { Alert.alert("خطأ", "فشل قبول الطلب"); }
  };

  const handleReject = async (id: number) => {
    Alert.alert("تأكيد الرفض", "هل تريد رفض هذا الطلب؟", [
      { text: "لا", style: "cancel" },
      {
        text: "نعم، رفض", style: "destructive",
        onPress: async () => {
          try {
            await updateServiceRequestStatus(id, "rejected");
            setOrders((p) => p.map((o) => o.id === id ? { ...o, status: "rejected" } : o));
          } catch { Alert.alert("خطأ", "فشل رفض الطلب"); }
        },
      },
    ]);
  };

  const handleCancel = async (id: number) => {
    Alert.alert("إلغاء الطلب", "هل تريد إلغاء هذا الطلب؟", [
      { text: "لا", style: "cancel" },
      {
        text: "إلغاء الطلب", style: "destructive",
        onPress: async () => {
          try {
            await cancelServiceRequest(id);
            setOrders((p) => p.map((o) => o.id === id ? { ...o, status: "rejected" } : o));
          } catch { Alert.alert("خطأ", "فشل إلغاء الطلب"); }
        },
      },
    ]);
  };

  const handleComplete = async (id: number) => {
    try {
      const res = await completeServiceRequest(id);
      const updated = res?.data;
      if (updated?.id) {
        setOrders((p) => p.map((o) => o.id === id ? { ...o, ...updated } : o));
      }
    } catch { Alert.alert("خطأ", "فشل تأكيد اكتمال الخدمة"); }
  };

  const handlePayFinal = async (id: number) => {
    try {
      const res = await payFinalAmount(id);
      const updated = res?.data;
      if (updated?.id) {
        setOrders((p) => p.map((o) => o.id === id ? { ...o, ...updated } : o));
      }
      Alert.alert("✅ تم", "تم دفع باقي المبلغ وصافي الصنايعي اتحول تلقائيًا");
    } catch { Alert.alert("خطأ", "فشل دفع الباقي"); }
  };

  if (loading) return <LoadingState message="جاري تحميل طلباتك..." />;
  if (error)   return <ErrorState message={error} onRetry={() => load()} />;

  return (
    <Screen noPadding>
      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
        {TABS.map((t) => {
          const count = stats[t.key as keyof typeof stats];
          const active = activeTab === t.key;
          return (
            <Pressable key={t.key} style={[styles.tab, active && styles.tabActive]} onPress={() => setTab(t.key)}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t.label} {count > 0 ? `(${count})` : ""}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); load(false); }} tintColor={colors.primary} />}
      >
        {filtered.length === 0 ? (
          <EmptyState message="لا توجد طلبات في هذه الفئة" icon="📋" />
        ) : (
          filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isCraftsman={isCraftsman}
              onAccept={() => handleAccept(order.id)}
              onReject={() => handleReject(order.id)}
              onCancel={() => handleCancel(order.id)}
              onComplete={() => handleComplete(order.id)}
              onPayFinal={() => handlePayFinal(order.id)}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  tabScroll: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    flexGrow: 0,
  },
  tabRow: { flexDirection: "row", paddingHorizontal: spacing.lg, gap: spacing.sm, paddingVertical: spacing.sm },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  tabActive: { backgroundColor: colors.navyDeep, borderColor: colors.navyDeep },
  tabText: { fontFamily: typography.semiBold, fontSize: typography.small, color: colors.textMuted },
  tabTextActive: { color: colors.white },
  list: { flex: 1, backgroundColor: colors.bgSection },
  listContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { gap: spacing.md },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  cardService: { fontFamily: typography.bold, fontSize: typography.h4, color: colors.textHeading, textAlign: "right" },
  cardTracking: { fontFamily: typography.regular, fontSize: typography.tiny, color: colors.textMuted, textAlign: "right" },
  warningBanner: {
    backgroundColor: "#FFF8E1",
    borderRadius: radius.sm,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  successBanner: {
    backgroundColor: "#E8F5E9",
    borderRadius: radius.sm,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  bannerText: { fontFamily: typography.semiBold, fontSize: typography.small, color: colors.textBase, textAlign: "right", lineHeight: 20 },
  infoGrid: { gap: spacing.sm },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  infoLabel: { fontFamily: typography.semiBold, fontSize: typography.small, color: colors.textMuted },
  infoValue: { fontFamily: typography.regular, fontSize: typography.small, color: colors.textBase, textAlign: "right", flex: 1, marginLeft: spacing.sm },
  descBox: { backgroundColor: colors.bgSection, borderRadius: radius.sm, padding: spacing.md, gap: spacing.xs },
  descLabel: { fontFamily: typography.semiBold, fontSize: typography.small, color: colors.textMuted },
  descText: { fontFamily: typography.regular, fontSize: typography.small, color: colors.textBase, textAlign: "right", lineHeight: 20 },
  actions: { gap: spacing.sm },
  actRow: { flexDirection: "row", gap: spacing.sm },
});
