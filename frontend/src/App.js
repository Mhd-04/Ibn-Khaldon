import React, { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";

// Components
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import StudentManagement from "./pages/StudentManagement";
import TeacherManagement from "./pages/TeacherManagement";
import GradeManagement from "./pages/GradeManagement";
import AttendanceManagement from "./pages/AttendanceManagement";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import SettingsPage from "./pages/SettingsPage";
import FinancialManagement from "./pages/FinancialManagement";
import StudentPortal from "./pages/StudentPortal";
import TeacherPortal from "./pages/TeacherPortal";
import Layout from "./components/Layout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
        } catch (error) {
          console.error("Auth error:", error);
          localStorage.removeItem("token");
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { username, password });
      const { access_token, user: userData } = response.data;
      localStorage.setItem("token", access_token);
      setToken(access_token);
      setUser(userData);
      toast.success(`مرحباً ${userData.full_name}`);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل تسجيل الدخول");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    toast.success("تم تسجيل الخروج بنجاح");
  };

  const getThemeClass = () => {
    if (!user) return "";
    if (user.role === "student") {
      return user.gender === "female" ? "theme-female" : "theme-male";
    }
    if (user.role === "teacher") {
      return "theme-teacher";
    }
    return ""; // Admin uses default purple
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, getThemeClass }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "teacher") return <Navigate to="/teacher" replace />;
    if (user.role === "student") return <Navigate to="/student" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Main App Router
const AppRoutes = () => {
  const { user, loading, getThemeClass } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={getThemeClass()}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={user.role === "admin" ? "/admin" : user.role === "teacher" ? "/teacher" : "/student"} replace /> : <LoginPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout><AdminDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/students" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout><StudentManagement /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/teachers" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout><TeacherManagement /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/grades" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout><GradeManagement /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/attendance" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout><AttendanceManagement /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/announcements" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout><AnnouncementsPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout><SettingsPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/financial" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout><FinancialManagement /></Layout>
          </ProtectedRoute>
        } />

        {/* Teacher Routes */}
        <Route path="/teacher" element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <Layout><TeacherPortal /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/teacher/grades" element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <Layout><GradeManagement /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/teacher/attendance" element={
          <ProtectedRoute allowedRoles={["teacher"]}>
            <Layout><AttendanceManagement /></Layout>
          </ProtectedRoute>
        } />

        {/* Student Routes */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Layout><StudentPortal /></Layout>
          </ProtectedRoute>
        } />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  // Seed database on first load
  useEffect(() => {
    const seedDB = async () => {
      try {
        await axios.post(`${API}/seed`);
      } catch (error) {
        // Ignore if already seeded
      }
    };
    seedDB();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster 
          position="top-center" 
          richColors 
          dir="rtl"
          toastOptions={{
            style: { fontFamily: 'Tajawal, sans-serif' }
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
