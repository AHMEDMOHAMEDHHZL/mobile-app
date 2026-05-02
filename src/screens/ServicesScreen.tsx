// ─────────────────────────────────────────────────────────────────────────────
// ServicesScreen — Service cards grid → Technician list (matches web exactly)
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, Image, ScrollView, RefreshControl,
  ActivityIndicator, Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen } from "../components/Screen";
import { LoadingState, EmptyState, ErrorState } from "../components/StateViews";
import { getServices, type Service } from "../api/services";
import { getTechnicians, type Technician } from "../api/technicians";
import { spacing, typography, radius } from "../theme";
import { useTheme } from "../providers/ThemeProvider";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { firstMediaUrl } from "../utils/media";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Display mode tabs (matching web)
const DISPLAY_MODES = [
  { key: "all",    label: "الكل"       },
  { key: "online", label: "متصل الآن" },
];

// ─── Price level helper
const getPriceLevel = (range: string | null) => {
  if (!range) return "unknown";
  const [, max] = range.split("-").map(Number);
  if (max <= 500)  return "low";
  if (max <= 1000) return "mid";
  return "high";
};

// ─── Technician Card (matches web TechnicianCard)
export function TechCard({ tech, onPress, onRequest, style }: {
  tech: Technician;
  onPress: () => void;
  onRequest: () => void;
  style?: any;
}) {
  const { colors } = useTheme();
  const tc = getTcStyles(colors);
  const govName = typeof tech.governorate === "object" && tech.governorate !== null
    ? (tech.governorate as any).name
    : tech.governorate;

  const initial = (tech.name ?? "ص").charAt(0);
  const isApproved = tech.status === "approved";

  return (
    <Pressable style={({ pressed }) => [tc.card, pressed && tc.pressed, style]} onPress={onPress}>
      {/* Top accent bar */}
      <View style={tc.accentBar} />

      {/* Avatar + Status */}
      <View style={tc.topRow}>
        <View style={[tc.avatar, { backgroundColor: isApproved ? colors.primary : colors.slate200 }]}>
          {(() => {
            const imageUrl = firstMediaUrl(
              (tech as any).profile_photo_url,
              (tech as any).profile_photo,
              (tech as any).avatar_url,
              (tech as any).avatarUrl,
              (tech as any).avatar,
              (tech as any).image_url,
              (tech as any).image,
              tech.profile_image_url,
              tech.profile_image,
              (tech as any).photo
            );
            if (imageUrl) {
              return (
                <Image 
                  source={{ uri: imageUrl }} 
                  style={tc.avatarImg} 
                  resizeMode="cover" 
                />
              );
            }
            return <Text style={tc.avatarText}>{initial}</Text>;
          })()}
        </View>
        <View style={tc.nameBlock}>
          <Text style={tc.name} numberOfLines={1}>{tech.name}</Text>
          <Text style={tc.service} numberOfLines={1}>{tech.service?.name ?? "خدمات عامة"}</Text>
        </View>
        <View style={tc.ratingBox}>
          <Text style={tc.ratingVal}>⭐ {Number(tech.rating ?? 0).toFixed(1)}</Text>
        </View>
      </View>

      {/* Meta chips */}
      <View style={tc.metaRow}>
        {govName ? (
          <View style={tc.chip}>
            <Text style={tc.chipText}>📍 {govName}</Text>
          </View>
        ) : null}
        {tech.experience_years ? (
          <View style={tc.chip}>
            <Text style={tc.chipText}>⏱ {tech.experience_years} سنة</Text>
          </View>
        ) : null}
        {tech.price_range ? (
          <View style={[tc.chip, tc.priceChip]}>
            <Text style={[tc.chipText, { color: colors.success }]}>💵 {tech.price_range} ج</Text>
          </View>
        ) : null}
      </View>

      {/* Description */}
      {tech.description ? (
        <Text style={tc.desc} numberOfLines={2}>{tech.description}</Text>
      ) : null}

      {/* Action button */}
      <Pressable style={tc.requestBtn} onPress={onRequest}>
        <Text style={tc.requestText}>طلب الخدمة</Text>
        <Text style={tc.requestArrow}>←</Text>
      </Pressable>
    </Pressable>
  );
}

