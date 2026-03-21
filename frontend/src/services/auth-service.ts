import axiosInstance from "./providers/axios-instance";
import type { LoginCredentials, User } from "@/types/auth";

// ---------------------------------------------------------------------------
// Auth Service
//
// All tokens are managed server-side via httpOnly cookies (set by dj-rest-auth).
// We never read or store tokens manually — the browser attaches them
// automatically on every request because axios is configured with
// `withCredentials: true`.
// ---------------------------------------------------------------------------

class AuthService {
  /**
   * Log in with email + password.
   * On success the backend sets `access-token` and `refresh-token` httpOnly
   * cookies. We don't need to return or store them.
   *
   * Endpoint: POST /auth/login/
   * Body:    { email, password }
   */
  async login(credentials: LoginCredentials): Promise<void> {
    await axiosInstance.post("/auth/login/", credentials);
  }

  /**
   * Fetch the currently authenticated user from the backend.
   * This is the source-of-truth for whether a session is active — since we
   * can't read httpOnly cookies in JS, we ask the server instead.
   *
   * Throws a 401 if the session has expired (interceptor handles the refresh).
   *
   * Endpoint: GET /auth/user/
   */
  async getUser(): Promise<User> {
    const response = await axiosInstance.get<User>("/auth/user/");
    return response.data;
  }

  /**
   * Log the user out and invalidate the refresh token on the server.
   * The backend clears the httpOnly cookies from the response.
   *
   * Endpoint: POST /auth/logout/
   */
  async logout(): Promise<void> {
    await axiosInstance.post("/auth/logout/");
  }

  /**
   * Ask the backend to issue a fresh access token using the refresh token
   * cookie. Called automatically by the axios 401 interceptor — you should
   * not call this directly from components.
   *
   * Endpoint: POST /auth/token/refresh/
   */
  async refreshToken(): Promise<void> {
    await axiosInstance.post("/auth/token/refresh/");
  }
}

export default new AuthService();
