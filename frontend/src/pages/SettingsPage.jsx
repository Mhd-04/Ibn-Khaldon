import React, { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Settings, Save, MessageCircle, School, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";

const SettingsPage = () => {
  const { token } = useAuth();
  const [settings, setSettings] = useState({
    school_name: "ثانوية ابن خلدون الخاصة",
    whatsapp_number: "0964803354",
    address: "حمص - سوريا",
    phone: "",
    email: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API}/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("تم حفظ الإعدادات بنجاح");
    } catch (error) {
      toast.error("فشل في حفظ الإعدادات");
    } finally {
      setSaving(false);
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
    <div className="space-y-6 animate-fadeIn max-w-2xl" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-[Cairo]">الإعدادات</h1>
        <p className="text-muted-foreground">إعدادات المدرسة والنظام</p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="font-[Cairo] flex items-center gap-2">
              <School className="h-5 w-5" />
              معلومات المدرسة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <School className="h-4 w-4 text-muted-foreground" />
                اسم المدرسة
              </Label>
              <Input
                value={settings.school_name}
                onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                data-testid="settings-school-name"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                رقم واتساب المدرسة
              </Label>
              <Input
                value={settings.whatsapp_number}
                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                placeholder="0964803354"
                dir="ltr"
                className="text-right"
                data-testid="settings-whatsapp"
              />
              <p className="text-xs text-muted-foreground">
                سيُستخدم هذا الرقم لإرسال إشعارات أولياء الأمور
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                العنوان
              </Label>
              <Input
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                data-testid="settings-address"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                رقم الهاتف
              </Label>
              <Input
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                dir="ltr"
                className="text-right"
                data-testid="settings-phone"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                البريد الإلكتروني
              </Label>
              <Input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                dir="ltr"
                className="text-right"
                data-testid="settings-email"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full gap-2" 
              disabled={saving}
              data-testid="settings-save-button"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  حفظ الإعدادات
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* WhatsApp Info */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[Cairo] flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            رسالة واتساب التلقائية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-800 text-sm leading-relaxed">
              ولي أمر الطالب/ة الكريم، تم رصد درجات (اسم المادة) في ثانوية ابن خلدون الخاصة. 
              يمكنك الاطلاع عليها الآن عبر بوابة الطالب. مع تحيات الإدارة.
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            سيتم إرسال هذه الرسالة تلقائياً عند نشر العلامات
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
