#!/usr/bin/env python3
import requests
import json
import subprocess
from datetime import datetime
import tempfile
from PIL import Image
import io
import time

class FocusedImageTest:
    def __init__(self):
        self.base_url = "https://photoprep-1.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.session_token = None
        self.user_id = None

    def create_test_user_and_session(self):
        """Create test user and session in MongoDB"""
        print("🔧 Creating test user and session...")
        
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

print('✅ Test user and session created');
"""
        
        try:
            result = subprocess.run(['mongosh', '--eval', mongo_script], 
                                  capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                print(f"✅ Test user created: {self.user_id}")
                return True
            else:
                print(f"❌ MongoDB error: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Failed to create test user: {str(e)}")
            return False

    def cleanup_test_data(self):
        """Clean up test data"""
        print("🧹 Cleaning up test data...")
        cleanup_script = f"""
use('test_database');
db.users.deleteMany({{user_id: '{self.user_id}'}});
db.user_sessions.deleteMany({{user_id: '{self.user_id}'}});
db.images.deleteMany({{user_id: '{self.user_id}'}});
"""
        try:
            subprocess.run(['mongosh', '--eval', cleanup_script], timeout=30)
            print("✅ Test data cleaned up")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {str(e)}")

    def create_test_image(self):
        """Create a simple test image"""
        img = Image.new('RGB', (200, 200), color='blue')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        return img_bytes

    def test_image_processing_flow(self):
        """Test the complete image processing flow with extended timeouts"""
        print("\n🎯 Testing Image Processing Flow")
        
        # Step 1: Upload image
        print("📤 Step 1: Uploading image...")
        test_image = self.create_test_image()
        files = {'file': ('test_image.jpg', test_image, 'image/jpeg')}
        headers = {'Authorization': f'Bearer {self.session_token}'}
        
        try:
            response = requests.post(f"{self.api_url}/images/upload", 
                                   files=files, headers=headers, timeout=30)
            if response.status_code == 200:
                upload_data = response.json()
                image_id = upload_data['image_id']
                print(f"✅ Image uploaded successfully: {image_id}")
            else:
                print(f"❌ Upload failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Upload error: {str(e)}")
            return False

        # Step 2: Check user credits before processing
        print("💳 Step 2: Checking user credits...")
        try:
            response = requests.get(f"{self.api_url}/auth/me", headers=headers, timeout=30)
            if response.status_code == 200:
                user_data = response.json()
                credits_before = user_data['credits']
                print(f"✅ Credits before processing: {credits_before}")
            else:
                print(f"❌ Failed to get user data: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ User data error: {str(e)}")
            return False

        # Step 3: Process image (with extended timeout for model download)
        print("🔄 Step 3: Processing image (may take 60-120 seconds for model download)...")
        start_time = time.time()
        
        try:
            response = requests.post(f"{self.api_url}/images/process/{image_id}", 
                                   headers=headers, timeout=120)  # 2 minute timeout
            processing_time = time.time() - start_time
            
            if response.status_code == 200:
                process_data = response.json()
                print(f"✅ Image processed successfully in {processing_time:.1f}s")
                print(f"   Status: {process_data.get('status')}")
                print(f"   Message: {process_data.get('message')}")
                
                if process_data.get('status') == 'completed':
                    processed_url = process_data.get('processed_url')
                    print(f"   Processed URL: {processed_url}")
                else:
                    print(f"⚠️  Processing status: {process_data.get('status')}")
                    return False
                    
            else:
                print(f"❌ Processing failed: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.Timeout:
            print(f"❌ Processing timed out after 120 seconds")
            return False
        except Exception as e:
            print(f"❌ Processing error: {str(e)}")
            return False

        # Step 4: Check credits after processing
        print("💳 Step 4: Checking credits after processing...")
        try:
            response = requests.get(f"{self.api_url}/auth/me", headers=headers, timeout=30)
            if response.status_code == 200:
                user_data = response.json()
                credits_after = user_data['credits']
                print(f"✅ Credits after processing: {credits_after}")
                
                if credits_before - credits_after == 1:
                    print("✅ Credit deduction working correctly")
                else:
                    print(f"⚠️  Expected 1 credit deducted, got {credits_before - credits_after}")
                    
            else:
                print(f"❌ Failed to get user data: {response.status_code}")
        except Exception as e:
            print(f"❌ User data error: {str(e)}")

        # Step 5: Download processed image
        print("📥 Step 5: Testing processed image download...")
        try:
            response = requests.get(f"{self.api_url}/images/file/{image_id}/processed", 
                                  headers=headers, timeout=30)
            if response.status_code == 200:
                print(f"✅ Processed image downloaded successfully ({len(response.content)} bytes)")
            else:
                print(f"❌ Download failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Download error: {str(e)}")

        # Step 6: Test premium user (unlimited credits)
        print("👑 Step 6: Testing premium user upgrade...")
        try:
            response = requests.post(f"{self.api_url}/user/upgrade", 
                                   headers=headers, timeout=30)
            if response.status_code == 200:
                print("✅ User upgraded to premium")
                
                # Check credits for premium user
                response = requests.get(f"{self.api_url}/auth/me", headers=headers, timeout=30)
                if response.status_code == 200:
                    user_data = response.json()
                    credits = user_data['credits']
                    subscription = user_data['subscription']
                    print(f"✅ Premium user - Credits: {credits}, Subscription: {subscription}")
                    
                    if credits == -1 and subscription == "premium":
                        print("✅ Premium unlimited access working correctly")
                    else:
                        print(f"⚠️  Premium user should have -1 credits, got {credits}")
                        
            else:
                print(f"❌ Upgrade failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Upgrade error: {str(e)}")

        return True

    def run_test(self):
        """Run the focused image processing test"""
        print("🚀 Starting Focused Image Processing Test")
        print(f"   Backend URL: {self.base_url}")
        
        if not self.create_test_user_and_session():
            print("❌ Failed to create test user. Aborting.")
            return False
        
        try:
            success = self.test_image_processing_flow()
            return success
        finally:
            self.cleanup_test_data()

def main():
    tester = FocusedImageTest()
    success = tester.run_test()
    
    if success:
        print("\n🎉 Image processing test completed successfully!")
        return 0
    else:
        print("\n❌ Image processing test failed!")
        return 1

if __name__ == "__main__":
    exit(main())