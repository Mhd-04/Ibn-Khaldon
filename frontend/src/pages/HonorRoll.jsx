import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Trophy, Medal, Crown, Star } from "lucide-react";
import { toast } from "sonner";

const SCHOOL_LOGO = "https://customer-assets.emergentagent.com/job_7beeca3e-b314-4460-83b0-e8b48115e3c8/artifacts/80ve4mnx_1000219663.jpg";

const HonorRoll = () => {
  const { token, selectedGender } = useAuth();
  const [honorRoll, setHonorRoll] = useState({});
  const [classes, setClasses] = useState(null);
  const [selectedClass, setSelectedClass] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedGender]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedGender) params.append("gender", selectedGender);
      
      const [honorRes, classesRes] = await Promise.all([
        axios.get(`${API}/honor-roll?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/classes`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setHonorRoll(honorRes.data);
      setClasses(classesRes.data);
    } catch (error) {
      toast.error("فشل في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const printHonorRoll = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>لوحة الشرف</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Cairo', sans-serif; padding: 30px; direction: rtl; background: linear-gradient(135deg, #F3E5F5, #E1BEE7); min-height: 100vh; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { width: 100px; height: 100px; object-fit: contain; margin-bottom: 15px; }
          .title { color: #6A1B9A; font-size: 32px; font-weight: 800; margin-bottom: 10px; }
          .subtitle { color: #7B1FA2; font-size: 18px; }
          .class-section { margin-bottom: 40px; page-break-inside: avoid; }
          .class-title { background: #6A1B9A; color: white; padding: 15px; border-radius: 10px 10px 0 0; font-size: 20px; font-weight: bold; }
          .students-container { background: white; padding: 20px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
          .student-card { display: flex; align-items: center; padding: 15px; margin: 10px 0; border-radius: 10px; }
          .rank-1 { background: linear-gradient(135deg, #FFD700, #FFA500); }
          .rank-2 { background: linear-gradient(135deg, #C0C0C0, #A0A0A0); }
          .rank-3 { background: linear-gradient(135deg, #CD7F32, #8B4513); }
          .rank-badge { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: white; margin-left: 15px; background: rgba(255,255,255,0.3); }
          .student-info { flex: 1; }
          .student-name { font-size: 18px; font-weight: bold; color: white; }
          .student-average { font-size: 14px; color: rgba(255,255,255,0.9); }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${SCHOOL_LOGO}" class="logo" />
          <div class="title">لوحة الشرف</div>
          <div class="subtitle">ثانوية ابن خلدون الخاصة - ${selectedGender === "male" ? "قسم الذكور" : selectedGender === "female" ? "قسم الإناث" : "جميع الأقسام"}</div>
        </div>
        ${Object.entries(honorRoll).map(([className, students]) => `
          <div class="class-section">
            <div class="class-title">${className}</div>
            <div class="students-container">
              ${students.map((s, idx) => `
                <div class="student-card rank-${idx + 1}">
                  <div class="rank-badge">${idx + 1}</div>
                  <div class="student-info">
                    <div class="student-name">${s.student.full_name}</div>
                    <div class="student-average">المعدل: ${s.average} | المجموع: ${s.total}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 0: return <Crown className="h-8 w-8 text-yellow-500" />;
      case 1: return <Medal className="h-8 w-8 text-gray-400" />;
      case 2: return <Star className="h-8 w-8 text-amber-700" />;
      default: return null;
    }
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 0: return "bg-gradient-to-l from-yellow-400 to-amber-500 text-white";
      case 1: return "bg-gradient-to-l from-gray-300 to-gray-400 text-gray-800";
      case 2: return "bg-gradient-to-l from-amber-600 to-amber-800 text-white";
      default: return "bg-muted";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const filteredHonorRoll = selectedClass === "all" 
    ? honorRoll 
    : { [selectedClass]: honorRoll[selectedClass] || [] };

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="honor-roll">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-[Cairo] flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            لوحة الشرف
          </h1>
          <p className="text-muted-foreground">الطلاب الثلاثة الأوائل في كل صف</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="اختر الصف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الصفوف</SelectItem>
              {classes?.classes?.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={printHonorRoll} className="gap-2">
            طباعة
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {Object.entries(filteredHonorRoll).map(([className, students]) => (
          <Card key={className} className="overflow-hidden">
            <CardHeader className="bg-primary text-primary-foreground">
              <CardTitle className="font-[Cairo]">{className}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!students || students.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد علامات منشورة</p>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {students.map((s, idx) => (
                    <div
                      key={s.student.id}
                      className={`p-6 rounded-xl ${getRankStyle(idx)} transition-transform hover:scale-105`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {getRankIcon(idx)}
                        </div>
                        <div>
                          <div className="text-xl font-bold">{s.student.full_name}</div>
                          <div className="text-sm opacity-90">
                            المعدل: {s.average} | المجموع: {s.total}
                          </div>
                          <div className="text-xs opacity-75 mt-1">
                            {s.subjects_count} مادة
                          </div>
                        </div>
                      </div>
                      <div className="text-center mt-4">
                        <span className="text-4xl font-bold">#{idx + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HonorRoll;
