import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL?.trim();

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});
