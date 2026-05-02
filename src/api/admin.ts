import { api } from "./client";

export async function getAdminDashboard() {
  const res = await api.get("/admin/dashboard");
  return res.data?.data ?? res.data ?? {};
}

export async function getAdminUsers(params: Record<string, any> = {}) {
  const res = await api.get("/admin/users", { params });
  return res.data?.data ?? res.data ?? [];
}

export async function getAdminCraftsmen(params: Record<string, any> = {}) {
  const res = await api.get("/admin/craftsmen", { params });
  return res.data?.data ?? res.data ?? [];
}

export async function getAdminCompanies(params: Record<string, any> = {}) {
  const res = await api.get("/admin/companies", { params });
  return res.data?.data ?? res.data ?? [];
}

export async function getAdminServiceRequests(params: Record<string, any> = {}) {
  const res = await api.get("/admin/service-requests", { params });
  return res.data?.data ?? res.data ?? [];
}

export async function getAdminVodafoneDeposits(params: Record<string, any> = {}) {
  const res = await api.get("/admin/vodafone-deposits", { params });
  return res.data?.data ?? res.data ?? [];
}

export async function approveCraftsman(id: number) {
  const res = await api.post(`/admin/craftsmen/${id}/verify`);
  return res.data;
}

export async function rejectCraftsman(id: number) {
  const res = await api.post(`/admin/craftsmen/${id}/reject`);
  return res.data;
}

export async function toggleUserBlock(id: number) {
  const res = await api.post(`/admin/users/${id}/toggle-block`);
  return res.data;
}

export async function toggleCompanyApproval(id: number) {
  const res = await api.post(`/admin/companies/${id}/toggle-approval`);
  return res.data;
}

export async function approveVodafoneDeposit(id: number) {
  const res = await api.post(`/admin/vodafone-deposits/${id}/approve`);
  return res.data;
}

export async function rejectVodafoneDeposit(id: number, admin_note?: string) {
  const res = await api.post(`/admin/vodafone-deposits/${id}/reject`, { admin_note });
  return res.data;
}
