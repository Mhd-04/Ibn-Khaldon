import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  BookOpen,
  Megaphone,
  Calendar,
  ExternalLink,
  FileText,
  GraduationCap
} from "lucide-react";
import { toast } from "sonner";

const SCHOOL_LOGO = "https://customer-assets.emergentagent.com/job_7beeca3e-b314-4460-83b0-e8b48115e3c8/artifacts/80ve4mnx_1000219663.jpg";

const StudentPortal = () => {
  const { token, user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gradesRes, announcementsRes, studentsRes] = await Promise.all([
        axios.get(`${API}/grades`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/announcements`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/students`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setGrades(gradesRes.data);
      setAnnouncements(announcementsRes.data);
      if (studentsRes.data.length > 0) {
        setStudentInfo(studentsRes.data[0]);
      }
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

  const latestGrades = grades.length > 0 ? grades[0] : null;

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="student-portal">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-l from-primary/10 to-transparent border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <img src={SCHOOL_LOGO} alt="الشعار" className="h-16 w-16 object-contain" />
            <div>
              <h1 className="text-2xl font-bold font-[Cairo]">مرحباً {user?.full_name}</h1>
              <p className="text-muted-foreground">
                {studentInfo ? `${studentInfo.class_name} - شعبة ${studentInfo.section}` : "بوابة الطالب"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="https://Mhd-04.github.io/IPS/"
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Card className="card-hover border-2 border-primary/20 hover:border-primary transition-colors cursor-pointer" data-testid="online-exams-link">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <ExternalLink className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-bold font-[Cairo] text-lg">مكتبة الاختبارات الإلكترونية</h3>
                <p className="text-sm text-muted-foreground">اضغط للوصول إلى بنك الأسئلة والاختبارات</p>
              </div>
            </CardContent>
          </Card>
        </a>

        <Card className="border-2 border-muted">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted">
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-bold font-[Cairo] text-lg">معلوماتي الدراسية</h3>
              <p className="text-sm text-muted-foreground">
                {studentInfo ? `${studentInfo.class_name} (${studentInfo.section})` : "غير محدد"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grades Section */}
      <Card data-testid="student-grades-card">
        <CardHeader>
          <CardTitle className="font-[Cairo] flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            علاماتي
          </CardTitle>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لم يتم نشر أي علامات بعد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {grades.map((gradeDoc, docIndex) => (
                <div key={docIndex} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 p-3 flex items-center justify-between">
                    <span className="font-semibold">{gradeDoc.semester} - {gradeDoc.academic_year}</span>
                    <Badge variant={gradeDoc.is_published ? "default" : "secondary"}>
                      {gradeDoc.is_published ? "منشور" : "قيد المراجعة"}
                    </Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-right font-bold">المادة</TableHead>
                        <TableHead className="text-right font-bold">الأول</TableHead>
                        <TableHead className="text-right font-bold">الثاني</TableHead>
                        <TableHead className="text-right font-bold">الشفهي</TableHead>
                        <TableHead className="text-right font-bold">الوظائف</TableHead>
                        <TableHead className="text-right font-bold">النهائي</TableHead>
                        <TableHead className="text-right font-bold">المجموع</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gradeDoc.grades?.map((grade, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{grade.subject}</TableCell>
                          <TableCell>{grade.first_exam}</TableCell>
                          <TableCell>{grade.second_exam}</TableCell>
                          <TableCell>{grade.oral}</TableCell>
                          <TableCell>{grade.homework}</TableCell>
                          <TableCell>{grade.final_exam}</TableCell>
                          <TableCell className="font-bold text-primary">{grade.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Announcements Section */}
      <Card data-testid="student-announcements-card">
        <CardHeader>
          <CardTitle className="font-[Cairo] flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            الإعلانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد إعلانات حالياً</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement, index) => (
                <div
                  key={announcement.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={`student-announcement-${index}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Megaphone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold">{announcement.title}</h4>
                      <p className="text-sm text-foreground mt-1 leading-relaxed">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(announcement.created_at).toLocaleDateString('ar-SY')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentPortal;
