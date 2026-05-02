import { api } from "./client";

export interface Technician {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  service_id?: number;
  service?: { id: number; name: string };
  profile_image?: string;
  profile_image_url?: string;
  price_range?: string;
  price?: number;
  rating?: number;
  reviews_count?: number;
  latitude?: number;
  longitude?: number;
  governorate?: string;
  status?: string;
  description?: string;
  experience_years?: number;
  work_days?: string[];
}

export const getTechnicians = async (
  serviceId?: number,
  filter?: string
): Promise<Technician[]> => {
  const params: Record<string, any> = {};
  if (serviceId !== undefined) params.service_id = serviceId;
  if (filter) params.filter = filter;
  const res = await api.get("/craftsmen", { params });
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.data?.data)) return res.data.data;
  return [];
};

export const getTechnicianById = async (id: string | number): Promise<Technician> => {
  const res = await api.get(`/craftsmen/${id}`);
  return res.data?.data || res.data;
};

export const getNearestTechnicians = async (
  lat: number,
  lng: number,
  serviceId: number
): Promise<Technician[]> => {
  const res = await api.get("/craftsmen/nearest", {
    params: { latitude: lat, longitude: lng, service_id: serviceId },
  });
  return res.data?.data || res.data || [];
};

export const getUserProfile = async () => {
  const res = await api.get("/user/me");
  return res.data?.data || res.data;
};

export const getCraftsmanProfile = async () => {
  const res = await api.get("/craftsmen/profile/me");
  return res.data?.data || res.data;
};

export const getCompanyProfile = async () => {
  const res = await api.get("/company/me");
  return res.data?.data || res.data;
};

export const getGovernates = async () => {
  try {
    const res = await api.get("/governorates");
    return res.data?.data || res.data || [];
  } catch {
    return [];
  }
};
