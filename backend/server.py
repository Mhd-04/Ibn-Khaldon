from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson import ObjectId
import io
from fastapi.responses import StreamingResponse
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'ibn-khaldoun-secret-key-2026')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="نظام ثانوية ابن خلدون الخاصة")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    username: str
    full_name: str
    role: str  # admin, teacher, student
    gender: Optional[str] = "male"  # male, female

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Student Models
class ParentInfo(BaseModel):
    father_name: str
    mother_name: str
    father_phone: str
    mother_phone: str

class StudentBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    full_name: str
    gender: str  # male, female
    birth_date: str
    class_name: str  # الصف
    section: str  # الشعبة
    address: str
    parent_info: ParentInfo
    registration_date: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class StudentResponse(StudentBase):
    id: str
    user_id: Optional[str] = None
    username: Optional[str] = None

# Teacher Models
class TeacherBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    full_name: str
    gender: str
    subject: str  # المادة
    phone: str
    hourly_rate: float  # أجر الساعة
    total_hours: float = 0
    bonus: float = 0
    deductions: float = 0

class TeacherCreate(TeacherBase):
    pass

class TeacherResponse(TeacherBase):
    id: str
    user_id: Optional[str] = None
    username: Optional[str] = None
    calculated_salary: Optional[float] = None

# Grade Models
class GradeEntry(BaseModel):
    subject: str
    first_exam: float = 0
    second_exam: float = 0
    oral: float = 0
    homework: float = 0
    final_exam: float = 0
    total: float = 0

class StudentGrades(BaseModel):
    model_config = ConfigDict(extra="ignore")
    student_id: str
    student_name: str
    class_name: str
    section: str
    semester: str  # الفصل الدراسي
    academic_year: str
    grades: List[GradeEntry]
    is_published: bool = False

class GradeCreate(BaseModel):
    student_id: str
    subject: str
    first_exam: float = 0
    second_exam: float = 0
    oral: float = 0
    homework: float = 0
    final_exam: float = 0
    semester: str
    academic_year: str

# Attendance Models
class AttendanceRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    student_id: str
    student_name: str
    class_name: str
    date: str
    status: str  # present, absent, late
    notes: Optional[str] = None

class AttendanceCreate(BaseModel):
    student_id: str
    date: str
    status: str
    notes: Optional[str] = None

# Announcement Models
class AnnouncementBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    content: str
    target_audience: str  # all, teachers, students
    is_active: bool = True

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementResponse(AnnouncementBase):
    id: str
    created_at: str
    created_by: str

# Financial Models (الذمة المالية)
class PaymentRecord(BaseModel):
    amount: float
    date: str
    notes: Optional[str] = None
    receipt_number: Optional[str] = None

class StudentFinancial(BaseModel):
    model_config = ConfigDict(extra="ignore")
    student_id: str
    student_name: str
    class_name: str
    total_fee: float  # القسط الكامل
    payments: List[PaymentRecord] = []
    discount: float = 0  # الخصم
    
class FinancialCreate(BaseModel):
    student_id: str
    total_fee: float
    discount: float = 0

class PaymentCreate(BaseModel):
    student_id: str
    amount: float
    date: str
    notes: Optional[str] = None

# Settings Model
class SchoolSettings(BaseModel):
    school_name: str = "ثانوية ابن خلدون الخاصة"
    whatsapp_number: str = "0964803354"
    address: str = "حمص - سوريا"
    phone: str = ""
    email: str = ""
    default_fee: float = 0  # القسط الافتراضي

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def generate_username(prefix: str, name: str) -> str:
    """Generate a readable username from name"""
    # Remove spaces and take first part
    clean_name = name.replace(" ", "_")[:10]
    short_id = str(uuid.uuid4())[:4]
    return f"{prefix}_{clean_name}_{short_id}"

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def require_teacher_or_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Teacher or Admin access required")
    return current_user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"username": credentials.username}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="اسم المستخدم غير موجود")
    if not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="كلمة المرور غير صحيحة")
    
    access_token = create_access_token({"sub": user["id"], "role": user["role"]})
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user["id"],
            username=user["username"],
            full_name=user["full_name"],
            role=user["role"],
            gender=user.get("gender", "male")
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        gender=current_user.get("gender", "male")
    )

# ==================== STUDENT ROUTES ====================

