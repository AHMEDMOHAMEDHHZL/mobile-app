import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Screen } from "../components/Screen";
import { SectionCard } from "../components/SectionCard";
import { InputField } from "../components/InputField";
import { Button } from "../components/Button";
import { registerUser } from "../api/auth";
import { FontAwesome5 } from "@expo/vector-icons";
import { spacing, typography, radius } from "../theme";
import { useTheme } from "../providers/ThemeProvider";
import type { AuthStackParamList } from "../navigation/AuthNavigator";
import { getGoogleAuthRedirectUrl } from "../utils/googleAuthRedirect";

type Nav = NativeStackNavigationProp<AuthStackParamList>;
type AccountType = "user" | "craftsman" | "company";

const ACCOUNT_CARDS: Array<{
  key: AccountType;
  title: string;
  text: string;
  button: string;
  image: any;
  url?: string;
}> = [
  {
    key: "user",
    title: "المستخدم",
    text: "اطلب خدمات من صنايعية محترفين في كل المجالات بتجربة سهلة وموثوقة.",
    button: "سجل الآن حسابك",
    image: require("../../assets/images/home.jpg"),
  },
  {
    key: "craftsman",
    title: "الصنايعي",
    text: "اعرض خدماتك وساعد العملاء يوصلوا لك بسهولة وزوّد دخلك.",
    button: "سجل حساب صنايعي",
    image: require("../../assets/images/home2.png"),
    url: "https://sanay3i.net/register-worker",
  },
  {
    key: "company",
    title: "الشركات / المحلات",
    text: "اعرض منتجاتك ومعداتك للصنايعية والمستخدمين وزوّد مبيعاتك.",
    button: "سجل حسابك التجاري",
    image: require("../../assets/logo.png"),
    url: "https://sanay3i.net/register-company",
  },
];

