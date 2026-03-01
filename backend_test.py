"""
Backend API Tests for RADAR V22 / Método L.O
Tests all authentication and core functionality endpoints
"""
import requests
import sys
from datetime import datetime
import json
import uuid

class RadarAPITester:
    def __init__(self, base_url="https://lo-dashboard.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.device_id = str(uuid.uuid4())

    def log_test(self, name, status, details=""):
        """Log test result"""
        self.tests_run += 1
        if status:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        if details:
            print(f"   Details: {details}")

    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", DB: {data.get('database', 'unknown')}"
            
            self.log_test("Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("Health Check", False, str(e))
            return False

    def test_cpf_login(self, cpf="000.000.000-00", password="admin123"):
        """Test CPF login"""
        try:
            payload = {
                "cpf": cpf,
                "password": password,
                "device_id": self.device_id,
                "device_label": "Test Device"
            }
            
            response = requests.post(
                f"{self.base_url}/api/auth/login/cpf",
                json=payload,
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                self.session_token = data.get("session_token")
                if "user" in data:
                    self.user_id = data["user"].get("id")
                    details += f", User ID: {self.user_id}, Role: {data['user'].get('role')}"
                if "subscription" in data:
                    details += f", Subscription: {data['subscription'].get('status')}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
            
            self.log_test("CPF Login", success, details)
            return success
        except Exception as e:
            self.log_test("CPF Login", False, str(e))
            return False

    def test_get_current_user(self):
        """Test getting current user info"""
        if not self.session_token:
            self.log_test("Get Current User", False, "No session token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.get(
                f"{self.base_url}/api/auth/me",
                headers=headers,
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if "user" in data:
                    user = data["user"]
                    details += f", CPF: {user.get('cpf')}, Role: {user.get('role')}"
                if "usage" in data:
                    usage = data["usage"]
                    details += f", Usage: {usage.get('seconds_used')}/{usage.get('seconds_limit')}"
                if "subscription" in data:
                    sub = data["subscription"]
                    details += f", Subscription: {sub.get('status')}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
                    
            self.log_test("Get Current User", success, details)
            return success
        except Exception as e:
            self.log_test("Get Current User", False, str(e))
            return False

    def test_session_validation(self):
        """Test session validation endpoint"""
        if not self.session_token:
            self.log_test("Session Validation", False, "No session token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            payload = {"device_id": self.device_id}
            
            response = requests.post(
                f"{self.base_url}/api/auth/validate-session",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                details += f", Valid: {data.get('valid')}"
                if not data.get('valid'):
                    details += f", Reason: {data.get('reason')}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
                    
            self.log_test("Session Validation", success, details)
            return success
        except Exception as e:
            self.log_test("Session Validation", False, str(e))
            return False

    def test_usage_status(self):
        """Test usage status endpoint"""
        if not self.session_token:
            self.log_test("Usage Status", False, "No session token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.get(
                f"{self.base_url}/api/usage/status",
                headers=headers,
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                details += f", Used: {data.get('seconds_used')}, Limit: {data.get('seconds_limit')}, Remaining: {data.get('seconds_remaining')}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
                    
            self.log_test("Usage Status", success, details)
            return success
        except Exception as e:
            self.log_test("Usage Status", False, str(e))
            return False

    def test_heartbeat(self):
        """Test usage heartbeat endpoint"""
        if not self.session_token:
            self.log_test("Usage Heartbeat", False, "No session token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            payload = {"device_id": self.device_id}
            
            response = requests.post(
                f"{self.base_url}/api/usage/heartbeat",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                details += f", Allowed: {data.get('allowed')}"
                if data.get('allowed'):
                    details += f", Used: {data.get('seconds_used')}, Remaining: {data.get('seconds_remaining')}"
                else:
                    details += f", Reason: {data.get('reason')}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
                    
            self.log_test("Usage Heartbeat", success, details)
            return success
        except Exception as e:
            self.log_test("Usage Heartbeat", False, str(e))
            return False

    def test_admin_users_list(self):
        """Test admin users list (only if admin role)"""
        if not self.session_token:
            self.log_test("Admin Users List", False, "No session token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.get(
                f"{self.base_url}/api/admin/users",
                headers=headers,
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                user_count = len(data.get("users", []))
                details += f", Users found: {user_count}"
            elif response.status_code == 403:
                success = True  # Expected if not admin
                details += ", Access denied (expected for non-admin users)"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
                    
            self.log_test("Admin Users List", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Users List", False, str(e))
            return False

    def test_logout(self):
        """Test logout endpoint"""
        if not self.session_token:
            self.log_test("Logout", False, "No session token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.post(
                f"{self.base_url}/api/auth/logout",
                headers=headers,
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'No message')}"
                # Clear session token
                self.session_token = None
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
                    
            self.log_test("Logout", success, details)
            return success
        except Exception as e:
            self.log_test("Logout", False, str(e))
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print(f"\n🧪 Starting Backend API Tests for RADAR V22")
        print(f"Base URL: {self.base_url}")
        print(f"Device ID: {self.device_id}")
        print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Health check first
        if not self.test_health_check():
            print("\n❌ Health check failed - stopping tests")
            return False
            
        # Authentication flow
        print("\n🔐 Testing Authentication Flow:")
        self.test_cpf_login()
        self.test_get_current_user()
        self.test_session_validation()
        
        # Usage tracking
        print("\n📊 Testing Usage Management:")
        self.test_usage_status()
        self.test_heartbeat()
        
        # Admin functions
        print("\n👑 Testing Admin Functions:")
        self.test_admin_users_list()
        
        # Logout
        print("\n🚪 Testing Logout:")
        self.test_logout()
        
        # Results
        print(f"\n📈 Test Results:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Run the test suite"""
    tester = RadarAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())