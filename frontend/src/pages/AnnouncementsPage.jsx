import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
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
import { Badge } from "../components/ui/badge";
import {
  Plus,
  Megaphone,
  Trash2,
  Calendar,
  Users,
  GraduationCap,
  Globe
} from "lucide-react";
import { toast } from "sonner";

const AnnouncementsPage = () => {
  const { token, user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    target_audience: "all"
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`${API}/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(response.data);
    } catch (error) {
      toast.error("فشل في جلب الإعلانات");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/announcements`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("تم إضافة الإعلان بنجاح");
      setDialogOpen(false);
      setFormData({ title: "", content: "", target_audience: "all" });
      fetchAnnouncements();
    } catch (error) {
      toast.error("فشل في إضافة الإعلان");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;
    try {
      await axios.delete(`${API}/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("تم حذف الإعلان");
      fetchAnnouncements();
    } catch (error) {
      toast.error("فشل في حذف الإعلان");
    }
  };

  const getAudienceIcon = (audience) => {
    switch (audience) {
      case "all":
        return <Globe className="h-4 w-4" />;
      case "teachers":
        return <GraduationCap className="h-4 w-4" />;
      case "students":
        return <Users className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getAudienceLabel = (audience) => {
    switch (audience) {
      case "all":
        return "الجميع";
      case "teachers":
        return "الأساتذة";
      case "students":
        return "الطلاب";
      default:
        return audience;
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
    <div className="space-y-6 animate-fadeIn" data-testid="announcements-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-[Cairo]">الإعلانات</h1>
          <p className="text-muted-foreground">إدارة إعلانات المدرسة</p>
        </div>
        {user?.role === "admin" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="add-announcement-button">
                <Plus className="h-5 w-5" />
                إضافة إعلان
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg" dir="rtl">
              <DialogHeader>
                <DialogTitle className="font-[Cairo] text-xl">إضافة إعلان جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>عنوان الإعلان *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="أدخل عنوان الإعلان"
                    required
                    data-testid="announcement-title-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>محتوى الإعلان *</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="أدخل محتوى الإعلان"
                    rows={5}
                    required
                    data-testid="announcement-content-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الفئة المستهدفة</Label>
                  <Select
                    value={formData.target_audience}
                    onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
                  >
                    <SelectTrigger data-testid="announcement-audience-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الجميع</SelectItem>
                      <SelectItem value="teachers">الأساتذة فقط</SelectItem>
                      <SelectItem value="students">الطلاب فقط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" data-testid="announcement-submit-button">
                    نشر الإعلان
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Megaphone className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">لا توجد إعلانات حالياً</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement, index) => (
            <Card 
              key={announcement.id} 
              className="card-hover animate-fadeIn"
              style={{ animationDelay: `${index * 0.1}s` }}
              data-testid={`announcement-card-${index}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-[Cairo] text-lg">{announcement.title}</CardTitle>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(announcement.created_at).toLocaleDateString('ar-SY')}
                        </span>
                        <Badge variant="outline" className="gap-1">
                          {getAudienceIcon(announcement.target_audience)}
                          {getAudienceLabel(announcement.target_audience)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {user?.role === "admin" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(announcement.id)}
                      data-testid={`delete-announcement-${index}`}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {announcement.content}
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  نشر بواسطة: {announcement.created_by}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
