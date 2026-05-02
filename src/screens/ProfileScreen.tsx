// ─────────────────────────────────────────────────────────────────────────────
// ProfileScreen — User profile and settings
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, Platform, Image, Modal, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useAuth } from "../auth/AuthContext";
import { Screen } from "../components/Screen";
import { SectionCard } from "../components/SectionCard";
import { Button } from "../components/Button";
import { InputField } from "../components/InputField";
import { spacing, typography, radius } from "../theme";
import { useTheme } from "../providers/ThemeProvider";
import type { MainTabParamList } from "../navigation/MainTabNavigator";
import { firstMediaUrl } from "../utils/media";

type ProfilePanel = "edit" | "password" | "language" | "support" | "terms" | null;

export function ProfileScreen() {
  const { colors, isDark, setTheme } = useTheme();
  const styles = getStyles(colors);
  const { user, userType, logout, updateUser } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [panel, setPanel] = useState<ProfilePanel>(null);
  const [draftName, setDraftName] = useState(user?.name || user?.company_name || "");
  const [draftEmail, setDraftEmail] = useState(user?.email || "");
  const [draftOldPassword, setDraftOldPassword] = useState("");
  const [draftNewPassword, setDraftNewPassword] = useState("");
  const [draftConfirmPassword, setDraftConfirmPassword] = useState("");

  const doLogout = async () => {
    await logout();
  };

  const handleLogout = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm("هل أنت متأكد من رغبتك في تسجيل الخروج؟")) {
        void doLogout();
      }
      return;
    }

    Alert.alert("تسجيل الخروج", "هل أنت متأكد من رغبتك في تسجيل الخروج؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "تسجيل الخروج", style: "destructive", onPress: () => void doLogout() },
    ]);
  };

  const displayName = user?.name || user?.company_name || "مستخدم";
  const displayEmail = user?.email || "لا يوجد بريد إلكتروني";
  const avatarUrl = firstMediaUrl(
    user?.profile_photo_url,
    user?.profile_photo,
    user?.profile_image,
    user?.company_logo_url,
    user?.company_logo
  );

  const roleLabel = {
    user: "حساب شخصي",
    craftsman: "حساب صنايعي",
    company: "حساب شركة",
    admin: "مدير النظام",
  }[userType || "user"];

  const openPanel = (nextPanel: ProfilePanel) => {
    if (nextPanel === "edit") {
      setDraftName(user?.name || user?.company_name || "");
      setDraftEmail(user?.email || "");
    }
    setPanel(nextPanel);
  };

  const saveLocalProfile = async () => {
    if (!user) return;
    if (!draftName.trim()) {
      Alert.alert("تنبيه", "اكتب الاسم");
      return;
    }

    await updateUser({
      ...user,
      name: draftName.trim(),
      email: draftEmail.trim(),
      company_name: user.company_name ? draftName.trim() : user.company_name,
    });
    setPanel(null);
    Alert.alert("تم", "تم تحديث البيانات داخل التطبيق");
  };

  const handlePasswordFeedback = () => {
    if (!draftOldPassword || !draftNewPassword || !draftConfirmPassword) {
      Alert.alert("تنبيه", "اكتب كلمة المرور الحالية والجديدة");
      return;
    }
    if (draftNewPassword.length < 6) {
      Alert.alert("تنبيه", "كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف");
      return;
    }
    if (draftNewPassword !== draftConfirmPassword) {
      Alert.alert("تنبيه", "تأكيد كلمة المرور غير مطابق");
      return;
    }
    setDraftOldPassword("");
    setDraftNewPassword("");
    setDraftConfirmPassword("");
    setPanel(null);
    Alert.alert("تنبيه", "تغيير كلمة المرور يحتاج ربط API. واجهة الموبايل جاهزة.");
  };

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
          )}
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{displayEmail}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{roleLabel}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <SectionCard style={styles.card}>
          <ProfileOption icon="👤" label="تعديل البيانات الشخصية" onPress={() => openPanel("edit")} />
          <View style={styles.divider} />
          <ProfileOption icon="🔔" label="الإشعارات" onPress={() => navigation.navigate("Notifications")} />
          <View style={styles.divider} />
          <ProfileOption icon="🔒" label="تغيير كلمة المرور" onPress={() => openPanel("password")} />
          <View style={styles.divider} />
          <ProfileOption icon="🌐" label="اللغة (العربية)" onPress={() => openPanel("language")} />
        </SectionCard>

        <SectionCard style={styles.card}>
          <ProfileOption icon="📞" label="تواصل معنا" onPress={() => navigation.navigate("Messages")} />
          <View style={styles.divider} />
          <ProfileOption icon="❓" label="المساعدة والدعم" onPress={() => openPanel("support")} />
          <View style={styles.divider} />
          <ProfileOption icon="📄" label="الشروط والأحكام" onPress={() => openPanel("terms")} />
          <View style={styles.divider} />
          <ProfileOption 
            icon={isDark ? "☀️" : "🌙"} 
            label={isDark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"} 
            onPress={() => setTheme(isDark ? "light" : "dark")} 
          />
          <View style={styles.divider} />
          <ProfileOption icon="📱" label="اتباع ثيم الجهاز" onPress={() => setTheme("system")} />
        </SectionCard>

        <Button
          label="تسجيل الخروج"
          onPress={handleLogout}
          variant="danger"
          style={styles.logoutBtn}
        />
      </View>

      <ProfileModal title={panelTitle(panel)} visible={!!panel} onClose={() => setPanel(null)}>
        {panel === "edit" ? (
          <View style={styles.modalForm}>
            <InputField label="الاسم" value={draftName} onChangeText={setDraftName} />
            <InputField label="البريد الإلكتروني" value={draftEmail} onChangeText={setDraftEmail} keyboardType="email-address" />
            <Button label="حفظ البيانات" onPress={saveLocalProfile} />
          </View>
        ) : null}

        {panel === "password" ? (
          <View style={styles.modalForm}>
            <InputField label="كلمة المرور الحالية" value={draftOldPassword} onChangeText={setDraftOldPassword} secureTextEntry />
            <InputField label="كلمة المرور الجديدة" value={draftNewPassword} onChangeText={setDraftNewPassword} secureTextEntry />
            <InputField label="تأكيد كلمة المرور" value={draftConfirmPassword} onChangeText={setDraftConfirmPassword} secureTextEntry />
            <Button label="متابعة" onPress={handlePasswordFeedback} />
          </View>
        ) : null}

        {panel === "language" ? (
          <View style={styles.modalForm}>
            <View style={styles.choiceActive}>
              <Text style={styles.choiceText}>العربية</Text>
              <Text style={styles.choiceMark}>مفعلة</Text>
            </View>
            <Text style={styles.modalText}>الواجهة الحالية عربية. إضافة لغات أخرى تحتاج ملفات ترجمة داخل التطبيق.</Text>
          </View>
        ) : null}

        {panel === "support" ? (
          <View style={styles.modalForm}>
            <Text style={styles.modalText}>للمساعدة السريعة افتح الشات من "تواصل معنا".</Text>
            <Text style={styles.modalText}>راجع طلباتك من تبويب طلباتي، والإشعارات من تبويب الإشعارات.</Text>
            <Button label="فتح الشات" onPress={() => { setPanel(null); navigation.navigate("Messages"); }} />
          </View>
        ) : null}

        {panel === "terms" ? (
          <View style={styles.modalForm}>
            <Text style={styles.modalText}>باستخدام التطبيق توافق على تقديم بيانات صحيحة، واحترام مواعيد الطلبات، وعدم مشاركة بيانات دفع أو معلومات حساسة خارج القنوات الرسمية.</Text>
            <Text style={styles.modalText}>قد تختلف الأسعار والمدة حسب اتفاق العميل والصنايعي وحالة الطلب.</Text>
          </View>
        ) : null}
      </ProfileModal>
    </Screen>
  );
}

