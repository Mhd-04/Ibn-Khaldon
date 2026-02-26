import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  Save,
  Send,
  FileText,
  MessageCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

const GradeManagement = () => {
  const { token, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  
  // Filters
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("الفصل الأول");
  const [selectedYear, setSelectedYear] = useState("2024-2025");
  
  // Grade entries
  const [gradeEntries, setGradeEntries] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, classesRes, gradesRes, settingsRes] = await Promise.all([
        axios.get(`${API}/students`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/classes`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/grades`, { headers: { Authorization: `Bearer ${token}` } }),
        user?.role === "admin" ? axios.get(`${API}/settings`, { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve({ data: null })
      ]);
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
      setGrades(gradesRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      toast.error("فشل في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (s) => s.class_name === selectedClass && s.section === selectedSection
  );

  const handleGradeChange = (studentId, field, value) => {
    setGradeEntries((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const saveGrade = async (studentId) => {
    const entry = gradeEntries[studentId];
    if (!entry || !selectedSubject) {
      toast.error("يرجى تعبئة جميع الحقول");
      return;
    }

    try {
      await axios.post(
        `${API}/grades`,
        {
          student_id: studentId,
          subject: selectedSubject,
          first_exam: entry.first_exam || 0,
          second_exam: entry.second_exam || 0,
          oral: entry.oral || 0,
          homework: entry.homework || 0,
          final_exam: entry.final_exam || 0,
          semester: selectedSemester,
          academic_year: selectedYear
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("تم حفظ العلامة بنجاح");
      fetchData();
    } catch (error) {
      toast.error("فشل في حفظ العلامة");
    }
  };

  const publishGrades = async () => {
    try {
      const response = await axios.post(
        `${API}/grades/publish`,
        { semester: selectedSemester, academic_year: selectedYear },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message);
      
      // Send WhatsApp notification to parents
      sendWhatsAppNotifications();
      
      fetchData();
    } catch (error) {
      toast.error("فشل في نشر العلامات");
    }
  };

  const sendWhatsAppNotifications = () => {
    const whatsappNumber = settings?.whatsapp_number || "0964803354";
    const message = encodeURIComponent(
      `ولي أمر الطالب/ة الكريم، تم رصد درجات (${selectedSubject}) في ثانوية ابن خلدون الخاصة. يمكنك الاطلاع عليها الآن عبر بوابة الطالب. مع تحيات الإدارة.`
    );
    
    // Open WhatsApp for the school number
    window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${message}`, '_blank');
    toast.success("تم فتح واتساب لإرسال الإشعارات");
  };

  const getStudentGrade = (studentId) => {
    const studentGrades = grades.find(
      (g) =>
        g.student_id === studentId &&
        g.semester === selectedSemester &&
        g.academic_year === selectedYear
    );
    if (!studentGrades) return null;
    return studentGrades.grades?.find((g) => g.subject === selectedSubject);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="grade-management">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-[Cairo]">إدارة العلامات</h1>
          <p className="text-muted-foreground">رصد وإدارة علامات الطلاب</p>
        </div>
        {user?.role === "admin" && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={sendWhatsAppNotifications}
              className="gap-2"
              data-testid="whatsapp-notify-button"
            >
              <MessageCircle className="h-5 w-5" />
              إرسال إشعار واتساب
            </Button>
            <Button
              onClick={publishGrades}
              className="gap-2 bg-[#2E7D32] hover:bg-[#1B5E20]"
              data-testid="publish-grades-button"
            >
              <Send className="h-5 w-5" />
              نشر العلامات
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[Cairo] text-lg">تصفية البيانات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>الصف</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger data-testid="grade-class-select">
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.classes?.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الشعبة</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger data-testid="grade-section-select">
                  <SelectValue placeholder="اختر الشعبة" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.sections?.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المادة</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger data-testid="grade-subject-select">
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.subjects?.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الفصل الدراسي</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger data-testid="grade-semester-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {classes?.semesters?.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>العام الدراسي</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger data-testid="grade-year-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {classes?.academic_years?.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grades Table */}
      {selectedClass && selectedSection && selectedSubject ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-[Cairo]">
              علامات {selectedSubject} - {selectedClass} ({selectedSection})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right font-bold">#</TableHead>
                    <TableHead className="text-right font-bold">اسم الطالب</TableHead>
                    <TableHead className="text-right font-bold">الجنس</TableHead>
                    <TableHead className="text-right font-bold">الامتحان الأول</TableHead>
                    <TableHead className="text-right font-bold">الامتحان الثاني</TableHead>
                    <TableHead className="text-right font-bold">الشفهي</TableHead>
                    <TableHead className="text-right font-bold">الوظائف</TableHead>
                    <TableHead className="text-right font-bold">النهائي</TableHead>
                    <TableHead className="text-right font-bold">المجموع</TableHead>
                    <TableHead className="text-right font-bold">الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        لا يوجد طلاب في هذا الصف
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student, index) => {
                      const existingGrade = getStudentGrade(student.id);
                      const entry = gradeEntries[student.id] || existingGrade || {};
                      const total = (entry.first_exam || 0) + (entry.second_exam || 0) + (entry.oral || 0) + (entry.homework || 0) + (entry.final_exam || 0);
                      
                      return (
                        <TableRow key={student.id} className="hover:bg-muted/50" data-testid={`grade-row-${index}`}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{student.full_name}</TableCell>
                          <TableCell>
                            <Badge className={student.gender === "male" ? "badge-male" : "badge-female"}>
                              {student.gender === "male" ? "ذكر" : "أنثى"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              className="w-20"
                              value={entry.first_exam || ""}
                              onChange={(e) => handleGradeChange(student.id, "first_exam", e.target.value)}
                              data-testid={`grade-first-exam-${index}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              className="w-20"
                              value={entry.second_exam || ""}
                              onChange={(e) => handleGradeChange(student.id, "second_exam", e.target.value)}
                              data-testid={`grade-second-exam-${index}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              className="w-20"
                              value={entry.oral || ""}
                              onChange={(e) => handleGradeChange(student.id, "oral", e.target.value)}
                              data-testid={`grade-oral-${index}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              className="w-20"
                              value={entry.homework || ""}
                              onChange={(e) => handleGradeChange(student.id, "homework", e.target.value)}
                              data-testid={`grade-homework-${index}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              className="w-20"
                              value={entry.final_exam || ""}
                              onChange={(e) => handleGradeChange(student.id, "final_exam", e.target.value)}
                              data-testid={`grade-final-exam-${index}`}
                            />
                          </TableCell>
                          <TableCell className="font-bold text-primary">{total}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => saveGrade(student.id)}
                              className="gap-1"
                              data-testid={`save-grade-${index}`}
                            >
                              <Save className="h-4 w-4" />
                              حفظ
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              يرجى اختيار الصف والشعبة والمادة لعرض جدول العلامات
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GradeManagement;
