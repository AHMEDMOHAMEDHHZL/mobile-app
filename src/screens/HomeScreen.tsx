// ─────────────────────────────────────────────────────────────────────────────
// HomeScreen — matches web design exactly
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, Animated, Dimensions,
  ImageBackground, TextInput, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useAuth } from "../auth/AuthContext";
import { LoadingState } from "../components/StateViews";
import { getServices, type Service } from "../api/services";
import { getTechnicians, type Technician } from "../api/technicians";
import { createServiceRequest } from "../api/orders";
import { ServiceCardItem, TechCard } from "./ServicesScreen";
import { spacing, typography, radius } from "../theme";
import { useTheme } from "../providers/ThemeProvider";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { MainTabParamList } from "../navigation/MainTabNavigator";

type HomeNav = NativeStackNavigationProp<RootStackParamList>;
const { width: SCREEN_W } = Dimensions.get("window");

// ── Slider data (mirrors web HeroSection slides)
const SLIDES = [
  {
    id: 1,
    title: "اطلب صنايعك... وخلي الشغل علينا!",
    desc: "مع صنايعي هتلاقي كل خدمات الصيانة والدِيكور في مكان واحد\nصنايعية خبرة، أسعار واضحة، وشغل مضمون يوصل لحد بابك.",
    image: require("../../assets/images/home.jpg"),
  },
  {
    id: 2,
    title: "لما البيت يحتاج صنايعي شاطر.. متلفش كتير",
    desc: "كفاية تدوير على صنايعي وفي الآخر تطلع الشغلانة مش مظبوطة..\nمعانا الصنايعي اللي بيفهم.. والسعر اللي يريّح!",
    image: require("../../assets/images/home2.png"),
  },
];

// ── Web Informational Cards
const WEB_CARDS = [
  { icon: "🛡️", title: "صنايعية موثوقين", text: "كل الحرفيين على صنايعي تم التحقق من خبرتهم وتقييماتهم لضمان أفضل جودة للخدمة." },
  { icon: "⏱️", title: "حجز سهل وسريع", text: "احجز الخدمة اللي تحتاجها في دقائق بخطوات بسيطة، من غير مكالمات ولا تعقيد." },
  { icon: "💵", title: "أسعار مناسبة", text: "نعرض لك تكلفة الخدمة بشكل شفاف قبل تأكيد الطلب، بدون مفاجآت." },
];

// ── Service icons map
const SERVICE_ICONS: Record<string, string> = {
  سباكة: "🚿", كهرباء: "⚡", نجارة: "🪚", دهانات: "🎨",
  "تكييف وتبريد": "❄️", بلاط: "🧱", حدادة: "🔩", صيانة: "🔧",
};
function serviceIcon(name: string) {
  for (const [key, icon] of Object.entries(SERVICE_ICONS)) {
    if (name?.includes(key)) return icon;
  }
  return "🔩";
}

// ── WHY SANAYEI cards (mirrors web WhySanayeiSection)
const WHY_STATS = [
  { icon: "🏢", value: "30+", title: "شركة ومورد معتمد", desc: "شركات ومتاجر موثوقة على المنصة توفر أفضل الخامات والمعدات." },
  { icon: "⏳", value: "6+", title: "سنين خبرة", desc: "خبرة في التوصيل بين العملاء وأفضل الصنايعية والموردين." },
  { icon: "✅", value: "250+", title: "طلب وخدمة ناجحة", desc: "طلبات نفذها أمهر الصنايعية المسجلين لدينا." },
  { icon: "🛠️", value: "100+", title: "صنايعي محترف", desc: "صنايعية متخصصين وموثوقين في الكهرباء، السباكة، النجارة، وغيرها." },
];

