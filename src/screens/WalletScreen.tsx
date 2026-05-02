// ─────────────────────────────────────────────────────────────────────────────
// WalletScreen — mirrors WalletPage.tsx from the web
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, Modal, TextInput, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../auth/AuthContext";
import { Screen } from "../components/Screen";
import { SectionCard } from "../components/SectionCard";
import { Button } from "../components/Button";
import { LoadingState, ErrorState } from "../components/StateViews";
import {
  getWalletOverview, getTransactions, createWallet,
  getVodafoneCashConfig, submitVodafoneCashDeposit, getMyVodafoneDeposits,
  type WalletOverview, type Transaction, type VodafoneCashConfig, type VodafoneCashDeposit,
} from "../api/wallet";
import { spacing, typography, radius } from "../theme";
import { useTheme } from "../providers/ThemeProvider";

// ─── Format helpers ───────────────────────────────────────────────────────────
function formatDate(str: string) {
  try { return new Date(str).toLocaleDateString("ar-EG", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return str; }
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const { colors, isDark } = useTheme();
  const txStyles = getTxStyles(colors, isDark);
  const isCredit = tx.type === "credit";
  return (
    <View style={txStyles.row}>
      <View style={txStyles.left}>
        <Text style={[txStyles.amount, { color: isCredit ? colors.success : colors.error }]}>
          {isCredit ? "+" : "-"}{Math.abs(tx.amount).toFixed(2)} ج
        </Text>
        <Text style={txStyles.date}>{formatDate(tx.created_at)}</Text>
      </View>
      <View style={txStyles.right}>
        <Text style={txStyles.desc} numberOfLines={1}>{tx.description}</Text>
        <View style={[txStyles.badge, isCredit ? txStyles.creditBadge : txStyles.debitBadge]}>
          <Text style={[txStyles.badgeTxt, { color: isCredit ? colors.success : colors.error }]}>
            {isCredit ? "إيداع" : "خصم"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const getTxStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  left: { alignItems: "flex-start", gap: 2 },
  right: { alignItems: "flex-end", gap: 4, flex: 1, marginRight: spacing.md },
  amount: { fontFamily: typography.bold, fontSize: typography.body },
  date: { fontFamily: typography.regular, fontSize: typography.tiny, color: colors.textMuted },
  desc: { fontFamily: typography.regular, fontSize: typography.small, color: colors.textBase, textAlign: "right" },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  creditBadge: { backgroundColor: isDark ? "rgba(76,175,80,0.16)" : "#E8F5E9" },
  debitBadge: { backgroundColor: isDark ? "rgba(244,67,54,0.16)" : "#FFEBEE" },
  badgeTxt: { fontFamily: typography.semiBold, fontSize: typography.tiny },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
export function WalletScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const { userType } = useAuth();

  const [overview, setOverview]   = useState<WalletOverview | null>(null);
  const [txs, setTxs]             = useState<Transaction[]>([]);
  const [vfConfig, setVfConfig]   = useState<VodafoneCashConfig | null>(null);
  const [deposits, setDeposits]   = useState<VodafoneCashDeposit[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [refreshing, setRefresh]  = useState(false);
  const [creating, setCreating]   = useState(false);
  const [showDeposit, setShowDep] = useState(false);
  const [depAmount, setDepAmt]    = useState("");
  const [depPhone, setDepPhone]   = useState("");
  const [depLoading, setDepLoad]  = useState(false);

  const load = async (spinner = true) => {
    if (spinner) setLoading(true);
    try {
      const [ov, txData, cfg, deps] = await Promise.all([
        getWalletOverview(userType),
        getTransactions(userType),
        getVodafoneCashConfig().catch(() => null),
        getMyVodafoneDeposits(userType).catch(() => []),
      ]);
      setOverview(ov);
      setTxs(Array.isArray(txData) ? txData : txData?.data ?? []);
      setVfConfig(cfg);
      setDeposits(deps);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "تعذر تحميل المحفظة");
    } finally { setLoading(false); setRefresh(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreateWallet = async () => {
    setCreating(true);
    try {
      await createWallet(userType);
      Alert.alert("✅ تم", "تم إنشاء المحفظة بنجاح");
      load();
    } catch { Alert.alert("خطأ", "فشل إنشاء المحفظة"); }
    finally { setCreating(false); }
  };

  const handleDepositSubmit = async () => {
    if (!depAmount || !depPhone) {
      Alert.alert("تنبيه", "يرجى إدخال المبلغ ورقم المرسل");
      return;
    }
    setDepLoad(true);
    try {
      const fd = new FormData();
      fd.append("amount", depAmount);
      fd.append("sender_number", depPhone);
      await submitVodafoneCashDeposit(fd, userType);
      Alert.alert("✅ تم", "تم إرسال طلب الإيداع، سيتم مراجعته من الإدارة");
      setShowDep(false);
      setDepAmt("");
      setDepPhone("");
      load(false);
    } catch { Alert.alert("خطأ", "فشل إرسال طلب الإيداع"); }
    finally { setDepLoad(false); }
  };

  if (loading) return <LoadingState message="جاري تحميل المحفظة..." />;

  // wallet not found
  if (error && error.toLowerCase().includes("404")) {
    return (
      <Screen>
        <View style={styles.createWallet}>
          <Text style={styles.createIcon}>💳</Text>
          <Text style={styles.createTitle}>لا توجد محفظة بعد</Text>
          <Text style={styles.createDesc}>أنشئ محفظتك الآن للاستفادة من مزايا المنصة</Text>
          <Button label="إنشاء المحفظة" onPress={handleCreateWallet} loading={creating} />
        </View>
      </Screen>
    );
  }

  if (error) return <ErrorState message={error} onRetry={() => load()} />;

  const balance   = overview?.wallet?.balance ?? 0;
  const available = overview?.summary?.available_balance ?? balance;
  const reserved  = overview?.summary?.reserved_balance ?? 0;

  return (
    <Screen noPadding>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); load(false); }} tintColor={colors.primary} />}
      >
        {/* ── Balance Card ── */}
        <LinearGradient colors={isDark ? ["#101827", "#16324a"] : [colors.navyDeep, "#1a4a6e"]} style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>الرصيد الكلي</Text>
          <Text style={styles.balanceAmount}>{Number(balance).toFixed(2)} ج</Text>
          <View style={styles.subBalRow}>
            <View style={styles.subBal}>
              <Text style={styles.subBalLabel}>متاح</Text>
              <Text style={styles.subBalAmt}>{Number(available).toFixed(2)} ج</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.subBal}>
              <Text style={styles.subBalLabel}>محجوز</Text>
              <Text style={styles.subBalAmt}>{Number(reserved).toFixed(2)} ج</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* ── Actions ── */}
          <View style={styles.actionRow}>
            <Pressable style={styles.actionBtn} onPress={() => setShowDep(true)}>
              <Text style={styles.actionIcon}>📲</Text>
              <Text style={styles.actionLabel}>إيداع فودافون</Text>
            </Pressable>
          </View>

          {/* ── Vodafone config hint ── */}
          {vfConfig && (
            <SectionCard>
              <Text style={styles.sectionTitle}>بيانات التحويل</Text>
              <View style={styles.vfRow}>
                <Text style={styles.vfLabel}>رقم فودافون كاش</Text>
                <Text style={styles.vfValue}>{vfConfig.number}</Text>
              </View>
              <View style={styles.vfRow}>
                <Text style={styles.vfLabel}>اسم المستلم</Text>
                <Text style={styles.vfValue}>{vfConfig.owner_name}</Text>
              </View>
            </SectionCard>
          )}

          {/* ── Deposit history ── */}
          {deposits.length > 0 && (
            <SectionCard>
              <Text style={styles.sectionTitle}>طلبات الإيداع</Text>
              {deposits.map((d) => (
                <View key={d.id} style={styles.depositRow}>
                  <View>
                    <Text style={styles.depositAmt}>{d.amount} ج</Text>
                    <Text style={styles.depositDate}>{formatDate(d.created_at)}</Text>
                  </View>
                  <View style={[
                    styles.depBadge,
                    d.status === "approved" && styles.depApproved,
                    d.status === "rejected" && styles.depRejected,
                  ]}>
                    <Text style={[
                      styles.depBadgeText,
                      d.status === "approved" && styles.depApprovedText,
                      d.status === "rejected" && styles.depRejectedText,
                    ]}>
                      {d.status === "approved" ? "✅ مقبول" : d.status === "rejected" ? "❌ مرفوض" : "⏳ قيد المراجعة"}
                    </Text>
                  </View>
                </View>
              ))}
            </SectionCard>
          )}

          {/* ── Transactions ── */}
          <SectionCard>
            <Text style={styles.sectionTitle}>سجل المعاملات</Text>
            {txs.length === 0 ? (
              <Text style={styles.emptyTx}>لا توجد معاملات بعد</Text>
            ) : (
              txs.slice(0, 20).map((tx) => <TransactionRow key={tx.id} tx={tx} />)
            )}
          </SectionCard>
        </View>
      </ScrollView>

      {/* ── Deposit Modal ── */}
      <Modal visible={showDeposit} animationType="slide" transparent onRequestClose={() => setShowDep(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowDep(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>إيداع عبر فودافون كاش</Text>
            {vfConfig && (
              <Text style={styles.modalHint}>
                حوّل المبلغ على الرقم {vfConfig.number} ({vfConfig.owner_name}) ثم أدخل بياناتك أدناه
              </Text>
            )}
            <TextInput
              placeholder="المبلغ بالجنيه"
              value={depAmount}
              onChangeText={setDepAmt}
              keyboardType="decimal-pad"
              style={styles.modalInput}
              textAlign="right"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              placeholder="رقم المرسل (فودافون)"
              value={depPhone}
              onChangeText={setDepPhone}
              keyboardType="phone-pad"
              style={styles.modalInput}
              textAlign="right"
              placeholderTextColor={colors.textMuted}
            />
            <Button label="إرسال طلب الإيداع" onPress={handleDepositSubmit} loading={depLoading} />
            <Button label="إلغاء" onPress={() => setShowDep(false)} variant="outline" />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  balanceCard: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    alignItems: "center",
    gap: spacing.sm,
  },
  balanceLabel: { fontFamily: typography.regular, fontSize: typography.body, color: "rgba(255,255,255,0.7)" },
  balanceAmount: { fontFamily: typography.bold, fontSize: 40, color: colors.white },
  subBalRow: { flexDirection: "row", alignItems: "center", gap: spacing.xxl, marginTop: spacing.sm },
  subBal: { alignItems: "center", gap: 2 },
  subBalLabel: { fontFamily: typography.regular, fontSize: typography.tiny, color: "rgba(255,255,255,0.6)" },
  subBalAmt: { fontFamily: typography.bold, fontSize: typography.body, color: colors.white },
  divider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.2)" },
  body: { padding: spacing.lg, gap: spacing.lg, backgroundColor: colors.bgSection },
  actionRow: { flexDirection: "row", gap: spacing.md },
  actionBtn: {
    flex: 1, backgroundColor: colors.bgApp, borderRadius: radius.card,
    padding: spacing.lg, alignItems: "center", gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 2,
    boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.28)" : "0 2px 6px rgba(11,30,51,0.06)",
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontFamily: typography.semiBold, fontSize: typography.small, color: colors.textHeading },
  sectionTitle: { fontFamily: typography.bold, fontSize: typography.h4, color: colors.textHeading, textAlign: "right", marginBottom: spacing.sm },
  vfRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs },
  vfLabel: { fontFamily: typography.regular, fontSize: typography.small, color: colors.textMuted },
  vfValue: { fontFamily: typography.bold, fontSize: typography.small, color: colors.textBase },
  depositRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  depositAmt: { fontFamily: typography.bold, fontSize: typography.body, color: colors.textBase },
  depositDate: { fontFamily: typography.regular, fontSize: typography.tiny, color: colors.textMuted },
  depBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: isDark ? "rgba(255,193,7,0.16)" : "#FFF8E1" },
  depApproved: { backgroundColor: isDark ? "rgba(76,175,80,0.16)" : "#E8F5E9" },
  depRejected: { backgroundColor: isDark ? "rgba(244,67,54,0.16)" : "#FFEBEE" },
  depBadgeText: { fontFamily: typography.semiBold, fontSize: typography.tiny, color: isDark ? colors.warning : colors.textBase },
  depApprovedText: { color: colors.success },
  depRejectedText: { color: colors.error },
  emptyTx: { fontFamily: typography.regular, fontSize: typography.small, color: colors.textMuted, textAlign: "center", paddingVertical: spacing.lg },
  createWallet: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxl, gap: spacing.lg },
  createIcon: { fontSize: 64 },
  createTitle: { fontFamily: typography.bold, fontSize: typography.h2, color: colors.textHeading, textAlign: "center" },
  createDesc: { fontFamily: typography.regular, fontSize: typography.body, color: colors.textMuted, textAlign: "center", lineHeight: 24 },
  modalOverlay: { flex: 1, backgroundColor: isDark ? "rgba(0,0,0,0.70)" : "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: colors.bgApp, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: colors.borderMedium, borderRadius: 2, alignSelf: "center", marginBottom: spacing.sm },
  modalTitle: { fontFamily: typography.bold, fontSize: typography.h3, color: colors.textHeading, textAlign: "right" },
  modalHint: { fontFamily: typography.regular, fontSize: typography.small, color: colors.textMuted, textAlign: "right", lineHeight: 20 },
  modalInput: {
    borderWidth: 1, borderColor: colors.borderMedium, borderRadius: radius.cardSm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    fontFamily: typography.regular, fontSize: typography.body, color: colors.textBase,
    backgroundColor: colors.bgSection,
  },
});
