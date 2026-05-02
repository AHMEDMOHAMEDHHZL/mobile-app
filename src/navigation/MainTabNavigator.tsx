// ─────────────────────────────────────────────────────────────────────────────
// MainTabNavigator — Header with logo + styled bottom nav matching web design
// ─────────────────────────────────────────────────────────────────────────────
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  Text, View, StyleSheet, Platform, Image, Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { HomeScreen } from "../screens/HomeScreen";
import { ServicesScreen } from "../screens/ServicesScreen";
import { OrdersScreen } from "../screens/OrdersScreen";
import { WalletScreen } from "../screens/WalletScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { StoreScreen } from "../screens/StoreScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { AdminScreen } from "../screens/AdminScreen";
import { typography, spacing, radius } from "../theme";
import { useTheme } from "../providers/ThemeProvider";
import { useAuth } from "../auth/AuthContext";

export type MainTabParamList = {
  Home: undefined;
  Services: undefined;
  Orders: undefined;
  Store: undefined;
  Wallet: undefined;
  Notifications: undefined;
  Admin: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// ─── Logo path
const LOGO = require("../../assets/logo.png");

// ─── Tabs config
const BASE_TABS = [
  { name: "Home"     as const, label: "الرئيسية", icon: "🏠" },
  { name: "Services" as const, label: "الخدمات",  icon: "🔧" },
  { name: "Orders"   as const, label: "طلباتي",   icon: "📋" },
  { name: "Store"    as const, label: "المتجر",   icon: "🛒" },
  { name: "Wallet"   as const, label: "المحفظة",  icon: "💰" },
  { name: "Notifications" as const, label: "تنبيهات", icon: "🔔" },
  { name: "Profile"  as const, label: "حسابي",    icon: "👤" },
];
const ADMIN_TAB = { name: "Admin" as const, label: "الإدارة", icon: "⚙️" };
const ALL_TABS = [...BASE_TABS, ADMIN_TAB];

// ─── Header component (matches web Navbar)
function AppHeader({ routeName }: { routeName: string }) {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const hStyles = getHStyles(colors);

  const pageTitles: Record<string, string> = {
    Home:     "",
    Services: "الخدمات",
    Orders:   "طلباتي",
    Store:    "المتجر",
    Wallet:   "المحفظة",
    Notifications: "الإشعارات",
    Admin: "الإدارة",
    Profile:  "حسابي",
  };

  return (
    <View style={hStyles.header}>
      {/* Right: Logo + Brand */}
      <Pressable
        style={hStyles.brand}
        onPress={() => navigation.navigate("Home")}
      >
        <Image source={LOGO} style={hStyles.logo} resizeMode="contain" />
        <Text style={hStyles.brandName}>صنايعي</Text>
      </Pressable>

      {/* Center: Page title (hidden on Home) */}
      {routeName !== "Home" && (
        <Text style={hStyles.pageTitle}>{pageTitles[routeName] ?? ""}</Text>
      )}

      {/* Left: User greeting / avatar */}
      <View style={hStyles.userBadge}>
        <Text style={hStyles.userInitial}>
          {(user?.name || (user as any)?.company_name || "م").charAt(0)}
        </Text>
      </View>
    </View>
  );
}

const getHStyles = (colors: any) => StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.navyDeep,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === "ios" ? 50 : spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(95,168,211,0.2)",
    boxShadow: "0 2px 12px rgba(11,30,51,0.3)",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logo: {
    width: 40,
    height: 40,
  },
  brandName: {
    color: "#FFFFFF",
    fontFamily: typography.bold,
    fontSize: 20,
  },
  pageTitle: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: typography.semiBold,
    fontSize: typography.body,
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  userBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  userInitial: {
    color: "#FFF",
    fontFamily: typography.bold,
    fontSize: 16,
  },
});

// ─── Tab icon component
function TabIcon({
  icon, label, focused,
}: { icon: string; label: string; focused: boolean }) {
  const { colors } = useTheme();
  const tabStyles = getTabStyles(colors);
  return (
    <View style={[tabStyles.tabItemWrap, focused && tabStyles.tabItemActive]}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>
        {icon}
      </Text>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>
        {label}
      </Text>
    </View>
  );
}

export function MainTabNavigator() {
  const { colors, isDark } = useTheme();
  const { userType } = useAuth();
  const tabStyles = getTabStyles(colors);
  const tabs = userType === "admin"
    ? [BASE_TABS[0], ADMIN_TAB, BASE_TABS[1], BASE_TABS[2], BASE_TABS[3], BASE_TABS[5], BASE_TABS[6]]
    : BASE_TABS;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = tabs.find((t) => t.name === route.name)
          ?? ALL_TABS.find((t) => t.name === route.name)
          ?? BASE_TABS[0];
        return {
          header: () => <AppHeader routeName={route.name} />,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={tab.icon} label={tab.label} focused={focused} />
          ),
          tabBarLabel: () => null,
          tabBarStyle: tabStyles.tabBar,
          tabBarItemStyle: tabStyles.tabItem,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
        };
      }}
    >
      <Tab.Screen name="Home"     component={HomeScreen}     />
      <Tab.Screen name="Services" component={ServicesScreen} />
      <Tab.Screen name="Orders"   component={OrdersScreen}   />
      <Tab.Screen name="Store"    component={StoreScreen}    />
      {userType !== "admin" && <Tab.Screen name="Wallet" component={WalletScreen} />}
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      {userType === "admin" && <Tab.Screen name="Admin" component={AdminScreen} />}
      <Tab.Screen name="Profile"  component={ProfileScreen}  />
    </Tab.Navigator>
  );
}

const getTabStyles = (colors: any) => StyleSheet.create({
  tabBar: {
    backgroundColor: colors.navyDeep,
    borderTopColor: "rgba(95,168,211,0.2)",
    borderTopWidth: 1,
    height: Platform.OS === "ios" ? 88 : 68,
    paddingTop: 0,
    paddingBottom: Platform.OS === "ios" ? spacing.lg : 0,
    boxShadow: "0 -2px 12px rgba(11,30,51,0.3)",
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabItemWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.card,
    gap: 2,
    minWidth: 56,
  },
  tabItemActive: {
    backgroundColor: "rgba(95,168,211,0.15)",
  },
  icon: {
    fontSize: 22,
    opacity: 0.5,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontFamily: typography.regular,
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    marginTop: 1,
  },
  labelActive: {
    fontFamily: typography.bold,
    color: colors.primary,
  },
});
