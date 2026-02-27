import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Eye,
  Printer,
  FileText,
  Calendar,
  DollarSign,
  GraduationCap,
  User,
  X
} from "lucide-react";
import { toast } from "sonner";

const SCHOOL_LOGO = "https://customer-assets.emergentagent.com/job_7beeca3e-b314-4460-83b0-e8b48115e3c8/artifacts/80ve4mnx_1000219663.jpg";

const StudentManagement = () => {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    gender: "male",
    birth_date: "",
    class_name: "",
    section: "",
    address: "",
    parent_info: {
      father_name: "",
      mother_name: "",
      father_phone: "",
      mother_phone: ""
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        axios.get(`${API}/students`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/classes`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      toast.error("فشل في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetails = async (studentId) => {
    try {
      const response = await axios.get(`${API}/students/${studentId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudentDetails(response.data);
      setDetailsDialogOpen(true);
    } catch (error) {
      toast.error("فشل في جلب بيانات الطالب");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await axios.put(`${API}/students/${editingStudent.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("تم تحديث بيانات الطالب بنجاح");
      } else {
        await axios.post(`${API}/students`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("تم إضافة الطالب بنجاح");
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "حدث خطأ");
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      full_name: student.full_name,
      gender: student.gender,
      birth_date: student.birth_date,
      class_name: student.class_name,
      section: student.section,
      address: student.address,
      parent_info: student.parent_info
    });
    setDialogOpen(true);
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الطالب؟")) return;
    try {
      await axios.delete(`${API}/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("تم حذف الطالب بنجاح");
      fetchData();
    } catch (error) {
      toast.error("فشل في حذف الطالب");
    }
  };

  const resetForm = () => {
    setEditingStudent(null);
    setFormData({
      full_name: "",
      gender: "male",
      birth_date: "",
      class_name: "",
      section: "",
      address: "",
      parent_info: {
        father_name: "",
        mother_name: "",
        father_phone: "",
        mother_phone: ""
      }
    });
  };

  const printStudentCard = () => {
    if (!studentDetails) return;
    const student = studentDetails.student;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>بطاقة الطالب - ${student.full_name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Cairo', sans-serif; padding: 20px; direction: rtl; }
          .card { width: 400px; border: 3px solid #6A1B9A; border-radius: 15px; padding: 20px; margin: auto; }
          .header { text-align: center; border-bottom: 2px solid #6A1B9A; padding-bottom: 15px; margin-bottom: 15px; }
          .logo { width: 80px; height: 80px; object-fit: contain; }
          .school-name { color: #6A1B9A; font-size: 18px; font-weight: bold; margin-top: 10px; }
          .student-name { font-size: 24px; font-weight: bold; color: #333; margin: 15px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .label { color: #666; }
          .value { font-weight: 600; color: #333; }
          .gender-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; font-size: 14px; }
          .male { background: #455A64; }
          .female { background: #880E4F; }
          .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px solid #6A1B9A; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <img src="${SCHOOL_LOGO}" class="logo" />
            <div class="school-name">ثانوية ابن خلدون الخاصة</div>
            <div style="color: #888; font-size: 12px;">حمص - سوريا</div>
          </div>
          <div class="student-name">${student.full_name}</div>
          <span class="gender-badge ${student.gender}">${student.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
          <div style="margin-top: 20px;">
            <div class="info-row"><span class="label">الصف:</span><span class="value">${student.class_name}</span></div>
            <div class="info-row"><span class="label">الشعبة:</span><span class="value">${student.section}</span></div>
            <div class="info-row"><span class="label">تاريخ الميلاد:</span><span class="value">${student.birth_date}</span></div>
            <div class="info-row"><span class="label">العنوان:</span><span class="value">${student.address}</span></div>
            <div class="info-row"><span class="label">اسم الأب:</span><span class="value">${student.parent_info?.father_name}</span></div>
            <div class="info-row"><span class="label">هاتف ولي الأمر:</span><span class="value">${student.parent_info?.father_phone}</span></div>
          </div>
          <div class="footer">
            <div style="color: #666; font-size: 12px;">اسم المستخدم: ${student.username || 'غير محدد'}</div>
            <div style="color: #888; font-size: 11px; margin-top: 5px;">تاريخ التسجيل: ${student.registration_date}</div>
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printReportCard = () => {
    if (!studentDetails || !studentDetails.grades.length) {
      toast.error("لا توجد علامات لطباعتها");
      return;
    }
    
    const student = studentDetails.student;
    const gradesData = studentDetails.grades[0];
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>الجلاء المدرسي - ${student.full_name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Cairo', sans-serif; padding: 30px; direction: rtl; }
          .container { max-width: 800px; margin: auto; border: 2px solid #333; padding: 30px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #6A1B9A; padding-bottom: 20px; margin-bottom: 20px; }
          .logo-section { text-align: center; }
          .logo { width: 100px; height: 100px; object-fit: contain; }
          .flag { width: 60px; margin-top: 10px; }
          .title-section { text-align: center; flex: 1; }
          .school-name { color: #6A1B9A; font-size: 24px; font-weight: bold; }
          .report-title { font-size: 20px; margin-top: 10px; color: #333; }
          .student-info { background: #f5f5f5; padding: 15px; border-radius: 10px; margin-bottom: 20px; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .info-item { display: flex; gap: 10px; }
          .info-label { color: #666; min-width: 100px; }
          .info-value { font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #333; padding: 10px; text-align: center; }
          th { background: #6A1B9A; color: white; }
          .total-row { background: #f0e6f5; font-weight: bold; }
          .signature-section { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; }
          .signature-box { text-align: center; width: 200px; }
          .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-section">
              <img src="${SCHOOL_LOGO}" class="logo" />
            </div>
            <div class="title-section">
              <div class="school-name">ثانوية ابن خلدون الخاصة</div>
              <div class="report-title">الجلاء المدرسي الإلكتروني</div>
              <div style="color: #666; margin-top: 5px;">${gradesData.semester} - ${gradesData.academic_year}</div>
            </div>
            <div class="logo-section">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Flag_of_Syria.svg/1200px-Flag_of_Syria.svg.png" class="flag" />
            </div>
          </div>
          
          <div class="student-info">
            <div class="info-grid">
              <div class="info-item"><span class="info-label">اسم الطالب:</span><span class="info-value">${student.full_name}</span></div>
              <div class="info-item"><span class="info-label">الصف:</span><span class="info-value">${student.class_name}</span></div>
              <div class="info-item"><span class="info-label">الشعبة:</span><span class="info-value">${student.section}</span></div>
              <div class="info-item"><span class="info-label">اسم الأب:</span><span class="info-value">${student.parent_info?.father_name}</span></div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>المادة</th>
                <th>الأول</th>
                <th>الثاني</th>
                <th>الشفهي</th>
                <th>الوظائف</th>
                <th>النهائي</th>
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${gradesData.grades?.map(g => `
                <tr>
                  <td>${g.subject}</td>
                  <td>${g.first_exam}</td>
                  <td>${g.second_exam}</td>
                  <td>${g.oral}</td>
                  <td>${g.homework}</td>
                  <td>${g.final_exam}</td>
                  <td class="total-row">${g.total}</td>
                </tr>
              `).join('') || '<tr><td colspan="7">لا توجد علامات</td></tr>'}
            </tbody>
          </table>
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">توقيع ولي الأمر</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">توقيع المدير</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">ختم المدرسة</div>
            </div>
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.full_name.includes(searchQuery);
    const matchesClass = filterClass === "all" || student.class_name === filterClass;
    const matchesGender = filterGender === "all" || student.gender === filterGender;
    return matchesSearch && matchesClass && matchesGender;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="student-management">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-[Cairo]">إدارة الطلاب</h1>
          <p className="text-muted-foreground">إدارة بيانات الطلاب وتسجيلهم</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="add-student-button">
              <Plus className="h-5 w-5" />
              إضافة طالب جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="font-[Cairo] text-xl">
                {editingStudent ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Personal Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-primary border-b pb-2">المعلومات الشخصية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الاسم الكامل *</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="أدخل الاسم الكامل"
                      required
                      data-testid="student-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الجنس *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger data-testid="student-gender-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>تاريخ الميلاد *</Label>
                    <Input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                      required
                      data-testid="student-birthdate-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان *</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="حمص - ..."
                      required
                      data-testid="student-address-input"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-primary border-b pb-2">المعلومات الدراسية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الصف *</Label>
                    <Select
                      value={formData.class_name}
                      onValueChange={(value) => setFormData({ ...formData, class_name: value })}
                    >
                      <SelectTrigger data-testid="student-class-select">
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
                    <Label>الشعبة *</Label>
                    <Select
                      value={formData.section}
                      onValueChange={(value) => setFormData({ ...formData, section: value })}
                    >
                      <SelectTrigger data-testid="student-section-select">
                        <SelectValue placeholder="اختر الشعبة" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes?.sections?.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Parent Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-primary border-b pb-2">معلومات ولي الأمر</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم الأب *</Label>
                    <Input
                      value={formData.parent_info.father_name}
                      onChange={(e) => setFormData({
                        ...formData,
                        parent_info: { ...formData.parent_info, father_name: e.target.value }
                      })}
                      required
                      data-testid="student-father-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>هاتف الأب *</Label>
                    <Input
                      value={formData.parent_info.father_phone}
                      onChange={(e) => setFormData({
                        ...formData,
                        parent_info: { ...formData.parent_info, father_phone: e.target.value }
                      })}
                      placeholder="09XXXXXXXX"
                      required
                      data-testid="student-father-phone-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>اسم الأم *</Label>
                    <Input
                      value={formData.parent_info.mother_name}
                      onChange={(e) => setFormData({
                        ...formData,
                        parent_info: { ...formData.parent_info, mother_name: e.target.value }
                      })}
                      required
                      data-testid="student-mother-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>هاتف الأم *</Label>
                    <Input
                      value={formData.parent_info.mother_phone}
                      onChange={(e) => setFormData({
                        ...formData,
                        parent_info: { ...formData.parent_info, mother_phone: e.target.value }
                      })}
                      placeholder="09XXXXXXXX"
                      required
                      data-testid="student-mother-phone-input"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" data-testid="student-submit-button">
                  {editingStudent ? "تحديث" : "إضافة"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث عن طالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
                data-testid="student-search-input"
              />
            </div>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-full md:w-48" data-testid="filter-class-select">
                <SelectValue placeholder="الصف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الصفوف</SelectItem>
                {classes?.classes?.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterGender} onValueChange={setFilterGender}>
              <SelectTrigger className="w-full md:w-36" data-testid="filter-gender-select">
                <SelectValue placeholder="الجنس" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="male">ذكور</SelectItem>
                <SelectItem value="female">إناث</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[Cairo]">
            قائمة الطلاب ({filteredStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-bold">#</TableHead>
                  <TableHead className="text-right font-bold">الاسم</TableHead>
                  <TableHead className="text-right font-bold">الجنس</TableHead>
                  <TableHead className="text-right font-bold">الصف</TableHead>
                  <TableHead className="text-right font-bold">الشعبة</TableHead>
                  <TableHead className="text-right font-bold">اسم المستخدم</TableHead>
                  <TableHead className="text-right font-bold">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا يوجد طلاب
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student, index) => (
                    <TableRow key={student.id} className="hover:bg-muted/50" data-testid={`student-row-${index}`}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell>
                        <Badge className={student.gender === "male" ? "badge-male" : "badge-female"}>
                          {student.gender === "male" ? "ذكر" : "أنثى"}
                        </Badge>
                      </TableCell>
                      <TableCell>{student.class_name}</TableCell>
                      <TableCell>{student.section}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {student.username || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedStudent(student);
                              fetchStudentDetails(student.id);
                            }}
                            title="عرض التفاصيل"
                            data-testid={`view-student-${index}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(student)}
                            title="تعديل"
                            data-testid={`edit-student-${index}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(student.id)}
                            title="حذف"
                            data-testid={`delete-student-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Student Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-[Cairo] text-xl flex items-center justify-between">
              <span>ملف الطالب: {studentDetails?.student?.full_name}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={printStudentCard} className="gap-1">
                  <Printer className="h-4 w-4" />
                  طباعة البطاقة
                </Button>
                <Button size="sm" variant="outline" onClick={printReportCard} className="gap-1">
                  <FileText className="h-4 w-4" />
                  طباعة الجلاء
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {studentDetails && (
            <Tabs defaultValue="info" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">المعلومات</TabsTrigger>
                <TabsTrigger value="grades">العلامات</TabsTrigger>
                <TabsTrigger value="attendance">الحضور</TabsTrigger>
                <TabsTrigger value="financial">الذمة المالية</TabsTrigger>
              </TabsList>
              
              {/* Info Tab */}
              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span className="text-muted-foreground">الاسم:</span>
                        <span className="font-semibold">{studentDetails.student.full_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-muted-foreground" />
                        <span className="text-muted-foreground">الصف:</span>
                        <span className="font-semibold">{studentDetails.student.class_name} ({studentDetails.student.section})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <span className="text-muted-foreground">تاريخ الميلاد:</span>
                        <span className="font-semibold">{studentDetails.student.birth_date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <span className="text-muted-foreground">هاتف الأب:</span>
                        <span className="font-semibold">{studentDetails.student.parent_info?.father_phone}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">اسم المستخدم:</span>
                        <span className="font-semibold mr-2">{studentDetails.student.username}</span>
                        <span className="text-sm text-muted-foreground">(كلمة المرور الافتراضية: 123456)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Grades Tab */}
              <TabsContent value="grades" className="space-y-4">
                {studentDetails.grades.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      لا توجد علامات مسجلة
                    </CardContent>
                  </Card>
                ) : (
                  studentDetails.grades.map((gradeDoc, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="text-lg">{gradeDoc.semester} - {gradeDoc.academic_year}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>المادة</TableHead>
                              <TableHead>الأول</TableHead>
                              <TableHead>الثاني</TableHead>
                              <TableHead>الشفهي</TableHead>
                              <TableHead>الوظائف</TableHead>
                              <TableHead>النهائي</TableHead>
                              <TableHead>المجموع</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {gradeDoc.grades?.map((g, i) => (
                              <TableRow key={i}>
                                <TableCell>{g.subject}</TableCell>
                                <TableCell>{g.first_exam}</TableCell>
                                <TableCell>{g.second_exam}</TableCell>
                                <TableCell>{g.oral}</TableCell>
                                <TableCell>{g.homework}</TableCell>
                                <TableCell>{g.final_exam}</TableCell>
                                <TableCell className="font-bold">{g.total}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
              
              {/* Attendance Tab */}
              <TabsContent value="attendance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">إحصائيات الحضور</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="p-4 rounded-lg bg-muted text-center">
                        <div className="text-2xl font-bold">{studentDetails.attendance.stats.total_days}</div>
                        <div className="text-sm text-muted-foreground">إجمالي الأيام</div>
                      </div>
                      <div className="p-4 rounded-lg bg-green-100 text-center">
                        <div className="text-2xl font-bold text-green-700">{studentDetails.attendance.stats.present_days}</div>
                        <div className="text-sm text-green-600">أيام الحضور</div>
                      </div>
                      <div className="p-4 rounded-lg bg-red-100 text-center">
                        <div className="text-2xl font-bold text-red-700">{studentDetails.attendance.stats.absent_days}</div>
                        <div className="text-sm text-red-600">أيام الغياب</div>
                      </div>
                      <div className="p-4 rounded-lg bg-yellow-100 text-center">
                        <div className="text-2xl font-bold text-yellow-700">{studentDetails.attendance.stats.late_days}</div>
                        <div className="text-sm text-yellow-600">أيام التأخر</div>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <span className="text-lg">نسبة الحضور: </span>
                      <span className="text-2xl font-bold text-primary">{studentDetails.attendance.stats.attendance_rate}%</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Financial Tab */}
              <TabsContent value="financial" className="space-y-4">
                {studentDetails.financial ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        الذمة المالية
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 rounded-lg bg-muted text-center">
                          <div className="text-xl font-bold">{studentDetails.financial.total_fee?.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">القسط الكامل</div>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-100 text-center">
                          <div className="text-xl font-bold text-blue-700">{studentDetails.financial.discount?.toLocaleString()}</div>
                          <div className="text-sm text-blue-600">الخصم</div>
                        </div>
                        <div className="p-4 rounded-lg bg-green-100 text-center">
                          <div className="text-xl font-bold text-green-700">{studentDetails.financial.total_paid?.toLocaleString()}</div>
                          <div className="text-sm text-green-600">المدفوع</div>
                        </div>
                        <div className="p-4 rounded-lg bg-red-100 text-center">
                          <div className="text-xl font-bold text-red-700">{studentDetails.financial.remaining?.toLocaleString()}</div>
                          <div className="text-sm text-red-600">المتبقي</div>
                        </div>
                      </div>
                      
                      {studentDetails.financial.payments?.length > 0 && (
                        <>
                          <h4 className="font-semibold mb-2">سجل الدفعات:</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>التاريخ</TableHead>
                                <TableHead>المبلغ</TableHead>
                                <TableHead>رقم الوصل</TableHead>
                                <TableHead>ملاحظات</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {studentDetails.financial.payments.map((p, i) => (
                                <TableRow key={i}>
                                  <TableCell>{p.date}</TableCell>
                                  <TableCell>{p.amount?.toLocaleString()} ل.س</TableCell>
                                  <TableCell>{p.receipt_number}</TableCell>
                                  <TableCell>{p.notes || "-"}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      لا يوجد سجل مالي لهذا الطالب
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentManagement;
