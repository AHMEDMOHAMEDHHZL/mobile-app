// ─────────────────────────────────────────────────────────────────────────────
// ProfileScreen — User profile and settings
// ─────────────────────────────────────────────────────────────────────────────
import { View, Text, StyleSheet, Pressable, Alert, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useAuth } from "../auth/AuthContext";
import { Screen } from "../components/Screen";
import { SectionCard } from "../components/SectionCard";
import { Button } from "../components/Button";
import { spacing, typography, radius } from "../theme";
import { useTheme } from "../providers/ThemeProvider";
import type { MainTabParamList } from "../navigation/MainTabNavigator";

export function ProfileScreen() {
  const { colors, isDark, setTheme } = useTheme();
  const styles = getStyles(colors);
  const { user, userType, logout } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

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

  const roleLabel = {
    user: "حساب شخصي",
    craftsman: "حساب صنايعي",
    company: "حساب شركة",
    admin: "مدير النظام",
  }[userType || "user"];

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{displayEmail}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{roleLabel}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <SectionCard style={styles.card}>
          <ProfileOption icon="👤" label="تعديل البيانات الشخصية" onPress={() => {}} />
          <View style={styles.divider} />
          <ProfileOption icon="🔔" label="الإشعارات" onPress={() => navigation.navigate("Notifications")} />
          <View style={styles.divider} />
          <ProfileOption icon="🔒" label="تغيير كلمة المرور" onPress={() => {}} />
          <View style={styles.divider} />
          <ProfileOption icon="🌐" label="اللغة (العربية)" onPress={() => {}} />
        </SectionCard>

        <SectionCard style={styles.card}>
          <ProfileOption icon="📞" label="تواصل معنا" onPress={() => {}} />
          <View style={styles.divider} />
          <ProfileOption icon="❓" label="المساعدة والدعم" onPress={() => {}} />
          <View style={styles.divider} />
          <ProfileOption icon="📄" label="الشروط والأحكام" onPress={() => {}} />
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
    </Screen>
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
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
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
});
