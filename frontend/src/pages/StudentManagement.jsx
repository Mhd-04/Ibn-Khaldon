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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  User
} from "lucide-react";
import { toast } from "sonner";

const StudentManagement = () => {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
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
                  <TableHead className="text-right font-bold">هاتف ولي الأمر</TableHead>
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
                      <TableCell dir="ltr" className="text-right">
                        {student.parent_info?.father_phone}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(student)}
                            data-testid={`edit-student-${index}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(student.id)}
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
    </div>
  );
};

export default StudentManagement;