// ─── Service Card (matches web ServiceCard)
export function ServiceCardItem({
  service, onPress, style, variant = "default",
}: {
  service: Service;
  onPress: () => void;
  style?: any;
  variant?: "default" | "homeCompact";
}) {
  const { colors } = useTheme();
  const sc = getScStyles(colors);
  const isCompact = variant === "homeCompact";
  return (
    <Pressable
      style={({ pressed }) => [
        sc.card,
        isCompact && sc.homeCompactCard,
        pressed && sc.pressed,
        style,
      ]}
      onPress={onPress}
    >
      {/* Top gradient accent */}
      {!isCompact && <View style={sc.topAccent} />}

      {/* Icon */}
      <View style={[sc.iconBox, isCompact && sc.homeCompactIconBox]}>
        {service.icon ? (
          <Image
            source={{ uri: service.icon }}
            style={[sc.icon, isCompact && sc.homeCompactIcon]}
            resizeMode="contain"
          />
        ) : (
          <Text style={[sc.iconEmoji, isCompact && sc.homeCompactEmoji]}>🔧</Text>
        )}
      </View>

      {/* Body */}
      <View style={[sc.body, isCompact && sc.homeCompactBody]}>
        <Text style={[sc.title, isCompact && sc.homeCompactTitle]} numberOfLines={2}>
          {service.name}
        </Text>
        {service.description ? (
          <Text style={[sc.desc, isCompact && sc.homeCompactDesc]} numberOfLines={2}>
            {service.description}
          </Text>
        ) : null}
      </View>

      {/* Button */}
      <View style={[sc.btn, isCompact && sc.homeCompactBtn]}>
        <Text style={[sc.btnText, isCompact && sc.homeCompactBtnText]}>
          اختار الخدمة
        </Text>
        {!isCompact && <Text style={sc.btnArrow}>←</Text>}
      </View>
    </Pressable>
  );
}

