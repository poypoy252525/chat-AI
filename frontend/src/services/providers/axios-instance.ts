import axios from "axios";
import type { AxiosRequestConfig } from "axios";

// ---------------------------------------------------------------------------
// Axios Instance
//
// `withCredentials: true` is required so the browser includes our httpOnly
// cookies (access-token, refresh-token) on every cross-origin request.
//
// ⚠️  For this to work, the Django backend must NOT use CORS_ALLOW_ALL_ORIGINS.
//     Instead, set:
//       CORS_ALLOW_CREDENTIALS = True
//       CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]  # your frontend URL
// ---------------------------------------------------------------------------
const apiURL = import.meta.env.VITE_API_URL || "";
const baseURL = apiURL.endsWith("/") ? apiURL : `${apiURL}/`;

const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ---------------------------------------------------------------------------
// 401 Interceptor — silent token refresh + retry
//
// When any request comes back with a 401 (access token expired), we:
//   1. Try to get a fresh access token via POST /auth/token/refresh/
//   2. If refresh succeeds → retry the original request once
//   3. If refresh also fails → redirect to /login (session is truly expired)
//
// The `_retry` flag on the request config prevents an infinite loop in case
// the retry itself returns a 401.
// ---------------------------------------------------------------------------
axiosInstance.interceptors.response.use(
  // Any 2xx response passes straight through
  (response) => response,

  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    const is401 = error.response?.status === 401;
    const isRefreshEndpoint = originalRequest.url?.includes(
      "auth/token/refresh/",
    );

    // Only attempt a refresh once, and never on the refresh endpoint itself
    if (is401 && !originalRequest._retry && !isRefreshEndpoint) {
      originalRequest._retry = true;

      try {
        // The refresh token cookie is sent automatically by the browser
        await axiosInstance.post("auth/token/refresh/");

        // Retry the original request — the new access-token cookie is now set
        return axiosInstance(originalRequest);
      } catch {
        // Refresh also failed — just reject and let the caller handle it.
        // AuthContext will catch this, set user = null, and ProtectedRoute
        // will redirect to /login via React Router (no hard page reload).
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
