import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import authService from "@/services/auth-service";
import type { AuthContextType, User } from "@/types/auth";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const AuthContext = createContext<AuthContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // start true — checking session
  const navigate = useNavigate();

  // -------------------------------------------------------------------------
  // On mount: silently check if a valid session exists.
  //
  // Since the tokens live in httpOnly cookies we can't inspect them in JS.
  // We instead ask the backend "who am I?" — if it returns a user the session
  // is valid; if it returns 401 the user is not logged in.
  //
  // The axios 401 interceptor will also try a token refresh before this
  // rejection reaches here, so by the time we see an error the session is
  // truly gone.
  // -------------------------------------------------------------------------
  useEffect(() => {
    authService
      .getUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  // -------------------------------------------------------------------------
  // login — POST credentials, then fetch the user object
  // -------------------------------------------------------------------------
  const login = useCallback(
    async (email: string, password: string) => {
      await authService.login({ email, password });

      // Fetch the authenticated user after a successful login so we can
      // populate our state without parsing the token ourselves
      const currentUser = await authService.getUser();
      setUser(currentUser);

      navigate("/");
    },
    [navigate]
  );

  // -------------------------------------------------------------------------
  // logout — tell the backend to blacklist the refresh token and clear cookies
  // -------------------------------------------------------------------------
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    navigate("/login");
  }, [navigate]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Internal hook — only used by the public useAuth hook in src/hooks/useAuth.ts
// ---------------------------------------------------------------------------
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
