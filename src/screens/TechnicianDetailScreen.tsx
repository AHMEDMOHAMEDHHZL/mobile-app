import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen } from "../components/Screen";
import { SectionCard } from "../components/SectionCard";
import { Button } from "../components/Button";
import { LoadingState, ErrorState } from "../components/StateViews";
import { getTechnicianById, type Technician } from "../api/technicians";
import { spacing, typography, radius } from "../theme";
import { useTheme } from "../providers/ThemeProvider";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function TechnicianDetailScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const route = useRoute<any>();
  const navigation = useNavigation<Nav>();
  const { id } = route.params;

  const [tech, setTech] = useState<Technician | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTechnicianById(id)
      .then(setTech)
      .catch((e) => setError(e.message || "فشل تحميل البيانات"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState />;
  if (error || !tech) return <ErrorState message={error || "لم يتم العثور على الصنايعي"} />;

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(tech.name || "ص").charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{tech.name}</Text>
        <Text style={styles.service}>{tech.service?.name || "خدمات عامة"}</Text>
        <View style={styles.meta}>
          <Text style={styles.rating}>⭐ {Number(tech.rating || 0).toFixed(1)}</Text>
          <Text style={styles.location}>📍 {tech.governorate || "غير محدد"}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <SectionCard>
          <Text style={styles.sectionTitle}>عن الصنايعي</Text>
          <Text style={styles.desc}>{tech.description || "لا يوجد وصف إضافي."}</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>سنوات الخبرة</Text>
              <Text style={styles.detailValue}>{tech.experience_years ? `${tech.experience_years} سنة` : "-"}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>متوسط السعر</Text>
              <Text style={styles.detailValue}>{tech.price_range ? `${tech.price_range} ج` : "-"}</Text>
            </View>
          </View>
        </SectionCard>

        <Button
          label="طلب خدمة"
          onPress={() => navigation.navigate("ServiceRequest", {
            technicianId: tech.id,
            technicianName: tech.name,
            serviceId: tech.service_id,
          })}
          style={styles.requestBtn}
        />
      </View>
    </Screen>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  header: { alignItems: "center", padding: spacing.xl, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.borderLight },
  avatar: { width: 90, height: 90, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  avatarText: { color: colors.white, fontSize: 40, fontFamily: typography.bold },
  name: { fontFamily: typography.bold, fontSize: typography.h2, color: colors.textHeading },
  service: { fontFamily: typography.regular, fontSize: typography.body, color: colors.primary, marginTop: spacing.xs },
  meta: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.sm },
  rating: { fontFamily: typography.semiBold, fontSize: typography.body, color: colors.textHeading },
  location: { fontFamily: typography.regular, fontSize: typography.body, color: colors.textMuted },
  body: { padding: spacing.lg, gap: spacing.lg },
  sectionTitle: { fontFamily: typography.bold, fontSize: typography.h4, color: colors.textHeading, textAlign: "right", marginBottom: spacing.sm },
  desc: { fontFamily: typography.regular, fontSize: typography.body, color: colors.textMuted, textAlign: "right", lineHeight: 22 },
  detailsGrid: { flexDirection: "row", marginTop: spacing.lg, borderTopWidth: 1, borderColor: colors.borderLight, paddingTop: spacing.md },
  detailItem: { flex: 1, alignItems: "center", gap: 4 },
  detailLabel: { fontFamily: typography.regular, fontSize: typography.small, color: colors.textMuted },
  detailValue: { fontFamily: typography.bold, fontSize: typography.body, color: colors.textBase },
  requestBtn: { marginTop: spacing.md },
});
