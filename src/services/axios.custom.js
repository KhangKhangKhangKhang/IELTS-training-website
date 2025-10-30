import axios from "axios";
import Cookies from "js-cookie";
import { refreshTokenAPI } from "./apiAuth";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use(
  (config) => {
    const token = Cookies.get("accessToken"); // 🚀 đồng bộ key
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
axios.interceptors.response.use(
  (res) => {
    return res;
  },
  async (err) => {
    const originalConfig = err.config;
    if (err.response?.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;
      const refreshToken = Cookies.get("refreshToken");
      if (!refreshToken) {
        return Promise.reject(err);
      }
      try {
        const refreshToken = await refreshTokenAPI();
        const { Token } = refreshToken?.data || {};
        Cookies.set("accessToken", Token);
        originalConfig.headers.Authorization = `Bearer ${Token}`;
        return API(originalConfig);
      } catch (error) {
        Cookies.remove("accessToken");
        Cookies.remove("user");
        Cookies.remove("refreshToken");
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  }
);

export default API;
