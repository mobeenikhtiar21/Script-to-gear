"""
Test suite for Filmmaker Quote Review UI and User Profile Management features.

Features tested:
- Profile Management: PUT /api/users/profile
- Filmmaker Quote Review: GET /api/leads, GET /api/leads/{lead_id}, PUT /api/leads/{lead_id}/decline
"""
import pytest
import requests
import os
from datetime import datetime, timezone, timedelta

# Base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from database setup
FILMMAKER_SESSION = "session_filmmaker_1773697470757"
RENTAL_SESSION = "session_rental_1773697470757"
LEAD_ID_NEW = "lead_test_new_1773697470769"
LEAD_ID_QUOTED = "lead_test_quoted_1773697470770"


class TestHealthCheck:
    """Verify API is accessible"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")


class TestFilmmakerLeadsAPI:
    """Test Filmmaker Quote Review API endpoints"""
    
    def test_get_leads_returns_200(self):
        """GET /api/leads returns leads for filmmaker"""
        response = requests.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/leads returned {len(data)} leads")
        
    def test_get_leads_returns_correct_structure(self):
        """Verify lead data structure"""
        response = requests.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            lead = data[0]
            # Verify required fields
            assert "lead_id" in lead
            assert "project_id" in lead
            assert "supplier_id" in lead
            assert "filmmaker_id" in lead
            assert "status" in lead
            assert "created_at" in lead
            assert "updated_at" in lead
            print(f"✓ Lead structure is valid: {list(lead.keys())}")
        else:
            print("⚠ No leads found to verify structure")
    
    def test_get_lead_details_returns_200(self):
        """GET /api/leads/{lead_id} returns lead details with status and quote_details"""
        response = requests.get(
            f"{BASE_URL}/api/leads/{LEAD_ID_QUOTED}",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify lead details
        assert data["lead_id"] == LEAD_ID_QUOTED
        assert data["status"] == "quoted"
        assert "quote_details" in data
        
        # Verify quote_details structure
        quote = data["quote_details"]
        assert "items" in quote
        assert "total_amount" in quote
        assert quote["total_amount"] == 350.00
        print(f"✓ Lead detail returned with status: {data['status']}, total: ${quote['total_amount']}")
    
    def test_get_lead_details_new_status(self):
        """GET /api/leads/{lead_id} works for new leads"""
        response = requests.get(
            f"{BASE_URL}/api/leads/{LEAD_ID_NEW}",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "new"
        assert data["quote_details"] is None
        print(f"✓ New lead returned with status: {data['status']}")
    
    def test_get_lead_not_found(self):
        """GET /api/leads/{lead_id} returns 404 for non-existent lead"""
        response = requests.get(
            f"{BASE_URL}/api/leads/nonexistent_lead_123",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 404
        print("✓ Non-existent lead returns 404")
    
    def test_decline_quoted_lead(self):
        """PUT /api/leads/{lead_id}/decline allows filmmaker to decline a quoted lead"""
        response = requests.put(
            f"{BASE_URL}/api/leads/{LEAD_ID_QUOTED}/decline",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Quote declined"
        print("✓ Decline quote returned success message")
        
        # Verify the status changed
        verify_response = requests.get(
            f"{BASE_URL}/api/leads/{LEAD_ID_QUOTED}",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data["status"] == "declined"
        print(f"✓ Lead status verified as: {verify_data['status']}")
    
    def test_leads_requires_auth(self):
        """GET /api/leads requires authentication"""
        response = requests.get(f"{BASE_URL}/api/leads")
        assert response.status_code == 401
        print("✓ Leads endpoint requires authentication")


class TestProfileManagement:
    """Test User Profile Management API endpoints"""
    
    def test_get_current_user(self):
        """GET /api/auth/me returns current user data"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify user structure
        assert "user_id" in data
        assert "email" in data
        assert "name" in data
        assert "role" in data
        print(f"✓ Current user: {data['name']} ({data['role']})")
    
    def test_update_profile_name(self):
        """PUT /api/users/profile updates user's name"""
        new_name = f"Updated Filmmaker {datetime.now().timestamp()}"
        response = requests.put(
            f"{BASE_URL}/api/users/profile",
            headers={
                "Authorization": f"Bearer {FILMMAKER_SESSION}",
                "Content-Type": "application/json"
            },
            json={"name": new_name}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == new_name
        print(f"✓ Name updated to: {data['name']}")
    
    def test_update_profile_phone(self):
        """PUT /api/users/profile updates user's phone"""
        new_phone = "555-123-4567"
        response = requests.put(
            f"{BASE_URL}/api/users/profile",
            headers={
                "Authorization": f"Bearer {FILMMAKER_SESSION}",
                "Content-Type": "application/json"
            },
            json={"phone": new_phone}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["phone"] == new_phone
        print(f"✓ Phone updated to: {data['phone']}")
    
    def test_update_profile_multiple_fields(self):
        """PUT /api/users/profile updates multiple fields at once"""
        response = requests.put(
            f"{BASE_URL}/api/users/profile",
            headers={
                "Authorization": f"Bearer {FILMMAKER_SESSION}",
                "Content-Type": "application/json"
            },
            json={"name": "Multi Update Test", "phone": "555-999-8888"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Multi Update Test"
        assert data["phone"] == "555-999-8888"
        print(f"✓ Multiple fields updated: name={data['name']}, phone={data['phone']}")
    
    def test_update_profile_name_validation(self):
        """PUT /api/users/profile validates name must be at least 2 characters"""
        response = requests.put(
            f"{BASE_URL}/api/users/profile",
            headers={
                "Authorization": f"Bearer {FILMMAKER_SESSION}",
                "Content-Type": "application/json"
            },
            json={"name": "A"}  # Too short
        )
        assert response.status_code == 400
        data = response.json()
        assert "at least 2 characters" in data["detail"].lower()
        print(f"✓ Short name rejected: {data['detail']}")
    
    def test_update_profile_empty_name_validation(self):
        """PUT /api/users/profile validates empty name is rejected"""
        response = requests.put(
            f"{BASE_URL}/api/users/profile",
            headers={
                "Authorization": f"Bearer {FILMMAKER_SESSION}",
                "Content-Type": "application/json"
            },
            json={"name": " "}  # Whitespace only
        )
        assert response.status_code == 400
        print("✓ Empty/whitespace name rejected")
    
    def test_rental_house_can_update_company_name(self):
        """PUT /api/users/profile allows rental_house to update company_name"""
        new_company_name = f"Updated Rentals {datetime.now().timestamp()}"
        response = requests.put(
            f"{BASE_URL}/api/users/profile",
            headers={
                "Authorization": f"Bearer {RENTAL_SESSION}",
                "Content-Type": "application/json"
            },
            json={"company_name": new_company_name}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["company_name"] == new_company_name
        print(f"✓ Rental house company name updated: {data['company_name']}")
    
    def test_filmmaker_cannot_update_company_name(self):
        """PUT /api/users/profile ignores company_name for filmmakers (no error but not updated)"""
        # First get current user data
        current_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        original_company = current_response.json().get("company_name")
        
        # Try to update company_name
        response = requests.put(
            f"{BASE_URL}/api/users/profile",
            headers={
                "Authorization": f"Bearer {FILMMAKER_SESSION}",
                "Content-Type": "application/json"
            },
            json={"name": "Filmmaker Test Update", "company_name": "Should Not Update"}
        )
        assert response.status_code == 200
        data = response.json()
        # company_name should remain unchanged (either null or original value)
        assert data.get("company_name") == original_company
        print(f"✓ Filmmaker company_name not updated (remained: {data.get('company_name')})")
    
    def test_profile_requires_auth(self):
        """PUT /api/users/profile requires authentication"""
        response = requests.put(
            f"{BASE_URL}/api/users/profile",
            headers={"Content-Type": "application/json"},
            json={"name": "Test"}
        )
        assert response.status_code == 401
        print("✓ Profile update requires authentication")
    
    def test_profile_no_fields_to_update(self):
        """PUT /api/users/profile returns 400 when no valid fields provided"""
        response = requests.put(
            f"{BASE_URL}/api/users/profile",
            headers={
                "Authorization": f"Bearer {FILMMAKER_SESSION}",
                "Content-Type": "application/json"
            },
            json={}
        )
        assert response.status_code == 400
        data = response.json()
        assert "no valid fields" in data["detail"].lower()
        print(f"✓ Empty update rejected: {data['detail']}")


class TestGetUsersEndpoint:
    """Test GET /api/users/{user_id} endpoint for lead detail page"""
    
    def test_get_rental_house_user(self):
        """GET /api/users/{user_id} returns rental house info for filmmaker"""
        # First get a lead to find supplier_id
        leads_response = requests.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
        )
        if leads_response.status_code == 200 and len(leads_response.json()) > 0:
            supplier_id = leads_response.json()[0]["supplier_id"]
            
            # Get supplier details
            response = requests.get(
                f"{BASE_URL}/api/users/{supplier_id}",
                headers={"Authorization": f"Bearer {FILMMAKER_SESSION}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert "name" in data
            assert "email" in data
            print(f"✓ Supplier info retrieved: {data.get('company_name', data.get('name'))}")
        else:
            pytest.skip("No leads available to test")


class TestCleanup:
    """Clean up test data after tests"""
    
    def test_cleanup_test_data(self):
        """Remove test data created during tests (runs last)"""
        import subprocess
        result = subprocess.run(
            ['mongosh', '--quiet', '--eval', """
use('test_database');
db.users.deleteMany({email: /test\\.filmmaker\\./});
db.users.deleteMany({email: /test\\.rental\\./});
db.user_sessions.deleteMany({session_token: /session_filmmaker_/});
db.user_sessions.deleteMany({session_token: /session_rental_/});
db.leads.deleteMany({lead_id: /lead_test_/});
db.projects.deleteMany({project_id: /proj_test_/});
print('Cleanup completed');
"""],
            capture_output=True,
            text=True
        )
        print(f"✓ Test data cleaned up: {result.stdout}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
