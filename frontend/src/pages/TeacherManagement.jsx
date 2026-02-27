import React, { useState, useEffect, useRef } from "react";
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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileSpreadsheet,
  DollarSign,
  Upload,
  Download,
  Printer
} from "lucide-react";
import { toast } from "sonner";

const TeacherManagement = () => {
  const { token } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    full_name: "",
    gender: "male",
    subject: "",
    phone: "",
    hourly_rate: 0,
    total_hours: 0,
    bonus: 0,
    deductions: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, classesRes] = await Promise.all([
        axios.get(`${API}/teachers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/classes`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setTeachers(teachersRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      toast.error("فشل في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await axios.put(`${API}/teachers/${editingTeacher.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("تم تحديث بيانات الأستاذ بنجاح");
      } else {
        await axios.post(`${API}/teachers`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("تم إضافة الأستاذ بنجاح");
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "حدث خطأ");
    }
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      full_name: teacher.full_name,
      gender: teacher.gender,
      subject: teacher.subject,
      phone: teacher.phone,
      hourly_rate: teacher.hourly_rate,
      total_hours: teacher.total_hours,
      bonus: teacher.bonus,
      deductions: teacher.deductions
    });
    setDialogOpen(true);
  };

  const handleDelete = async (teacherId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الأستاذ؟")) return;
    try {
      await axios.delete(`${API}/teachers/${teacherId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("تم حذف الأستاذ بنجاح");
      fetchData();
    } catch (error) {
      toast.error("فشل في حذف الأستاذ");
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/import/salaries`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success(response.data.message);
      if (response.data.errors?.length > 0) {
        response.data.errors.forEach(err => toast.error(err));
      }
      fetchData();
      setUploadDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في رفع الملف");
    }
  };

  const printSalaries = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>كشف الرواتب</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Cairo', sans-serif; padding: 30px; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; color: #6A1B9A; font-weight: bold; }
          .date { color: #666; margin-top: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #333; padding: 10px; text-align: center; }
          th { background: #6A1B9A; color: white; }
          .total-row { background: #f0e6f5; font-weight: bold; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">ثانوية ابن خلدون الخاصة - كشف رواتب الأساتذة</div>
          <div class="date">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SY')}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم الأستاذ</th>
              <th>المادة</th>
              <th>الساعات</th>
              <th>أجر الساعة</th>
              <th>المكافآت</th>
              <th>الخصومات</th>
              <th>الراتب الصافي</th>
            </tr>
          </thead>
          <tbody>
            ${teachers.map((t, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${t.full_name}</td>
                <td>${t.subject}</td>
                <td>${t.total_hours}</td>
                <td>${t.hourly_rate.toLocaleString()}</td>
                <td>${t.bonus.toLocaleString()}</td>
                <td>${t.deductions.toLocaleString()}</td>
                <td class="total-row">${(t.calculated_salary || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="7">إجمالي الرواتب</td>
              <td>${totalSalaries.toLocaleString()} ل.س</td>
            </tr>
          </tbody>
        </table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const resetForm = () => {
    setEditingTeacher(null);
    setFormData({
      full_name: "",
      gender: "male",
      subject: "",
      phone: "",
      hourly_rate: 0,
      total_hours: 0,
      bonus: 0,
      deductions: 0
    });
  };

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.full_name.includes(searchQuery) || teacher.subject.includes(searchQuery)
  );

  const totalSalaries = teachers.reduce((sum, t) => sum + (t.calculated_salary || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="teacher-management">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-[Cairo]">إدارة الأساتذة</h1>
          <p className="text-muted-foreground">إدارة بيانات الأساتذة والرواتب</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setUploadDialogOpen(true)}
            className="gap-2"
            data-testid="upload-salaries-button"
          >
            <Upload className="h-5 w-5" />
            رفع Excel
          </Button>
          <Button
            variant="outline"
            onClick={exportSalaries}
            className="gap-2"
            data-testid="export-salaries-button"
          >
            <Download className="h-5 w-5" />
            تصدير Excel
          </Button>
          <Button
            variant="outline"
            onClick={printSalaries}
            className="gap-2"
            data-testid="print-salaries-button"
          >
            <Printer className="h-5 w-5" />
            طباعة
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="add-teacher-button">
                <Plus className="h-5 w-5" />
                إضافة أستاذ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle className="font-[Cairo] text-xl">
                  {editingTeacher ? "تعديل بيانات الأستاذ" : "إضافة أستاذ جديد"}
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
                        required
                        data-testid="teacher-name-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الجنس *</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      >
                        <SelectTrigger data-testid="teacher-gender-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">ذكر</SelectItem>
                          <SelectItem value="female">أنثى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>المادة *</Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) => setFormData({ ...formData, subject: value })}
                      >
                        <SelectTrigger data-testid="teacher-subject-select">
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
                      <Label>رقم الهاتف *</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="09XXXXXXXX"
                        required
                        data-testid="teacher-phone-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Salary Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-primary border-b pb-2">معلومات الراتب</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>أجر الساعة (ل.س) *</Label>
                      <Input
                        type="number"
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                        required
                        data-testid="teacher-hourly-rate-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>عدد الساعات</Label>
                      <Input
                        type="number"
                        value={formData.total_hours}
                        onChange={(e) => setFormData({ ...formData, total_hours: parseFloat(e.target.value) || 0 })}
                        data-testid="teacher-hours-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المكافآت (ل.س)</Label>
                      <Input
                        type="number"
                        value={formData.bonus}
                        onChange={(e) => setFormData({ ...formData, bonus: parseFloat(e.target.value) || 0 })}
                        data-testid="teacher-bonus-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الخصومات (ل.س)</Label>
                      <Input
                        type="number"
                        value={formData.deductions}
                        onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) || 0 })}
                        data-testid="teacher-deductions-input"
                      />
                    </div>
                  </div>
                  {/* Salary Preview */}
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">الراتب الصافي المتوقع:</p>
                    <p className="text-2xl font-bold text-primary">
                      {((formData.hourly_rate * formData.total_hours) + formData.bonus - formData.deductions).toLocaleString()} ل.س
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" data-testid="teacher-submit-button">
                    {editingTeacher ? "تحديث" : "إضافة"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-[Cairo]">رفع ملف Excel للرواتب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              يجب أن يحتوي ملف Excel على الأعمدة التالية بالترتيب:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
              <li>اسم الأستاذ (يجب أن يكون موجوداً في النظام)</li>
              <li>عدد الساعات</li>
              <li>أجر الساعة</li>
              <li>المكافآت</li>
              <li>الخصومات</li>
            </ul>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="cursor-pointer"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-r-4 border-r-primary">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">عدد الأساتذة</p>
              <p className="text-2xl font-bold">{teachers.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-r-4 border-r-[#2E7D32]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الرواتب</p>
              <p className="text-2xl font-bold">{totalSalaries.toLocaleString()} ل.س</p>
            </div>
            <div className="p-3 rounded-xl bg-[#2E7D32]/10">
              <DollarSign className="h-6 w-6 text-[#2E7D32]" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-r-4 border-r-[#FFD700]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">متوسط الراتب</p>
              <p className="text-2xl font-bold">
                {teachers.length > 0 ? Math.round(totalSalaries / teachers.length).toLocaleString() : 0} ل.س
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#FFD700]/10">
              <DollarSign className="h-6 w-6 text-[#FFD700]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث عن أستاذ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
              data-testid="teacher-search-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Teachers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[Cairo]">كشف الرواتب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-bold">#</TableHead>
                  <TableHead className="text-right font-bold">الاسم</TableHead>
                  <TableHead className="text-right font-bold">اسم المستخدم</TableHead>
                  <TableHead className="text-right font-bold">المادة</TableHead>
                  <TableHead className="text-right font-bold">الساعات</TableHead>
                  <TableHead className="text-right font-bold">أجر الساعة</TableHead>
                  <TableHead className="text-right font-bold">المكافآت</TableHead>
                  <TableHead className="text-right font-bold">الخصومات</TableHead>
                  <TableHead className="text-right font-bold">الراتب الصافي</TableHead>
                  <TableHead className="text-right font-bold">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      لا يوجد أساتذة
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers.map((teacher, index) => (
                    <TableRow key={teacher.id} className="hover:bg-muted/50" data-testid={`teacher-row-${index}`}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{teacher.full_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{teacher.username || "-"}</TableCell>
                      <TableCell>{teacher.subject}</TableCell>
                      <TableCell>{teacher.total_hours}</TableCell>
                      <TableCell>{teacher.hourly_rate.toLocaleString()}</TableCell>
                      <TableCell className="text-green-600">+{teacher.bonus.toLocaleString()}</TableCell>
                      <TableCell className="text-red-600">-{teacher.deductions.toLocaleString()}</TableCell>
                      <TableCell className="font-bold text-primary">
                        {(teacher.calculated_salary || 0).toLocaleString()} ل.س
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(teacher)}
                            data-testid={`edit-teacher-${index}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(teacher.id)}
                            data-testid={`delete-teacher-${index}`}
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
    </div>
  );
};

export default TeacherManagement;
