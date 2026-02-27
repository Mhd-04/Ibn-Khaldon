import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardList,
  Calendar,
  Megaphone,
  Settings,
  LogOut,
  Menu,
  X,
  BookOpen,
  FileText,
  ExternalLink,
  DollarSign
} from "lucide-react";

const SCHOOL_LOGO = "https://customer-assets.emergentagent.com/job_7beeca3e-b314-4460-83b0-e8b48115e3c8/artifacts/80ve4mnx_1000219663.jpg";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Navigation items based on role
  const getNavItems = () => {
    if (user?.role === "admin") {
      return [
        { path: "/admin", icon: LayoutDashboard, label: "لوحة التحكم" },
        { path: "/admin/students", icon: Users, label: "إدارة الطلاب" },
        { path: "/admin/teachers", icon: GraduationCap, label: "إدارة الأساتذة" },
        { path: "/admin/grades", icon: ClipboardList, label: "إدارة العلامات" },
        { path: "/admin/attendance", icon: Calendar, label: "الحضور والغياب" },
        { path: "/admin/announcements", icon: Megaphone, label: "الإعلانات" },
        { path: "/admin/settings", icon: Settings, label: "الإعدادات" },
      ];
    }
    if (user?.role === "teacher") {
      return [
        { path: "/teacher", icon: LayoutDashboard, label: "لوحة التحكم" },
        { path: "/teacher/grades", icon: ClipboardList, label: "رصد العلامات" },
        { path: "/teacher/attendance", icon: Calendar, label: "تسجيل الحضور" },
      ];
    }
    return [
      { path: "/student", icon: LayoutDashboard, label: "بوابة الطالب" },
    ];
  };

  const navItems = getNavItems();

  const NavLink = ({ item, mobile = false }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        onClick={() => mobile && setMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
        data-testid={`nav-${item.path.replace(/\//g, '-')}`}
      >
        <item.icon className="h-5 w-5" />
        <span className={`${!sidebarOpen && !mobile ? "hidden" : ""} font-medium`}>
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 right-0 left-0 z-50 bg-card border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
          <div className="flex items-center gap-2">
            <img src={SCHOOL_LOGO} alt="الشعار" className="h-10 w-10 object-contain" />
            <span className="font-bold text-lg font-[Cairo]">ابن خلدون</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 right-0 h-full w-72 bg-card z-50 transform transition-transform duration-300 shadow-2xl ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <img src={SCHOOL_LOGO} alt="الشعار" className="h-12 w-12 object-contain" />
            <div>
              <h2 className="font-bold font-[Cairo]">ثانوية ابن خلدون</h2>
              <p className="text-xs text-muted-foreground">{user?.full_name}</p>
            </div>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-180px)] px-3 py-4">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink key={item.path} item={item} mobile />
            ))}
            {/* Online Exams Link */}
            <a
              href="https://Mhd-04.github.io/IPS/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
              data-testid="nav-online-exams"
            >
              <ExternalLink className="h-5 w-5" />
              <span className="font-medium">مكتبة الاختبارات</span>
            </a>
          </nav>
        </ScrollArea>
        <div className="absolute bottom-0 right-0 left-0 p-4 border-t bg-card">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={handleLogout}
            data-testid="logout-button-mobile"
          >
            <LogOut className="h-5 w-5" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 right-0 h-screen bg-card border-l shadow-sm z-30 sidebar-transition ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <img src={SCHOOL_LOGO} alt="الشعار" className="h-12 w-12 object-contain" />
            {sidebarOpen && (
              <div className="animate-fadeIn">
                <h2 className="font-bold font-[Cairo] text-sm">ثانوية ابن خلدون</h2>
                <p className="text-xs text-muted-foreground truncate">{user?.full_name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -left-3 top-20 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          data-testid="sidebar-toggle"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
            {/* Online Exams Link */}
            <a
              href="https://Mhd-04.github.io/IPS/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
              data-testid="nav-online-exams-desktop"
            >
              <ExternalLink className="h-5 w-5" />
              {sidebarOpen && <span className="font-medium">مكتبة الاختبارات</span>}
            </a>
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t">
          <Button
            variant="outline"
            className={`w-full gap-2 text-destructive hover:text-destructive ${
              sidebarOpen ? "justify-start" : "justify-center"
            }`}
            onClick={handleLogout}
            data-testid="logout-button"
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span>تسجيل الخروج</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`min-h-screen transition-all duration-300 ${
          sidebarOpen ? "lg:mr-64" : "lg:mr-20"
        } pt-16 lg:pt-0`}
      >
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
