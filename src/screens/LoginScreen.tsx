import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { FontAwesome5 } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";

import { Screen } from "../components/Screen";
import { useAuth } from "../auth/AuthContext";
import { radius, spacing, typography } from "../theme";
import { useTheme } from "../providers/ThemeProvider";
import { loginWithApi, exchangeGoogleCode } from "../api/auth";
import type { AuthStackParamList } from "../navigation/AuthNavigator";
import { getGoogleAuthRedirectUrl } from "../utils/googleAuthRedirect";

WebBrowser.maybeCompleteAuthSession();

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function LoginScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<Nav>();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"error" | "info">("info");

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setFeedbackTone("error");
      setFeedback("اكتب البريد أو رقم الدخول وكلمة المرور أولاً");
      return;
    }

    setLoading(true);
    setFeedbackTone("info");
    setFeedback("جاري محاولة تسجيل الدخول...");

    try {
      const result = await loginWithApi(identifier.trim(), password);

      if (!result.success) {
        setFeedbackTone("error");
        setFeedback(result.message);
        return;
      }

      await login({
        token: result.token,
        userType: result.role,
        user: result.user,
      });
      setFeedbackTone("info");
      setFeedback(`تم تسجيل الدخول بنجاح كـ ${result.role}`);
    } catch {
      setFeedbackTone("error");
      setFeedback("حدث خطأ أثناء الاتصال بالخادم أو تم رفض الطلب من المتصفح");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setFeedbackTone("info");
      setFeedback("جاري تحويلك إلى جوجل...");

      const redirectUrl = getGoogleAuthRedirectUrl();
      const backendAuthUrl = `https://sanay3i.net/api/auth/google?mode=login&frontend_url=${encodeURIComponent(redirectUrl)}`;

      const result = await WebBrowser.openAuthSessionAsync(backendAuthUrl, redirectUrl);

      if (result.type === "success" && result.url) {
        setFeedback("جاري التحقق من بيانات جوجل...");
        const parsed = Linking.parse(result.url);
        const path = parsed.path || "";
        
        if (path.includes("verify-otp")) {
          setFeedback("");
          navigation.navigate("VerifyOtp", {
            email: parsed.queryParams?.email as string,
            is_new: parsed.queryParams?.is_new === "1" || parsed.queryParams?.is_new === "true",
          });
          return;
        }

        const code = parsed.queryParams?.code as string;
        
        if (code) {
          const exchangeResult = await exchangeGoogleCode(code);
          if (exchangeResult.success) {
            await login({
              token: exchangeResult.token,
              userType: exchangeResult.role as any,
              user: exchangeResult.user as any,
            });
            setFeedbackTone("info");
            setFeedback("تم تسجيل الدخول عبر جوجل بنجاح");
          } else {
            setFeedbackTone("error");
            setFeedback("فشل مصادقة حساب جوجل من الخادم");
          }
        } else {
            setFeedbackTone("error");
            setFeedback("تم تسجيل الدخول ولكن لم يتم استلام رمز التحقق");
        }
      } else if (result.type === "cancel") {
        setFeedbackTone("error");
        setFeedback("تم إلغاء عملية تسجيل الدخول عبر جوجل");
      }
    } catch (e: any) {
      setFeedbackTone("error");
      setFeedback(e?.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable>
      <View style={styles.container}>
        <View style={styles.brandBlock}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brandName}>صنايعي</Text>
          <Text style={styles.brandSub}>ادخل لحسابك وكمل طلباتك وخدماتك بسهولة</Text>
        </View>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>تسجيل الدخول</Text>

          {/* Phone or Email Input */}
          <View style={styles.inputGroup}>
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="رقم الهاتف أو البريد الإلكتروني"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              style={styles.authInput}
              textAlign="right"
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <View style={[styles.inputGroup, styles.passwordWrapper]}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="كلمة المرور"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              style={[styles.authInput, styles.passwordInput]}
              textAlign="right"
              editable={!loading}
            />
            <Pressable 
              style={styles.passwordToggle} 
              onPress={() => setShowPassword((p) => !p)}
              hitSlop={10}
            >
              <FontAwesome5 name={showPassword ? "eye" : "eye-slash"} size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Login Options (Remember Me & Forgot Password) */}
          <View style={styles.loginOptions}>
            <Pressable onPress={() => {}} /* Navigate to Forgot Password */>
              <Text style={styles.forgotPassword}>نسيت كلمة المرور؟</Text>
            </Pressable>

            <Pressable style={styles.rememberMe} onPress={() => setRememberMe(!rememberMe)}>
              <Text style={styles.rememberMeText}>تذكرني</Text>
              <Checkbox 
                value={rememberMe} 
                onValueChange={setRememberMe} 
                color={rememberMe ? colors.primary : undefined}
                style={styles.checkbox} 
              />
            </Pressable>
          </View>

          {feedback ? (
            <Text style={[styles.feedback, feedbackTone === "error" ? styles.feedbackError : styles.feedbackInfo]}>
              {feedback}
            </Text>
          ) : null}

          {/* Submit Button */}
          <Pressable 
            style={({ pressed }) => [styles.authBtn, pressed && styles.authBtnPressed]} 
            onPress={() => void handleLogin()} 
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.authBtnText}>تسجيل الدخول</Text>}
          </Pressable>

          {/* Divider */}
          <View style={styles.authDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>أو</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button */}
          <View style={styles.authSocialContainer}>
            <Pressable 
              style={({ pressed }) => [styles.authSocialBtn, pressed && styles.authSocialBtnPressed]} 
              onPress={() => void handleGoogleLogin()} 
              disabled={loading}
            >
              <Text style={styles.authSocialBtnText}>عن طريق جوجل</Text>
              <FontAwesome5 name="google" size={18} color="#EA4335" />
            </Pressable>
          </View>

          {/* Footer Link */}
          <View style={styles.authFooterLink}>
            <Pressable onPress={() => navigation.navigate("Register")}>
              <Text style={styles.authFooterText}>
                ليس لديك حساب؟ <Text style={styles.authFooterLinkText}>أنشئ حساب جديد</Text>
              </Text>
            </Pressable>
          </View>

        </View>
      </View>
    </Screen>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
    backgroundColor: colors.bgSection,
  },
  brandBlock: {
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  logo: {
    width: 68,
    height: 68,
  },
  brandName: {
    fontFamily: typography.bold,
    fontSize: 24,
    color: colors.textHeading,
  },
  brandSub: {
    fontFamily: typography.regular,
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  authCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 0.5)",
    // web shadow
    boxShadow: "0 8px 24px rgba(11,30,51,0.10)",
  },
  authTitle: {
    fontFamily: typography.bold,
    fontSize: 28,
    color: colors.textHeading,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  authInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontFamily: typography.regular,
    fontSize: 15,
    color: colors.textBase,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingRight: spacing.lg,
    paddingLeft: spacing.md,
  },
  passwordToggle: {
    padding: spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  loginOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
    marginTop: spacing.xs,
  },
  forgotPassword: {
    fontFamily: typography.semiBold,
    fontSize: 14,
    color: colors.primary,
  },
  rememberMe: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  rememberMeText: {
    fontFamily: typography.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderColor: colors.borderMedium,
  },
  authBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: `0 4px 8px ${colors.primary}4d`,
    elevation: 4,
  },
  authBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  authBtnText: {
    fontFamily: typography.bold,
    fontSize: 16,
    color: colors.white,
  },
  authDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 14,
  },
  authSocialContainer: {
    marginBottom: spacing.xl,
  },
  authSocialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 14,
    gap: spacing.md,
  },
  authSocialBtnPressed: {
    backgroundColor: "#f9fafb",
  },
  authSocialBtnText: {
    fontFamily: typography.semiBold,
    fontSize: 15,
    color: colors.textHeading,
  },
  authFooterLink: {
    alignItems: "center",
    marginTop: spacing.sm,
  },
  authFooterText: {
    fontFamily: typography.regular,
    fontSize: 15,
    color: colors.textMuted,
  },
  authFooterLinkText: {
    color: colors.primary,
    fontFamily: typography.bold,
  },
  feedback: {
    fontFamily: typography.regular,
    fontSize: typography.small,
    textAlign: "center",
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  feedbackInfo: {
    color: colors.primary,
  },
  feedbackError: {
    color: colors.error,
  },
});