@api_router.get("/students", response_model=List[StudentResponse])
async def get_students(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "student":
        # Students can only see their own data
        student = await db.students.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if student:
            user = await db.users.find_one({"id": student.get("user_id")}, {"_id": 0})
            student["username"] = user.get("username") if user else None
            return [StudentResponse(**student)]
        return []
    
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    # Add username to each student
    for student in students:
        user = await db.users.find_one({"id": student.get("user_id")}, {"_id": 0})
        student["username"] = user.get("username") if user else None
    return [StudentResponse(**s) for s in students]

@api_router.get("/students/{student_id}", response_model=StudentResponse)
async def get_student(student_id: str, current_user: dict = Depends(get_current_user)):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    user = await db.users.find_one({"id": student.get("user_id")}, {"_id": 0})
    student["username"] = user.get("username") if user else None
    return StudentResponse(**student)

@api_router.get("/students/{student_id}/details")
async def get_student_details(student_id: str, current_user: dict = Depends(get_current_user)):
    """Get full student details including grades, attendance, and financial info"""
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    
    # Get username
    user = await db.users.find_one({"id": student.get("user_id")}, {"_id": 0})
    student["username"] = user.get("username") if user else None
    
    # Get grades
    grades = await db.grades.find({"student_id": student_id}, {"_id": 0}).to_list(100)
    
    # Get attendance
    attendance = await db.attendance.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    
    # Calculate attendance stats
    total_days = len(attendance)
    present_days = len([a for a in attendance if a["status"] == "present"])
    absent_days = len([a for a in attendance if a["status"] == "absent"])
    late_days = len([a for a in attendance if a["status"] == "late"])
    
    # Get financial info
    financial = await db.financials.find_one({"student_id": student_id}, {"_id": 0})
    if financial:
        total_paid = sum(p.get("amount", 0) for p in financial.get("payments", []))
        financial["total_paid"] = total_paid
        financial["remaining"] = financial.get("total_fee", 0) - financial.get("discount", 0) - total_paid
    
    return {
        "student": student,
        "grades": grades,
        "attendance": {
            "records": attendance,
            "stats": {
                "total_days": total_days,
                "present_days": present_days,
                "absent_days": absent_days,
                "late_days": late_days,
                "attendance_rate": round((present_days / total_days * 100) if total_days > 0 else 0, 1)
            }
        },
        "financial": financial
    }

@api_router.post("/students", response_model=StudentResponse)
async def create_student(student: StudentCreate, current_user: dict = Depends(require_admin)):
    student_dict = student.model_dump()
    student_dict["id"] = str(uuid.uuid4())
    student_dict["registration_date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Create user account for student with readable username
    user_id = str(uuid.uuid4())
    username = generate_username("student", student.full_name)
    
    # Check if username exists
    existing = await db.users.find_one({"username": username})
    if existing:
        username = f"{username}_{str(uuid.uuid4())[:4]}"
    
    user_doc = {
        "id": user_id,
        "username": username,
        "password_hash": hash_password("123456"),  # Default password
        "full_name": student.full_name,
        "role": "student",
        "gender": student.gender
    }
    await db.users.insert_one(user_doc)
    student_dict["user_id"] = user_id
    
    await db.students.insert_one(student_dict)
    student_dict["username"] = username
    return StudentResponse(**student_dict)

@api_router.put("/students/{student_id}", response_model=StudentResponse)
async def update_student(student_id: str, student: StudentCreate, current_user: dict = Depends(require_admin)):
    existing = await db.students.find_one({"id": student_id})
    if not existing:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    
    update_data = student.model_dump()
    await db.students.update_one({"id": student_id}, {"$set": update_data})
    
    # Update user info too
    if existing.get("user_id"):
        await db.users.update_one(
            {"id": existing["user_id"]},
            {"$set": {"full_name": student.full_name, "gender": student.gender}}
        )
    
    updated = await db.students.find_one({"id": student_id}, {"_id": 0})
    user = await db.users.find_one({"id": updated.get("user_id")}, {"_id": 0})
    updated["username"] = user.get("username") if user else None
    return StudentResponse(**updated)

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, current_user: dict = Depends(require_admin)):
    student = await db.students.find_one({"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    
    # Delete associated user
    if student.get("user_id"):
        await db.users.delete_one({"id": student["user_id"]})
    
    # Delete related data
    await db.grades.delete_many({"student_id": student_id})
    await db.attendance.delete_many({"student_id": student_id})
    await db.financials.delete_one({"student_id": student_id})
    
    await db.students.delete_one({"id": student_id})
    return {"message": "تم حذف الطالب بنجاح"}

# ==================== TEACHER ROUTES ====================

@api_router.get("/teachers", response_model=List[TeacherResponse])
async def get_teachers(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "teacher":
        teacher = await db.teachers.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if teacher:
            teacher["calculated_salary"] = (teacher["hourly_rate"] * teacher["total_hours"]) + teacher["bonus"] - teacher["deductions"]
            user = await db.users.find_one({"id": teacher.get("user_id")}, {"_id": 0})
            teacher["username"] = user.get("username") if user else None
            return [TeacherResponse(**teacher)]
        return []
    
    teachers = await db.teachers.find({}, {"_id": 0}).to_list(1000)
    result = []
    for t in teachers:
        t["calculated_salary"] = (t["hourly_rate"] * t["total_hours"]) + t["bonus"] - t["deductions"]
        user = await db.users.find_one({"id": t.get("user_id")}, {"_id": 0})
        t["username"] = user.get("username") if user else None
        result.append(TeacherResponse(**t))
    return result

@api_router.get("/teachers/{teacher_id}", response_model=TeacherResponse)
async def get_teacher(teacher_id: str, current_user: dict = Depends(get_current_user)):
    teacher = await db.teachers.find_one({"id": teacher_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="الأستاذ غير موجود")
    teacher["calculated_salary"] = (teacher["hourly_rate"] * teacher["total_hours"]) + teacher["bonus"] - teacher["deductions"]
    user = await db.users.find_one({"id": teacher.get("user_id")}, {"_id": 0})
    teacher["username"] = user.get("username") if user else None
    return TeacherResponse(**teacher)

@api_router.post("/teachers", response_model=TeacherResponse)
async def create_teacher(teacher: TeacherCreate, current_user: dict = Depends(require_admin)):
    teacher_dict = teacher.model_dump()
    teacher_dict["id"] = str(uuid.uuid4())
    
    # Create user account for teacher with readable username
    user_id = str(uuid.uuid4())
    username = generate_username("teacher", teacher.full_name)
    
    existing = await db.users.find_one({"username": username})
    if existing:
        username = f"{username}_{str(uuid.uuid4())[:4]}"
    
    user_doc = {
        "id": user_id,
        "username": username,
        "password_hash": hash_password("123456"),
        "full_name": teacher.full_name,
        "role": "teacher",
        "gender": teacher.gender
    }
    await db.users.insert_one(user_doc)
    teacher_dict["user_id"] = user_id
    
    await db.teachers.insert_one(teacher_dict)
    teacher_dict["calculated_salary"] = (teacher_dict["hourly_rate"] * teacher_dict["total_hours"]) + teacher_dict["bonus"] - teacher_dict["deductions"]
    teacher_dict["username"] = username
    return TeacherResponse(**teacher_dict)

@api_router.put("/teachers/{teacher_id}", response_model=TeacherResponse)
async def update_teacher(teacher_id: str, teacher: TeacherCreate, current_user: dict = Depends(require_admin)):
    existing = await db.teachers.find_one({"id": teacher_id})
    if not existing:
        raise HTTPException(status_code=404, detail="الأستاذ غير موجود")
    
    update_data = teacher.model_dump()
    await db.teachers.update_one({"id": teacher_id}, {"$set": update_data})
    
    if existing.get("user_id"):
        await db.users.update_one(
            {"id": existing["user_id"]},
            {"$set": {"full_name": teacher.full_name, "gender": teacher.gender}}
        )
    
    updated = await db.teachers.find_one({"id": teacher_id}, {"_id": 0})
    updated["calculated_salary"] = (updated["hourly_rate"] * updated["total_hours"]) + updated["bonus"] - updated["deductions"]
    user = await db.users.find_one({"id": updated.get("user_id")}, {"_id": 0})
    updated["username"] = user.get("username") if user else None
    return TeacherResponse(**updated)

@api_router.delete("/teachers/{teacher_id}")
async def delete_teacher(teacher_id: str, current_user: dict = Depends(require_admin)):
    teacher = await db.teachers.find_one({"id": teacher_id})
    if not teacher:
        raise HTTPException(status_code=404, detail="الأستاذ غير موجود")
    
    if teacher.get("user_id"):
        await db.users.delete_one({"id": teacher["user_id"]})
    
    await db.teachers.delete_one({"id": teacher_id})
    return {"message": "تم حذف الأستاذ بنجاح"}

@api_router.post("/teachers/import")
async def import_teachers_excel(file: UploadFile = File(...), current_user: dict = Depends(require_admin)):
    """Import teachers from Excel file"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="يجب أن يكون الملف بصيغة Excel")
    
    content = await file.read()
    wb = load_workbook(io.BytesIO(content))
    ws = wb.active
    
    imported = 0
    errors = []
    
    for row_num, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        try:
            if not row[0]:  # Skip empty rows
                continue
            
            teacher_data = {
                "full_name": str(row[0]) if row[0] else "",
                "gender": str(row[1]) if row[1] else "male",
                "subject": str(row[2]) if row[2] else "",
                "phone": str(row[3]) if row[3] else "",
                "hourly_rate": float(row[4]) if row[4] else 0,
                "total_hours": float(row[5]) if row[5] else 0,
                "bonus": float(row[6]) if row[6] else 0,
                "deductions": float(row[7]) if row[7] else 0
            }
            
            teacher = TeacherCreate(**teacher_data)
            await create_teacher(teacher, current_user)
            imported += 1
        except Exception as e:
            errors.append(f"صف {row_num}: {str(e)}")
    
    return {"message": f"تم استيراد {imported} أستاذ", "errors": errors}

# ==================== GRADES ROUTES ====================

@api_router.get("/grades")
async def get_all_grades(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "student":
        student = await db.students.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if student:
            grades = await db.grades.find({"student_id": student["id"], "is_published": True}, {"_id": 0}).to_list(100)
            return grades
        return []
    
    grades = await db.grades.find({}, {"_id": 0}).to_list(1000)
    return grades

@api_router.get("/grades/student/{student_id}")
async def get_student_grades(student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "student":
        student = await db.students.find_one({"user_id": current_user["id"]})
        if not student or student["id"] != student_id:
            raise HTTPException(status_code=403, detail="غير مصرح لك بالوصول")
    
    grades = await db.grades.find({"student_id": student_id}, {"_id": 0}).to_list(100)
    return grades

@api_router.post("/grades")
async def create_or_update_grade(grade: GradeCreate, current_user: dict = Depends(require_teacher_or_admin)):
    student = await db.students.find_one({"id": grade.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    
    total = grade.first_exam + grade.second_exam + grade.oral + grade.homework + grade.final_exam
    
    existing = await db.grades.find_one({
        "student_id": grade.student_id,
        "semester": grade.semester,
        "academic_year": grade.academic_year
    })
    
    grade_entry = {
        "subject": grade.subject,
        "first_exam": grade.first_exam,
        "second_exam": grade.second_exam,
        "oral": grade.oral,
        "homework": grade.homework,
        "final_exam": grade.final_exam,
        "total": total
    }
    
    if existing:
        # Update existing grades
        grades_list = existing.get("grades", [])
        updated = False
        for i, g in enumerate(grades_list):
            if g["subject"] == grade.subject:
                grades_list[i] = grade_entry
                updated = True
                break
        if not updated:
            grades_list.append(grade_entry)
        
        await db.grades.update_one(
            {"student_id": grade.student_id, "semester": grade.semester, "academic_year": grade.academic_year},
            {"$set": {"grades": grades_list}}
        )
    else:
        # Create new grade document
        grade_doc = {
            "id": str(uuid.uuid4()),
            "student_id": grade.student_id,
            "student_name": student["full_name"],
            "class_name": student["class_name"],
            "section": student["section"],
            "semester": grade.semester,
            "academic_year": grade.academic_year,
            "grades": [grade_entry],
            "is_published": False
        }
        await db.grades.insert_one(grade_doc)
    
    return {"message": "تم حفظ العلامات بنجاح"}

@api_router.post("/grades/publish")
async def publish_grades(data: dict, current_user: dict = Depends(require_admin)):
    semester = data.get("semester")
    academic_year = data.get("academic_year")
    
    result = await db.grades.update_many(
        {"semester": semester, "academic_year": academic_year},
        {"$set": {"is_published": True}}
    )
    
    return {"message": f"تم نشر علامات {result.modified_count} طالب", "count": result.modified_count}

# ==================== ATTENDANCE ROUTES ====================

@api_router.get("/attendance")
async def get_attendance(date: Optional[str] = None, class_name: Optional[str] = None, current_user: dict = Depends(require_teacher_or_admin)):
    query = {}
    if date:
        query["date"] = date
    if class_name:
        query["class_name"] = class_name
    
    records = await db.attendance.find(query, {"_id": 0}).to_list(1000)
    return records

@api_router.get("/attendance/student/{student_id}")
async def get_student_attendance(student_id: str, current_user: dict = Depends(get_current_user)):
    """Get attendance records and stats for a specific student"""
    attendance = await db.attendance.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    
    total_days = len(attendance)
    present_days = len([a for a in attendance if a["status"] == "present"])
    absent_days = len([a for a in attendance if a["status"] == "absent"])
    late_days = len([a for a in attendance if a["status"] == "late"])
    
    return {
        "records": attendance,
        "stats": {
            "total_days": total_days,
            "present_days": present_days,
            "absent_days": absent_days,
            "late_days": late_days,
            "attendance_rate": round((present_days / total_days * 100) if total_days > 0 else 0, 1)
        }
    }

@api_router.post("/attendance")
async def mark_attendance(record: AttendanceCreate, current_user: dict = Depends(require_teacher_or_admin)):
    student = await db.students.find_one({"id": record.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    
    # Check if already marked
    existing = await db.attendance.find_one({
        "student_id": record.student_id,
        "date": record.date
    })
    
    if existing:
        await db.attendance.update_one(
            {"student_id": record.student_id, "date": record.date},
            {"$set": {"status": record.status, "notes": record.notes}}
        )
    else:
        attendance_doc = {
            "id": str(uuid.uuid4()),
            "student_id": record.student_id,
            "student_name": student["full_name"],
            "class_name": student["class_name"],
            "date": record.date,
            "status": record.status,
            "notes": record.notes
        }
        await db.attendance.insert_one(attendance_doc)
    
    return {"message": "تم تسجيل الحضور"}

@api_router.post("/attendance/bulk")
async def mark_bulk_attendance(data: dict, current_user: dict = Depends(require_teacher_or_admin)):
    records = data.get("records", [])
    date = data.get("date")
    
    for record in records:
        student = await db.students.find_one({"id": record["student_id"]}, {"_id": 0})
        if student:
            existing = await db.attendance.find_one({
                "student_id": record["student_id"],
                "date": date
            })
            
            if existing:
                await db.attendance.update_one(
                    {"student_id": record["student_id"], "date": date},
                    {"$set": {"status": record["status"]}}
                )
            else:
                await db.attendance.insert_one({
                    "id": str(uuid.uuid4()),
                    "student_id": record["student_id"],
                    "student_name": student["full_name"],
                    "class_name": student["class_name"],
                    "date": date,
                    "status": record["status"]
                })
    
    return {"message": f"تم تسجيل حضور {len(records)} طالب"}

# ==================== FINANCIAL ROUTES (الذمة المالية) ====================

@api_router.get("/financials")
async def get_all_financials(current_user: dict = Depends(require_admin)):
    """Get all students financial records"""
    financials = await db.financials.find({}, {"_id": 0}).to_list(1000)
    
    for f in financials:
        total_paid = sum(p.get("amount", 0) for p in f.get("payments", []))
        f["total_paid"] = total_paid
        f["remaining"] = f.get("total_fee", 0) - f.get("discount", 0) - total_paid
    
    return financials

@api_router.get("/financials/{student_id}")
async def get_student_financial(student_id: str, current_user: dict = Depends(get_current_user)):
    """Get financial record for a specific student"""
    financial = await db.financials.find_one({"student_id": student_id}, {"_id": 0})
    if not financial:
        return None
    
    total_paid = sum(p.get("amount", 0) for p in financial.get("payments", []))
    financial["total_paid"] = total_paid
    financial["remaining"] = financial.get("total_fee", 0) - financial.get("discount", 0) - total_paid
    
    return financial

@api_router.post("/financials")
async def create_or_update_financial(data: FinancialCreate, current_user: dict = Depends(require_admin)):
    """Create or update student financial record"""
    student = await db.students.find_one({"id": data.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")
    
    existing = await db.financials.find_one({"student_id": data.student_id})
    
    if existing:
        await db.financials.update_one(
            {"student_id": data.student_id},
            {"$set": {"total_fee": data.total_fee, "discount": data.discount}}
        )
    else:
        financial_doc = {
            "id": str(uuid.uuid4()),
            "student_id": data.student_id,
            "student_name": student["full_name"],
            "class_name": student["class_name"],
            "total_fee": data.total_fee,
            "discount": data.discount,
            "payments": []
        }
        await db.financials.insert_one(financial_doc)
    
    return {"message": "تم حفظ البيانات المالية"}

@api_router.post("/financials/payment")
async def add_payment(data: PaymentCreate, current_user: dict = Depends(require_admin)):
    """Add a payment to student financial record"""
    financial = await db.financials.find_one({"student_id": data.student_id})
    if not financial:
        raise HTTPException(status_code=404, detail="لا يوجد سجل مالي لهذا الطالب")
    
    payment = {
        "id": str(uuid.uuid4()),
        "amount": data.amount,
        "date": data.date,
        "notes": data.notes,
        "receipt_number": f"RCP-{str(uuid.uuid4())[:8].upper()}"
    }
    
    await db.financials.update_one(
        {"student_id": data.student_id},
        {"$push": {"payments": payment}}
    )
    
    return {"message": "تم تسجيل الدفعة", "receipt_number": payment["receipt_number"]}

@api_router.get("/financials/export/excel")
async def export_financials_excel(current_user: dict = Depends(require_admin)):
    """Export all financial records to Excel"""
    financials = await db.financials.find({}, {"_id": 0}).to_list(1000)
    
    wb = Workbook()
    ws = wb.active
    ws.title = "الذمة المالية"
    ws.sheet_view.rightToLeft = True
    
    # Styling
    header_font = Font(bold=True, size=12, color="FFFFFF")
    header_fill = PatternFill(start_color="6A1B9A", end_color="6A1B9A", fill_type="solid")
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    # Title
    ws.merge_cells('A1:G1')
    ws['A1'] = "ثانوية ابن خلدون الخاصة - كشف الذمة المالية"
    ws['A1'].font = Font(bold=True, size=16)
    ws['A1'].alignment = Alignment(horizontal='center')
    
    ws.merge_cells('A2:G2')
    ws['A2'] = f"تاريخ التصدير: {datetime.now().strftime('%Y-%m-%d')}"
    ws['A2'].alignment = Alignment(horizontal='center')
    
    # Headers
    headers = ['#', 'اسم الطالب', 'الصف', 'القسط الكامل', 'الخصم', 'المدفوع', 'المتبقي']
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=4, column=col, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.border = border
        cell.alignment = Alignment(horizontal='center')
    
    # Data
    total_fees = 0
    total_paid = 0
    total_remaining = 0
    
    for idx, f in enumerate(financials, 1):
        paid = sum(p.get("amount", 0) for p in f.get("payments", []))
        remaining = f.get("total_fee", 0) - f.get("discount", 0) - paid
        
        total_fees += f.get("total_fee", 0)
        total_paid += paid
        total_remaining += remaining
        
        row_data = [
            idx,
            f.get("student_name", ""),
            f.get("class_name", ""),
            f.get("total_fee", 0),
            f.get("discount", 0),
            paid,
            remaining
        ]
        
        for col, value in enumerate(row_data, 1):
            cell = ws.cell(row=idx + 4, column=col, value=value)
            cell.border = border
            cell.alignment = Alignment(horizontal='center')
    
    # Total row
    total_row = len(financials) + 5
    ws.merge_cells(f'A{total_row}:C{total_row}')
    ws[f'A{total_row}'] = "الإجمالي"
    ws[f'A{total_row}'].font = Font(bold=True)
    ws[f'D{total_row}'] = total_fees
    ws[f'F{total_row}'] = total_paid
    ws[f'G{total_row}'] = total_remaining
    
    # Column widths
    ws.column_dimensions['A'].width = 5
    ws.column_dimensions['B'].width = 25
    ws.column_dimensions['C'].width = 20
    ws.column_dimensions['D'].width = 15
    ws.column_dimensions['E'].width = 12
    ws.column_dimensions['F'].width = 15
    ws.column_dimensions['G'].width = 15
    
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=financials_report.xlsx"}
    )

@api_router.post("/financials/import")
async def import_financials_excel(file: UploadFile = File(...), current_user: dict = Depends(require_admin)):
    """Import financial records from Excel"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="يجب أن يكون الملف بصيغة Excel")
    
    content = await file.read()
    wb = load_workbook(io.BytesIO(content))
    ws = wb.active
    
    imported = 0
    errors = []
    
    for row_num, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        try:
            if not row[0]:
                continue
            
            student_name = str(row[0])
            student = await db.students.find_one({"full_name": student_name}, {"_id": 0})
            
            if not student:
                errors.append(f"صف {row_num}: الطالب '{student_name}' غير موجود")
                continue
            
            financial_data = FinancialCreate(
                student_id=student["id"],
                total_fee=float(row[1]) if row[1] else 0,
                discount=float(row[2]) if row[2] else 0
            )
            
            await create_or_update_financial(financial_data, current_user)
            imported += 1
        except Exception as e:
            errors.append(f"صف {row_num}: {str(e)}")
    
    return {"message": f"تم استيراد {imported} سجل", "errors": errors}

# ==================== ANNOUNCEMENTS ROUTES ====================

@api_router.get("/announcements", response_model=List[AnnouncementResponse])
async def get_announcements(current_user: dict = Depends(get_current_user)):
    query = {"is_active": True}
    if current_user["role"] == "student":
        query["target_audience"] = {"$in": ["all", "students"]}
    elif current_user["role"] == "teacher":
        query["target_audience"] = {"$in": ["all", "teachers"]}
    
    announcements = await db.announcements.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [AnnouncementResponse(**a) for a in announcements]

@api_router.post("/announcements", response_model=AnnouncementResponse)
async def create_announcement(announcement: AnnouncementCreate, current_user: dict = Depends(require_admin)):
    announcement_dict = announcement.model_dump()
    announcement_dict["id"] = str(uuid.uuid4())
    announcement_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    announcement_dict["created_by"] = current_user["full_name"]
    
    await db.announcements.insert_one(announcement_dict)
    return AnnouncementResponse(**announcement_dict)

@api_router.delete("/announcements/{announcement_id}")
async def delete_announcement(announcement_id: str, current_user: dict = Depends(require_admin)):
    result = await db.announcements.delete_one({"id": announcement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="الإعلان غير موجود")
    return {"message": "تم حذف الإعلان"}

# ==================== FINANCIAL/EXPORT ROUTES ====================

@api_router.get("/export/salaries")
async def export_salaries_excel(current_user: dict = Depends(require_admin)):
    teachers = await db.teachers.find({}, {"_id": 0}).to_list(1000)
    
    wb = Workbook()
    ws = wb.active
    ws.title = "كشف الرواتب"
    ws.sheet_view.rightToLeft = True
    
    # Styling
    header_font = Font(bold=True, size=12)
    header_fill = PatternFill(start_color="6A1B9A", end_color="6A1B9A", fill_type="solid")
    header_font_white = Font(bold=True, size=12, color="FFFFFF")
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    # Title
    ws.merge_cells('A1:H1')
    ws['A1'] = "ثانوية ابن خلدون الخاصة - كشف رواتب الأساتذة"
    ws['A1'].font = Font(bold=True, size=16)
    ws['A1'].alignment = Alignment(horizontal='center')
    
    ws.merge_cells('A2:H2')
    ws['A2'] = f"تاريخ التصدير: {datetime.now().strftime('%Y-%m-%d')}"
    ws['A2'].alignment = Alignment(horizontal='center')
    
    # Headers
    headers = ['#', 'اسم الأستاذ', 'المادة', 'عدد الساعات', 'أجر الساعة', 'المكافآت', 'الخصومات', 'الراتب الصافي']
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=4, column=col, value=header)
        cell.font = header_font_white
        cell.fill = header_fill
        cell.border = border
        cell.alignment = Alignment(horizontal='center')
    
    # Data
    total_salaries = 0
    for idx, teacher in enumerate(teachers, 1):
        salary = (teacher["hourly_rate"] * teacher["total_hours"]) + teacher["bonus"] - teacher["deductions"]
        total_salaries += salary
        
        row_data = [
            idx,
            teacher["full_name"],
            teacher["subject"],
            teacher["total_hours"],
            teacher["hourly_rate"],
            teacher["bonus"],
            teacher["deductions"],
            salary
        ]
        
        for col, value in enumerate(row_data, 1):
            cell = ws.cell(row=idx + 4, column=col, value=value)
            cell.border = border
            cell.alignment = Alignment(horizontal='center')
    
    # Total row
    total_row = len(teachers) + 5
    ws.merge_cells(f'A{total_row}:G{total_row}')
    ws[f'A{total_row}'] = "إجمالي الرواتب"
    ws[f'A{total_row}'].font = header_font
    ws[f'A{total_row}'].alignment = Alignment(horizontal='center')
    ws[f'H{total_row}'] = total_salaries
    ws[f'H{total_row}'].font = header_font
    
    # Column widths
    ws.column_dimensions['A'].width = 5
    ws.column_dimensions['B'].width = 25
    ws.column_dimensions['C'].width = 15
    ws.column_dimensions['D'].width = 12
    ws.column_dimensions['E'].width = 12
    ws.column_dimensions['F'].width = 12
    ws.column_dimensions['G'].width = 12
    ws.column_dimensions['H'].width = 15
    
    # Save to buffer
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=salaries_report.xlsx"}
    )

@api_router.post("/import/salaries")
async def import_salaries_excel(file: UploadFile = File(...), current_user: dict = Depends(require_admin)):
    """Import/Update teacher salaries from Excel"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="يجب أن يكون الملف بصيغة Excel")
    
    content = await file.read()
    wb = load_workbook(io.BytesIO(content))
    ws = wb.active
    
    updated = 0
    errors = []
    
    for row_num, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        try:
            if not row[0]:
                continue
            
            teacher_name = str(row[0])
            teacher = await db.teachers.find_one({"full_name": teacher_name})
            
            if not teacher:
                errors.append(f"صف {row_num}: الأستاذ '{teacher_name}' غير موجود")
                continue
            
            update_data = {}
            if row[1] is not None:
                update_data["total_hours"] = float(row[1])
            if row[2] is not None:
                update_data["hourly_rate"] = float(row[2])
            if row[3] is not None:
                update_data["bonus"] = float(row[3])
            if row[4] is not None:
                update_data["deductions"] = float(row[4])
            
            if update_data:
                await db.teachers.update_one({"id": teacher["id"]}, {"$set": update_data})
                updated += 1
        except Exception as e:
            errors.append(f"صف {row_num}: {str(e)}")
    
    return {"message": f"تم تحديث {updated} سجل", "errors": errors}

# ==================== SETTINGS ROUTES ====================

@api_router.get("/settings")
async def get_settings(current_user: dict = Depends(require_admin)):
    settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        settings = SchoolSettings().model_dump()
        await db.settings.insert_one(settings)
    return settings

@api_router.put("/settings")
async def update_settings(settings: SchoolSettings, current_user: dict = Depends(require_admin)):
    await db.settings.update_one({}, {"$set": settings.model_dump()}, upsert=True)
    return {"message": "تم تحديث الإعدادات"}

# ==================== DASHBOARD STATS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "student":
        student = await db.students.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if student:
            grades = await db.grades.find({"student_id": student["id"], "is_published": True}, {"_id": 0}).to_list(100)
            attendance = await db.attendance.find({"student_id": student["id"]}, {"_id": 0}).to_list(1000)
            present_count = len([a for a in attendance if a["status"] == "present"])
            return {
                "grades_count": len(grades),
                "attendance_rate": (present_count / len(attendance) * 100) if attendance else 0
            }
        return {}
    
    students_count = await db.students.count_documents({})
    teachers_count = await db.teachers.count_documents({})
    male_students = await db.students.count_documents({"gender": "male"})
    female_students = await db.students.count_documents({"gender": "female"})
    
    # Calculate total salaries
    teachers = await db.teachers.find({}, {"_id": 0}).to_list(1000)
    total_salaries = sum(
        (t["hourly_rate"] * t["total_hours"]) + t["bonus"] - t["deductions"]
        for t in teachers
    )
    
    # Calculate total fees and payments
    financials = await db.financials.find({}, {"_id": 0}).to_list(1000)
    total_fees = sum(f.get("total_fee", 0) for f in financials)
    total_paid = sum(
        sum(p.get("amount", 0) for p in f.get("payments", []))
        for f in financials
    )
    total_remaining = total_fees - total_paid
    
    announcements_count = await db.announcements.count_documents({"is_active": True})
    
    return {
        "students_count": students_count,
        "teachers_count": teachers_count,
        "male_students": male_students,
        "female_students": female_students,
        "total_salaries": total_salaries,
        "total_fees": total_fees,
        "total_paid": total_paid,
        "total_remaining": total_remaining,
        "announcements_count": announcements_count
    }

# ==================== CLASSES DATA ====================

@api_router.get("/classes")
async def get_classes():
    return {
        "classes": [
            "الصف السابع",
            "الصف الثامن",
            "الصف التاسع",
            "الصف العاشر",
            "الصف الحادي عشر علمي",
            "الصف الحادي عشر أدبي",
            "الصف الثالث الثانوي علمي",
            "الصف الثالث الثانوي أدبي"
        ],
        "sections": ["أ", "ب", "ج", "د"],
        "subjects": [
            "اللغة العربية",
            "اللغة الإنجليزية",
            "اللغة الفرنسية",
            "الرياضيات",
            "الفيزياء",
            "الكيمياء",
            "علم الأحياء",
            "التاريخ",
            "الجغرافيا",
            "الفلسفة",
            "التربية الوطنية",
            "التربية الدينية",
            "المعلوماتية"
        ],
        "semesters": ["الفصل الأول", "الفصل الثاني"],
        "academic_years": ["2024-2025", "2025-2026", "2026-2027"]
    }

# ==================== USERS LIST (for login help) ====================

@api_router.get("/users/list")
async def get_users_list(current_user: dict = Depends(require_admin)):
    """Get list of all users with their usernames (for admin reference)"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_database():
    # Check if already seeded
    admin = await db.users.find_one({"username": "admin"})
    if admin:
        return {"message": "قاعدة البيانات مُعدة مسبقاً"}
    
    # Create Admin
    admin_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": admin_id,
        "username": "admin",
        "password_hash": hash_password("admin123"),
        "full_name": "مدير المدرسة",
        "role": "admin",
        "gender": "male"
    })
    
    # Create sample teachers
    teachers_data = [
        {"full_name": "أحمد محمد علي", "gender": "male", "subject": "الرياضيات", "phone": "0991234567", "hourly_rate": 5000, "total_hours": 40, "bonus": 10000, "deductions": 0},
        {"full_name": "فاطمة حسن", "gender": "female", "subject": "اللغة العربية", "phone": "0992345678", "hourly_rate": 4500, "total_hours": 35, "bonus": 5000, "deductions": 2000},
        {"full_name": "محمود أحمد", "gender": "male", "subject": "الفيزياء", "phone": "0993456789", "hourly_rate": 5500, "total_hours": 30, "bonus": 8000, "deductions": 0},
    ]
    
    for teacher in teachers_data:
        teacher_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())
        username = generate_username("teacher", teacher["full_name"])
        
        await db.users.insert_one({
            "id": user_id,
            "username": username,
            "password_hash": hash_password("123456"),
            "full_name": teacher["full_name"],
            "role": "teacher",
            "gender": teacher["gender"]
        })
        
        teacher["id"] = teacher_id
        teacher["user_id"] = user_id
        await db.teachers.insert_one(teacher)
    
    # Create sample students
    students_data = [
        {"full_name": "عمر خالد", "gender": "male", "birth_date": "2008-05-15", "class_name": "الصف العاشر", "section": "أ", "address": "حمص - حي الوعر", "parent_info": {"father_name": "خالد أحمد", "mother_name": "سمر محمد", "father_phone": "0994567890", "mother_phone": "0995678901"}},
        {"full_name": "مريم أحمد", "gender": "female", "birth_date": "2008-08-20", "class_name": "الصف العاشر", "section": "أ", "address": "حمص - حي الإنشاءات", "parent_info": {"father_name": "أحمد سعيد", "mother_name": "هدى علي", "father_phone": "0996789012", "mother_phone": "0997890123"}},
        {"full_name": "يوسف محمد", "gender": "male", "birth_date": "2007-03-10", "class_name": "الصف الحادي عشر علمي", "section": "ب", "address": "حمص - باب هود", "parent_info": {"father_name": "محمد سليم", "mother_name": "رنا خالد", "father_phone": "0998901234", "mother_phone": "0999012345"}},
        {"full_name": "سارة علي", "gender": "female", "birth_date": "2007-11-25", "class_name": "الصف الحادي عشر أدبي", "section": "أ", "address": "حمص - حي الزهراء", "parent_info": {"father_name": "علي حسين", "mother_name": "نور أحمد", "father_phone": "0991122334", "mother_phone": "0992233445"}},
    ]
    
    for student in students_data:
        student_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())
        username = generate_username("student", student["full_name"])
        
        await db.users.insert_one({
            "id": user_id,
            "username": username,
            "password_hash": hash_password("123456"),
            "full_name": student["full_name"],
            "role": "student",
            "gender": student["gender"]
        })
        
        student["id"] = student_id
        student["user_id"] = user_id
        student["registration_date"] = "2024-09-01"
        await db.students.insert_one(student)
        
        # Create financial record for student
        await db.financials.insert_one({
            "id": str(uuid.uuid4()),
            "student_id": student_id,
            "student_name": student["full_name"],
            "class_name": student["class_name"],
            "total_fee": 500000,  # القسط الافتراضي
            "discount": 0,
            "payments": []
        })
    
    # Create sample announcements
    await db.announcements.insert_one({
        "id": str(uuid.uuid4()),
        "title": "بداية الفصل الدراسي الثاني",
        "content": "نعلم طلابنا الأعزاء وأولياء أمورهم الكرام بأن الفصل الدراسي الثاني سيبدأ بتاريخ 01/02/2025. نتمنى للجميع فصلاً دراسياً موفقاً.",
        "target_audience": "all",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": "مدير المدرسة"
    })
    
    # Create default settings
    await db.settings.insert_one(SchoolSettings().model_dump())
    
    return {"message": "تم إعداد قاعدة البيانات بنجاح", "admin_credentials": {"username": "admin", "password": "admin123"}}

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "مرحباً بكم في نظام ثانوية ابن خلدون الخاصة"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
