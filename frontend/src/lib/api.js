import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_ROOT = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_ROOT,
  withCredentials: true,
});

export default api;
