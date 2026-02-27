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
  DollarSign,
  Upload,
  Download,
  Printer,
  CreditCard,
  Receipt
} from "lucide-react";
import { toast } from "sonner";

const FinancialManagement = () => {
  const { token } = useAuth();
  const [financials, setFinancials] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const fileInputRef = useRef(null);
  
  const [feeFormData, setFeeFormData] = useState({
    student_id: "",
    total_fee: 0,
    discount: 0
  });
  
  const [paymentFormData, setPaymentFormData] = useState({
    student_id: "",
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [financialsRes, studentsRes] = await Promise.all([
        axios.get(`${API}/financials`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/students`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setFinancials(financialsRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      toast.error("فشل في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleFeeSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/financials`, feeFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("تم حفظ البيانات المالية");
      setFeeDialogOpen(false);
      setFeeFormData({ student_id: "", total_fee: 0, discount: 0 });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "حدث خطأ");
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/financials/payment`, paymentFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`تم تسجيل الدفعة - رقم الوصل: ${response.data.receipt_number}`);
      setPaymentDialogOpen(false);
      setPaymentFormData({ student_id: "", amount: 0, date: new Date().toISOString().split('T')[0], notes: "" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "حدث خطأ");
    }
  };

  const exportFinancials = async () => {
    try {
      const response = await axios.get(`${API}/financials/export/excel`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'financials_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("تم تصدير كشف الذمة المالية");
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
      const response = await axios.post(`${API}/financials/import`, formData, {
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

  const printFinancials = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>كشف الذمة المالية</title>
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
          .paid { color: #2E7D32; }
          .remaining { color: #C62828; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">ثانوية ابن خلدون الخاصة - كشف الذمة المالية</div>
          <div class="date">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SY')}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم الطالب</th>
              <th>الصف</th>
              <th>القسط الكامل</th>
              <th>الخصم</th>
              <th>المدفوع</th>
              <th>المتبقي</th>
            </tr>
          </thead>
          <tbody>
            ${financials.map((f, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${f.student_name}</td>
                <td>${f.class_name}</td>
                <td>${f.total_fee?.toLocaleString()}</td>
                <td>${f.discount?.toLocaleString()}</td>
                <td class="paid">${f.total_paid?.toLocaleString()}</td>
                <td class="remaining">${f.remaining?.toLocaleString()}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3">الإجمالي</td>
              <td>${totalFees.toLocaleString()}</td>
              <td>${totalDiscounts.toLocaleString()}</td>
              <td class="paid">${totalPaid.toLocaleString()}</td>
              <td class="remaining">${totalRemaining.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredFinancials = financials.filter((f) =>
    f.student_name?.includes(searchQuery) || f.class_name?.includes(searchQuery)
  );

  const totalFees = financials.reduce((sum, f) => sum + (f.total_fee || 0), 0);
  const totalDiscounts = financials.reduce((sum, f) => sum + (f.discount || 0), 0);
  const totalPaid = financials.reduce((sum, f) => sum + (f.total_paid || 0), 0);
  const totalRemaining = financials.reduce((sum, f) => sum + (f.remaining || 0), 0);

  // Get students without financial records
  const studentsWithoutRecords = students.filter(
    s => !financials.some(f => f.student_id === s.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="financial-management">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-[Cairo]">الذمة المالية</h1>
          <p className="text-muted-foreground">إدارة أقساط الطلاب والمدفوعات</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setUploadDialogOpen(true)}
            className="gap-2"
            data-testid="upload-financials-button"
          >
            <Upload className="h-5 w-5" />
            رفع Excel
          </Button>
          <Button
            variant="outline"
            onClick={exportFinancials}
            className="gap-2"
            data-testid="export-financials-button"
          >
            <Download className="h-5 w-5" />
            تصدير Excel
          </Button>
          <Button
            variant="outline"
            onClick={printFinancials}
            className="gap-2"
            data-testid="print-financials-button"
          >
            <Printer className="h-5 w-5" />
            طباعة
          </Button>
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-green-600 hover:bg-green-700" data-testid="add-payment-button">
                <CreditCard className="h-5 w-5" />
                تسجيل دفعة
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle className="font-[Cairo]">تسجيل دفعة جديدة</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePaymentSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>اختر الطالب *</Label>
                  <Select
                    value={paymentFormData.student_id}
                    onValueChange={(value) => setPaymentFormData({ ...paymentFormData, student_id: value })}
                  >
                    <SelectTrigger data-testid="payment-student-select">
                      <SelectValue placeholder="اختر الطالب" />
                    </SelectTrigger>
                    <SelectContent>
                      {financials.map((f) => (
                        <SelectItem key={f.student_id} value={f.student_id}>
                          {f.student_name} - {f.class_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المبلغ (ل.س) *</Label>
                  <Input
                    type="number"
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: parseFloat(e.target.value) || 0 })}
                    required
                    data-testid="payment-amount-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>التاريخ *</Label>
                  <Input
                    type="date"
                    value={paymentFormData.date}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, date: e.target.value })}
                    required
                    data-testid="payment-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Input
                    value={paymentFormData.notes}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                    placeholder="ملاحظات إضافية"
                    data-testid="payment-notes-input"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700" data-testid="payment-submit-button">
                    تسجيل الدفعة
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={feeDialogOpen} onOpenChange={setFeeDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="add-fee-button">
                <Plus className="h-5 w-5" />
                تحديد قسط
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle className="font-[Cairo]">تحديد قسط طالب</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleFeeSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>اختر الطالب *</Label>
                  <Select
                    value={feeFormData.student_id}
                    onValueChange={(value) => setFeeFormData({ ...feeFormData, student_id: value })}
                  >
                    <SelectTrigger data-testid="fee-student-select">
                      <SelectValue placeholder="اختر الطالب" />
                    </SelectTrigger>
                    <SelectContent>
                      {studentsWithoutRecords.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name} - {s.class_name}
                        </SelectItem>
                      ))}
                      {financials.map((f) => (
                        <SelectItem key={f.student_id} value={f.student_id}>
                          {f.student_name} - {f.class_name} (تعديل)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>القسط الكامل (ل.س) *</Label>
                  <Input
                    type="number"
                    value={feeFormData.total_fee}
                    onChange={(e) => setFeeFormData({ ...feeFormData, total_fee: parseFloat(e.target.value) || 0 })}
                    required
                    data-testid="fee-total-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الخصم (ل.س)</Label>
                  <Input
                    type="number"
                    value={feeFormData.discount}
                    onChange={(e) => setFeeFormData({ ...feeFormData, discount: parseFloat(e.target.value) || 0 })}
                    data-testid="fee-discount-input"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setFeeDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" data-testid="fee-submit-button">
                    حفظ
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
            <DialogTitle className="font-[Cairo]">رفع ملف Excel للذمة المالية</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              يجب أن يحتوي ملف Excel على الأعمدة التالية بالترتيب:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 text-muted-foreground">
              <li>اسم الطالب (يجب أن يكون موجوداً في النظام)</li>
              <li>القسط الكامل</li>
              <li>الخصم</li>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-r-4 border-r-primary">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الأقساط</p>
              <p className="text-xl font-bold">{totalFees.toLocaleString()} ل.س</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-r-4 border-r-blue-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الخصومات</p>
              <p className="text-xl font-bold">{totalDiscounts.toLocaleString()} ل.س</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <Receipt className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-r-4 border-r-green-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المدفوع</p>
              <p className="text-xl font-bold text-green-600">{totalPaid.toLocaleString()} ل.س</p>
            </div>
            <div className="p-3 rounded-xl bg-green-100">
              <CreditCard className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-r-4 border-r-red-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي المتبقي</p>
              <p className="text-xl font-bold text-red-600">{totalRemaining.toLocaleString()} ل.س</p>
            </div>
            <div className="p-3 rounded-xl bg-red-100">
              <DollarSign className="h-6 w-6 text-red-500" />
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
              placeholder="البحث عن طالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
              data-testid="financial-search-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Financials Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-[Cairo]">كشف الذمة المالية ({filteredFinancials.length} طالب)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right font-bold">#</TableHead>
                  <TableHead className="text-right font-bold">اسم الطالب</TableHead>
                  <TableHead className="text-right font-bold">الصف</TableHead>
                  <TableHead className="text-right font-bold">القسط الكامل</TableHead>
                  <TableHead className="text-right font-bold">الخصم</TableHead>
                  <TableHead className="text-right font-bold">المدفوع</TableHead>
                  <TableHead className="text-right font-bold">المتبقي</TableHead>
                  <TableHead className="text-right font-bold">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFinancials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد سجلات مالية
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFinancials.map((f, index) => (
                    <TableRow key={f.student_id} className="hover:bg-muted/50" data-testid={`financial-row-${index}`}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{f.student_name}</TableCell>
                      <TableCell>{f.class_name}</TableCell>
                      <TableCell>{f.total_fee?.toLocaleString()}</TableCell>
                      <TableCell>{f.discount?.toLocaleString()}</TableCell>
                      <TableCell className="text-green-600 font-semibold">{f.total_paid?.toLocaleString()}</TableCell>
                      <TableCell className="text-red-600 font-semibold">{f.remaining?.toLocaleString()}</TableCell>
                      <TableCell>
                        {f.remaining <= 0 ? (
                          <Badge className="bg-green-600">مسدد بالكامل</Badge>
                        ) : f.total_paid > 0 ? (
                          <Badge className="bg-yellow-500">مسدد جزئياً</Badge>
                        ) : (
                          <Badge className="bg-red-600">غير مسدد</Badge>
                        )}
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

export default FinancialManagement;
