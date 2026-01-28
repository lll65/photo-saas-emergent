import requests
import sys
import json
import subprocess
from datetime import datetime, timezone, timedelta
import os
import tempfile
from PIL import Image
import io

class PhotoPrepAPITester:
    def __init__(self, base_url="https://photoprep-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        
        # Default headers
        test_headers = {'Content-Type': 'application/json'}
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'
        if headers:
            test_headers.update(headers)
        
        # Remove Content-Type for file uploads
        if files:
            test_headers.pop('Content-Type', None)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data, headers=test_headers, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                print(f"   Status: {response.status_code} ✅")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"   Status: {response.status_code} (expected {expected_status}) ❌")
                print(f"   Response: {response.text[:300]}")

            self.log_test(name, success, f"Status {response.status_code}, expected {expected_status}")
            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"   Error: {str(e)} ❌")
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def create_test_user_and_session(self):
        """Create test user and session in MongoDB"""
        print("\n🔧 Creating test user and session in MongoDB...")
        
        timestamp = int(datetime.now().timestamp())
        self.user_id = f"test-user-{timestamp}"
        self.session_token = f"test_session_{timestamp}"
        
        # Create MongoDB script
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

print('✅ Test user and session created');
print('User ID: ' + userId);
print('Session Token: ' + sessionToken);
"""
        
        try:
            result = subprocess.run(
                ['mongosh', '--eval', mongo_script],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print(f"✅ Test user created: {self.user_id}")
                print(f"✅ Session token: {self.session_token}")
                return True
            else:
                print(f"❌ MongoDB error: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Failed to create test user: {str(e)}")
            return False

    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        print("\n🧹 Cleaning up test data...")
        
        cleanup_script = f"""
use('test_database');
db.users.deleteMany({{user_id: '{self.user_id}'}});
db.user_sessions.deleteMany({{user_id: '{self.user_id}'}});
db.images.deleteMany({{user_id: '{self.user_id}'}});
print('✅ Test data cleaned up');
"""
        
        try:
            subprocess.run(['mongosh', '--eval', cleanup_script], timeout=30)
            print("✅ Test data cleaned up")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {str(e)}")

    def create_test_image(self):
        """Create a test image file"""
        # Create a simple test image
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        return img_bytes

    def test_health_endpoints(self):
        """Test health check endpoints"""
        self.run_test("Health Check Root", "GET", "", 200)
        self.run_test("Health Check Endpoint", "GET", "health", 200)

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        # Test /api/auth/me without authentication (should return 401)
        self.run_test("Auth Me - Unauthenticated", "GET", "auth/me", 401)
        
        # Test /api/auth/me with authentication (should return 200)
        self.run_test("Auth Me - Authenticated", "GET", "auth/me", 200)

    def test_image_endpoints(self):
        """Test image processing endpoints"""
        # Test image upload
        test_image = self.create_test_image()
        files = {'file': ('test_image.jpg', test_image, 'image/jpeg')}
        
        success, upload_response = self.run_test(
            "Image Upload", "POST", "images/upload", 200, 
            files=files
        )
        
        if success and 'image_id' in upload_response:
            image_id = upload_response['image_id']
            print(f"   Uploaded image ID: {image_id}")
            
            # Test image processing (this may take 10-30 seconds)
            print("   ⏳ Processing image (may take 10-30 seconds)...")
            success, process_response = self.run_test(
                "Image Processing", "POST", f"images/process/{image_id}", 200
            )
            
            # Test getting original image file
            self.run_test(
                "Get Original Image File", "GET", f"images/file/{image_id}/original", 200
            )
            
            # Test getting processed image file (if processing succeeded)
            if success and process_response.get('status') == 'completed':
                self.run_test(
                    "Get Processed Image File", "GET", f"images/file/{image_id}/processed", 200
                )
            
            # Test image history
            self.run_test("Image History", "GET", "images/history", 200)
            
            # Test image deletion
            self.run_test("Delete Image", "DELETE", f"images/{image_id}", 200)
        else:
            print("   ⚠️  Skipping image processing tests due to upload failure")

    def test_user_endpoints(self):
        """Test user profile and subscription endpoints"""
        self.run_test("User Profile", "GET", "user/profile", 200)
        
        # Test premium upgrade (mocked)
        success, upgrade_response = self.run_test("User Upgrade", "POST", "user/upgrade", 200)
        
        if success:
            # Test downgrade back to free
            self.run_test("User Downgrade", "POST", "user/downgrade", 200)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting PhotoPrep API Tests")
        print(f"   Backend URL: {self.base_url}")
        print(f"   API URL: {self.api_url}")
        
        # Create test user and session
        if not self.create_test_user_and_session():
            print("❌ Failed to create test user. Aborting tests.")
            return False
        
        try:
            # Run tests
            self.test_health_endpoints()
            self.test_auth_endpoints()
            self.test_image_endpoints()
            self.test_user_endpoints()
            
        finally:
            # Always cleanup
            self.cleanup_test_data()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"   Tests run: {self.tests_run}")
        print(f"   Tests passed: {self.tests_passed}")
        print(f"   Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print failed tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = PhotoPrepAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())