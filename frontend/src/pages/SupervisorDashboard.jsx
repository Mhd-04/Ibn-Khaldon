import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import {
  Users,
  GraduationCap,
  DollarSign,
  Megaphone,
  ClipboardList,
  Calendar,
  Trophy,
  CalendarDays,
  UserCog
} from "lucide-react";
import { toast } from "sonner";

const SupervisorDashboard = () => {
  const { token, selectedGender } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [selectedGender]);

  const fetchStats = async () => {
    try {
      const params = selectedGender ? `?gender=${selectedGender}` : "";
      const response = await axios.get(`${API}/dashboard/stats${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      toast.error("فشل في جلب الإحصائيات");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "إجمالي الطلاب",
      value: stats?.students_count || 0,
      icon: Users,
      color: "bg-[#6A1B9A]",
      borderColor: "border-r-[#6A1B9A]"
    },
    {
      title: "عدد الأساتذة",
      value: stats?.teachers_count || 0,
      icon: GraduationCap,
      color: "bg-[#9C27B0]",
      borderColor: "border-r-[#9C27B0]"
    },
    {
      title: "إجمالي المستحقات",
      value: `${(stats?.total_fees || 0).toLocaleString()} ل.س`,
      icon: DollarSign,
      color: "bg-[#2E7D32]",
      borderColor: "border-r-[#2E7D32]"
    },
    {
      title: "المتبقي من الأقساط",
      value: `${(stats?.total_remaining || 0).toLocaleString()} ل.س`,
      icon: DollarSign,
      color: "bg-[#C62828]",
      borderColor: "border-r-[#C62828]"
    }
  ];

  const quickActions = [
    { label: "إدارة الطلاب", icon: Users, path: "/supervisor/students", color: "hover:bg-[#6A1B9A]" },
    { label: "إدارة الأساتذة", icon: GraduationCap, path: "/supervisor/teachers", color: "hover:bg-[#9C27B0]" },
    { label: "إدارة العلامات", icon: ClipboardList, path: "/supervisor/grades", color: "hover:bg-[#2E7D32]" },
    { label: "الحضور والغياب", icon: Calendar, path: "/supervisor/attendance", color: "hover:bg-[#1565C0]" },
    { label: "الذمة المالية", icon: DollarSign, path: "/supervisor/financial", color: "hover:bg-[#FFD700]" },
    { label: "الجداول", icon: CalendarDays, path: "/supervisor/schedules", color: "hover:bg-[#E65100]" },
    { label: "لوحة الشرف", icon: Trophy, path: "/supervisor/honor-roll", color: "hover:bg-[#FFC107]" },
    { label: "الإعلانات", icon: Megaphone, path: "/supervisor/announcements", color: "hover:bg-[#7B1FA2]" },
  ];

  return (
    <div className="space-y-8 animate-fadeIn" data-testid="supervisor-dashboard">
      <div>
        <h1 className="text-3xl font-bold font-[Cairo] text-foreground flex items-center gap-2">
          <UserCog className="h-8 w-8 text-primary" />
          لوحة تحكم الموجه
        </h1>
        <p className="text-muted-foreground mt-1">
          {selectedGender === "male" ? "قسم الذكور" : selectedGender === "female" ? "قسم الإناث" : "جميع الأقسام"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={stat.title} className={`card-hover border-r-4 ${stat.borderColor}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold font-[Cairo]">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gender Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[Cairo]">توزيع الطلاب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-lg bg-[#455A64]/10 text-center">
              <div className="text-4xl font-bold text-[#455A64]">{stats?.male_students || 0}</div>
              <div className="text-muted-foreground">طالب (ذكور)</div>
            </div>
            <div className="p-6 rounded-lg bg-[#880E4F]/10 text-center">
              <div className="text-4xl font-bold text-[#880E4F]">{stats?.female_students || 0}</div>
              <div className="text-muted-foreground">طالبة (إناث)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[Cairo]">الإجراءات السريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.path} to={action.path}>
                <Button
                  variant="outline"
                  className={`w-full h-24 flex-col gap-2 ${action.color} hover:text-white transition-colors`}
                >
                  <action.icon className="h-8 w-8" />
                  <span className="text-sm">{action.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorDashboard;