export function HomeScreen() {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const { user, userType } = useAuth();
  const navigation = useNavigation<HomeNav>();
  const tabNavigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  const [services, setServices]       = useState<Service[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [slideIdx, setSlideIdx]       = useState(0);
  const [quickServiceId, setQuickServiceId] = useState<number | null>(null);
  const [quickTechId, setQuickTechId] = useState<number | null>(null);
  const [quickTechOptions, setQuickTechOptions] = useState<Technician[]>([]);
  const [quickProvince, setQuickProvince] = useState("");
  const [quickAddress, setQuickAddress] = useState("");
  const [quickDate, setQuickDate] = useState("");
  const [quickTime, setQuickTime] = useState("");
  const [quickAmount, setQuickAmount] = useState("");
  const [quickDesc, setQuickDesc] = useState("");
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fetchData = async () => {
    setLoading(true);
    const [servicesResult, techniciansResult] = await Promise.allSettled([
      getServices(),
      getTechnicians(),
    ]);

    if (servicesResult.status === "fulfilled") {
      const svcs = servicesResult.value;
      setServices(svcs.slice(0, 8));
    }

    if (techniciansResult.status === "fulfilled") {
      const techs = techniciansResult.value;
      setTechnicians(techs.slice(0, 5));
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!quickServiceId) {
      setQuickTechOptions([]);
      return;
    }

    getTechnicians(quickServiceId)
      .then((rows) => setQuickTechOptions(rows))
      .catch(() => setQuickTechOptions([]));
  }, [quickServiceId]);

  // Auto-slide every 6 s
  useEffect(() => {
    const t = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
      ]).start();
      setSlideIdx((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  const displayName = user?.name || (user as any)?.company_name || "عزيزي المستخدم";
  const slide = SLIDES[slideIdx];
  const quickTechnicians = quickServiceId
    ? (quickTechOptions.length > 0 ? quickTechOptions : technicians.filter((tech) => tech.service_id === quickServiceId || tech.service?.id === quickServiceId))
    : technicians;

  const submitQuickRequest = async () => {
    const serviceId = quickServiceId;
    const technicianId = quickTechId || quickTechnicians[0]?.id;
    const amount = Number(quickAmount);
    if (!serviceId || !technicianId || !quickProvince || !quickAddress || !quickDate || !quickTime || !quickDesc || !amount) {
      Alert.alert("تنبيه", "اكمل بيانات طلب الخدمة السريع");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(quickDate) || !/^\d{1,2}:\d{2}$/.test(quickTime)) {
      Alert.alert("تنبيه", "اكتب التاريخ 2026-05-02 والوقت 10:00");
      return;
    }
    setQuickSubmitting(true);
    try {
      await createServiceRequest({
        service_type: serviceId,
        craftsman_id: technicianId,
        province: quickProvince,
        address: quickAddress,
        date: quickDate,
        time: quickTime.padStart(5, "0"),
        requested_amount: amount,
        problem_description: quickDesc,
        payment_method: "cash",
      });
      Alert.alert("تم", "تم إرسال طلب الخدمة بنجاح");
      setQuickProvince("");
      setQuickAddress("");
      setQuickDate("");
      setQuickTime("");
      setQuickAmount("");
      setQuickDesc("");
    } catch (e: any) {
      Alert.alert("خطأ", e?.message || "فشل إرسال الطلب");
    } finally {
      setQuickSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchData(); }}
          tintColor={colors.primary}
        />
      }
    >
      {/* ══════════════ HERO SECTION ══════════════ */}
      <ImageBackground
        source={slide.image}
        style={styles.hero}
        resizeMode="cover"
        imageStyle={{ width: '100%', height: '100%' }}
      >
        {/* Overlay gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(11, 30, 51, 0.95)', '#0B1E33']}
          locations={[0, 0.6, 1]}
          style={styles.heroOverlay}
        />
        <Animated.View style={[styles.heroContent, { opacity: fadeAnim }]}>
          <Text style={styles.heroTitle}>{slide.title}</Text>
          <Text style={styles.heroDesc}>{slide.desc}</Text>
          <View style={styles.heroBtns}>
            <Pressable
              style={({ pressed }) => [styles.btnHero, pressed && { opacity: 0.85 }]}
              onPress={() => tabNavigation.navigate("Services")}
            >
              <Text style={styles.btnHeroText}>اطلب الآن</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btnOutline, pressed && { opacity: 0.85 }]}
              onPress={() => navigation.navigate("Home" as never)}
            >
              <Text style={styles.btnOutlineText}>اقرأ اكثر</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Slide dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Pressable key={i} onPress={() => setSlideIdx(i)}>
              <View style={[styles.dot, i === slideIdx && styles.dotActive]} />
            </Pressable>
          ))}
        </View>

        {/* Welcome badge */}
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>أهلاً، {displayName} 👋</Text>
        </View>
      </ImageBackground>

      {/* ══════════════ INFO CARDS (Web Style) ══════════════ */}
      <View style={styles.webCardsRow}>
        {WEB_CARDS.map((item, idx) => (
          <View key={idx} style={styles.webCardItem}>
            <View style={styles.webCardIconWrap}>
              <Text style={styles.webCardIcon}>{item.icon}</Text>
            </View>
            <View style={styles.webCardTextWrap}>
              <Text style={styles.webCardTitle}>{item.title}</Text>
              <Text style={styles.webCardDesc}>{item.text}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ══════════════ QUICK ACTIONS CARDS ══════════════ */}
      <View style={styles.cardsRow}>
        {[
          { icon: "🔧", label: "طلب خدمة",  tab: "Services" as const, color: "#EBF5FB" },
          { icon: "📋", label: "طلباتي",    tab: "Orders"   as const, color: "#FFF8E1" },
          { icon: "💰", label: "المحفظة",   tab: "Wallet"   as const, color: "#E8F5E9" },
          { icon: "👤", label: "حسابي",     tab: "Profile"  as const, color: "#EDE7F6" },
        ].map((item) => (
          <Pressable
            key={item.tab}
            style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}
            onPress={() => tabNavigation.navigate(item.tab)}
          >
            <View style={[styles.quickIconWrap, { backgroundColor: item.color }]}>
              <Text style={styles.quickIconText}>{item.icon}</Text>
            </View>
            <Text style={styles.quickLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.body}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeKicker}>مرحباً بك في صنايعي</Text>
          <Text style={styles.welcomeTitle}>أهلاً، {displayName}</Text>
          <Text style={styles.welcomeText}>
            {userType === "admin"
              ? "لوحة الإدارة جاهزة لمتابعة المستخدمين والطلبات والمراجعات من الموبايل."
              : "اختار خدمة، تابع طلباتك، وابدأ حجزك في خطوات بسيطة."}
          </Text>
          {userType === "admin" ? (
            <Pressable style={styles.welcomeBtn} onPress={() => tabNavigation.navigate("Admin")}>
              <Text style={styles.welcomeBtnText}>فتح لوحة الإدارة</Text>
            </Pressable>
          ) : null}
        </View>

        {/* ══════════════ SERVICES SECTION ══════════════ */}
        {services.length > 0 && (
          <View style={styles.servicesSection}>
            <View style={styles.servicesHeading}>
              <Text style={styles.servicesEyebrow}>خدماتنا</Text>
              <Text style={styles.servicesTitle}>اختر الخدمة اللي تناسبك</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.servicesRail}
            >
              {services.map((item) => (
                <ServiceCardItem
                  key={item.id}
                  service={item}
                  variant="homeCompact"
                  onPress={() => tabNavigation.navigate("Services")}
                />
              ))}
            </ScrollView>
            <Pressable
              style={styles.servicesCta}
              onPress={() => tabNavigation.navigate("Services")}
            >
              <Text style={styles.servicesCtaText}>عرض كل الخدمات</Text>
            </Pressable>
          </View>
        )}

        {userType !== "admin" && services.length > 0 && (
          <View style={styles.quickRequestSection}>
            <View style={styles.servicesHeading}>
              <Text style={styles.servicesEyebrow}>طلب خدمة</Text>
              <Text style={[styles.servicesTitle, { color: colors.textHeading }]}>اطلب صنايعي من الصفحة الرئيسية</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPills}>
              {services.map((service) => (
                <Pressable
                  key={service.id}
                  style={[styles.quickPill, quickServiceId === service.id && styles.quickPillActive]}
                  onPress={() => { setQuickServiceId(service.id); setQuickTechId(null); }}
                >
                  <Text style={[styles.quickPillText, quickServiceId === service.id && styles.quickPillTextActive]}>{service.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPills}>
              {quickTechnicians.slice(0, 10).map((tech) => (
                <Pressable
                  key={tech.id}
                  style={[styles.techPill, (quickTechId || quickTechnicians[0]?.id) === tech.id && styles.quickPillActive]}
                  onPress={() => setQuickTechId(tech.id)}
                >
                  <Text style={[styles.quickPillText, (quickTechId || quickTechnicians[0]?.id) === tech.id && styles.quickPillTextActive]}>{tech.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput style={styles.quickInput} value={quickProvince} onChangeText={setQuickProvince} placeholder="المحافظة" placeholderTextColor={colors.textMuted} textAlign="right" />
            <TextInput style={styles.quickInput} value={quickAddress} onChangeText={setQuickAddress} placeholder="العنوان بالتفصيل" placeholderTextColor={colors.textMuted} textAlign="right" />
            <View style={styles.quickRow}>
              <TextInput style={[styles.quickInput, styles.quickFlex]} value={quickTime} onChangeText={setQuickTime} placeholder="10:00" placeholderTextColor={colors.textMuted} textAlign="right" />
              <TextInput style={[styles.quickInput, styles.quickFlex]} value={quickDate} onChangeText={setQuickDate} placeholder="2026-05-02" placeholderTextColor={colors.textMuted} textAlign="right" />
            </View>
            <TextInput style={styles.quickInput} value={quickAmount} onChangeText={setQuickAmount} placeholder="الميزانية المتوقعة" placeholderTextColor={colors.textMuted} keyboardType="numeric" textAlign="right" />
            <TextInput style={[styles.quickInput, styles.quickArea]} value={quickDesc} onChangeText={setQuickDesc} placeholder="وصف المشكلة" placeholderTextColor={colors.textMuted} multiline textAlign="right" />
            <Pressable style={[styles.quickSubmit, quickSubmitting && { opacity: 0.6 }]} onPress={submitQuickRequest} disabled={quickSubmitting}>
              <Text style={styles.quickSubmitText}>{quickSubmitting ? "جاري الإرسال..." : "إرسال طلب الخدمة"}</Text>
            </Pressable>
          </View>
        )}

        {/* ══════════════ FEATURED TECHNICIANS ══════════════ */}
        {technicians.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionEyebrowRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>الأكثر طلباً</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>نخبة الفنيين المتميزين</Text>
            <Text style={styles.sectionSubtitle}>
              أمهر الفنيين وأعلاهم تقييماً الذين أثبتوا كفاءتهم بأعمال منجزة في المنصة
            </Text>
            {technicians.map((tech) => (
              <TechCard
                key={tech.id}
                tech={tech}
                onPress={() => navigation.navigate("TechnicianDetail", { id: tech.id })}
                onRequest={() => navigation.navigate("ServiceRequest", {
                  technicianId: tech.id,
                  technicianName: tech.name ?? "صنايعي",
                  serviceId: tech.service_id,
                })}
                style={{ marginBottom: spacing.md }}
              />
            ))}
            <Pressable
              style={styles.ctaBtnOutline}
              onPress={() => tabNavigation.navigate("Services")}
            >
              <Text style={styles.ctaBtnOutlineText}>المزيد من الصنايعية</Text>
            </Pressable>
          </View>
        )}

        {/* ══════════════ WHY SANAYEI ══════════════ */}
        <View style={styles.whySectionContainer}>
          <View style={styles.whyTextWrap}>
            <Text style={styles.whyHeading}>ليه تثق في <Text style={styles.whyHeadingHighlight}>“صنايعي”</Text>؟</Text>
            <Text style={styles.whyParagraph}>
              لأنك بتتعامل مع منصة متكاملة بتجمع أحسن الصنايعية والشركات، وبتوفرلك طلب خدمات من محترفين مع إمكانية شراء أحدث المنتجات والمعدات من مكان واحد وموثوق.
            </Text>
          </View>
          
          <View style={styles.whyGrid}>
            {WHY_STATS.map((stat, idx) => (
              <View key={idx} style={styles.whyCard}>
                <View style={styles.whyIconWrap}>
                  <Text style={styles.whyIcon}>{stat.icon}</Text>
                </View>
                <View style={styles.whyStatContent}>
                  <Text style={styles.whyValue}>{stat.value}</Text>
                  <Text style={styles.whyTitle}>{stat.title}</Text>
                  <Text style={styles.whyDesc}>{stat.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ══════════════ CRAFTSMAN CTA ══════════════ */}
        {userType === "craftsman" && (
          <LinearGradient colors={["#0B1E33", "#1a3a5c"]} style={styles.craftsmanCta}>
            <Text style={styles.ctaTitle}>مرحباً في لوحتك 🔧</Text>
            <Text style={styles.ctaText}>
              ستجد طلبات العملاء الواردة إليك في قسم "طلباتي"
            </Text>
            <Pressable
              style={styles.ctaHeroBtn}
              onPress={() => tabNavigation.navigate("Orders")}
            >
              <Text style={styles.ctaHeroBtnText}>عرض الطلبات الواردة</Text>
            </Pressable>
          </LinearGradient>
        )}

        <View style={{ height: spacing.xl }} />
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgSection },

  // ── Hero
  hero: {
    minHeight: 400,
    paddingTop: spacing.xxl + spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    position: "relative",
    justifyContent: "flex-end",
    backgroundColor: colors.navyDeep,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: { gap: spacing.md, zIndex: 2, alignItems: 'flex-end', paddingTop: spacing.xl },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontFamily: typography.bold,
    textAlign: "right",
    lineHeight: 38,
  },
  heroDesc: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
    fontFamily: typography.semiBold,
    textAlign: "right",
    lineHeight: 24,
  },
  heroBtns: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  btnHero: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    boxShadow: `0 4px 10px ${colors.primary}66`,
    elevation: 5,
  },
  btnHeroText: {
    color: "#FFF",
    fontFamily: typography.bold,
    fontSize: 16,
  },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.8)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  btnOutlineText: {
    color: "#FFF",
    fontFamily: typography.semiBold,
    fontSize: 16,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 22,
    borderRadius: 4,
  },
  heroBadge: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    backgroundColor: "rgba(95,168,211,0.2)",
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(95,168,211,0.4)",
  },
  heroBadgeText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: typography.small,
    fontFamily: typography.semiBold,
  },

  // ── Web Info Cards Row
  webCardsRow: {
    flexDirection: "column",
    gap: spacing.md,
    backgroundColor: colors.bgApp,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  webCardItem: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  webCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: "rgba(95,168,211,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  webCardIcon: { fontSize: 20 },
  webCardTextWrap: { flex: 1, alignItems: "flex-end" },
  webCardTitle: {
    fontFamily: typography.bold,
    fontSize: 16,
    color: colors.textHeading,
    marginBottom: 4,
  },
  webCardDesc: {
    fontFamily: typography.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 20,
  },

  // ── Quick action cards row
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.bgSection,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    boxShadow: "0 2px 8px rgba(11,30,51,0.05)",
    elevation: 3,
  },
  quickCard: {
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  quickIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  quickIconText: { fontSize: 20 },
  quickLabel: {
    fontFamily: typography.semiBold,
    fontSize: 11,
    color: colors.textHeading,
    textAlign: "center",
  },
  pressed: { opacity: 0.75 },

  // ── Body
  body: { padding: spacing.lg, gap: spacing.xl },

  welcomeCard: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    boxShadow: "0 2px 10px rgba(11,30,51,0.06)",
  },
  welcomeKicker: {
    fontFamily: typography.semiBold,
    fontSize: typography.small,
    color: colors.primary,
    textAlign: "right",
  },
  welcomeTitle: {
    fontFamily: typography.bold,
    fontSize: 20,
    color: colors.textHeading,
    textAlign: "right",
  },
  welcomeText: {
    fontFamily: typography.regular,
    fontSize: typography.body,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 22,
  },
  welcomeBtn: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  welcomeBtnText: {
    fontFamily: typography.bold,
    fontSize: typography.small,
    color: "#FFF",
  },

  // ── Sections
  section: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
    boxShadow: "0 2px 10px rgba(11,30,51,0.06)",
    elevation: 3,
  },
  sectionEyebrowRow: { flexDirection: "row", justifyContent: "flex-end" },
  sectionEyebrow: {
    color: colors.primary,
    fontFamily: typography.bold,
    fontSize: typography.small,
    textAlign: "right",
  },
  sectionTitle: {
    fontFamily: typography.bold,
    fontSize: 20,
    color: colors.textHeading,
    textAlign: "right",
    lineHeight: 28,
  },
  sectionSubtitle: {
    fontFamily: typography.regular,
    fontSize: typography.small,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 20,
  },

  // ── Home services rail (web-inspired compact cards)
  servicesSection: {
    backgroundColor: colors.navyDeep,
    borderRadius: radius.card,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    overflow: "hidden",
    boxShadow: "0 8px 16px rgba(11,30,51,0.16)",
    elevation: 5,
  },
  servicesHeading: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  servicesEyebrow: {
    color: colors.primary,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  servicesTitle: {
    fontFamily: typography.bold,
    fontSize: 20,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 28,
  },
  servicesRail: {
    flexDirection: "row-reverse",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: "stretch",
  },
  servicesCta: {
    alignSelf: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  servicesCtaText: {
    color: "#FFF",
    fontFamily: typography.bold,
    fontSize: typography.body,
  },

  quickRequestSection: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    boxShadow: "0 2px 10px rgba(11,30,51,0.06)",
  },
  quickPills: {
    flexDirection: "row-reverse",
    gap: spacing.sm,
  },
  quickPill: {
    backgroundColor: colors.bgSection,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  techPill: {
    backgroundColor: colors.bgSection,
    borderRadius: radius.cardSm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  quickPillActive: {
    backgroundColor: colors.navyDeep,
    borderColor: colors.navyDeep,
  },
  quickPillText: {
    fontFamily: typography.semiBold,
    fontSize: typography.small,
    color: colors.textMuted,
  },
  quickPillTextActive: {
    color: colors.white,
  },
  quickInput: {
    backgroundColor: colors.bgSection,
    borderRadius: radius.cardSm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textBase,
    fontFamily: typography.regular,
  },
  quickArea: {
    minHeight: 86,
    textAlignVertical: "top",
  },
  quickRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  quickFlex: { flex: 1 },
  quickSubmit: {
    backgroundColor: colors.primary,
    borderRadius: radius.cardSm,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  quickSubmitText: {
    color: colors.white,
    fontFamily: typography.bold,
    fontSize: typography.body,
  },

  // ── CTA Buttons
  ctaBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  ctaBtnText: {
    color: "#FFF",
    fontFamily: typography.bold,
    fontSize: typography.body,
  },
  ctaBtnOutline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
    backgroundColor: "#EBF5FB",
  },
  ctaBtnOutlineText: {
    color: colors.primary,
    fontFamily: typography.bold,
    fontSize: typography.body,
  },

  // ── Tech cards
  badge: {
    backgroundColor: "#FFF8E1",
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#FFC107",
  },
  badgeText: {
    color: "#F59E0B",
    fontFamily: typography.bold,
    fontSize: 11,
  },
  techCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.bgSection,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  techAvatar: {
    width: 50,
    height: 50,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  techAvatarText: {
    color: "#FFF",
    fontFamily: typography.bold,
    fontSize: 20,
  },
  techInfo: { flex: 1, gap: 3 },
  techName: {
    fontFamily: typography.bold,
    fontSize: typography.body,
    color: colors.textHeading,
    textAlign: "right",
  },
  techMeta: {
    fontFamily: typography.regular,
    fontSize: typography.small,
    color: colors.textMuted,
    textAlign: "right",
  },
  techPrice: {
    fontFamily: typography.semiBold,
    fontSize: typography.small,
    color: colors.primary,
    textAlign: "right",
  },
  techRatingBadge: {
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: "#FFC107",
  },
  techRatingStar: { fontSize: 12 },
  techRatingVal: {
    fontFamily: typography.bold,
    fontSize: 13,
    color: "#F59E0B",
  },

  // ── Why Sanayei (Web Style)
  whySectionContainer: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.xl,
    boxShadow: "0 2px 10px rgba(11,30,51,0.06)",
    elevation: 3,
  },
  whyTextWrap: {
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  whyHeading: {
    fontFamily: typography.bold,
    fontSize: 26,
    color: colors.primary,
    textAlign: "right",
  },
  whyHeadingHighlight: {
    color: colors.textHeading,
  },
  whyParagraph: {
    fontFamily: typography.regular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textMuted,
    textAlign: "right",
  },
  whyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  whyCard: {
    width: "47%",
    backgroundColor: colors.bgSection,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "flex-end",
  },
  whyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: "rgba(95,168,211,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  whyIcon: { fontSize: 20 },
  whyStatContent: {
    alignItems: "flex-end",
  },
  whyValue: {
    fontFamily: typography.bold,
    fontSize: 22,
    color: colors.textHeading,
  },
  whyTitle: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: colors.textHeading,
    textAlign: "right",
    marginTop: 4,
  },
  whyDesc: {
    fontFamily: typography.regular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "right",
    lineHeight: 18,
    marginTop: 4,
  },

  // ── Craftsman CTA
  craftsmanCta: {
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: "flex-end",
  },
  ctaTitle: {
    fontFamily: typography.bold,
    fontSize: 20,
    color: "#FFF",
    textAlign: "right",
  },
  ctaText: {
    fontFamily: typography.regular,
    fontSize: typography.body,
    color: "rgba(255,255,255,0.75)",
    textAlign: "right",
    lineHeight: 22,
  },
  ctaHeroBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    alignSelf: "stretch",
  },
  ctaHeroBtnText: {
    fontFamily: typography.bold,
    fontSize: typography.body,
    color: "#FFF",
  },
});
