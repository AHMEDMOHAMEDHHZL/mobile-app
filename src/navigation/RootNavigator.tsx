// ─────────────────────────────────────────────────────────────────────────────
// RootNavigator — Auth guard + Tab + Stack routing
// ─────────────────────────────────────────────────────────────────────────────
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../auth/AuthContext";
import { AuthNavigator } from "./AuthNavigator";
import { MainTabNavigator } from "./MainTabNavigator";
import { TechnicianDetailScreen } from "../screens/TechnicianDetailScreen";
import { ProductDetailScreen } from "../screens/ProductDetailScreen";
import { ServiceRequestScreen } from "../screens/ServiceRequestScreen";
import { typography } from "../theme";
import { useTheme } from "../providers/ThemeProvider";

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  TechnicianDetail: { id: number };
  ProductDetail: { id: number };
  ServiceRequest: { technicianId: number; technicianName: string; serviceId?: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) return null;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: typography.bold },
        headerTintColor: colors.navyDeep,
        headerBackTitle: "رجوع",
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} options={{ headerShown: false }} />
          <Stack.Screen
            name="TechnicianDetail"
            component={TechnicianDetailScreen}
            options={{ title: "بروفايل الصنايعي" }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{ title: "تفاصيل المنتج" }}
          />
          <Stack.Screen
            name="ServiceRequest"
            component={ServiceRequestScreen}
            options={{ title: "طلب خدمة" }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}
