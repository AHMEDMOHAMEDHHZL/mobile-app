import { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Screen } from "../components/Screen";
import { SectionCard } from "../components/SectionCard";
import { InputField } from "../components/InputField";
import { Button } from "../components/Button";
import { createServiceRequest } from "../api/orders";
import { spacing, typography } from "../theme";
import { useTheme } from "../providers/ThemeProvider";

export function ServiceRequestScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { technicianId, technicianName, serviceId } = route.params;

  const [province, setProvince] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!province || !address || !date || !time || !desc || !amount) {
      Alert.alert("تنبيه", "يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setLoading(true);
    try {
      await createServiceRequest({
        craftsman_id: technicianId,
        service_id: serviceId,
        province,
        address,
        date,
        time,
        problem_description: desc,
        requested_amount: amount,
        payment_method: paymentMethod,
      });
      Alert.alert("تم بنجاح", "تم إرسال طلبك إلى الصنايعي", [
        { text: "حسناً", onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      Alert.alert("خطأ", e.message || "فشل إرسال الطلب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable>
      <View style={styles.container}>
        <SectionCard>
          <Text style={styles.title}>طلب خدمة من {technicianName}</Text>

          <Text style={styles.sectionHeader}>1. بيانات الزيارة</Text>
          <InputField
            label="المحافظة *"
            placeholder="مثال: القاهرة"
            value={province}
            onChangeText={setProvince}
          />
          <InputField
            label="العنوان بالتفصيل *"
            placeholder="المنطقة، الشارع، رقم العمارة..."
            value={address}
            onChangeText={setAddress}
          />
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <InputField
                label="تاريخ الزيارة *"
                placeholder="YYYY-MM-DD"
                value={date}
                onChangeText={setDate}
              />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label="وقت الزيارة *"
                placeholder="مثال: 10:00 ص"
                value={time}
                onChangeText={setTime}
              />
            </View>
          </View>

          <Text style={styles.sectionHeader}>2. تفاصيل المشكلة</Text>
          <InputField
            label="المبلغ المتوقع (ميزانيتك) *"
            placeholder="مثال: 150"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          <InputField
            label="وصف المشكلة *"
            placeholder="اشرح المشكلة بالتفصيل..."
            value={desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />

          <Text style={styles.sectionHeader}>3. طريقة الدفع</Text>
          <View style={styles.paymentRow}>
            <View 
              onTouchEnd={() => setPaymentMethod("wallet")}
              style={[styles.paymentOption, paymentMethod === "wallet" && styles.paymentActive]}
            >
              <Text style={[styles.paymentText, paymentMethod === "wallet" && styles.paymentTextActive]}>الدفع بالمحفظة</Text>
            </View>
            <View 
              onTouchEnd={() => setPaymentMethod("cash")}
              style={[styles.paymentOption, paymentMethod === "cash" && styles.paymentActive]}
            >
              <Text style={[styles.paymentText, paymentMethod === "cash" && styles.paymentTextActive]}>الدفع كاش</Text>
            </View>
          </View>

          <Button
            label="إرسال الطلب"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitBtn}
          />
        </SectionCard>
      </View>
    </Screen>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { padding: spacing.lg },
  title: { fontFamily: typography.bold, fontSize: typography.h3, color: colors.textHeading, textAlign: "right", marginBottom: spacing.lg },
  sectionHeader: { fontFamily: typography.bold, fontSize: typography.body, color: colors.primary, textAlign: "right", marginTop: spacing.md, marginBottom: spacing.sm },
  textArea: { height: 100, textAlignVertical: "top" },
  paymentRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md, direction: "rtl" },
  paymentOption: { flex: 1, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 12, alignItems: "center" },
  paymentActive: { borderColor: colors.primary, backgroundColor: "rgba(95,168,211,0.1)" },
  paymentText: { fontFamily: typography.semiBold, color: colors.textMuted },
  paymentTextActive: { color: colors.primary },
  submitBtn: { marginTop: spacing.md },
});
