import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
import { CalendarDays, Save, Printer } from "lucide-react";
import { toast } from "sonner";

const SCHOOL_LOGO = "https://customer-assets.emergentagent.com/job_7beeca3e-b314-4460-83b0-e8b48115e3c8/artifacts/80ve4mnx_1000219663.jpg";

const SchedulesPage = () => {
  const { token } = useAuth();
  const [classes, setClasses] = useState(null);
  const [weeklySchedules, setWeeklySchedules] = useState([]);
  const [examSchedules, setExamSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [weeklyItems, setWeeklyItems] = useState([]);
  const [examItems, setExamItems] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchSchedules();
    }
  }, [selectedClass, selectedSection]);

  const fetchData = async () => {
    try {
      const classesRes = await axios.get(`${API}/classes`, { headers: { Authorization: `Bearer ${token}` } });
      setClasses(classesRes.data);
    } catch (error) {
      toast.error("فشل في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const [weeklyRes, examsRes] = await Promise.all([
        axios.get(`${API}/schedules/weekly?class_name=${selectedClass}&section=${selectedSection}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/schedules/exams?class_name=${selectedClass}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      if (weeklyRes.data.length > 0) {
        setWeeklyItems(weeklyRes.data[0].items || []);
      } else {
        // Initialize empty schedule
        const newItems = [];
        classes?.days?.forEach(day => {
          classes?.periods?.forEach(period => {
            newItems.push({ day, period, subject: "", teacher_name: "" });
          });
        });
        setWeeklyItems(newItems);
      }
      
      setExamSchedules(examsRes.data);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const saveWeeklySchedule = async () => {
    try {
      await axios.post(`${API}/schedules/weekly`, {
        class_name: selectedClass,
        section: selectedSection,
        items: weeklyItems
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("تم حفظ برنامج الأسبوع");
    } catch (error) {
      toast.error("فشل في حفظ البرنامج");
    }
  };

  const updateWeeklyItem = (day, period, field, value) => {
    setWeeklyItems(prev => 
      prev.map(item => 
        item.day === day && item.period === period 
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const printWeeklySchedule = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>برنامج الأسبوع</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Cairo', sans-serif; padding: 20px; direction: rtl; }
          .header { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 30px; border-bottom: 3px solid #6A1B9A; padding-bottom: 20px; }
          .logo { width: 80px; height: 80px; object-fit: contain; }
          .title { text-align: center; }
          .school-name { color: #6A1B9A; font-size: 24px; font-weight: bold; }
          .schedule-title { font-size: 18px; color: #333; margin-top: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 2px solid #6A1B9A; padding: 10px; text-align: center; }
          th { background: #6A1B9A; color: white; }
          .period-cell { background: #f0e6f5; font-weight: bold; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${SCHOOL_LOGO}" class="logo" />
          <div class="title">
            <div class="school-name">ثانوية ابن خلدون الخاصة</div>
            <div class="schedule-title">برنامج الأسبوع - ${selectedClass} - الشعبة ${selectedSection}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>الحصة</th>
              ${classes?.days?.map(day => `<th>${day}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${classes?.periods?.map(period => `
              <tr>
                <td class="period-cell">${period}</td>
                ${classes?.days?.map(day => {
                  const item = weeklyItems.find(i => i.day === day && i.period === period);
                  return `<td>${item?.subject || ''}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="schedules-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-[Cairo] flex items-center gap-2">
            <CalendarDays className="h-8 w-8 text-primary" />
            الجداول
          </h1>
          <p className="text-muted-foreground">برنامج الأسبوع وبرنامج الامتحانات</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label>الصف</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.classes?.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label>الشعبة</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
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
        </CardContent>
      </Card>

      {selectedClass && selectedSection && (
        <Tabs defaultValue="weekly">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">برنامج الأسبوع</TabsTrigger>
            <TabsTrigger value="exams">برنامج الامتحانات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-[Cairo]">
                  برنامج الأسبوع - {selectedClass} ({selectedSection})
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={printWeeklySchedule} className="gap-2">
                    <Printer className="h-4 w-4" />
                    طباعة
                  </Button>
                  <Button onClick={saveWeeklySchedule} className="gap-2">
                    <Save className="h-4 w-4" />
                    حفظ
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-primary">
                        <TableHead className="text-primary-foreground text-center font-bold">الحصة</TableHead>
                        {classes?.days?.map(day => (
                          <TableHead key={day} className="text-primary-foreground text-center font-bold">
                            {day}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classes?.periods?.map(period => (
                        <TableRow key={period}>
                          <TableCell className="font-bold bg-muted text-center">{period}</TableCell>
                          {classes?.days?.map(day => {
                            const item = weeklyItems.find(i => i.day === day && i.period === period);
                            return (
                              <TableCell key={`${day}-${period}`} className="p-1">
                                <Select
                                  value={item?.subject || ""}
                                  onValueChange={(value) => updateWeeklyItem(day, period, "subject", value)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="-" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">-</SelectItem>
                                    {classes?.subjects?.map(s => (
                                      <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="exams">
            <Card>
              <CardHeader>
                <CardTitle className="font-[Cairo]">برنامج الامتحانات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  قريباً - نظام إدارة برنامج الامتحانات
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SchedulesPage;
