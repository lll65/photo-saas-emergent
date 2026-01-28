#!/usr/bin/env python3
import requests
import json
import subprocess
from datetime import datetime
import tempfile
from PIL import Image
import io
import time

class ComprehensiveAPITest:
    def __init__(self):
        self.base_url = "https://photoprep-1.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.session_token = None
        self.user_id = None
        self.tests_passed = 0
        self.tests_total = 0

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_total += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")

    def create_test_user_and_session(self):
        """Create test user and session in MongoDB"""
        timestamp = int(datetime.now().timestamp())
        self.user_id = f"test-user-{timestamp}"
        self.session_token = f"test_session_{timestamp}"
        
        mongo_script = f"""
use('test_database');
var userId = '{self.user_id}';
var sessionToken = '{self.session_token}';
var now = new Date();
var expiresAt = new Date(now.getTime() + 7*24*60*60*1000);

db.users.insertOne({{
  user_id: userId,
  email: 'test.user.{timestamp}@example.com',
  name: 'Test User {timestamp}',
  picture: 'https://via.placeholder.com/150',
  credits: 5,
  subscription: 'free',
  created_at: now.toISOString(),
  last_credit_reset: now.toISOString()
}});

db.user_sessions.insertOne({{
  user_id: userId,
  session_token: sessionToken,
  expires_at: expiresAt.toISOString(),
  created_at: now.toISOString()
}});
"""
        
        try:
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                  capture_output=True, text=True, timeout=30)
            return result.returncode == 0
        except Exception as e:
            print(f"❌ Failed to create test user: {str(e)}")
            return False

    def cleanup_test_data(self):
        """Clean up test data"""
        cleanup_script = f"""
use('test_database');
db.users.deleteMany({{user_id: '{self.user_id}'}});
db.user_sessions.deleteMany({{user_id: '{self.user_id}'}});
db.images.deleteMany({{user_id: '{self.user_id}'}});
"""
        try:
            subprocess.run(['mongosh', '--eval', cleanup_script], timeout=30)
        except Exception as e:
            pass

    def create_test_image(self):
        """Create a simple test image"""
        img = Image.new('RGB', (150, 150), color='green')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        return img_bytes

    def test_health_endpoints(self):
        """Test health endpoints"""
        print("\n🏥 Testing Health Endpoints")
        
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            self.log_test("Health Check Root", response.status_code == 200)
        except Exception as e:
            self.log_test("Health Check Root", False, str(e))
        
        try:
            response = requests.get(f"{self.api_url}/health", timeout=10)
            self.log_test("Health Check Endpoint", response.status_code == 200)
        except Exception as e:
            self.log_test("Health Check Endpoint", False, str(e))

    def test_authentication(self):
        """Test authentication"""
        print("\n🔐 Testing Authentication")
        
        # Test without auth (should return 401)
        try:
            response = requests.get(f"{self.api_url}/auth/me", timeout=10)
            self.log_test("Auth Me - Unauthenticated", response.status_code == 401)
        except Exception as e:
            self.log_test("Auth Me - Unauthenticated", False, str(e))
        
        # Test with auth (should return 200)
        try:
            headers = {'Authorization': f'Bearer {self.session_token}'}
            response = requests.get(f"{self.api_url}/auth/me", headers=headers, timeout=10)
            self.log_test("Auth Me - Authenticated", response.status_code == 200)
        except Exception as e:
            self.log_test("Auth Me - Authenticated", False, str(e))

    def test_complete_image_flow(self):
        """Test complete image upload -> process -> download flow"""
        print("\n🖼️  Testing Complete Image Flow")
        
        headers = {'Authorization': f'Bearer {self.session_token}'}
        
        # Upload image
        try:
            test_image = self.create_test_image()
            files = {'file': ('test_image.jpg', test_image, 'image/jpeg')}
            response = requests.post(f"{self.api_url}/images/upload", 
                                   files=files, headers=headers, timeout=30)
            
            if response.status_code == 200:
                upload_data = response.json()
                image_id = upload_data['image_id']
                self.log_test("Image Upload", True)
                
                # Process image
                try:
                    response = requests.post(f"{self.api_url}/images/process/{image_id}", 
                                           headers=headers, timeout=60)
                    
                    if response.status_code == 200:
                        process_data = response.json()
                        self.log_test("Image Processing", process_data.get('status') == 'completed')
                        
                        # Download original
                        try:
                            response = requests.get(f"{self.api_url}/images/file/{image_id}/original", 
                                                  headers=headers, timeout=30)
                            self.log_test("Download Original Image", response.status_code == 200)
                        except Exception as e:
                            self.log_test("Download Original Image", False, str(e))
                        
                        # Download processed
                        try:
                            response = requests.get(f"{self.api_url}/images/file/{image_id}/processed", 
                                                  headers=headers, timeout=30)
                            self.log_test("Download Processed Image", response.status_code == 200)
                        except Exception as e:
                            self.log_test("Download Processed Image", False, str(e))
                        
                        # Test image history
                        try:
                            response = requests.get(f"{self.api_url}/images/history", 
                                                  headers=headers, timeout=30)
                            if response.status_code == 200:
                                history = response.json()
                                self.log_test("Image History", len(history) > 0)
                            else:
                                self.log_test("Image History", False, f"Status {response.status_code}")
                        except Exception as e:
                            self.log_test("Image History", False, str(e))
                        
                        # Delete image
                        try:
                            response = requests.delete(f"{self.api_url}/images/{image_id}", 
                                                     headers=headers, timeout=30)
                            self.log_test("Delete Image", response.status_code == 200)
                        except Exception as e:
                            self.log_test("Delete Image", False, str(e))
                            
                    else:
                        self.log_test("Image Processing", False, f"Status {response.status_code}")
                        
                except Exception as e:
                    self.log_test("Image Processing", False, str(e))
                    
            else:
                self.log_test("Image Upload", False, f"Status {response.status_code}")
                
        except Exception as e:
            self.log_test("Image Upload", False, str(e))

    def test_credit_system(self):
        """Test credit deduction and premium features"""
        print("\n💳 Testing Credit System")
        
        headers = {'Authorization': f'Bearer {self.session_token}'}
        
        # Check initial credits
        try:
            response = requests.get(f"{self.api_url}/auth/me", headers=headers, timeout=10)
            if response.status_code == 200:
                user_data = response.json()
                initial_credits = user_data['credits']
                self.log_test("Check Initial Credits", initial_credits == 4)  # Should be 4 after previous test
            else:
                self.log_test("Check Initial Credits", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Check Initial Credits", False, str(e))
        
        # Test premium upgrade
        try:
            response = requests.post(f"{self.api_url}/user/upgrade", headers=headers, timeout=10)
            if response.status_code == 200:
                self.log_test("Premium Upgrade", True)
                
                # Check premium status
                response = requests.get(f"{self.api_url}/auth/me", headers=headers, timeout=10)
                if response.status_code == 200:
                    user_data = response.json()
                    is_premium = user_data['subscription'] == 'premium' and user_data['credits'] == -1
                    self.log_test("Premium Status Check", is_premium)
                else:
                    self.log_test("Premium Status Check", False, f"Status {response.status_code}")
            else:
                self.log_test("Premium Upgrade", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Premium Upgrade", False, str(e))

    def test_user_endpoints(self):
        """Test user profile endpoints"""
        print("\n👤 Testing User Endpoints")
        
        headers = {'Authorization': f'Bearer {self.session_token}'}
        
        try:
            response = requests.get(f"{self.api_url}/user/profile", headers=headers, timeout=10)
            self.log_test("User Profile", response.status_code == 200)
        except Exception as e:
            self.log_test("User Profile", False, str(e))

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Comprehensive PhotoPrep API Tests")
        print(f"   Backend URL: {self.base_url}")
        
        if not self.create_test_user_and_session():
            print("❌ Failed to create test user. Aborting tests.")
            return False
        
        try:
            self.test_health_endpoints()
            self.test_authentication()
            self.test_complete_image_flow()
            self.test_credit_system()
            self.test_user_endpoints()
            
        finally:
            self.cleanup_test_data()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"   Tests passed: {self.tests_passed}/{self.tests_total}")
        print(f"   Success rate: {(self.tests_passed/self.tests_total*100):.1f}%")
        
        return self.tests_passed == self.tests_total

def main():
    tester = ComprehensiveAPITest()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())