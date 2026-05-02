import type { AxiosError } from "axios";
import { api } from "./client";
import { authStorage } from "../auth/auth.storage";
import type { AuthUser, UserRole } from "../auth/auth.types";

interface AuthResponse {
  token?: string;
  access_token?: string;
  role?: UserRole;
  message?: string;
  user?: Record<string, unknown>;
  company?: Record<string, unknown>;
  craftsman?: Record<string, unknown>;
  data?: Record<string, unknown> & { token?: string; user?: Record<string, unknown> };
  email?: string;
  is_new?: boolean | number | string;
}

function normalizeUser(data: Record<string, unknown> | undefined | null): AuthUser | null {
  if (!data) return null;

  const nested = (data.data as Record<string, unknown> | undefined) || data;
  const id = Number(nested.id || nested.user_id);

  if (!id) return null;

  return {
    id,
    name: String(nested.name || nested.company_name || ""),
    email: String(nested.email || nested.company_email || ""),
    company_name: nested.company_name ? String(nested.company_name) : undefined,
    profile_image: (nested.profile_image as string) || (nested.profile_photo as string) || null,
    company_logo: (nested.company_logo as string) || null,
    status: nested.status ? String(nested.status) : undefined,
  };
}

export async function loginWithApi(identifier: string, password: string) {
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  const lastRole = await authStorage.getUserType();

  const strategies = [
    {
      url: "admin/login",
      payload: { email: identifier, password },
      role: "admin" as UserRole,
      enabled: isEmail,
    },
    {
      url: "companies/login",
      payload: { company_email: identifier, company_password: password },
      role: "company" as UserRole,
      enabled: isEmail,
    },
    {
      url: "craftsmen/login",
      payload: { login: identifier, password },
      role: "craftsman" as UserRole,
      enabled: true,
    },
    {
      url: "auth/login",
      payload: { email: identifier, login: identifier, password },
      role: "user" as UserRole,
      enabled: true,
    },
  ].filter((item) => item.enabled);

  const orderedStrategies = lastRole
    ? [
        ...strategies.filter((item) => item.role === lastRole),
        ...strategies.filter((item) => item.role !== lastRole),
      ]
    : strategies;

  let lastError: AxiosError<AuthResponse> | null = null;

  for (const strategy of orderedStrategies) {
    try {
      const { data } = await api.post<AuthResponse>(strategy.url, strategy.payload);
      const token = data.token || data.access_token || data.data?.token || null;
      const rawUser = data.user || data.company || data.craftsman || data.data;
      const user = normalizeUser(rawUser || undefined);

      if (token && user) {
        return {
          success: true as const,
          token,
          role: data.role || strategy.role,
          user,
        };
      }
    } catch (error) {
      lastError = error as AxiosError<AuthResponse>;

      if (lastError.response?.status === 403) {
        return {
          success: false as const,
          message: lastError.response?.data?.message || "الحساب غير مفعل أو غير متاح حالياً",
        };
      }

      if (lastError.response?.status === 422 && strategy.role === "craftsman") {
        return {
          success: false as const,
          message: lastError.response?.data?.message || "الحساب قيد المراجعة أو توجد مشكلة في بيانات الصنايعي",
        };
      }
    }
  }

  if (lastError && !(lastError as AxiosError<AuthResponse>).response) {
    console.error("🔴 Network/CORS Error details:", lastError);
    return {
      success: false as const,
      message: "خطأ في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت أو إعدادات الشبكة.",
    };
  }

  if (lastError) {
    console.log("🟠 API Error details:", (lastError as AxiosError).response?.data);
  }

  return {
    success: false as const,
    message: (lastError as AxiosError<AuthResponse> | null)?.response?.data?.message || "فشل تسجيل الدخول، تحقق من البيانات",
  };
}

export const exchangeGoogleCode = async (code: string) => {
  const res = await api.post("/auth/google-exchange", { code });
  const payload = res.data;
  return {
    success: payload?.status ?? true,
    token: payload.token,
    role: payload.role || "user",
    user: payload.data || payload.user,
  };
};

export const registerUser = async (data: Record<string, any>) => {
  const res = await api.post("/register", data);
  return res.data;
};

export const verifyOtp = async (email: string, otp: string) => {
  const res = await api.post("/verify-otp", { email, otp });
  const payload = res.data;
  return {
    success: payload?.status ?? true,
    token: payload.token,
    user: payload.data || payload.user,
  };
};

export const resendOtp = async (email: string) => {
  const res = await api.post("/resend-otp", { email });
  return res.data;
};
