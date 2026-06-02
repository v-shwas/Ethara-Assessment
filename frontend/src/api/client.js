import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_VITE_API_URL || "http://localhost:8000",
});

export const productsApi = {
  list: () => api.get("/products"),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
};

export const customersApi = {
  list: () => api.get("/customers"),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post("/customers", data),
  remove: (id) => api.delete(`/customers/${id}`),
};

export const ordersApi = {
  list: () => api.get("/orders"),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post("/orders", data),
  remove: (id) => api.delete(`/orders/${id}`),
};

export default api;
