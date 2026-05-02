import { api } from "./client";

export const getPublicCategories = async () => {
  try {
    const res = await api.get("/store/categories");
    return res.data;
  } catch {
    return [];
  }
};

export const getPublicProducts = async (params: {
  category_id?: number;
  search?: string;
  page?: number;
} = {}) => {
  try {
    const res = await api.get("/store/products", { params });
    return res.data;
  } catch {
    return { data: [] };
  }
};

export const getPublicProductDetails = async (id: number) => {
  const res = await api.get(`/store/products/${id}`);
  return res.data;
};

export const getCartItems = async () => {
  const res = await api.get("/company/store/cart");
  return res.data?.data || res.data || [];
};

export const addToCart = async (product_id: number, quantity: number) => {
  const res = await api.post("/company/store/cart/add", { product_id, quantity });
  return res.data;
};

export const removeFromCart = async (cartItemId: number) => {
  const res = await api.delete(`/company/store/cart/${cartItemId}`);
  return res.data;
};

export const placeOrder = async (payload: {
  address: string;
  phone: string;
  notes?: string;
}) => {
  const res = await api.post("/company/store/checkout", payload);
  return res.data;
};

export const getMyStoreOrders = async () => {
  const res = await api.get("/company/store/my-orders");
  return res.data?.data || res.data || [];
};

export const getCompanyRegistrationCategories = async () => {
  try {
    const res = await api.get("/companies/registration-categories");
    return res.data;
  } catch {
    return [];
  }
};
