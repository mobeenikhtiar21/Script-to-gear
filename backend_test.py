#!/usr/bin/env python3
"""
Backend API Testing for Script-to-Gear Marketplace
Tests authentication, project creation, gear management, and AI integration
"""

import requests
import json
import sys
import time
from datetime import datetime
from typing import Dict, Optional

class ScriptToGearAPITester:
    def __init__(self, base_url: str = "https://filmmaker-rental.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = {
            'projects': [],
            'gear_items': [],
            'leads': []
        }

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def api_request(self, method: str, endpoint: str, data: Dict = None, 
                   expected_status: int = 200) -> tuple[bool, Dict]:
        """Make API request with authentication"""
        url = f"{self.base_url}/api/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'

        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"raw_response": response.text}
                
            if not success:
                response_data['status_code'] = response.status_code
                response_data['expected'] = expected_status
                
            return success, response_data
            
        except Exception as e:
            return False, {"error": str(e)}

    def create_test_session(self) -> bool:
        """Create a test session by directly inserting into MongoDB"""
        print("\n🔧 Setting up test user and session...")
        
        import subprocess
        import uuid
        
        # Generate test data
        user_id = f"test-user-{int(time.time())}"
        email = f"test.user.{int(time.time())}@example.com"
        session_token = f"test_session_{uuid.uuid4().hex[:16]}"
        
        # MongoDB commands to create test user and session
        mongo_commands = f"""
use('test_database');
db.users.insertOne({{
  user_id: '{user_id}',
  email: '{email}',
  name: 'Test Filmmaker',
  role: 'filmmaker',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
}});
db.user_sessions.insertOne({{
  user_id: '{user_id}',
  session_token: '{session_token}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});
print('Test user created: {user_id}');
print('Session token: {session_token}');
"""
        
        try:
            result = subprocess.run(
                ['mongosh', '--eval', mongo_commands],
                capture_output=True, text=True, timeout=30
            )
            
            if result.returncode == 0:
                self.session_token = session_token
                self.user_data = {
                    'user_id': user_id,
                    'email': email,
                    'name': 'Test Filmmaker',
                    'role': 'filmmaker'
                }
                return self.log_test("Test Session Creation", True, f"User: {user_id}")
            else:
                return self.log_test("Test Session Creation", False, f"MongoDB Error: {result.stderr}")
                
        except Exception as e:
            return self.log_test("Test Session Creation", False, f"Error: {str(e)}")

    def create_rental_house_session(self) -> bool:
        """Create a test rental house session"""
        print("\n🔧 Setting up rental house test user...")
        
        import subprocess
        import uuid
        
        # Generate test data
        user_id = f"test-rental-{int(time.time())}"
        email = f"test.rental.{int(time.time())}@example.com"
        session_token = f"test_rental_session_{uuid.uuid4().hex[:16]}"
        
        # MongoDB commands
        mongo_commands = f"""
use('test_database');
db.users.insertOne({{
  user_id: '{user_id}',
  email: '{email}',
  name: 'Test Rental House',
  role: 'rental_house',
  company_name: 'Test Cinema Rentals',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
}});
db.user_sessions.insertOne({{
  user_id: '{user_id}',
  session_token: '{session_token}',
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});
print('Test rental house created: {user_id}');
"""
        
        try:
            result = subprocess.run(
                ['mongosh', '--eval', mongo_commands],
                capture_output=True, text=True, timeout=30
            )
            
            if result.returncode == 0:
                self.rental_session_token = session_token
                self.rental_user_data = {
                    'user_id': user_id,
                    'email': email,
                    'name': 'Test Rental House',
                    'role': 'rental_house',
                    'company_name': 'Test Cinema Rentals'
                }
                return self.log_test("Rental House Session Creation", True, f"User: {user_id}")
            else:
                return self.log_test("Rental House Session Creation", False, f"MongoDB Error: {result.stderr}")
                
        except Exception as e:
            return self.log_test("Rental House Session Creation", False, f"Error: {str(e)}")

    def test_authentication(self) -> bool:
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication...")
        
        # Test /api/auth/me
        success, response = self.api_request('GET', 'auth/me')
        if not success:
            return self.log_test("Get Current User", False, f"Status: {response.get('status_code')}")
        
        if response.get('user_id') != self.user_data['user_id']:
            return self.log_test("Get Current User", False, "User ID mismatch")
        
        return self.log_test("Get Current User", True, f"User: {response.get('name')}")

    def test_project_creation_with_ai(self) -> bool:
        """Test project creation with AI script analysis"""
        print("\n🎬 Testing Project Creation with AI...")
        
        # Test script with specific scene types for AI to analyze
        test_script = """EXT. MOODY NIGHT EXTERIOR - ABANDONED WAREHOUSE

The rain-soaked streets glisten under flickering streetlights. Deep shadows dance between the industrial structures. The scene requires low-light capable cameras and fast lenses to capture the atmospheric tension.

Camera moves through the darkness, revealing hidden details in the shadows. Professional lighting equipment needed to maintain cinematic quality in challenging conditions.

INT. DIALOGUE-HEAVY INTERVIEW - DAY

Two characters sit across from each other in an intimate setting. Clean dialogue capture is essential - lavalier microphones and directional audio equipment required.

The conversation drives the emotional core of the scene. Multiple camera angles and professional audio recording setup needed for seamless editing."""

        project_data = {
            'script_text': test_script
        }
        
        print("⏳ Analyzing script with AI (this may take a few seconds)...")
        success, response = self.api_request('POST', 'projects', project_data, 201)
        
        if not success:
            return self.log_test("AI Project Creation", False, 
                               f"Status: {response.get('status_code')}, Error: {response.get('error', 'Unknown error')}")
        
        project_id = response.get('project_id')
        if project_id:
            self.created_resources['projects'].append(project_id)
        
        # Check AI analysis results
        ai_analysis = response.get('ai_analysis_result', {})
        
        if 'error' in ai_analysis:
            return self.log_test("AI Script Analysis", False, f"AI Error: {ai_analysis.get('message')}")
        
        # Verify AI found scene types
        scene_analysis = ai_analysis.get('scene_analysis', [])
        gear_recommendations = ai_analysis.get('gear_recommendations', [])
        
        analysis_success = (
            len(scene_analysis) > 0 and
            len(gear_recommendations) > 0 and
            any('night' in scene.get('scene_type', '').lower() for scene in scene_analysis) and
            any('dialogue' in scene.get('scene_type', '').lower() for scene in scene_analysis)
        )
        
        if analysis_success:
            self.log_test("AI Script Analysis", True, 
                         f"Found {len(scene_analysis)} scenes, {len(gear_recommendations)} gear recommendations")
        else:
            self.log_test("AI Script Analysis", False, 
                         "AI didn't properly analyze scene types or generate recommendations")
        
        return self.log_test("AI Project Creation", True, f"Project ID: {project_id}")

    def test_gear_management(self) -> bool:
        """Test gear creation and management (requires rental house session)"""
        print("\n📦 Testing Gear Management...")
        
        if not hasattr(self, 'rental_session_token'):
            if not self.create_rental_house_session():
                return False
        
        # Switch to rental house session
        original_token = self.session_token
        original_user = self.user_data
        self.session_token = self.rental_session_token
        self.user_data = self.rental_user_data
        
        # Test gear creation
        gear_data = {
            'category': 'camera',
            'manufacturer': 'ARRI',
            'model': 'Alexa Mini LF',
            'daily_rate': 1200.00,
            'specs': {
                'sensor_size': 'Large Format',
                'resolution': '4.5K',
                'mount_type': 'LPL',
                'weight': '2.3 kg'
            },
            'available': True
        }
        
        success, response = self.api_request('POST', 'gear', gear_data, 201)
        
        if not success:
            # Restore filmmaker session
            self.session_token = original_token
            self.user_data = original_user
            return self.log_test("Gear Creation", False, 
                               f"Status: {response.get('status_code')}")
        
        gear_id = response.get('gear_id')
        if gear_id:
            self.created_resources['gear_items'].append(gear_id)
        
        # Test gear listing
        success, gear_list = self.api_request('GET', 'gear')
        gear_found = success and any(g.get('gear_id') == gear_id for g in gear_list)
        
        # Restore filmmaker session
        self.session_token = original_token
        self.user_data = original_user
        
        self.log_test("Gear Listing", gear_found, f"Created gear visible in listing")
        return self.log_test("Gear Creation", True, f"Gear ID: {gear_id}")

    def test_leads_and_quotes(self) -> bool:
        """Test lead creation and quote workflow"""
        print("\n📋 Testing Quote Workflow...")
        
        if not self.created_resources['gear_items']:
            print("⚠️  Skipping quote tests - no gear items available")
            return True
        
        if not self.created_resources['projects']:
            print("⚠️  Skipping quote tests - no projects available") 
            return True
        
        # Create lead (quote request)
        lead_data = {
            'project_id': self.created_resources['projects'][0],
            'supplier_id': self.rental_user_data['user_id']
        }
        
        success, response = self.api_request('POST', 'leads', lead_data, 201)
        
        if not success:
            return self.log_test("Lead Creation", False, 
                               f"Status: {response.get('status_code')}")
        
        lead_id = response.get('lead_id')
        if lead_id:
            self.created_resources['leads'].append(lead_id)
        
        # Test leads listing
        success, leads = self.api_request('GET', 'leads')
        lead_found = success and any(l.get('lead_id') == lead_id for l in leads)
        
        self.log_test("Leads Listing", lead_found, "Created lead visible in listing")
        return self.log_test("Lead Creation", True, f"Lead ID: {lead_id}")

    def test_rental_houses_listing(self) -> bool:
        """Test rental houses listing endpoint"""
        print("\n🏢 Testing Rental Houses...")
        
        success, response = self.api_request('GET', 'rental-houses')
        
        if not success:
            return self.log_test("Rental Houses Listing", False, 
                               f"Status: {response.get('status_code')}")
        
        # Check if our test rental house is in the list
        rental_found = any(
            rh.get('user_id') == self.rental_user_data['user_id'] 
            for rh in response
        ) if hasattr(self, 'rental_user_data') else True
        
        return self.log_test("Rental Houses Listing", rental_found, 
                           f"Found {len(response)} rental houses")

    def cleanup_test_data(self) -> None:
        """Clean up test data from database"""
        print("\n🧹 Cleaning up test data...")
        
        import subprocess
        
        cleanup_commands = """
use('test_database');
db.users.deleteMany({user_id: /^test-(user|rental)-/});
db.user_sessions.deleteMany({session_token: /^test_(session|rental_session)/});
db.projects.deleteMany({filmmaker_id: /^test-user-/});
db.gear_items.deleteMany({supplier_id: /^test-rental-/});
db.leads.deleteMany({filmmaker_id: /^test-user-/});
print('Test data cleaned up');
"""
        
        try:
            subprocess.run(['mongosh', '--eval', cleanup_commands], 
                         capture_output=True, timeout=30)
            print("✅ Test data cleanup completed")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {str(e)}")

    def run_all_tests(self) -> int:
        """Run all backend tests"""
        print("🚀 Starting Script-to-Gear Backend API Tests")
        print("=" * 60)
        
        # Setup test session
        if not self.create_test_session():
            print("❌ Failed to create test session - aborting tests")
            return 1
        
        # Core authentication tests
        if not self.test_authentication():
            print("❌ Authentication failed - aborting remaining tests")
            self.cleanup_test_data()
            return 1
        
        # Feature tests
        self.test_project_creation_with_ai()
        self.test_gear_management()  
        self.test_leads_and_quotes()
        self.test_rental_houses_listing()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend tests PASSED!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests FAILED")
            return 1

def main():
    tester = ScriptToGearAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())