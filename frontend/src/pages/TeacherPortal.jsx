import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  DollarSign,
  BookOpen,
  Calendar,
  ClipboardList,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const SCHOOL_LOGO = "https://customer-assets.emergentagent.com/job_7beeca3e-b314-4460-83b0-e8b48115e3c8/artifacts/80ve4mnx_1000219663.jpg";

const TeacherPortal = () => {
  const { token, user } = useAuth();
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, announcementsRes] = await Promise.all([
        axios.get(`${API}/teachers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/announcements`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (teachersRes.data.length > 0) {
        setTeacherInfo(teachersRes.data[0]);
      }
      setAnnouncements(announcementsRes.data);
    } catch (error) {
      toast.error("فشل في جلب البيانات");
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

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="teacher-portal">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-l from-primary/10 to-transparent border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <img src={SCHOOL_LOGO} alt="الشعار" className="h-16 w-16 object-contain" />
            <div>
              <h1 className="text-2xl font-bold font-[Cairo]">مرحباً أستاذ/ة {user?.full_name}</h1>
              <p className="text-muted-foreground">
                {teacherInfo ? `مادة ${teacherInfo.subject}` : "بوابة الأستاذ"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/teacher/grades">
          <Card className="card-hover cursor-pointer h-full" data-testid="teacher-grades-link">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <ClipboardList className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold font-[Cairo]">رصد العلامات</h3>
                <p className="text-sm text-muted-foreground">إدخال علامات الطلاب</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/teacher/attendance">
          <Card className="card-hover cursor-pointer h-full" data-testid="teacher-attendance-link">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold font-[Cairo]">تسجيل الحضور</h3>
                <p className="text-sm text-muted-foreground">تسجيل حضور وغياب الطلاب</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <a href="https://Mhd-04.github.io/IPS/" target="_blank" rel="noopener noreferrer">
          <Card className="card-hover cursor-pointer h-full" data-testid="teacher-exams-link">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <ExternalLink className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold font-[Cairo]">مكتبة الاختبارات</h3>
                <p className="text-sm text-muted-foreground">بنك الأسئلة الإلكتروني</p>
              </div>
            </CardContent>
          </Card>
        </a>
      </div>

      {/* Salary Info */}
      {teacherInfo && (
        <Card data-testid="teacher-salary-card">
          <CardHeader>
            <CardTitle className="font-[Cairo] flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              معلومات الراتب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right font-bold">البند</TableHead>
                    <TableHead className="text-right font-bold">القيمة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">أجر الساعة</TableCell>
                    <TableCell>{teacherInfo.hourly_rate.toLocaleString()} ل.س</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">عدد الساعات</TableCell>
                    <TableCell>{teacherInfo.total_hours} ساعة</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">الراتب الأساسي</TableCell>
                    <TableCell>{(teacherInfo.hourly_rate * teacherInfo.total_hours).toLocaleString()} ل.س</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-green-600">المكافآت</TableCell>
                    <TableCell className="text-green-600">+{teacherInfo.bonus.toLocaleString()} ل.س</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-red-600">الخصومات</TableCell>
                    <TableCell className="text-red-600">-{teacherInfo.deductions.toLocaleString()} ل.س</TableCell>
                  </TableRow>
                  <TableRow className="bg-primary/5">
                    <TableCell className="font-bold text-lg">الراتب الصافي</TableCell>
                    <TableCell className="font-bold text-lg text-primary">
                      {(teacherInfo.calculated_salary || 0).toLocaleString()} ل.س
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Announcements */}
      <Card data-testid="teacher-announcements-card">
        <CardHeader>
          <CardTitle className="font-[Cairo] flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            الإعلانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">لا توجد إعلانات حالياً</p>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 5).map((announcement, index) => (
                <div
                  key={announcement.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <h4 className="font-bold">{announcement.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(announcement.created_at).toLocaleDateString('ar-SY')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherPortal;