// ─── Main Screen
export function ServicesScreen() {
  const { colors, isDark } = useTheme();
  const sc = getScStyles(colors);
  const sh = getShStyles(colors);
  const navigation = useNavigation<Nav>();

  const [services, setServices]         = useState<Service[]>([]);
  const [technicians, setTechnicians]   = useState<Technician[]>([]);
  const [selectedService, setSelected]  = useState<Service | null>(null);
  const [search, setSearch]             = useState("");
  const [displayMode, setMode]          = useState("all");
  const [loading, setLoading]           = useState(true);
  const [techLoading, setTechLoading]   = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [refreshing, setRefreshing]     = useState(false);

  // ─── Load services
  const fetchServices = async () => {
    try {
      const svcs = await getServices();
      setServices(svcs);
    } catch (e: any) {
      setError(e?.message || "تعذر تحميل الخدمات");
    } finally { setLoading(false); setRefreshing(false); }
  };

  // ─── Load technicians for selected service
  const fetchTechnicians = useCallback(async () => {
    if (!selectedService) return;
    setTechLoading(true);
    try {
      const mode = displayMode === "online" ? "online" : undefined;
      const techs = await getTechnicians(selectedService.id, mode);
      setTechnicians(techs);
    } catch { setTechnicians([]); }
    finally { setTechLoading(false); }
  }, [selectedService, displayMode]);

  useEffect(() => { fetchServices(); }, []);
  useEffect(() => { fetchTechnicians(); }, [fetchTechnicians]);

  // ─── Filter technicians
  const filteredTechs = technicians.filter((t) => {
    if (!search) return true;
    const govName = typeof t.governorate === "object" && t.governorate !== null
      ? (t.governorate as any).name : t.governorate ?? "";
    return (t.name ?? "").includes(search) || govName.includes(search);
  });

  const filteredServices = services.filter((s) =>
    !search || s.name.includes(search)
  );

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} onRetry={() => { setLoading(true); fetchServices(); }} />;

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW A: Technician list (service selected)
  // ─────────────────────────────────────────────────────────────────────────
  if (selectedService) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgSection }}>
        {/* ── Sub-header ── */}
        <View style={sh.header}>
          <Pressable style={sh.backBtn} onPress={() => { setSelected(null); setSearch(""); setTechnicians([]); }}>
            <Text style={sh.backText}>→ رجوع</Text>
          </Pressable>
          <Text style={sh.title}>{selectedService.name}</Text>
        </View>

        {/* ── Search ── */}
        <View style={sh.searchRow}>
          <TextInput
            style={sh.searchInput}
            placeholder="ابحث باسم أو منطقة..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
        </View>

        {/* ── Display mode tabs (web: الكل / متصل الآن) ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={sh.modeScroll}
          contentContainerStyle={sh.modeRow}
        >
          {DISPLAY_MODES.map((m) => (
            <Pressable
              key={m.key}
              style={[sh.modeTab, displayMode === m.key && sh.modeActive]}
              onPress={() => setMode(m.key)}
            >
              <Text style={[sh.modeText, displayMode === m.key && sh.modeTextActive]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Count ── */}
        <View style={sh.countRow}>
          <Text style={sh.count}>
            {techLoading ? "جاري التحميل..." : `${filteredTechs.length} صنايعي متاح`}
          </Text>
        </View>

        {/* ── Technician list ── */}
        {techLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: spacing.md, color: colors.textMuted, fontFamily: typography.regular }}>
              جاري تحميل الصنايعية...
            </Text>
          </View>
        ) : filteredTechs.length === 0 ? (
          <EmptyState
            message={displayMode === "online" ? "لا يوجد صنايعية متاحين الآن" : "لا يوجد صنايعية لهذه الخدمة حالياً"}
            icon="🔍"
          />
        ) : (
          <FlatList
            data={filteredTechs}
            keyExtractor={(t) => String(t.id)}
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchTechnicians(); }}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item: tech }) => (
              <TechCard
                tech={tech}
                onPress={() => navigation.navigate("TechnicianDetail", { id: tech.id })}
                onRequest={() => navigation.navigate("ServiceRequest", {
                  technicianId: tech.id,
                  technicianName: tech.name ?? "صنايعي",
                  serviceId: tech.service_id,
                })}
              />
            )}
          />
        )}
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW B: Service cards grid
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.bgSection }}>
      {/* ── Search ── */}
      <View style={sc.searchRow}>
        <TextInput
          style={sc.searchInput}
          placeholder="ابحث عن خدمة..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          textAlign="right"
        />
      </View>

      {/* ── Section title ── */}
      <View style={sc.sectionHeader}>
        <Text style={sc.sectionEyebrow}>اختار خدمتك</Text>
        <Text style={sc.sectionTitle}>كل الخدمات المتاحة</Text>
      </View>

      <FlatList
        data={filteredServices}
        numColumns={2}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={sc.grid}
        columnWrapperStyle={sc.row}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchServices(); }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={<EmptyState message="لا توجد خدمات" icon="🔧" />}
        renderItem={({ item }) => (
          <ServiceCardItem
            service={item}
            onPress={() => { setSelected(item); setSearch(""); setMode("all"); }}
          />
        )}
      />
    </View>
  );
}

