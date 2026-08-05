import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import DEFAULT_URL from "../../config/backendConfig";

export let API_URL = DEFAULT_URL;

const TOKEN_KEY = "bandhaki_auth_token";
const ENDPOINT_KEY = "API_ENDPOINT";

// SecureStore hits the native keystore, which is slow. Both values change rarely,
// so they are read once and kept in memory instead of on every request.
let cachedToken: string | null | undefined;
let cachedEndpoint: string | null | undefined;

// ==================== Token Management ====================

export async function getToken(): Promise<string | null> {
  if (cachedToken !== undefined) return cachedToken;
  try {
    cachedToken =
      Platform.OS === "web"
        ? localStorage.getItem(TOKEN_KEY)
        : await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    cachedToken = null;
  }
  return cachedToken;
}

export async function setToken(token: string): Promise<void> {
  cachedToken = token;
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error("Failed to save token:", error);
  }
}

export async function removeToken(): Promise<void> {
  cachedToken = null;
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error("Failed to remove token:", error);
  }
}

// ==================== API endpoint ====================

export async function getApiEndpoint(): Promise<string> {
  if (cachedEndpoint === undefined) {
    try {
      cachedEndpoint =
        Platform.OS === "web"
          ? localStorage.getItem(ENDPOINT_KEY)
          : await SecureStore.getItemAsync(ENDPOINT_KEY);
    } catch {
      cachedEndpoint = null;
    }
  }
  return cachedEndpoint || DEFAULT_URL;
}

export async function setApiEndpoint(url: string): Promise<void> {
  const normalized = url.trim().replace(/\/+$/, "");
  cachedEndpoint = normalized;
  API_URL = normalized;
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(ENDPOINT_KEY, normalized);
      return;
    }
    await SecureStore.setItemAsync(ENDPOINT_KEY, normalized);
  } catch (error) {
    console.error("Failed to save API endpoint:", error);
  }
}

// ==================== Axios Instance ====================

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach Bearer token and ensure correct baseURL
apiClient.interceptors.request.use(
  async (config) => {
    const endpoint = await getApiEndpoint();
    config.baseURL = endpoint;
    API_URL = endpoint;

    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await removeToken();
    }
    return Promise.reject(error);
  },
);

export default apiClient;
