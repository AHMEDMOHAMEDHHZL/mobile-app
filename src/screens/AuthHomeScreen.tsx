import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen } from "../components/Screen";
import { spacing, typography, radius } from "../theme";
import { useTheme } from "../providers/ThemeProvider";
import type { AuthStackParamList } from "../navigation/AuthNavigator";

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function AuthHomeScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  const navigation = useNavigation<Nav>();

  return (
    <Screen scrollable>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brand}>صنايعي</Text>
          <Text style={styles.title}>كل خدمات البيت والمتجر في مكان واحد</Text>
          <Text style={styles.desc}>
            اطلب صنايعي، تابع طلباتك، اشترِ معداتك، وتواصل بأمان من خلال التطبيق.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.primaryText}>تسجيل الدخول</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]} onPress={() => navigation.navigate("Register")}>
            <Text style={styles.secondaryText}>إنشاء حساب جديد</Text>
          </Pressable>
        </View>

        <View style={styles.featureBand}>
          <Feature title="صنايعية موثوقين" text="اختار الخدمة وتابع الطلب من التطبيق." />
          <Feature title="محفظة آمنة" text="ادفع العربون وباقي المبلغ من المحفظة." />
          <Feature title="شات مباشر" text="تواصل مع العميل أو الصنايعي بسهولة." />
        </View>
      </View>
    </Screen>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);
  return (
    <View style={styles.feature}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: spacing.xl, backgroundColor: colors.bgSection, gap: spacing.xl },
  hero: {
    alignItems: "center",
    backgroundColor: colors.bgApp,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xl,
    gap: spacing.sm,
    boxShadow: isDark ? "0 12px 28px rgba(0,0,0,0.30)" : "0 12px 28px rgba(11,30,51,0.08)",
  },
  logo: { width: 86, height: 86 },
  brand: { fontFamily: typography.bold, fontSize: 26, color: colors.primary },
  title: { fontFamily: typography.bold, fontSize: typography.h2, color: colors.textHeading, textAlign: "center", lineHeight: 32 },
  desc: { fontFamily: typography.regular, fontSize: typography.body, color: colors.textMuted, textAlign: "center", lineHeight: 24 },
  actions: { gap: spacing.md },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.cardSm, paddingVertical: spacing.md, alignItems: "center" },
  primaryText: { fontFamily: typography.bold, fontSize: typography.body, color: colors.white },
  secondaryBtn: { backgroundColor: colors.bgApp, borderRadius: radius.cardSm, paddingVertical: spacing.md, alignItems: "center", borderWidth: 1, borderColor: colors.primary },
  secondaryText: { fontFamily: typography.bold, fontSize: typography.body, color: colors.primary },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  featureBand: { gap: spacing.sm },
  feature: { backgroundColor: colors.bgApp, borderRadius: radius.cardSm, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
  featureTitle: { fontFamily: typography.bold, color: colors.textHeading, textAlign: "right", marginBottom: 4 },
  featureText: { fontFamily: typography.regular, color: colors.textMuted, textAlign: "right", lineHeight: 20 },
});
