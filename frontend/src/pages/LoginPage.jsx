import React, { useState } from "react";
import { useAuth } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Eye, EyeOff, LogIn, School } from "lucide-react";

const SCHOOL_LOGO = "https://customer-assets.emergentagent.com/job_7beeca3e-b314-4460-83b0-e8b48115e3c8/artifacts/80ve4mnx_1000219663.jpg";

const LoginPage = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setLoading(true);
    await login(username, password);
    setLoading(false);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 50%, #CE93D8 100%)"
      }}
    >
      <div className="w-full max-w-md animate-fadeIn">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
            <img 
              src={SCHOOL_LOGO} 
              alt="شعار ثانوية ابن خلدون الخاصة" 
              className="h-24 w-24 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-[#4A148C] font-[Cairo]">
            ثانوية ابن خلدون الخاصة
          </h1>
          <p className="text-[#7B1FA2] mt-2">للبنين - البنات | حمص</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-[Cairo] text-[#6A1B9A]">
              تسجيل الدخول
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              أدخل بيانات الدخول للوصول إلى النظام
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-right block">
                  اسم المستخدم
                </Label>
                <Input
                  id="username"
                  data-testid="login-username-input"
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="text-right"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-right block">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    data-testid="login-password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-right pe-10"
                    dir="rtl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                data-testid="login-submit-button"
                className="w-full bg-[#6A1B9A] hover:bg-[#4A148C] text-white font-semibold py-6 text-lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <LogIn className="ms-2 h-5 w-5" />
                    دخول
                  </>
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-[#F3E5F5] rounded-lg">
              <p className="text-sm font-semibold text-[#6A1B9A] mb-2">بيانات تجريبية:</p>
              <div className="text-xs space-y-1 text-[#7B1FA2]">
                <p><strong>المدير:</strong> admin / admin123</p>
                <p><strong>الأساتذة:</strong> teacher_XXXXXXXX / 123456</p>
                <p><strong>الطلاب:</strong> student_XXXXXXXX / 123456</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-[#6A1B9A] mt-6">
          نظام الإدارة المدرسية الإلكتروني © 2026
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
