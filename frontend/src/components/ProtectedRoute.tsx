import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Wraps any route that requires the user to be authenticated.
 *
 * Renders a loading state while the initial session check is in-flight —
 * this prevents a flash redirect to /login for already-logged-in users
 * who just refreshed the page.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // Still checking session — don't redirect yet
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
