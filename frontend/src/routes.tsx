import { createBrowserRouter } from "react-router-dom"
import LoginPage from "./pages/login-page"
import { ChatInterface } from "./components/chat"

export const routes = createBrowserRouter([
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/",
        element: <ChatInterface />,
    }
])