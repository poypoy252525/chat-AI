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
// Concurrent Refresh Handling
//
// If multiple requests fail with a 401 at once (e.g., on page load), we only
// want to trigger ONE refresh call. The others should "wait" and then retry.
// ---------------------------------------------------------------------------
interface AxiosRequestConfigExtended extends AxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(null);
    }
  });
  failedQueue = [];
};

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
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfigExtended;

    // Handle network errors (no response)
    if (!error.response) {
      return Promise.reject(error);
    }

    const is401 = error.response.status === 401;
    const isRefreshEndpoint = originalRequest.url?.includes(
      "auth/token/refresh/",
    );

    if (is401 && !originalRequest._retry && !isRefreshEndpoint) {
      if (isRefreshing) {
        // If a refresh is already in progress, wait for it to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axiosInstance.post("auth/token/refresh/");
        isRefreshing = false;
        processQueue(); // Release all waiting requests
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
