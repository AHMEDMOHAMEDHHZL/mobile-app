import { useState } from "react";
import { Pressable, View, Text, StyleSheet, Alert, Platform } from "react-native";
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
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUseCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      Alert.alert("تنبيه", "تحديد الموقع غير مدعوم على هذا الجهاز حالياً");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude.toFixed(7));
        const longitude = Number(position.coords.longitude.toFixed(7));
        setCoords({ latitude, longitude });
        setAddress((current) => current || `موقعي الحالي: ${latitude}, ${longitude}`);
        setLocating(false);
      },
      () => {
        Alert.alert("تعذر تحديد الموقع", "اسمح للتطبيق باستخدام موقعك ثم حاول مرة أخرى");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const handleSubmit = async () => {
    const normalizedTime = normalizeTime(time);
    const numericAmount = Number(String(amount).replace(/[^\d.]/g, ""));

    if (!technicianId || !serviceId) {
      Alert.alert("تنبيه", "بيانات الصنايعي أو الخدمة غير مكتملة. ارجع واختر الخدمة مرة أخرى.");
      return;
    }

    if (!province || !address || !date || !time || !desc || !amount) {
      Alert.alert("تنبيه", "يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("تنبيه", "اكتب التاريخ بصيغة صحيحة مثل 2026-05-02");
      return;
    }

    if (!normalizedTime) {
      Alert.alert("تنبيه", "اكتب الوقت بنظام 24 ساعة مثل 10:00 أو 18:30");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert("تنبيه", "اكتب مبلغاً صحيحاً أكبر من صفر");
      return;
    }

    setLoading(true);
    try {
      await createServiceRequest({
        craftsman_id: technicianId,
        service_type: serviceId,
        province,
        address,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        date,
        time: normalizedTime,
        problem_description: desc,
        requested_amount: numericAmount,
        payment_method: paymentMethod,
      });
      Alert.alert("تم بنجاح", "تم إرسال طلبك إلى الصنايعي", [
        { text: "حسناً", onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      Alert.alert("خطأ", e?.message || e?.response?.data?.message || "فشل إرسال الطلب");
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
          <Pressable style={styles.locationButton} onPress={handleUseCurrentLocation} disabled={locating}>
            <Text style={styles.locationButtonText}>
              {locating ? "جاري تحديد الموقع..." : coords ? "تم تحديد الموقع" : "تحديد موقعي الحالي"}
            </Text>
          </Pressable>
          {coords ? (
            <Text style={styles.coordsText}>{coords.latitude}, {coords.longitude}</Text>
          ) : null}
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
            <Pressable
              onPress={() => setPaymentMethod("wallet")}
              style={[styles.paymentOption, paymentMethod === "wallet" && styles.paymentActive]}
            >
              <Text style={[styles.paymentText, paymentMethod === "wallet" && styles.paymentTextActive]}>الدفع بالمحفظة</Text>
            </Pressable>
            <Pressable
              onPress={() => setPaymentMethod("cash")}
              style={[styles.paymentOption, paymentMethod === "cash" && styles.paymentActive]}
            >
              <Text style={[styles.paymentText, paymentMethod === "cash" && styles.paymentTextActive]}>الدفع كاش</Text>
            </Pressable>
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

function normalizeTime(value: string) {
  const original = value.trim();
  const isPm = /م|pm/i.test(original);
  const isAm = /ص|am/i.test(original);
  const trimmed = original
    .replace("ص", "")
    .replace("م", "")
    .replace(/am|pm/ig, "")
    .replace(/\s+/g, "");

  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  if (isPm && hour >= 1 && hour <= 11) hour += 12;
  if (isAm && hour === 12) hour = 0;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { padding: spacing.lg },
  title: { fontFamily: typography.bold, fontSize: typography.h3, color: colors.textHeading, textAlign: "right", marginBottom: spacing.lg },
  sectionHeader: { fontFamily: typography.bold, fontSize: typography.body, color: colors.primary, textAlign: "right", marginTop: spacing.md, marginBottom: spacing.sm },
  textArea: { height: 100, textAlignVertical: "top" },
  paymentRow: { flexDirection: "row-reverse", gap: spacing.md, marginBottom: spacing.md },
  paymentOption: { flex: 1, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 12, alignItems: "center" },
  paymentActive: { borderColor: colors.primary, backgroundColor: "rgba(95,168,211,0.1)" },
  paymentText: { fontFamily: typography.semiBold, color: colors.textMuted },
  paymentTextActive: { color: colors.primary },
  locationButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
    backgroundColor: Platform.OS === "web" ? "rgba(95,168,211,0.08)" : "transparent",
    marginBottom: spacing.sm,
  },
  locationButtonText: { fontFamily: typography.bold, color: colors.primary },
  coordsText: { fontFamily: typography.regular, color: colors.textMuted, textAlign: "right", marginBottom: spacing.sm },
  submitBtn: { marginTop: spacing.md },
});
