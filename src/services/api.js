import API from "./axios.custom";
import axios from "axios";

export const loginAPI = (data) => {
  return API.post('/auth/login', data);
}


export const registerAPI = (data) => API.post("/auth/register", data);

