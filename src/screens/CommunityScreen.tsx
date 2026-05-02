import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen } from "../components/Screen";
import { EmptyState, ErrorState } from "../components/StateViews";
import { getBlogCategories, getBlogPosts } from "../api/blog";
import { acceptCommunityOffer, createCommunityPost, getCommunityOffers, getCommunityPosts, submitCommunityOffer } from "../api/community";
import { getServices, type Service } from "../api/services";
import { useAuth } from "../auth/AuthContext";
import { radius, spacing, typography } from "../theme";
import { useTheme } from "../providers/ThemeProvider";

type Mode = "market" | "offers" | "blog" | "create";

const MODES: Array<{ key: Mode; label: string; icon: string }> = [
  { key: "market", label: "سوق الطلبات", icon: "🧰" },
  { key: "offers", label: "العروض", icon: "💬" },
  { key: "blog", label: "المدونة", icon: "📝" },
  { key: "create", label: "طلب جديد", icon: "➕" },
];

export function CommunityScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { userType } = useAuth();
  const [mode, setMode] = useState<Mode>("market");
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [postForm, setPostForm] = useState({
    title: "",
    description: "",
    service_id: "",
    location: "",
    budget_min: "",
    budget_max: "",
    urgency: "normal",
  });
  const [offerForm, setOfferForm] = useState({ price: "", delivery_days: "1", description: "" });

  const load = useCallback(async (spinner = true) => {
    if (spinner) setLoading(true);
    try {
      const [postRows, blogPayload, serviceRows, categoryRows] = await Promise.all([
        getCommunityPosts({ search: search || undefined }),
        getBlogPosts({ per_page: 12, search: mode === "blog" ? search || undefined : undefined }),
        getServices(),
        getBlogCategories(),
      ]);
      setPosts(postRows);
      setBlogPosts(blogPayload.posts);
      setFeatured(blogPayload.featured);
      setServices(serviceRows);
      setCategories(categoryRows);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "تعذر تحميل سوق الطلبات");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mode, search]);

  useEffect(() => { load(); }, [load]);

  const openOffers = async (post: any) => {
    setSelectedPost(post);
    setMode("offers");
    setLoading(true);
    try {
      setOffers(await getCommunityOffers(post.id));
    } catch {
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOffer = async () => {
    if (!selectedPost) return;
    const price = Number(offerForm.price);
    const days = Number(offerForm.delivery_days);
    if (!price || !days || !offerForm.description.trim()) {
      Alert.alert("تنبيه", "اكتب السعر والمدة ووصف العرض");
      return;
    }
    try {
      await submitCommunityOffer(selectedPost.id, { price, delivery_days: days, description: offerForm.description.trim() });
      Alert.alert("تم", "تم إرسال عرضك بنجاح");
      setOfferForm({ price: "", delivery_days: "1", description: "" });
      setOffers(await getCommunityOffers(selectedPost.id));
    } catch (e: any) {
      Alert.alert("خطأ", e?.response?.data?.message || e?.message || "فشل إرسال العرض");
    }
  };

  const handleCreatePost = async () => {
    if (!postForm.title || !postForm.description || !postForm.service_id || !postForm.location) {
      Alert.alert("تنبيه", "اكتب العنوان والوصف والخدمة والموقع");
      return;
    }
    try {
      await createCommunityPost(postForm);
      Alert.alert("تم", "تم نشر طلبك في سوق الطلبات");
      setPostForm({ title: "", description: "", service_id: "", location: "", budget_min: "", budget_max: "", urgency: "normal" });
      setMode("market");
      await load(false);
    } catch (e: any) {
      Alert.alert("خطأ", e?.response?.data?.message || e?.message || "فشل نشر الطلب");
    }
  };

  const visibleBlog = useMemo(() => [...featured, ...blogPosts].filter((item, index, arr) => arr.findIndex((p) => p.id === item.id) === index), [featured, blogPosts]);

  if (error) return <ErrorState message={error} onRetry={() => load()} />;

  return (
    <Screen noPadding>
      <View style={styles.hero}>
        <Text style={styles.kicker}>سوق الطلبات والمدونة</Text>
        <Text style={styles.heroTitle}>اطرح طلبك، استقبل العروض، واتعلم قبل ما تبدأ</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
        {MODES.map((item) => (
          <Pressable key={item.key} style={[styles.tab, mode === item.key && styles.tabActive]} onPress={() => setMode(item.key)}>
            <Text>{item.icon}</Text>
            <Text style={[styles.tabText, mode === item.key && styles.tabTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.body}>
        {mode !== "create" && (
          <TextInput value={search} onChangeText={setSearch} placeholder="ابحث..." placeholderTextColor={colors.textMuted} style={styles.search} textAlign="right" />
        )}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : mode === "market" ? (
          <FlatList
            data={posts}
            keyExtractor={(item) => String(item.id)}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(false); }} />}
            ListEmptyComponent={<EmptyState message="لا توجد طلبات حالياً" icon="🧰" />}
            renderItem={({ item }) => <PostCard post={item} onOffers={() => openOffers(item)} />}
          />
        ) : mode === "offers" ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedPost ? <Text style={styles.sectionTitle}>عروض: {selectedPost.title}</Text> : <Text style={styles.sectionTitle}>اختر طلباً من السوق لعرض عروضه</Text>}
            {userType === "craftsman" && selectedPost ? (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>قدم عرضك</Text>
                <TextInput style={styles.input} value={offerForm.price} onChangeText={(v) => setOfferForm((p) => ({ ...p, price: v }))} placeholder="السعر" keyboardType="numeric" textAlign="right" />
                <TextInput style={styles.input} value={offerForm.delivery_days} onChangeText={(v) => setOfferForm((p) => ({ ...p, delivery_days: v }))} placeholder="مدة التنفيذ بالأيام" keyboardType="numeric" textAlign="right" />
                <TextInput style={[styles.input, styles.textArea]} value={offerForm.description} onChangeText={(v) => setOfferForm((p) => ({ ...p, description: v }))} placeholder="اشرح عرضك..." multiline textAlign="right" />
                <PrimaryButton label="إرسال العرض" onPress={handleSubmitOffer} />
              </View>
            ) : null}
            {offers.length === 0 ? <EmptyState message="لا توجد عروض بعد" icon="💬" /> : offers.map((offer) => (
              <View key={offer.id} style={styles.card}>
                <Text style={styles.cardTitle}>{offer.craftsman?.name || "صنايعي"}</Text>
                <Text style={styles.cardText}>{offer.description}</Text>
                <Text style={styles.cardMeta}>{offer.price} ج • {offer.delivery_days} يوم • {offer.status}</Text>
                {selectedPost?.is_mine ? <PrimaryButton label="قبول العرض" onPress={() => acceptCommunityOffer(selectedPost.id, offer.id)} /> : null}
              </View>
            ))}
          </ScrollView>
        ) : mode === "blog" ? (
          <FlatList
            data={visibleBlog}
            keyExtractor={(item) => String(item.id)}
            ListHeaderComponent={categories.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>{categories.map((cat) => <Text key={cat.id} style={styles.categoryPill}>{cat.name}</Text>)}</ScrollView> : null}
            ListEmptyComponent={<EmptyState message="لا توجد مقالات" icon="📝" />}
            renderItem={({ item }) => <BlogCard post={item} />}
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>انشر طلب في سوق الطلبات</Text>
              <TextInput style={styles.input} value={postForm.title} onChangeText={(v) => setPostForm((p) => ({ ...p, title: v }))} placeholder="عنوان الطلب" textAlign="right" />
              <TextInput style={[styles.input, styles.textArea]} value={postForm.description} onChangeText={(v) => setPostForm((p) => ({ ...p, description: v }))} placeholder="تفاصيل الطلب" multiline textAlign="right" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serviceRail}>
                {services.map((service) => (
                  <Pressable key={service.id} style={[styles.servicePill, postForm.service_id === String(service.id) && styles.servicePillActive]} onPress={() => setPostForm((p) => ({ ...p, service_id: String(service.id) }))}>
                    <Text style={[styles.servicePillText, postForm.service_id === String(service.id) && styles.servicePillTextActive]}>{service.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <TextInput style={styles.input} value={postForm.location} onChangeText={(v) => setPostForm((p) => ({ ...p, location: v }))} placeholder="الموقع" textAlign="right" />
              <View style={styles.twoCols}>
                <TextInput style={[styles.input, styles.flex]} value={postForm.budget_max} onChangeText={(v) => setPostForm((p) => ({ ...p, budget_max: v }))} placeholder="أقصى ميزانية" keyboardType="numeric" textAlign="right" />
                <TextInput style={[styles.input, styles.flex]} value={postForm.budget_min} onChangeText={(v) => setPostForm((p) => ({ ...p, budget_min: v }))} placeholder="أقل ميزانية" keyboardType="numeric" textAlign="right" />
              </View>
              <PrimaryButton label="نشر الطلب" onPress={handleCreatePost} />
            </View>
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

function PostCard({ post, onOffers }: { post: any; onOffers: () => void }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.status}>{post.status || "open"}</Text>
        <Text style={styles.cardTitle}>{post.title}</Text>
      </View>
      <Text style={styles.cardText} numberOfLines={3}>{post.description}</Text>
      <Text style={styles.cardMeta}>{post.service?.name || post.category || "خدمة"} • {post.location || "الموقع غير محدد"} • {post.offers_count ?? 0} عروض</Text>
      <PrimaryButton label="عرض العروض" onPress={onOffers} />
    </View>
  );
}

function BlogCard({ post }: { post: any }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{post.title}</Text>
      <Text style={styles.cardText} numberOfLines={3}>{post.excerpt || post.summary || stripHtml(post.content || "")}</Text>
      <Text style={styles.cardMeta}>{post.category?.name || "مقال"} • {post.published_at || post.created_at || ""}</Text>
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <Pressable style={styles.primaryBtn} onPress={onPress}>
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const getStyles = (colors: any) => StyleSheet.create({
  hero: { backgroundColor: colors.navyDeep, padding: spacing.lg, gap: spacing.xs },
  kicker: { color: colors.primary, fontFamily: typography.semiBold, fontSize: typography.small, textAlign: "right" },
  heroTitle: { color: colors.white, fontFamily: typography.bold, fontSize: 20, textAlign: "right", lineHeight: 28 },
  tabs: { flexGrow: 0, backgroundColor: colors.bgApp, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  tabsContent: { flexDirection: "row-reverse", gap: spacing.sm, padding: spacing.md },
  tab: { flexDirection: "row-reverse", gap: spacing.xs, alignItems: "center", backgroundColor: colors.bgSection, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  tabActive: { backgroundColor: colors.navyDeep },
  tabText: { fontFamily: typography.semiBold, color: colors.textMuted, fontSize: typography.small },
  tabTextActive: { color: colors.white },
  body: { flex: 1, padding: spacing.lg, backgroundColor: colors.bgSection, gap: spacing.md },
  search: { backgroundColor: colors.bgApp, borderRadius: radius.full, borderWidth: 1, borderColor: colors.borderLight, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, fontFamily: typography.regular, color: colors.textBase, marginBottom: spacing.md },
  sectionTitle: { fontFamily: typography.bold, color: colors.textHeading, fontSize: typography.h4, textAlign: "right", marginBottom: spacing.md },
  card: { backgroundColor: colors.bgApp, borderRadius: radius.card, padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.borderLight, boxShadow: "0 2px 10px rgba(11,30,51,0.06)" },
  cardHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  status: { backgroundColor: "#E8F5E9", color: colors.success, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, fontFamily: typography.bold, fontSize: typography.tiny },
  cardTitle: { flex: 1, fontFamily: typography.bold, color: colors.textHeading, fontSize: typography.h4, textAlign: "right" },
  cardText: { fontFamily: typography.regular, color: colors.textMuted, fontSize: typography.body, lineHeight: 22, textAlign: "right" },
  cardMeta: { fontFamily: typography.semiBold, color: colors.primary, fontSize: typography.small, textAlign: "right" },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.cardSm, paddingVertical: spacing.sm, alignItems: "center", marginTop: spacing.xs },
  primaryText: { fontFamily: typography.bold, color: colors.white, fontSize: typography.body },
  formCard: { backgroundColor: colors.bgApp, borderRadius: radius.card, padding: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
  formTitle: { fontFamily: typography.bold, color: colors.textHeading, fontSize: typography.h4, textAlign: "right" },
  input: { backgroundColor: colors.bgSection, borderRadius: radius.cardSm, borderWidth: 1, borderColor: colors.borderLight, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.textBase, fontFamily: typography.regular },
  textArea: { minHeight: 96, textAlignVertical: "top" },
  serviceRail: { flexDirection: "row-reverse", gap: spacing.sm },
  servicePill: { borderRadius: radius.full, backgroundColor: colors.bgSection, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.borderLight },
  servicePillActive: { backgroundColor: colors.navyDeep, borderColor: colors.navyDeep },
  servicePillText: { fontFamily: typography.semiBold, color: colors.textMuted, fontSize: typography.small },
  servicePillTextActive: { color: colors.white },
  twoCols: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
  categories: { flexDirection: "row-reverse", gap: spacing.sm, paddingBottom: spacing.md },
  categoryPill: { backgroundColor: colors.bgApp, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.primary, fontFamily: typography.semiBold, overflow: "hidden" },
});
