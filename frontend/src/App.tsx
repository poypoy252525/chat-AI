import { Outlet } from "react-router-dom";
import { AuthProvider } from "./context/auth-context";
import { Toaster } from "sonner";

function App() {
  return (
    <div className="h-full bg-background overflow-hidden">
      <AuthProvider>
        <Outlet />
      </AuthProvider>
      <Toaster />
    </div>
  );
}

export default App;
