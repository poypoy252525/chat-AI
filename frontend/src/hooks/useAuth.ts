import { useAuthContext } from "@/context/auth-context";

/**
 * Hook to access auth state and actions anywhere inside <AuthProvider>.
 *
 * Usage:
 *   const { user, isAuthenticated, login, logout } = useAuth();
 */
export function useAuth() {
  return useAuthContext();
}
