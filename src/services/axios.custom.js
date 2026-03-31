import axios from "axios";
import Cookies from "js-cookie";
import { refreshTokenAPI } from "./apiAuth";

const normalizeErrorMessage = (payload) => {
  const message = payload?.message;

  if (Array.isArray(message)) {
    return message.join(", ");
  }

  if (typeof message === "string") {
    return message;
  }

  if (typeof payload?.error === "string") {
    return payload.error;
  }

  return "Request failed";
};

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",

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
API.interceptors.response.use(
  (res) => {
    return res;
  },
  async (err) => {
    const normalizedMessage = normalizeErrorMessage(err?.response?.data);
    if (err?.response?.data) {
      err.response.data.message = normalizedMessage;
    }

    const originalConfig = err.config;
    if (err.response?.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;
      const refreshToken = Cookies.get("refreshToken");
      if (!refreshToken) {
        return Promise.reject(err);
      }
      try {
        const res = await refreshTokenAPI(refreshToken);
        const token =
          res?.access_token ||
          res?.data?.access_token ||
          res?.data?.data?.access_token ||
          "";

        if (!token) {
          throw new Error("Refresh token response missing access token");
        }

        Cookies.set("accessToken", token);
        originalConfig.headers.Authorization = `Bearer ${token}`;
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


