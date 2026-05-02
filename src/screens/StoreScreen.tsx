// ─────────────────────────────────────────────────────────────────────────────
// StoreScreen — Mobile store matching web Store page
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, Image, RefreshControl, ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen } from "../components/Screen";
import { LoadingState, EmptyState, ErrorState } from "../components/StateViews";
import { spacing, typography, radius } from "../theme";
import { useTheme } from "../providers/ThemeProvider";
import { api as client } from "../api/client";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  image?: string;
  category?: { name: string } | string;
  stock?: number;
}

const CATEGORY_ALL = "الكل";

export function StoreScreen() {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors);
  const navigation = useNavigation<Nav>();
  const [products, setProducts]   = useState<Product[]>([]);
  const [search, setSearch]       = useState("");
  const [catFilter, setCat]       = useState(CATEGORY_ALL);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [refreshing, setRefresh]  = useState(false);

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await client.get("/store/products?per_page=50");
      const data = res.data?.data ?? res.data ?? [];
      setProducts(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "تعذر تحميل المتجر");
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ─── Categories
  const categories = [
    CATEGORY_ALL,
    ...Array.from(new Set(
      products.map((p) =>
        typeof p.category === "object" && p.category !== null
          ? (p.category as any).name
          : (p.category as string) ?? ""
      ).filter(Boolean)
    )),
  ];

  const filtered = products.filter((p) => {
    const catName = typeof p.category === "object" && p.category !== null
      ? (p.category as any).name : p.category;
    const matchCat = catFilter === CATEGORY_ALL || catName === catFilter;
    const matchSearch = !search || p.name.includes(search) || (p.description ?? "").includes(search);
    return matchCat && matchSearch;
  });

  if (loading) return <LoadingState message="جاري تحميل المتجر..." />;
  if (error)   return <ErrorState message={error} onRetry={() => load()} />;

  return (
    <Screen scrollable={false} noPadding>
      {/* ── Search bar ── */}
      <View style={s.searchBar}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="ابحث في المنتجات..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          textAlign="right"
        />
      </View>

      {/* ── Category chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.catScroll}
        contentContainerStyle={s.catList}
      >
        {categories.map((cat) => {
          const active = catFilter === cat;
          return (
            <Pressable
              key={cat}
              style={[s.chip, active && s.chipActive]}
              onPress={() => setCat(cat)}
            >
              <Text style={[s.chipText, active && s.chipTextActive]}>{cat}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Products grid ── */}
      {filtered.length === 0 ? (
        <EmptyState message="لا توجد منتجات في هذا القسم" icon="🛒" />
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.grid}
          columnWrapperStyle={s.row}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefresh(true); load(true); }}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [s.card, pressed && s.pressed]}
              onPress={() => navigation.navigate("ProductDetail", { id: item.id })}
            >
              {/* Product image */}
              <View style={s.imgBox}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={s.img} resizeMode="cover" />
                ) : (
                  <View style={s.imgPlaceholder}>
                    <Text style={s.imgEmoji}>🔩</Text>
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={s.cardBody}>
                <Text style={s.productName} numberOfLines={2}>{item.name}</Text>
                {item.category ? (
                  <Text style={s.category}>
                    {typeof item.category === "object"
                      ? (item.category as any).name
                      : item.category}
                  </Text>
                ) : null}
                <View style={s.priceRow}>
                  <Text style={s.price}>{Number(item.price).toFixed(0)} ج</Text>
                  {(item.stock ?? 1) > 0 ? (
                    <View style={s.stockBadge}>
                      <Text style={s.stockText}>متوفر</Text>
                    </View>
                  ) : (
                    <View style={[s.stockBadge, s.outStock]}>
                      <Text style={s.stockText}>نفذ</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  searchBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontFamily: typography.regular,
    fontSize: typography.body,
    color: colors.textBase,
    paddingVertical: spacing.sm + 2,
  },
  catScroll: { flexGrow: 0, backgroundColor: colors.white },
  catList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.borderMedium,
    backgroundColor: colors.bgSection,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { fontFamily: typography.semiBold, fontSize: typography.small, color: colors.textMuted },
  chipTextActive: { color: colors.white },
  grid: { padding: spacing.md, paddingBottom: spacing.xxl },
  row: { gap: spacing.md, justifyContent: "space-between" },
  card: {
    flex: 0.48,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    marginBottom: spacing.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
    boxShadow: "0 2px 8px rgba(11,30,51,0.06)",
  },
  pressed: { opacity: 0.85 },
  imgBox: { width: "100%", aspectRatio: 1, backgroundColor: colors.bgSection },
  img: { width: "100%", height: "100%" },
  imgPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EBF4FB",
  },
  imgEmoji: { fontSize: 40 },
  cardBody: { padding: spacing.sm, gap: spacing.xs },
  productName: {
    fontFamily: typography.bold,
    fontSize: typography.small,
    color: colors.textHeading,
    textAlign: "right",
    lineHeight: 18,
  },
  category: {
    fontFamily: typography.regular,
    fontSize: typography.tiny,
    color: colors.primary,
    textAlign: "right",
  },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  price: { fontFamily: typography.bold, fontSize: typography.body, color: colors.navyDeep },
  stockBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  outStock: { backgroundColor: "#FFEBEE" },
  stockText: { fontFamily: typography.semiBold, fontSize: 10, color: colors.textMuted },
});
