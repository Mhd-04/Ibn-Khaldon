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
import SchedulesPage from "./pages/SchedulesPage";
import HonorRoll from "./pages/HonorRoll";
import StudentPortal from "./pages/StudentPortal";
import TeacherPortal from "./pages/TeacherPortal";
import SupervisorDashboard from "./pages/SupervisorDashboard";
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
  const [selectedGender, setSelectedGender] = useState(localStorage.getItem("selectedGender") || null);

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
    localStorage.removeItem("selectedGender");
    setToken(null);
    setUser(null);
    setSelectedGender(null);
    toast.success("تم تسجيل الخروج بنجاح");
  };

  const selectGender = (gender) => {
    setSelectedGender(gender);
    localStorage.setItem("selectedGender", gender);
  };

  const getThemeClass = () => {
    if (!user) return "";
    if (user.role === "student") {
      return user.gender === "female" ? "theme-female" : "theme-male";
    }
    if (user.role === "teacher") {
      return "theme-teacher";
    }
    // For admin/supervisor with gender selection
    if (selectedGender === "female") return "theme-female";
    if (selectedGender === "male") return "theme-male";
    return ""; // Admin purple
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.post(`${API}/auth/change-password`, 
        { current_password: currentPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("تم تغيير كلمة المرور بنجاح");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في تغيير كلمة المرور");
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, token, login, logout, loading, getThemeClass, 
      selectedGender, selectGender, changePassword 
    }}>
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
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "supervisor") return <Navigate to="/supervisor" replace />;
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

  const getDefaultRoute = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "admin": return "/admin";
      case "supervisor": return "/supervisor";
      case "teacher": return "/teacher";
      case "student": return "/student";
      default: return "/login";
    }
  };

  return (
    <div className={getThemeClass()}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={getDefaultRoute()} replace /> : <LoginPage />} />
        
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
        <Route path="/admin/financial" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout><FinancialManagement /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/schedules" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout><SchedulesPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin/honor-roll" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout><HonorRoll /></Layout>
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

        {/* Supervisor Routes */}
        <Route path="/supervisor" element={
          <ProtectedRoute allowedRoles={["supervisor"]}>
            <Layout><SupervisorDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/supervisor/students" element={
          <ProtectedRoute allowedRoles={["supervisor"]}>
            <Layout><StudentManagement /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/supervisor/teachers" element={
          <ProtectedRoute allowedRoles={["supervisor"]}>
            <Layout><TeacherManagement /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/supervisor/grades" element={
          <ProtectedRoute allowedRoles={["supervisor"]}>
            <Layout><GradeManagement /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/supervisor/attendance" element={
          <ProtectedRoute allowedRoles={["supervisor"]}>
            <Layout><AttendanceManagement /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/supervisor/financial" element={
          <ProtectedRoute allowedRoles={["supervisor"]}>
            <Layout><FinancialManagement /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/supervisor/schedules" element={
          <ProtectedRoute allowedRoles={["supervisor"]}>
            <Layout><SchedulesPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/supervisor/honor-roll" element={
          <ProtectedRoute allowedRoles={["supervisor"]}>
            <Layout><HonorRoll /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/supervisor/announcements" element={
          <ProtectedRoute allowedRoles={["supervisor"]}>
            <Layout><AnnouncementsPage /></Layout>
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
