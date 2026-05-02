// ─────────────────────────────────────────────────────────────────────────────
// ProductDetailScreen — Full product detail matching web ProductDetails page
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, Image, ScrollView,
  Pressable, Alert, ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Screen } from "../components/Screen";
import { Button } from "../components/Button";
import { spacing, typography, radius } from "../theme";
import { useTheme } from "../providers/ThemeProvider";
import { api as client } from "../api/client";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { firstMediaUrl } from "../utils/media";

type RouteT = RouteProp<RootStackParamList, "ProductDetail">;
type NavT   = NativeStackNavigationProp<RootStackParamList>;

export function ProductDetailScreen() {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors);
  const route      = useRoute<RouteT>();
  const navigation = useNavigation<NavT>();
  const { id }     = route.params;

  const [product, setProduct]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [qty, setQty]           = useState(1);
  const [adding, setAdding]     = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    client.get(`/store/products/${id}`)
      .then((res: any) => {
        setProduct(res.data?.data ?? res.data);
      })
      .catch((e: any) => setError(e?.message || "تعذر تحميل المنتج"))
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = async () => {
    setAdding(true);
    try {
      await client.post("/store/cart", { product_id: id, quantity: qty });
      Alert.alert("✅ تمت الإضافة", "تم إضافة المنتج للسلة بنجاح");
    } catch (e: any) {
      Alert.alert("خطأ", e?.response?.data?.message || "فشل إضافة المنتج");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error || !product) {
    return (
      <Screen>
        <View style={s.center}>
          <Text style={s.errorText}>{error ?? "المنتج غير موجود"}</Text>
          <Pressable style={s.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={s.retryText}>رجوع</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const catName = typeof product.category === "object" && product.category !== null
    ? product.category.name : product.category;
  const inStock = (product.stock ?? 1) > 0;
  const images = getProductImages(product);
  const heroImage = selectedImage || images[0] || null;

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* ── Product Image ── */}
      <View style={s.imgBox}>
        {heroImage ? (
          <Image source={{ uri: heroImage }} style={s.img} resizeMode="contain" />
        ) : (
          <View style={s.imgPlaceholder}>
            <Text style={s.imgEmoji}>🔩</Text>
          </View>
        )}
      </View>
      {images.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.galleryRail}>
          {images.map((image, index) => {
            const active = (selectedImage || images[0]) === image;
            return (
              <Pressable key={`${image}-${index}`} style={[s.thumbBox, active && s.thumbActive]} onPress={() => setSelectedImage(image)}>
                <Image source={{ uri: image }} style={s.thumbImg} resizeMode="cover" />
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {/* ── Info Card ── */}
      <View style={s.infoCard}>
        {/* Badge row */}
        <View style={s.badgeRow}>
          {catName ? (
            <View style={s.catBadge}>
              <Text style={s.catText}>{catName}</Text>
            </View>
          ) : null}
          <View style={[s.stockBadge, !inStock && s.outStock]}>
            <Text style={s.stockText}>{inStock ? "متوفر في المخزن" : "نفذ المخزون"}</Text>
          </View>
        </View>

        {/* Name */}
        <Text style={s.name}>{product.name}</Text>
        {product.company ? (
          <Text style={s.companyName}>{product.company.company_name || product.company.name}</Text>
        ) : null}

        {/* Price */}
        <Text style={s.price}>{Number(product.price).toFixed(2)} جنيه</Text>

        {/* Description */}
        {product.description ? (
          <View style={s.descBox}>
            <Text style={s.descLabel}>📋 وصف المنتج</Text>
            <Text style={s.desc}>{product.description}</Text>
          </View>
        ) : null}

        {/* Specs */}
        {product.specifications ? (
          <View style={s.descBox}>
            <Text style={s.descLabel}>📐 المواصفات</Text>
            <Text style={s.desc}>{product.specifications}</Text>
          </View>
        ) : null}

        {/* Divider */}
        <View style={s.divider} />

        {/* Quantity selector */}
        <View style={s.qtyRow}>
          <Text style={s.qtyLabel}>الكمية</Text>
          <View style={s.qtyControls}>
            <Pressable
              style={s.qtyBtn}
              onPress={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Text style={s.qtyBtnText}>−</Text>
            </Pressable>
            <Text style={s.qtyValue}>{qty}</Text>
            <Pressable
              style={s.qtyBtn}
              onPress={() => setQty((q) => q + 1)}
            >
              <Text style={s.qtyBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Total */}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>الإجمالي</Text>
          <Text style={s.totalValue}>{(Number(product.price) * qty).toFixed(2)} جنيه</Text>
        </View>

        {/* Add to cart */}
        <Pressable
          style={[s.cartBtn, !inStock && s.cartBtnDisabled]}
          onPress={inStock ? addToCart : undefined}
          disabled={!inStock || adding}
        >
          {adding ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={s.cartBtnText}>
              {inStock ? "🛒 أضف للسلة" : "نفذ المخزون"}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

function getProductImages(product: any) {
  const rawImages = normalizeImages(product.images);
  const candidates = [
    product.main_image_url,
    product.image_url,
    product.image,
    product.main_image,
    ...(Array.isArray(product.images_urls) ? product.images_urls : []),
    ...rawImages,
  ];
  const resolved = candidates
    .map((item) => firstMediaUrl(item))
    .filter(Boolean) as string[];
  return Array.from(new Set(resolved));
}

function normalizeImages(value: unknown) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
}

const getStyles = (colors: any) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bgSection },
  content: { paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl },
  errorText: { fontFamily: typography.semiBold, fontSize: typography.body, color: colors.error, textAlign: "center" },
  retryBtn: {
    backgroundColor: colors.navyDeep, paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md, borderRadius: radius.card,
  },
  retryText: { color: "#FFF", fontFamily: typography.bold },
  imgBox: {
    width: "100%",
    aspectRatio: 1.2,
    backgroundColor: colors.bgApp,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  img: { width: "100%", height: "100%" },
  imgPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  imgEmoji: { fontSize: 80 },
  galleryRail: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm, flexDirection: "row-reverse" },
  thumbBox: { width: 64, height: 64, borderRadius: radius.cardSm, borderWidth: 1, borderColor: colors.borderLight, overflow: "hidden", backgroundColor: colors.bgApp },
  thumbActive: { borderColor: colors.primary, borderWidth: 2 },
  thumbImg: { width: "100%", height: "100%" },
  infoCard: {
    margin: spacing.lg,
    backgroundColor: colors.bgApp,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    boxShadow: "0 2px 12px rgba(11,30,51,0.06)",
  },
  badgeRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap", justifyContent: "flex-end" },
  catBadge: {
    backgroundColor: "#EBF4FB",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  catText: { fontFamily: typography.semiBold, fontSize: typography.tiny, color: colors.primary },
  stockBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  outStock: { backgroundColor: "#FFEBEE" },
  stockText: { fontFamily: typography.semiBold, fontSize: typography.tiny, color: colors.textMuted },
  name: {
    fontFamily: typography.bold,
    fontSize: typography.h3,
    color: colors.textHeading,
    textAlign: "right",
    lineHeight: 32,
  },
  companyName: { fontFamily: typography.semiBold, fontSize: typography.small, color: colors.textMuted, textAlign: "right" },
  price: {
    fontFamily: typography.bold,
    fontSize: 28,
    color: colors.textHeading,
    textAlign: "right",
  },
  descBox: { backgroundColor: colors.bgSection, borderRadius: radius.sm, padding: spacing.md, gap: spacing.xs },
  descLabel: { fontFamily: typography.bold, fontSize: typography.small, color: colors.textMuted, textAlign: "right" },
  desc: { fontFamily: typography.regular, fontSize: typography.small, color: colors.textBase, textAlign: "right", lineHeight: 22 },
  divider: { height: 1, backgroundColor: colors.borderLight },
  qtyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  qtyLabel: { fontFamily: typography.semiBold, fontSize: typography.body, color: colors.textHeading },
  qtyControls: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  qtyBtn: {
    width: 36, height: 36, borderRadius: radius.full,
    backgroundColor: colors.bgSection, borderWidth: 1,
    borderColor: colors.borderMedium, alignItems: "center", justifyContent: "center",
  },
  qtyBtnText: { fontFamily: typography.bold, fontSize: 20, color: colors.navyDeep },
  qtyValue: { fontFamily: typography.bold, fontSize: typography.h3, color: colors.textHeading, minWidth: 32, textAlign: "center" },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", backgroundColor: "#EBF4FB",
    borderRadius: radius.sm, padding: spacing.md,
  },
  totalLabel: { fontFamily: typography.semiBold, fontSize: typography.body, color: colors.primary },
  totalValue: { fontFamily: typography.bold, fontSize: typography.h3, color: colors.textHeading },
  cartBtn: {
    backgroundColor: colors.navyDeep,
    borderRadius: radius.card,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  cartBtnDisabled: { backgroundColor: colors.slate200 },
  cartBtnText: { fontFamily: typography.bold, fontSize: typography.body, color: "#FFF" },
});
