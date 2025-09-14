import API from "./axios.custom";
import axios from "axios";

export const loginAPI = (data) => {
  return API.post('/auth/login', data);
}

export const signupAPI = async (data) => {
  const res = await API.post("/auth/register", data);
  return res.data; // { email, otp }
};

// verify OTP API
export const verifyOtpAPI = async (data) => {
  const res = await API.post("/auth/verify-otp", data);
  return res.data; // { message: "success" }
};

export const resendOtpAPI = async (data) => {
  const res = await API.post("/auth/resend-otp", data);
  return res.data; // { message: "OTP resent" }
}

export const forgetPasswordAPI = async (data) => {
  const res = await API.post("/auth/forgot-password", data);
  return res.data; // { email, otp }
}

export const resetPasswordAPI = async (data) => {
  const res = await API.post("/auth/reset-password", data);
  return res.data; // { message: "Password reset successful" }
}

export const introspectAPI = async (data) => {
  const res = await API.post("/auth/introspect", { token: data });
  return res.data; // { active: true/false, ... }
}