function panelTitle(panel: ProfilePanel) {
  if (panel === "edit") return "تعديل البيانات الشخصية";
  if (panel === "password") return "تغيير كلمة المرور";
  if (panel === "language") return "اللغة";
  if (panel === "support") return "المساعدة والدعم";
  if (panel === "terms") return "الشروط والأحكام";
  return "";
}

function ProfileModal({ title, visible, onClose, children }: { title: string; visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
            <Text style={styles.modalTitle}>{title}</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ProfileOption({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <Pressable style={({ pressed }) => [styles.option, pressed && styles.pressed]} onPress={onPress}>
      <Text style={styles.optionArrow}>{"<"}</Text>
      <View style={styles.optionContent}>
        <Text style={styles.optionLabel}>{label}</Text>
        <Text style={styles.optionIcon}>{icon}</Text>
      </View>
    </Pressable>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  header: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    backgroundColor: colors.bgApp,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatarImage: { width: "100%", height: "100%" },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  avatarText: { color: colors.white, fontFamily: typography.bold, fontSize: 36 },
  name: { fontFamily: typography.bold, fontSize: typography.h3, color: colors.textHeading },
  email: { fontFamily: typography.regular, fontSize: typography.body, color: colors.textMuted, marginTop: 4 },
  roleBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.bgSection,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  roleText: { fontFamily: typography.semiBold, fontSize: typography.small, color: colors.primary },
  body: { padding: spacing.lg, gap: spacing.lg },
  card: { padding: 0, overflow: "hidden" },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    backgroundColor: colors.bgApp,
  },
  optionContent: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  optionIcon: { fontSize: 20 },
  optionLabel: { fontFamily: typography.semiBold, fontSize: typography.body, color: colors.textHeading },
  optionArrow: { fontFamily: typography.regular, fontSize: typography.body, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.borderLight, marginLeft: spacing.xl },
  pressed: { backgroundColor: colors.bgSection },
  logoutBtn: { marginTop: spacing.md },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    maxHeight: "86%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: { flex: 1, fontFamily: typography.bold, color: colors.textHeading, fontSize: typography.h4, textAlign: "right" },
  closeButton: { width: 36, height: 36, borderRadius: radius.full, alignItems: "center", justifyContent: "center", backgroundColor: colors.bgSection },
  closeText: { fontFamily: typography.bold, color: colors.textHeading, fontSize: 22, lineHeight: 24 },
  modalBody: { padding: spacing.lg },
  modalForm: { gap: spacing.md },
  modalText: { fontFamily: typography.regular, color: colors.textBase, fontSize: typography.body, lineHeight: 24, textAlign: "right" },
  choiceActive: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "rgba(95,168,211,0.10)",
    borderRadius: radius.cardSm,
    padding: spacing.md,
  },
  choiceText: { fontFamily: typography.bold, color: colors.textHeading },
  choiceMark: { fontFamily: typography.semiBold, color: colors.primary },
});
