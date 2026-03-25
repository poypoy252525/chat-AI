import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { ChatInterface } from "./components/chat";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/login-page";
import SignupPage from "./pages/signup-page";
import RootLayout from "./root-layout";

// ---------------------------------------------------------------------------
// AuthLayout — wraps all routes with AuthProvider.
//
// AuthProvider lives here (not in main.tsx) because it uses useNavigate,
// which requires a router context to already be mounted above it.
// ---------------------------------------------------------------------------

export const routes = createBrowserRouter([
  {
    // All routes share the same AuthProvider via this layout
    element: <App />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/signup",
        element: <SignupPage />,
      },
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <RootLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <ChatInterface />,
          },
          {
            path: "chat/:id",
            element: <ChatInterface />,
          },
        ],
      },
    ],
  },
]);