export function RegisterScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<Nav>();
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConf, setPasswordConf] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !passwordConf) {
      Alert.alert("خطأ", "جميع الحقول مطلوبة");
      return;
    }
    if (password !== passwordConf) {
      Alert.alert("خطأ", "كلمات المرور غير متطابقة");
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        name, email, phone, password, password_confirmation: passwordConf,
      });
      navigation.navigate("VerifyOtp", { email, is_new: true });
    } catch (e: any) {
      Alert.alert("خطأ", e.response?.data?.message || "فشل إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setGoogleLoading(true);
      const redirectUrl = getGoogleAuthRedirectUrl();
      const backendAuthUrl = `https://sanay3i.net/api/auth/google?mode=register&frontend_url=${encodeURIComponent(redirectUrl)}`;

      const result = await WebBrowser.openAuthSessionAsync(backendAuthUrl, redirectUrl);

      if (result.type === "success" && result.url) {
        const parsed = Linking.parse(result.url);
        const path = parsed.path || "";
        
        if (path.includes("verify-otp")) {
          navigation.navigate("VerifyOtp", {
            email: parsed.queryParams?.email as string,
            is_new: true,
          });
        } else if (path.includes("auth/callback") || parsed.queryParams?.code) {
          // Sometimes Google returns directly if previously registered
          Alert.alert("معلومة", "تم التعرف على حسابك. يرجى تسجيل الدخول.");
          navigation.navigate("Login");
        }
      }
    } catch (e: any) {
      Alert.alert("خطأ", "حدث خطأ أثناء محاولة التسجيل بجوجل");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAccountSelect = async (type: AccountType) => {
    setAccountType(type);
    const card = ACCOUNT_CARDS.find((item) => item.key === type);
    if (card?.url) {
      await WebBrowser.openBrowserAsync(card.url);
    }
  };

  return (
    <Screen scrollable>
      <View style={styles.container}>
        <View style={styles.brandBlock}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brandName}>صنايعي</Text>
          <Text style={styles.brandSub}>أنشئ حسابك وابدأ طلب الخدمات من مكان واحد</Text>
        </View>
        <SectionCard style={styles.authCard}>
          <Text style={styles.title}>إنشاء حساب جديد</Text>
          <Text style={styles.desc}>
            {accountType === "user"
              ? "أكمل بيانات حسابك للبدء في طلب الخدمات."
              : "اختر نوع الحساب الذي تريد إنشاءه أولاً."}
          </Text>

          {!accountType ? (
            <>
              <Text style={styles.accountSectionTitle}>اختر نوع الحساب</Text>
              <View style={styles.accountGrid}>
                {ACCOUNT_CARDS.map((card) => (
                  <Pressable
                    key={card.key}
                    style={({ pressed }) => [
                      styles.accountCard,
                      pressed && styles.accountCardPressed,
                    ]}
                    onPress={() => void handleAccountSelect(card.key)}
                  >
                    <View style={styles.accountImageWrap}>
                      <Image source={card.image} style={styles.accountImage} resizeMode={card.key === "company" ? "contain" : "cover"} />
                    </View>
                    <View style={styles.accountContent}>
                      <Text style={styles.accountTitle}>{card.title}</Text>
                      <Text style={styles.accountText}>{card.text}</Text>
                      <Text style={styles.accountButton}>{card.button}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              <Pressable onPress={() => navigation.navigate("Login")} style={styles.loginLink}>
                <Text style={styles.loginText}>لديك حساب بالفعل؟ <Text style={{color: colors.primary}}>سجل دخولك</Text></Text>
              </Pressable>
            </>
          ) : null}

          {accountType && accountType !== "user" ? (
            <View style={styles.externalHint}>
              <Text style={styles.externalHintText}>
                تم فتح تسجيل {accountType === "craftsman" ? "الصنايعي" : "الشركة / المحل"} في المتصفح لإكمال البيانات المطلوبة.
              </Text>
              <Pressable style={styles.backToChoices} onPress={() => setAccountType(null)}>
                <Text style={styles.backToChoicesText}>العودة لاختيار نوع الحساب</Text>
              </Pressable>
            </View>
          ) : null}

          {accountType === "user" ? (
            <>
          <Pressable style={styles.backToChoices} onPress={() => setAccountType(null)}>
            <Text style={styles.backToChoicesText}>تغيير نوع الحساب</Text>
          </Pressable>

          <InputField label="الاسم الكامل" value={name} onChangeText={setName} />
          <InputField label="البريد الإلكتروني" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <InputField label="رقم الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <InputField label="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry />
          <InputField label="تأكيد كلمة المرور" value={passwordConf} onChangeText={setPasswordConf} secureTextEntry />

          <Button label="إنشاء حساب" onPress={handleRegister} loading={loading} style={styles.btn} />

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>أو</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.btn, styles.googleButton, pressed && styles.googleButtonPressed]}
            onPress={() => void handleGoogleRegister()}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Text style={styles.googleButtonText}>التسجيل بواسطة جوجل</Text>
                <FontAwesome5 name="google" size={18} color="#EA4335" />
              </>
            )}
          </Pressable>

          <Pressable onPress={() => navigation.navigate("Login")} style={styles.loginLink}>
            <Text style={styles.loginText}>لديك حساب بالفعل؟ <Text style={{color: colors.primary}}>سجل دخولك</Text></Text>
          </Pressable>
            </>
          ) : null}
        </SectionCard>
      </View>
    </Screen>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: "center", backgroundColor: colors.bgSection },
  brandBlock: { alignItems: "center", marginBottom: spacing.lg, gap: spacing.xs },
  logo: { width: 64, height: 64 },
  brandName: { fontFamily: typography.bold, fontSize: 24, color: colors.textHeading },
  brandSub: { fontFamily: typography.regular, fontSize: typography.body, color: colors.textMuted, textAlign: "center", lineHeight: 22 },
  authCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.5)",
    boxShadow: "0 8px 24px rgba(11,30,51,0.10)",
  },
  title: { fontFamily: typography.bold, fontSize: 26, color: colors.textHeading, textAlign: "center" },
  desc: { fontFamily: typography.regular, fontSize: typography.body, color: colors.textMuted, textAlign: "center", marginBottom: spacing.lg, lineHeight: 22 },
  accountSectionTitle: { fontFamily: typography.bold, fontSize: typography.h4, color: colors.textHeading, textAlign: "right", marginBottom: spacing.md },
  accountGrid: { gap: spacing.md, marginBottom: spacing.lg },
  accountCard: {
    backgroundColor: colors.bgApp,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
    boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
  },
  accountCardActive: {
    borderColor: colors.primary,
    boxShadow: `0 12px 28px ${colors.primary}33`,
  },
  accountCardPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  accountImageWrap: {
    height: 132,
    backgroundColor: "rgba(95,168,211,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  accountImage: { width: "100%", height: "100%" },
  accountContent: { padding: spacing.lg, gap: spacing.sm, alignItems: "stretch" },
  accountTitle: { fontFamily: typography.bold, fontSize: 22, color: colors.primary, textAlign: "right" },
  accountText: { fontFamily: typography.regular, fontSize: typography.small, color: colors.textMuted, lineHeight: 21, textAlign: "right" },
  accountButton: {
    marginTop: spacing.sm,
    overflow: "hidden",
    backgroundColor: colors.primary,
    color: colors.white,
    borderRadius: 18,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    textAlign: "center",
    fontFamily: typography.bold,
    fontSize: typography.body,
  },
  accountButtonActive: { backgroundColor: colors.primaryHover },
  externalHint: { backgroundColor: "rgba(95,168,211,0.12)", borderRadius: radius.cardSm, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.primary },
  externalHintText: { fontFamily: typography.semiBold, color: colors.textHeading, textAlign: "right", lineHeight: 22 },
  backToChoices: { alignSelf: "flex-end", marginBottom: spacing.md, paddingVertical: spacing.xs },
  backToChoicesText: { fontFamily: typography.bold, color: colors.primary, textAlign: "right" },
  btn: { marginTop: spacing.md },
  dividerContainer: { flexDirection: "row", alignItems: "center", marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.borderLight },
  dividerText: { marginHorizontal: spacing.md, color: colors.textMuted, fontFamily: typography.regular, fontSize: typography.small },
  googleButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.cardSm,
    marginTop: 0,
    flexDirection: "row",
    gap: spacing.md,
  },
  googleButtonPressed: { backgroundColor: "#f9fafb" },
  googleButtonText: { color: colors.textHeading, fontFamily: typography.semiBold, fontSize: 15 },
  loginLink: { marginTop: spacing.xl, alignItems: "center" },
  loginText: { fontFamily: typography.regular, fontSize: typography.body, color: colors.textMuted },
});
