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

export function RegisterScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<Nav>();
  
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
          <Text style={styles.desc}>مرحباً بك في منصة صنايعي. سجل حسابك الآن للبدء.</Text>

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
