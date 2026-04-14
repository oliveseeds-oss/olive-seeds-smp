import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { Blogs, Carousels, Reels, Media, Tweets } from "./pages/Collections";
import CalendarPage from "./pages/Calendar";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}
function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="blogs" element={<Blogs />} />
        <Route path="carousels" element={<Carousels />} />
        <Route path="reels" element={<Reels />} />
        <Route path="media" element={<Media />} />
        <Route path="tweets" element={<Tweets />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          style:{borderRadius:10,background:"#1e293b",color:"#f8fafc",fontSize:"0.875rem",fontFamily:"var(--font-body)",boxShadow:"0 8px 24px rgba(0,0,0,0.15)"},
          success:{iconTheme:{primary:"#10b981",secondary:"#fff"}},
          error:{iconTheme:{primary:"#ef4444",secondary:"#fff"}},
        }}/>
      </BrowserRouter>
    </AuthProvider>
  );
}
