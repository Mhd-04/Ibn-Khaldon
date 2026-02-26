#!/usr/bin/env python3
"""
Backend API Test Suite for Ibn Khaldoun School Management System
Tests all endpoints and core functionalities
"""

import requests
import sys
from datetime import datetime, timedelta
import json

class SchoolAPITester:
    def __init__(self):
        self.base_url = "https://admin-dashboard-edu.preview.emergentagent.com/api"
        self.token = None
        self.admin_user = None
        self.test_student_id = None
        self.test_teacher_id = None
        
        # Test counters
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status=200, data=None, auth_required=True):
        """Execute a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            print(f"   Response Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Expected {expected_status}, got {response.status_code}")
                
                # Try to parse JSON response
                try:
                    response_data = response.json()
                    print(f"   Response data keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Not a dict'}")
                    return True, response_data
                except:
                    return True, response.content if hasattr(response, 'content') else {}
                    
            else:
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error details: {error_detail}")
                except:
                    print(f"   Raw response: {response.text[:200]}")
                return False, {}

        except requests.exceptions.RequestException as e:
            self.failed_tests.append(f"{name}: Network/Request error - {str(e)}")
            print(f"❌ FAILED - Network error: {str(e)}")
            return False, {}
        except Exception as e:
            self.failed_tests.append(f"{name}: Unexpected error - {str(e)}")
            print(f"❌ FAILED - Unexpected error: {str(e)}")
            return False, {}

    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        print("\n" + "="*50)
        print("TESTING BASIC CONNECTIVITY")
        print("="*50)
        
        success, data = self.run_test("API Root", "GET", "", 200, auth_required=False)
        return success

    def test_database_seeding(self):
        """Test database seeding"""
        print("\n" + "="*50)
        print("TESTING DATABASE SEEDING")
        print("="*50)
        
        success, data = self.run_test("Database Seed", "POST", "seed", 200, auth_required=False)
        return success

    def test_authentication(self):
        """Test login and authentication"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION")
        print("="*50)
        
        # Test admin login
        login_data = {"username": "admin", "password": "admin123"}
        success, response = self.run_test("Admin Login", "POST", "auth/login", 200, login_data, auth_required=False)
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.admin_user = response['user']
            print(f"✅ Admin login successful. User: {self.admin_user.get('full_name', 'Unknown')}")
            
            # Test get current user
            success2, _ = self.run_test("Get Current User", "GET", "auth/me", 200)
            return success and success2
        else:
            print("❌ Admin login failed - cannot proceed with authenticated tests")
            return False

    def test_student_management(self):
        """Test student CRUD operations"""
        print("\n" + "="*50)
        print("TESTING STUDENT MANAGEMENT")
        print("="*50)
        
        # Get existing students
        success1, students = self.run_test("Get All Students", "GET", "students", 200)
        if not success1:
            return False
        
        # Create a new student
        student_data = {
            "full_name": "محمد طارق تست",
            "gender": "male",
            "birth_date": "2008-01-15",
            "class_name": "الصف العاشر",
            "section": "أ",
            "address": "حمص - الخالدية",
            "parent_info": {
                "father_name": "طارق أحمد",
                "mother_name": "سلمى محمد",
                "father_phone": "0991234567",
                "mother_phone": "0992345678"
            }
        }
        
        success2, created_student = self.run_test("Create Student", "POST", "students", 201, student_data)
        if success2 and 'id' in created_student:
            self.test_student_id = created_student['id']
            print(f"✅ Student created with ID: {self.test_student_id}")
            
            # Test get specific student
            success3, _ = self.run_test("Get Specific Student", "GET", f"students/{self.test_student_id}", 200)
            
            # Test update student
            updated_data = student_data.copy()
            updated_data['full_name'] = "محمد طارق تست - محدث"
            success4, _ = self.run_test("Update Student", "PUT", f"students/{self.test_student_id}", 200, updated_data)
            
            return success1 and success2 and success3 and success4
        
        return success1 and success2

    def test_teacher_management(self):
        """Test teacher CRUD operations"""
        print("\n" + "="*50)
        print("TESTING TEACHER MANAGEMENT")
        print("="*50)
        
        # Get existing teachers
        success1, teachers = self.run_test("Get All Teachers", "GET", "teachers", 200)
        if not success1:
            return False
        
        # Create a new teacher
        teacher_data = {
            "full_name": "سارة خالد تست",
            "gender": "female",
            "subject": "الرياضيات",
            "phone": "0993456789",
            "hourly_rate": 5000.0,
            "total_hours": 40.0,
            "bonus": 10000.0,
            "deductions": 2000.0
        }
        
        success2, created_teacher = self.run_test("Create Teacher", "POST", "teachers", 201, teacher_data)
        if success2 and 'id' in created_teacher:
            self.test_teacher_id = created_teacher['id']
            print(f"✅ Teacher created with ID: {self.test_teacher_id}")
            
            # Test get specific teacher
            success3, _ = self.run_test("Get Specific Teacher", "GET", f"teachers/{self.test_teacher_id}", 200)
            
            return success1 and success2 and success3
        
        return success1 and success2

    def test_grades_system(self):
        """Test grades management"""
        print("\n" + "="*50)
        print("TESTING GRADES SYSTEM")
        print("="*50)
        
        # Get all grades
        success1, _ = self.run_test("Get All Grades", "GET", "grades", 200)
        
        # Create a grade (if we have a test student)
        if self.test_student_id:
            grade_data = {
                "student_id": self.test_student_id,
                "subject": "الرياضيات",
                "first_exam": 85.0,
                "second_exam": 78.0,
                "oral": 15.0,
                "homework": 12.0,
                "final_exam": 90.0,
                "semester": "الفصل الأول",
                "academic_year": "2024-2025"
            }
            
            success2, _ = self.run_test("Create Grade", "POST", "grades", 200, grade_data)
            
            # Get student grades
            success3, _ = self.run_test("Get Student Grades", "GET", f"grades/student/{self.test_student_id}", 200)
            
            return success1 and success2 and success3
        
        return success1

    def test_announcements(self):
        """Test announcements system"""
        print("\n" + "="*50)
        print("TESTING ANNOUNCEMENTS")
        print("="*50)
        
        # Get all announcements
        success1, _ = self.run_test("Get All Announcements", "GET", "announcements", 200)
        
        # Create announcement
        announcement_data = {
            "title": "إعلان تجريبي",
            "content": "هذا إعلان تجريبي للاختبار",
            "target_audience": "all",
            "is_active": True
        }
        
        success2, created_announcement = self.run_test("Create Announcement", "POST", "announcements", 201, announcement_data)
        
        return success1 and success2

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n" + "="*50)
        print("TESTING DASHBOARD STATISTICS")
        print("="*50)
        
        success, stats = self.run_test("Get Dashboard Stats", "GET", "dashboard/stats", 200)
        
        if success:
            expected_keys = ['students_count', 'teachers_count', 'total_salaries']
            has_expected_keys = all(key in stats for key in expected_keys)
            if has_expected_keys:
                print(f"✅ Stats contain expected keys: {expected_keys}")
            else:
                print(f"⚠️  Stats missing some expected keys. Got: {list(stats.keys())}")
        
        return success

    def test_excel_export(self):
        """Test Excel export functionality"""
        print("\n" + "="*50)
        print("TESTING EXCEL EXPORT")
        print("="*50)
        
        # Test salaries export (should return blob/file)
        success, _ = self.run_test("Export Salaries Excel", "GET", "export/salaries", 200)
        return success

    def test_classes_data(self):
        """Test classes and subjects data"""
        print("\n" + "="*50)
        print("TESTING CLASSES DATA")
        print("="*50)
        
        success, classes_data = self.run_test("Get Classes Data", "GET", "classes", 200, auth_required=False)
        
        if success:
            expected_keys = ['classes', 'sections', 'subjects', 'semesters', 'academic_years']
            has_expected_keys = all(key in classes_data for key in expected_keys)
            if has_expected_keys:
                print(f"✅ Classes data contain expected keys: {expected_keys}")
            else:
                print(f"⚠️  Classes data missing some keys. Got: {list(classes_data.keys())}")
        
        return success

    def test_settings(self):
        """Test settings management"""
        print("\n" + "="*50)
        print("TESTING SETTINGS")
        print("="*50)
        
        # Get settings
        success1, settings = self.run_test("Get Settings", "GET", "settings", 200)
        
        # Update settings
        if success1:
            settings_data = {
                "school_name": "ثانوية ابن خلدون الخاصة",
                "whatsapp_number": "0964803354",
                "address": "حمص - سوريا",
                "phone": "",
                "email": ""
            }
            success2, _ = self.run_test("Update Settings", "PUT", "settings", 200, settings_data)
            return success1 and success2
        
        return success1

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n" + "="*50)
        print("CLEANING UP TEST DATA")
        print("="*50)
        
        cleanup_success = True
        
        # Delete test student
        if self.test_student_id:
            success, _ = self.run_test("Delete Test Student", "DELETE", f"students/{self.test_student_id}", 200)
            cleanup_success = cleanup_success and success
        
        # Delete test teacher
        if self.test_teacher_id:
            success, _ = self.run_test("Delete Test Teacher", "DELETE", f"teachers/{self.test_teacher_id}", 200)
            cleanup_success = cleanup_success and success
        
        return cleanup_success

    def run_all_tests(self):
        """Run the complete test suite"""
        print("🏫 Ibn Khaldoun School Management System - Backend API Testing")
        print("="*70)
        
        start_time = datetime.now()
        
        # Test sequence
        tests = [
            ("Basic Connectivity", self.test_basic_connectivity),
            ("Database Seeding", self.test_database_seeding),
            ("Authentication", self.test_authentication),
            ("Student Management", self.test_student_management),
            ("Teacher Management", self.test_teacher_management),
            ("Grades System", self.test_grades_system),
            ("Announcements", self.test_announcements),
            ("Dashboard Stats", self.test_dashboard_stats),
            ("Excel Export", self.test_excel_export),
            ("Classes Data", self.test_classes_data),
            ("Settings", self.test_settings),
        ]
        
        all_passed = True
        for test_name, test_func in tests:
            try:
                result = test_func()
                if not result:
                    all_passed = False
                    print(f"⚠️  {test_name} had some failures")
            except Exception as e:
                all_passed = False
                print(f"💥 {test_name} crashed: {str(e)}")
        
        # Cleanup
        try:
            self.cleanup_test_data()
        except Exception as e:
            print(f"⚠️  Cleanup failed: {str(e)}")
        
        # Final results
        end_time = datetime.now()
        duration = end_time - start_time
        
        print("\n" + "="*70)
        print("FINAL TEST RESULTS")
        print("="*70)
        print(f"📊 Total Tests: {self.tests_run}")
        print(f"✅ Passed: {self.tests_passed}")
        print(f"❌ Failed: {self.tests_run - self.tests_passed}")
        print(f"⏱️  Duration: {duration.total_seconds():.2f} seconds")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for i, failed_test in enumerate(self.failed_tests, 1):
                print(f"   {i}. {failed_test}")
        
        print("="*70)
        
        # Return success if more than 70% of tests passed
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        return success_rate >= 70

if __name__ == "__main__":
    tester = SchoolAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)