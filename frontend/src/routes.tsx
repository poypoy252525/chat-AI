import { createBrowserRouter, Outlet } from "react-router-dom";
import LoginPage from "./pages/login-page";
import { ChatInterface } from "./components/chat";
import { AuthProvider } from "./context/auth-context";
import { ProtectedRoute } from "./components/ProtectedRoute";

// ---------------------------------------------------------------------------
// AuthLayout — wraps all routes with AuthProvider.
//
// AuthProvider lives here (not in main.tsx) because it uses useNavigate,
// which requires a router context to already be mounted above it.
// ---------------------------------------------------------------------------
function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export const routes = createBrowserRouter([
  {
    // All routes share the same AuthProvider via this layout
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <ChatInterface />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);