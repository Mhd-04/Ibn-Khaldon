import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Users,
  GraduationCap,
  DollarSign,
  Megaphone,
  TrendingUp,
  UserCheck,
  UserX,
  FileSpreadsheet,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      toast.error("فشل في جلب الإحصائيات");
    } finally {
      setLoading(false);
    }
  };

  const exportSalaries = async () => {
    try {
      const response = await axios.get(`${API}/export/salaries`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'salaries_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("تم تصدير كشف الرواتب بنجاح");
    } catch (error) {
      toast.error("فشل في تصدير الملف");
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
      borderColor: "border-r-[#6A1B9A]",
      change: "+12%",
      changeType: "up"
    },
    {
      title: "عدد الأساتذة",
      value: stats?.teachers_count || 0,
      icon: GraduationCap,
      color: "bg-[#9C27B0]",
      borderColor: "border-r-[#9C27B0]",
      change: "+3",
      changeType: "up"
    },
    {
      title: "إجمالي الرواتب",
      value: `${(stats?.total_salaries || 0).toLocaleString()} ل.س`,
      icon: DollarSign,
      color: "bg-[#FFD700]",
      borderColor: "border-r-[#FFD700]",
      change: null,
      changeType: null
    },
    {
      title: "الإعلانات النشطة",
      value: stats?.announcements_count || 0,
      icon: Megaphone,
      color: "bg-[#2E7D32]",
      borderColor: "border-r-[#2E7D32]",
      change: null,
      changeType: null
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn" data-testid="admin-dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-[Cairo] text-foreground">
            لوحة التحكم
          </h1>
          <p className="text-muted-foreground mt-1">
            مرحباً بك في نظام إدارة ثانوية ابن خلدون الخاصة
          </p>
        </div>
        <Button
          onClick={exportSalaries}
          className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white gap-2"
          data-testid="export-salaries-button"
        >
          <FileSpreadsheet className="h-5 w-5" />
          تصدير كشف الرواتب
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card
            key={stat.title}
            className={`card-hover border-r-4 ${stat.borderColor} animate-fadeIn`}
            style={{ animationDelay: `${index * 0.1}s` }}
            data-testid={`stat-card-${index}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold font-[Cairo]">{stat.value}</p>
                  {stat.change && (
                    <div className={`flex items-center gap-1 mt-2 text-sm ${
                      stat.changeType === "up" ? "text-green-600" : "text-red-600"
                    }`}>
                      {stat.changeType === "up" ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                      <span>{stat.change}</span>
                    </div>
                  )}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-hover" data-testid="gender-distribution-card">
          <CardHeader>
            <CardTitle className="font-[Cairo] text-lg">توزيع الطلاب حسب الجنس</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-[#455A64]"></div>
                  <span>الذكور</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{stats?.male_students || 0}</span>
                  <span className="text-muted-foreground text-sm">طالب</span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-[#455A64] h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${stats?.students_count ? (stats.male_students / stats.students_count) * 100 : 0}%`
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-[#880E4F]"></div>
                  <span>الإناث</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{stats?.female_students || 0}</span>
                  <span className="text-muted-foreground text-sm">طالبة</span>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-[#880E4F] h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${stats?.students_count ? (stats.female_students / stats.students_count) * 100 : 0}%`
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="card-hover" data-testid="quick-actions-card">
          <CardHeader>
            <CardTitle className="font-[Cairo] text-lg">إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-[#6A1B9A] hover:text-white transition-colors"
                onClick={() => window.location.href = "/admin/students"}
                data-testid="quick-add-student"
              >
                <Users className="h-6 w-6" />
                <span>إضافة طالب</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-[#9C27B0] hover:text-white transition-colors"
                onClick={() => window.location.href = "/admin/teachers"}
                data-testid="quick-add-teacher"
              >
                <GraduationCap className="h-6 w-6" />
                <span>إضافة أستاذ</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-[#2E7D32] hover:text-white transition-colors"
                onClick={() => window.location.href = "/admin/grades"}
                data-testid="quick-grades"
              >
                <TrendingUp className="h-6 w-6" />
                <span>إدارة العلامات</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-[#FFD700] hover:text-black transition-colors"
                onClick={() => window.location.href = "/admin/announcements"}
                data-testid="quick-announcements"
              >
                <Megaphone className="h-6 w-6" />
                <span>إضافة إعلان</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