// ─── Service Card Styles
const getScStyles = (colors: any) => StyleSheet.create({
  searchRow: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchInput: {
    backgroundColor: colors.bgSection,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    fontFamily: typography.regular,
    fontSize: typography.body,
    color: colors.textBase,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    alignItems: "flex-end",
  },
  sectionEyebrow: {
    fontFamily: typography.semiBold,
    fontSize: typography.body,
    color: colors.primary,
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: typography.bold,
    fontSize: typography.h3,
    color: colors.textHeading,
  },
  grid: { padding: spacing.md, paddingBottom: 80 },
  row: { gap: spacing.md, justifyContent: "space-between" },
  card: {
    flex: 0.48,
    backgroundColor: colors.white,
    borderRadius: 20,
    marginBottom: spacing.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    alignItems: "center",
    paddingBottom: spacing.md,
  },
  pressed: { opacity: 0.87, transform: [{ scale: 0.98 }] },
  topAccent: {
    width: "100%",
    height: 4,
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EBF4FB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: "rgba(95,168,211,0.15)",
    overflow: "hidden",
  },
  icon: { width: 52, height: 52 },
  iconEmoji: { fontSize: 28 },
  body: { flex: 1, alignItems: "center", paddingHorizontal: spacing.sm, gap: 4, width: "100%" },
  title: {
    fontFamily: typography.bold,
    fontSize: typography.body,
    color: colors.textHeading,
    textAlign: "center",
    lineHeight: 22,
  },
  desc: {
    fontFamily: typography.regular,
    fontSize: typography.tiny,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: spacing.xs,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primary,
    borderRadius: 10,
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: "90%",
    gap: spacing.xs,
  },
  btnText: { fontFamily: typography.bold, fontSize: typography.small, color: "#FFF", flex: 1, textAlign: "center" },
  btnArrow: { color: "#FFF", fontSize: 14 },
  homeCompactCard: {
    flex: 0,
    width: 86,
    minHeight: 156,
    borderRadius: 16,
    marginBottom: 0,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderColor: "rgba(95,168,211,0.28)",
    boxShadow: "0 8px 20px rgba(11,30,51,0.14)",
  },
  homeCompactIconBox: {
    width: 58,
    height: 58,
    borderRadius: radius.full,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: "#EEF6FC",
    borderColor: "rgba(95,168,211,0.32)",
  },
  homeCompactIcon: { width: 50, height: 50 },
  homeCompactEmoji: { fontSize: 24 },
  homeCompactBody: {
    minHeight: 46,
    paddingHorizontal: spacing.xs,
    justifyContent: "center",
  },
  homeCompactTitle: {
    fontSize: 10,
    lineHeight: 15,
  },
  homeCompactDesc: {
    fontSize: 8,
    lineHeight: 12,
    paddingHorizontal: 0,
  },
  homeCompactBtn: {
    width: "78%",
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  homeCompactBtnText: {
    fontSize: 10,
    lineHeight: 14,
  },
});

// ─── Technician Card Styles
const getTcStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
    boxShadow: "0 4px 16px rgba(11,30,51,0.07)",
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  pressed: { opacity: 0.88 },
  accentBar: {
    height: 4,
    backgroundColor: colors.primary,
    width: "100%",
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarText: { color: "#FFF", fontFamily: typography.bold, fontSize: typography.h3 },
  nameBlock: { flex: 1, gap: 2 },
  name: { fontFamily: typography.bold, fontSize: typography.body, color: colors.textHeading, textAlign: "right" },
  service: { fontFamily: typography.regular, fontSize: typography.tiny, color: colors.primary, textAlign: "right" },
  ratingBox: {
    backgroundColor: "#FFF8E1",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  ratingVal: { fontFamily: typography.bold, fontSize: typography.tiny, color: "#F59E0B" },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    justifyContent: "flex-end",
  },
  chip: {
    backgroundColor: colors.bgSection,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  priceChip: { backgroundColor: "#E8F5E9", borderColor: "#A5D6A7" },
  chipText: { fontFamily: typography.regular, fontSize: typography.tiny, color: colors.textMuted },
  desc: {
    fontFamily: typography.regular,
    fontSize: typography.small,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  requestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.navyDeep,
    marginHorizontal: spacing.md,
    borderRadius: radius.cardSm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  requestText: { fontFamily: typography.bold, fontSize: typography.body, color: "#FFF" },
  requestArrow: { color: "#FFF", fontSize: 16 },
});

// ─── Sub-header styles (when service selected)
const getShStyles = (colors: any) => StyleSheet.create({
  header: {
    backgroundColor: colors.navyDeep,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  backBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  backText: { color: "#FFF", fontFamily: typography.semiBold, fontSize: typography.small },
  title: {
    flex: 1,
    color: "#FFF",
    fontFamily: typography.bold,
    fontSize: typography.h4,
    textAlign: "right",
  },
  searchRow: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchInput: {
    backgroundColor: colors.bgSection,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontFamily: typography.regular,
    fontSize: typography.body,
    color: colors.textBase,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  modeScroll: { flexGrow: 0, backgroundColor: colors.white },
  modeRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modeTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgSection,
  },
  modeActive: { backgroundColor: colors.navyDeep, borderColor: colors.navyDeep },
  modeText: { fontFamily: typography.semiBold, fontSize: typography.small, color: colors.textMuted },
  modeTextActive: { color: "#FFF" },
  countRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSection,
  },
  count: {
    fontFamily: typography.semiBold,
    fontSize: typography.small,
    color: colors.textMuted,
    textAlign: "right",
  },
});
