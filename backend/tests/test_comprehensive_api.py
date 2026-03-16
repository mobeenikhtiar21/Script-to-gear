"""
Comprehensive API Test Suite for Script-to-Gear Marketplace

Tests all major API endpoints for:
- Authentication flows
- Filmmaker features (projects, gear, leads)
- Rental House features (gear inventory, leads, quotes)
- Payment flows
- Profile management
- Edge cases and validation
"""
import pytest
import requests
import os
import time
from datetime import datetime

# Environment configuration
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TS = "1773698352880"

# Test sessions and user IDs
FILMMAKER_SESSION = f"test_full_filmmaker_{TS}"
FILMMAKER_USER_ID = f"test-filmmaker-full-{TS}"
RENTAL_SESSION = f"test_full_rental_{TS}"
RENTAL_USER_ID = f"test-rental-full-{TS}"
NOROLE_SESSION = f"test_full_norole_{TS}"
NOROLE_USER_ID = f"test-norole-full-{TS}"

# Shared state for tests
CREATED_PROJECT_ID = None
CREATED_GEAR_ID = None
CREATED_LEAD_ID = None


class TestHealthAndBasicAuth:
    """Basic health check and authentication tests"""
    
    def test_01_health_endpoint(self):
        """GET /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")
    
    def test_02_auth_me_no_token(self):
        """GET /api/auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Auth me without token returns 401")
    
    def test_03_auth_me_invalid_token(self):
        """GET /api/auth/me with invalid token returns 401"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_123"}
        )
        assert response.status_code == 401
        print("✓ Auth me with invalid token returns 401")
    
    def test_04_auth_me_filmmaker(self):
        """GET /api/auth/me returns filmmaker user data"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == FILMMAKER_USER_ID
        assert data["role"] == "filmmaker"
        assert "email" in data
        assert "name" in data
        print(f"✓ Filmmaker auth: {data['name']} ({data['role']})")
    
    def test_05_auth_me_rental_house(self):
        """GET /api/auth/me returns rental house user data"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {RENTAL_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == RENTAL_USER_ID
        assert data["role"] == "rental_house"
        assert "company_name" in data
        print(f"✓ Rental house auth: {data['name']} ({data['role']})")


class TestRoleSelection:
    """Test role selection endpoint"""
    
    def test_01_select_role_invalid_role(self):
        """POST /api/auth/select-role with invalid role returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/select-role",
            headers={"Authorization": f"Bearer {NOROLE_SESSION}"},
            json={"role": "invalid_role"}
        )
        assert response.status_code == 400
        print("✓ Invalid role rejected with 400")
    
    def test_02_select_role_filmmaker(self):
        """POST /api/auth/select-role sets filmmaker role"""
        response = requests.post(
            f"{BASE_URL}/api/auth/select-role",
            headers={"Authorization": f"Bearer {NOROLE_SESSION}"},
            json={"role": "filmmaker", "phone": "+9999999999"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "filmmaker"
        print(f"✓ Role selected: {data['role']}")


class TestRentalHouseGearCRUD:
    """Test Gear CRUD operations for rental house"""
    
    def test_01_create_gear_unauthorized(self):
        """POST /api/gear by filmmaker returns 403"""
        response = requests.post(
            f"{BASE_URL}/api/gear",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"},
            json={
                "category": "camera",
                "manufacturer": "Test",
                "model": "Test Camera",
                "daily_rate": 100.0,
                "specs": {"sensor": "full-frame"}
            }
        )
        assert response.status_code == 403
        print("✓ Filmmaker cannot create gear - 403")
    
    def test_02_create_gear_success(self):
        """POST /api/gear creates gear item"""
        global CREATED_GEAR_ID
        response = requests.post(
            f"{BASE_URL}/api/gear",
            headers={"Authorization": f"Bearer {RENTAL_SESSION}"},
            json={
                "category": "camera",
                "manufacturer": "RED",
                "model": "Komodo 6K",
                "daily_rate": 500.0,
                "specs": {
                    "sensor_size": "Super 35",
                    "resolution": "6K",
                    "mount_type": "RF"
                },
                "available": True
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["category"] == "camera"
        assert data["manufacturer"] == "RED"
        assert data["model"] == "Komodo 6K"
        assert data["daily_rate"] == 500.0
        assert data["available"] == True
        assert "gear_id" in data
        CREATED_GEAR_ID = data["gear_id"]
        print(f"✓ Gear created: {CREATED_GEAR_ID}")
    
    def test_03_get_gear_list_rental(self):
        """GET /api/gear returns rental house's gear"""
        response = requests.get(
            f"{BASE_URL}/api/gear",
            headers={"Authorization": f"Bearer {RENTAL_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should include our created gear
        gear_ids = [g["gear_id"] for g in data]
        assert CREATED_GEAR_ID in gear_ids
        print(f"✓ Rental house sees {len(data)} gear items")
    
    def test_04_get_single_gear(self):
        """GET /api/gear/{gear_id} returns gear details"""
        response = requests.get(
            f"{BASE_URL}/api/gear/{CREATED_GEAR_ID}",
            headers={"Authorization": f"Bearer {RENTAL_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["gear_id"] == CREATED_GEAR_ID
        assert data["manufacturer"] == "RED"
        print(f"✓ Got gear details: {data['manufacturer']} {data['model']}")
    
    def test_05_update_gear(self):
        """PUT /api/gear/{gear_id} updates gear"""
        response = requests.put(
            f"{BASE_URL}/api/gear/{CREATED_GEAR_ID}",
            headers={"Authorization": f"Bearer {RENTAL_SESSION}"},
            json={
                "daily_rate": 550.0,
                "available": False
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["daily_rate"] == 550.0
        assert data["available"] == False
        print(f"✓ Gear updated: rate=${data['daily_rate']}, available={data['available']}")
        
        # Revert for other tests
        requests.put(
            f"{BASE_URL}/api/gear/{CREATED_GEAR_ID}",
            headers={"Authorization": f"Bearer {RENTAL_SESSION}"},
            json={"available": True}
        )
    
    def test_06_update_gear_unauthorized(self):
        """PUT /api/gear/{gear_id} by filmmaker returns 403"""
        response = requests.put(
            f"{BASE_URL}/api/gear/{CREATED_GEAR_ID}",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"},
            json={"daily_rate": 999.0}
        )
        assert response.status_code == 403
        print("✓ Filmmaker cannot update gear - 403")
    
    def test_07_get_gear_not_found(self):
        """GET /api/gear/{gear_id} with invalid ID returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/gear/nonexistent_gear_id",
            headers={"Authorization": f"Bearer {RENTAL_SESSION}"}
        )
        assert response.status_code == 404
        print("✓ Non-existent gear returns 404")


class TestFilmmakerProjects:
    """Test Project CRUD operations for filmmaker"""
    
    def test_01_create_project_unauthorized(self):
        """POST /api/projects by rental house returns 403"""
        response = requests.post(
            f"{BASE_URL}/api/projects",
            headers={"Authorization": f"Bearer {RENTAL_SESSION}"},
            json={"script_text": "Test script"}
        )
        assert response.status_code == 403
        print("✓ Rental house cannot create projects - 403")
    
    def test_02_create_project_success(self):
        """POST /api/projects creates project with AI analysis"""
        global CREATED_PROJECT_ID
        response = requests.post(
            f"{BASE_URL}/api/projects",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"},
            json={
                "script_text": """
                INT. WAREHOUSE - NIGHT
                
                The camera follows our protagonist through a dimly lit warehouse.
                Moody lighting. Handheld movement. Industrial sounds echo.
                
                JOHN
                (whispering)
                We need to be quiet.
                
                EXT. ROOFTOP - DAWN
                
                Wide establishing shot of the city at sunrise.
                Dolly shot moving across the rooftop.
                """
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert "project_id" in data
        assert "script_text" in data
        assert "ai_analysis_result" in data
        CREATED_PROJECT_ID = data["project_id"]
        
        # Check AI analysis has expected fields
        ai_result = data["ai_analysis_result"]
        if "error" not in ai_result:
            assert "gear_recommendations" in ai_result
            print(f"✓ Project created with AI analysis: {CREATED_PROJECT_ID}")
            print(f"  Recommendations: {len(ai_result.get('gear_recommendations', []))} items")
        else:
            print(f"✓ Project created (AI had error): {CREATED_PROJECT_ID}")
    
    def test_03_get_projects_list(self):
        """GET /api/projects returns filmmaker's projects"""
        response = requests.get(
            f"{BASE_URL}/api/projects",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        project_ids = [p["project_id"] for p in data]
        assert CREATED_PROJECT_ID in project_ids
        print(f"✓ Filmmaker has {len(data)} projects")
    
    def test_04_get_project_detail(self):
        """GET /api/projects/{project_id} returns project details"""
        response = requests.get(
            f"{BASE_URL}/api/projects/{CREATED_PROJECT_ID}",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["project_id"] == CREATED_PROJECT_ID
        assert "script_text" in data
        assert "ai_analysis_result" in data
        print(f"✓ Got project detail: {CREATED_PROJECT_ID}")
    
    def test_05_get_project_other_user(self):
        """GET /api/projects/{project_id} by other user returns 403"""
        response = requests.get(
            f"{BASE_URL}/api/projects/{CREATED_PROJECT_ID}",
            headers={"Authorization": f"Bearer {RENTAL_SESSION}"}
        )
        # Rental house shouldn't access filmmaker's project
        assert response.status_code == 403
        print("✓ Other user cannot access project - 403")
    
    def test_06_get_project_not_found(self):
        """GET /api/projects/{project_id} with invalid ID returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/projects/nonexistent_project_id",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 404
        print("✓ Non-existent project returns 404")
    
    def test_07_retry_analysis(self):
        """POST /api/projects/{project_id}/retry-analysis retries AI"""
        response = requests.post(
            f"{BASE_URL}/api/projects/{CREATED_PROJECT_ID}/retry-analysis",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["project_id"] == CREATED_PROJECT_ID
        assert "status" in data
        assert "analysis" in data
        print(f"✓ Retry analysis: status={data['status']}")


class TestLeadWorkflow:
    """Test Lead/Quote workflow"""
    
    def test_01_create_lead_invalid_project(self):
        """POST /api/leads with non-existent project returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"},
            json={
                "project_id": "nonexistent_project",
                "supplier_id": RENTAL_USER_ID
            }
        )
        assert response.status_code == 404
        print("✓ Non-existent project returns 404")
    
    def test_02_create_lead_invalid_supplier(self):
        """POST /api/leads with non-rental-house supplier returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"},
            json={
                "project_id": CREATED_PROJECT_ID,
                "supplier_id": FILMMAKER_USER_ID  # Filmmaker, not rental house
            }
        )
        assert response.status_code == 400
        print("✓ Non-rental-house supplier returns 400")
    
    def test_03_create_lead_success(self):
        """POST /api/leads creates new lead"""
        global CREATED_LEAD_ID
        response = requests.post(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"},
            json={
                "project_id": CREATED_PROJECT_ID,
                "supplier_id": RENTAL_USER_ID
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "new"
        assert data["filmmaker_id"] == FILMMAKER_USER_ID
        assert data["supplier_id"] == RENTAL_USER_ID
        assert data["project_id"] == CREATED_PROJECT_ID
        assert "lead_id" in data
        CREATED_LEAD_ID = data["lead_id"]
        print(f"✓ Lead created: {CREATED_LEAD_ID}")
    
    def test_04_get_leads_filmmaker(self):
        """GET /api/leads returns filmmaker's leads"""
        response = requests.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        lead_ids = [l["lead_id"] for l in data]
        assert CREATED_LEAD_ID in lead_ids
        print(f"✓ Filmmaker has {len(data)} leads")
    
    def test_05_get_leads_rental(self):
        """GET /api/leads returns rental house's leads"""
        response = requests.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {RENTAL_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        lead_ids = [l["lead_id"] for l in data]
        assert CREATED_LEAD_ID in lead_ids
        print(f"✓ Rental house has {len(data)} leads")
    
    def test_06_get_lead_detail(self):
        """GET /api/leads/{lead_id} returns lead details"""
        response = requests.get(
            f"{BASE_URL}/api/leads/{CREATED_LEAD_ID}",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["lead_id"] == CREATED_LEAD_ID
        assert data["status"] == "new"
        print(f"✓ Got lead detail: status={data['status']}")
    
    def test_07_send_quote_unauthorized(self):
        """PUT /api/leads/{lead_id}/quote by filmmaker returns 403"""
        response = requests.put(
            f"{BASE_URL}/api/leads/{CREATED_LEAD_ID}/quote",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"},
            json={
                "status": "quoted",
                "quote_details": {"total_amount": 500.0}
            }
        )
        assert response.status_code == 403
        print("✓ Filmmaker cannot send quote - 403")
    
    def test_08_send_quote_success(self):
        """PUT /api/leads/{lead_id}/quote sends quote"""
        response = requests.put(
            f"{BASE_URL}/api/leads/{CREATED_LEAD_ID}/quote",
            headers={"Authorization": f"Bearer {RENTAL_SESSION}"},
            json={
                "status": "quoted",
                "quote_details": {
                    "items": [
                        {"name": "RED Komodo 6K", "quantity": 1, "daily_rate": 500.0},
                        {"name": "Lens Kit", "quantity": 1, "daily_rate": 200.0}
                    ],
                    "total_amount": 700.0,
                    "notes": "Great gear for your project!"
                }
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "quoted"
        assert data["quote_details"]["total_amount"] == 700.0
        print(f"✓ Quote sent: ${data['quote_details']['total_amount']}")
    
    def test_09_accept_quote_non_quoted(self):
        """PUT /api/leads/{lead_id}/accept without quote returns error"""
        # Create a new lead without quote
        response = requests.post(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"},
            json={
                "project_id": CREATED_PROJECT_ID,
                "supplier_id": RENTAL_USER_ID
            }
        )
        new_lead_id = response.json()["lead_id"]
        
        # Try to accept without quote
        response = requests.put(
            f"{BASE_URL}/api/leads/{new_lead_id}/accept",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 400
        print("✓ Cannot accept non-quoted lead - 400")
    
    def test_10_accept_quote_success(self):
        """PUT /api/leads/{lead_id}/accept accepts quoted lead"""
        response = requests.put(
            f"{BASE_URL}/api/leads/{CREATED_LEAD_ID}/accept",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Quote accepted"
        print("✓ Quote accepted")
        
        # Verify status change
        verify = requests.get(
            f"{BASE_URL}/api/leads/{CREATED_LEAD_ID}",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert verify.json()["status"] == "accepted"
        print("✓ Lead status verified: accepted")
    
    def test_11_decline_quote(self):
        """PUT /api/leads/{lead_id}/decline declines lead"""
        # Create and quote a new lead
        lead_resp = requests.post(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"},
            json={"project_id": CREATED_PROJECT_ID, "supplier_id": RENTAL_USER_ID}
        )
        lead_id = lead_resp.json()["lead_id"]
        
        requests.put(
            f"{BASE_URL}/api/leads/{lead_id}/quote",
            headers={"Authorization": f"Bearer {RENTAL_SESSION}"},
            json={"status": "quoted", "quote_details": {"total_amount": 100.0}}
        )
        
        # Decline
        response = requests.put(
            f"{BASE_URL}/api/leads/{lead_id}/decline",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Quote declined"
        print("✓ Quote declined successfully")


class TestPaymentEndpoints:
    """Test payment related endpoints"""
    
    def test_01_create_checkout_unauthorized(self):
        """POST /api/payments/checkout by rental house returns 403"""
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            headers={"Authorization": f"Bearer {RENTAL_SESSION}"},
            json={
                "lead_id": CREATED_LEAD_ID,
                "origin_url": BASE_URL
            }
        )
        assert response.status_code == 403
        print("✓ Rental house cannot create checkout - 403")
    
    def test_02_create_checkout_success(self):
        """POST /api/payments/checkout creates Stripe session"""
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"},
            json={
                "lead_id": CREATED_LEAD_ID,
                "origin_url": BASE_URL
            }
        )
        # Should succeed (Stripe test mode)
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert "session_id" in data
        print(f"✓ Checkout created: {data['session_id'][:30]}...")
        return data["session_id"]


class TestStripeConnect:
    """Test Stripe Connect endpoints"""
    
    def test_01_connect_onboard_unauthorized(self):
        """POST /api/stripe/connect/onboard by filmmaker returns 403"""
        response = requests.post(
            f"{BASE_URL}/api/stripe/connect/onboard",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"},
            json={
                "return_url": f"{BASE_URL}/rental-house/payments/success",
                "refresh_url": f"{BASE_URL}/rental-house/payments"
            }
        )
        assert response.status_code == 403
        print("✓ Filmmaker cannot onboard to Stripe Connect - 403")
    
    def test_02_connect_status_unauthorized(self):
        """GET /api/stripe/connect/status by filmmaker returns 403"""
        response = requests.get(
            f"{BASE_URL}/api/stripe/connect/status",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 403
        print("✓ Filmmaker cannot check Stripe Connect status - 403")


class TestProfileManagement:
    """Test profile update endpoints"""
    
    def test_01_update_profile_name(self):
        """PUT /api/users/profile updates name"""
        response = requests.put(
            f"{BASE_URL}/api/users/profile",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"},
            json={"name": "Updated Filmmaker Name"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Filmmaker Name"
        print(f"✓ Name updated: {data['name']}")
    
    def test_02_update_profile_phone(self):
        """PUT /api/users/profile updates phone"""
        response = requests.put(
            f"{BASE_URL}/api/users/profile",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"},
            json={"phone": "+1234567890"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["phone"] == "+1234567890"
        print(f"✓ Phone updated: {data['phone']}")
    
    def test_03_update_profile_short_name(self):
        """PUT /api/users/profile with short name returns 400"""
        response = requests.put(
            f"{BASE_URL}/api/users/profile",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"},
            json={"name": "A"}
        )
        assert response.status_code == 400
        print("✓ Short name rejected - 400")
    
    def test_04_update_profile_empty_name(self):
        """PUT /api/users/profile with empty name returns 400"""
        response = requests.put(
            f"{BASE_URL}/api/users/profile",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"},
            json={"name": "  "}
        )
        assert response.status_code == 400
        print("✓ Empty name rejected - 400")
    
    def test_05_update_profile_empty_request(self):
        """PUT /api/users/profile with no fields returns 400"""
        response = requests.put(
            f"{BASE_URL}/api/users/profile",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"},
            json={}
        )
        assert response.status_code == 400
        print("✓ Empty update rejected - 400")
    
    def test_06_rental_update_company_name(self):
        """PUT /api/users/profile updates company_name for rental house"""
        response = requests.put(
            f"{BASE_URL}/api/users/profile",
            headers={"Authorization": f"Bearer {RENTAL_SESSION}"},
            json={"company_name": "Updated Rental Company"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["company_name"] == "Updated Rental Company"
        print(f"✓ Company name updated: {data['company_name']}")


class TestRentalHousesList:
    """Test rental houses list endpoint"""
    
    def test_01_get_rental_houses(self):
        """GET /api/rental-houses returns list of rental houses"""
        response = requests.get(
            f"{BASE_URL}/api/rental-houses",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Check at least one rental house
        if len(data) > 0:
            assert "user_id" in data[0]
            assert "name" in data[0]
        print(f"✓ Found {len(data)} rental houses")


class TestGetUserEndpoint:
    """Test GET /api/users/{user_id} endpoint"""
    
    def test_01_get_user_details(self):
        """GET /api/users/{user_id} returns user info"""
        response = requests.get(
            f"{BASE_URL}/api/users/{RENTAL_USER_ID}",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == RENTAL_USER_ID
        assert "name" in data
        assert "email" in data
        print(f"✓ Got user: {data['name']}")
    
    def test_02_get_user_not_found(self):
        """GET /api/users/{user_id} with invalid ID returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/users/nonexistent_user",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 404
        print("✓ Non-existent user returns 404")


class TestLogout:
    """Test logout endpoint"""
    
    def test_01_logout(self):
        """POST /api/auth/logout invalidates session"""
        # Use norole session since we already changed its role
        response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {NOROLE_SESSION}"}
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Logged out"
        print("✓ Logout successful")
        
        # Verify session is invalid
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {NOROLE_SESSION}"}
        )
        assert response.status_code == 401
        print("✓ Session invalidated after logout")


class TestCleanup:
    """Clean up test data"""
    
    def test_99_cleanup(self):
        """Clean up all test data"""
        import subprocess
        result = subprocess.run(
            ['mongosh', '--quiet', '--eval', """
use('test_database');
db.users.deleteMany({email: /TEST_FULL_/});
db.user_sessions.deleteMany({session_token: /test_full_/});
db.projects.deleteMany({filmmaker_id: /test-filmmaker-full-/});
db.gear_items.deleteMany({supplier_id: /test-rental-full-/});
db.leads.deleteMany({filmmaker_id: /test-filmmaker-full-/});
db.payment_transactions.deleteMany({filmmaker_id: /test-filmmaker-full-/});
print('Cleanup completed');
"""],
            capture_output=True,
            text=True
        )
        print(f"✓ Cleanup: {result.stdout.strip()}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s", "--tb=short"])
