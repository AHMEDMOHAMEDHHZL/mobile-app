import { useState } from "react";
import { View, Text, StyleSheet, Alert, TextInput } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen } from "../components/Screen";
import { SectionCard } from "../components/SectionCard";
import { Button } from "../components/Button";
import { useAuth } from "../auth/AuthContext";
import { verifyOtp, resendOtp } from "../api/auth";
import { spacing, typography, radius } from "../theme";
import { useTheme } from "../providers/ThemeProvider";
import type { AuthStackParamList } from "../navigation/AuthNavigator";

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function VerifyOtpScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const route = useRoute<any>();
  const navigation = useNavigation<Nav>();
  const { login } = useAuth();
  
  const email = route.params?.email || "";
  const isNew = route.params?.is_new;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (!otp.trim()) {
      Alert.alert("خطأ", "الرجاء إدخال كود التحقق");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOtp(email, otp.trim());
      if (result.success) {
        Alert.alert("تم", "تم تفعيل حسابك بنجاح!");
        await login({
          token: result.token,
          userType: "user",
          user: result.user,
        });
      }
    } catch (e: any) {
      Alert.alert("خطأ", e.response?.data?.message || e.message || "كود التحقق غير صحيح");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOtp(email);
      Alert.alert("تم", "تم إرسال كود جديد إلى بريدك الإلكتروني");
    } catch (e: any) {
      Alert.alert("خطأ", "فشل إعادة إرسال الكود");
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen scrollable>
      <View style={styles.container}>
        <SectionCard>
          <Text style={styles.title}>تأكيد الحساب</Text>
          <Text style={styles.desc}>
            تم إرسال كود تفعيل إلى بريدك الإلكتروني: {email}
            {isNew ? "\nيرجى إدخال الكود لإكمال عملية التسجيل." : ""}
          </Text>

          <TextInput
            value={otp}
            onChangeText={setOtp}
            placeholder="أدخل كود التحقق (6 أرقام)"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            style={styles.input}
            textAlign="center"
            maxLength={6}
          />

          <Button label="تأكيد الكود" onPress={handleVerify} loading={loading} style={styles.btn} />

          <Button 
            label="إعادة إرسال الكود" 
            onPress={handleResend} 
            loading={resending} 
            variant="outline" 
            style={styles.btn} 
          />
        </SectionCard>
      </View>
    </Screen>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, justifyContent: "center" },
  title: { fontFamily: typography.bold, fontSize: typography.h2, color: colors.textHeading, textAlign: "right" },
  desc: { fontFamily: typography.regular, fontSize: typography.body, color: colors.textMuted, textAlign: "right", lineHeight: 24, marginTop: spacing.sm, marginBottom: spacing.lg },
  input: {
    borderWidth: 1, borderColor: colors.borderMedium, backgroundColor: colors.bgSection,
    borderRadius: radius.cardSm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    color: colors.textBase, fontFamily: typography.bold, fontSize: typography.h3,
    letterSpacing: 4, marginBottom: spacing.lg
  },
  btn: { marginBottom: spacing.md },
});
