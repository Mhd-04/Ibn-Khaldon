import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
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
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import {
  Calendar as CalendarIcon,
  Check,
  X,
  Clock,
  Save
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const AttendanceManagement = () => {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedClass) {
      fetchAttendance();
    }
  }, [selectedDate, selectedClass, selectedSection]);

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

  const fetchAttendance = async () => {
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await axios.get(`${API}/attendance`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { date: dateStr, class_name: selectedClass }
      });
      setAttendance(response.data);
      
      // Populate attendance records
      const records = {};
      response.data.forEach((record) => {
        records[record.student_id] = record.status;
      });
      setAttendanceRecords(records);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  const filteredStudents = students.filter(
    (s) => s.class_name === selectedClass && s.section === selectedSection
  );

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status
    }));
  };

  const saveAllAttendance = async () => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const records = Object.entries(attendanceRecords).map(([student_id, status]) => ({
      student_id,
      status
    }));

    try {
      await axios.post(
        `${API}/attendance/bulk`,
        { date: dateStr, records },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("تم حفظ الحضور بنجاح");
      fetchAttendance();
    } catch (error) {
      toast.error("فشل في حفظ الحضور");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "present":
        return <Badge className="status-present gap-1"><Check className="h-3 w-3" /> حاضر</Badge>;
      case "absent":
        return <Badge className="status-absent gap-1"><X className="h-3 w-3" /> غائب</Badge>;
      case "late":
        return <Badge className="status-late gap-1"><Clock className="h-3 w-3" /> متأخر</Badge>;
      default:
        return <Badge variant="outline">غير محدد</Badge>;
    }
  };

  const getStats = () => {
    const total = filteredStudents.length;
    const present = Object.values(attendanceRecords).filter((s) => s === "present").length;
    const absent = Object.values(attendanceRecords).filter((s) => s === "absent").length;
    const late = Object.values(attendanceRecords).filter((s) => s === "late").length;
    return { total, present, absent, late };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="attendance-management">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-[Cairo]">الحضور والغياب</h1>
          <p className="text-muted-foreground">تسجيل حضور وغياب الطلاب</p>
        </div>
        <Button
          onClick={saveAllAttendance}
          className="gap-2"
          disabled={filteredStudents.length === 0}
          data-testid="save-attendance-button"
        >
          <Save className="h-5 w-5" />
          حفظ الحضور
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-right font-normal"
                    data-testid="attendance-date-picker"
                  >
                    <CalendarIcon className="ms-2 h-4 w-4" />
                    {format(selectedDate, "PPP", { locale: ar })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={ar}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>الصف</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger data-testid="attendance-class-select">
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
                <SelectTrigger data-testid="attendance-section-select">
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
              <Label>الإحصائيات</Label>
              <div className="flex gap-2 text-sm">
                <span className="text-green-600">حاضر: {stats.present}</span>
                <span className="text-red-600">غائب: {stats.absent}</span>
                <span className="text-yellow-600">متأخر: {stats.late}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      {selectedClass && selectedSection ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-[Cairo]">
              حضور {selectedClass} ({selectedSection}) - {format(selectedDate, "PPP", { locale: ar })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right font-bold">#</TableHead>
                    <TableHead className="text-right font-bold">اسم الطالب</TableHead>
                    <TableHead className="text-right font-bold">الجنس</TableHead>
                    <TableHead className="text-right font-bold">الحالة</TableHead>
                    <TableHead className="text-right font-bold">تسجيل الحضور</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        لا يوجد طلاب في هذا الصف
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student, index) => (
                      <TableRow key={student.id} className="hover:bg-muted/50" data-testid={`attendance-row-${index}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{student.full_name}</TableCell>
                        <TableCell>
                          <Badge className={student.gender === "male" ? "badge-male" : "badge-female"}>
                            {student.gender === "male" ? "ذكر" : "أنثى"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(attendanceRecords[student.id])}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={attendanceRecords[student.id] === "present" ? "default" : "outline"}
                              className={attendanceRecords[student.id] === "present" ? "bg-green-600 hover:bg-green-700" : ""}
                              onClick={() => handleAttendanceChange(student.id, "present")}
                              data-testid={`attendance-present-${index}`}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={attendanceRecords[student.id] === "absent" ? "default" : "outline"}
                              className={attendanceRecords[student.id] === "absent" ? "bg-red-600 hover:bg-red-700" : ""}
                              onClick={() => handleAttendanceChange(student.id, "absent")}
                              data-testid={`attendance-absent-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={attendanceRecords[student.id] === "late" ? "default" : "outline"}
                              className={attendanceRecords[student.id] === "late" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                              onClick={() => handleAttendanceChange(student.id, "late")}
                              data-testid={`attendance-late-${index}`}
                            >
                              <Clock className="h-4 w-4" />
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
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              يرجى اختيار الصف والشعبة لعرض قائمة الحضور
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceManagement;
