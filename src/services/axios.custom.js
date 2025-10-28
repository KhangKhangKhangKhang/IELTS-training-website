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

// Gắn token vào mỗi request
API.interceptors.request.use(
  (config) => {
    const token = Cookies.get("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ FIXED: gắn interceptor response vào đúng instance
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalConfig = err.config;

    if (err.response?.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;
      const refreshTokenValue = Cookies.get("refreshToken");
      if (!refreshTokenValue) return Promise.reject(err);

      try {
        // ✅ gọi API refresh token đúng cách
        const refreshRes = await refreshTokenAPI({
          refreshToken: refreshTokenValue,
        });

        const newToken = refreshRes?.Token || refreshRes?.data?.Token;
        if (!newToken) throw new Error("Không lấy được access token mới");

        // ✅ lưu và gọi lại request cũ
        Cookies.set("accessToken", newToken);
        originalConfig.headers.Authorization = `Bearer ${newToken}`;
        return API(originalConfig);
      } catch (error) {
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
        Cookies.remove("user");
        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  }
);

export default API;
