"""
Comprehensive Diagnostic Sweep for Script-to-Gear Marketplace
Tests all API endpoints, authentication, role-based access, and integrations
"""

import pytest
import requests
import os
import time
import json

# Use public URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://filmmaker-rental.preview.emergentagent.com').rstrip('/')

# ============= FIXTURES =============

@pytest.fixture(scope="module")
def filmmaker_session():
    """Create test filmmaker user and session"""
    import subprocess
    result = subprocess.run([
        'mongosh', '--quiet', '--eval', '''
        use('test_database');
        var userId = 'test-diag-filmmaker-' + Date.now();
        var token = 'test_diag_fm_' + Date.now();
        db.users.insertOne({
          user_id: userId,
          email: 'TEST_DIAG_filmmaker_' + Date.now() + '@example.com',
          name: 'Test Diagnostic Filmmaker',
          role: 'filmmaker',
          phone: '555-1111',
          picture: 'https://via.placeholder.com/150',
          created_at: new Date()
        });
        db.user_sessions.insertOne({
          user_id: userId,
          session_token: token,
          expires_at: new Date(Date.now() + 7*24*60*60*1000),
          created_at: new Date()
        });
        print(token + '|' + userId);
        '''
    ], capture_output=True, text=True)
    parts = result.stdout.strip().split('|')
    return {"token": parts[0], "user_id": parts[1]}

@pytest.fixture(scope="module")
def rental_session():
    """Create test rental house user and session"""
    import subprocess
    result = subprocess.run([
        'mongosh', '--quiet', '--eval', '''
        use('test_database');
        var userId = 'test-diag-rental-' + Date.now();
        var token = 'test_diag_rh_' + Date.now();
        db.users.insertOne({
          user_id: userId,
          email: 'TEST_DIAG_rental_' + Date.now() + '@example.com',
          name: 'Test Diagnostic Rental',
          role: 'rental_house',
          phone: '555-2222',
          company_name: 'Diagnostic Studios',
          picture: 'https://via.placeholder.com/150',
          created_at: new Date()
        });
        db.user_sessions.insertOne({
          user_id: userId,
          session_token: token,
          expires_at: new Date(Date.now() + 7*24*60*60*1000),
          created_at: new Date()
        });
        print(token + '|' + userId);
        '''
    ], capture_output=True, text=True)
    parts = result.stdout.strip().split('|')
    return {"token": parts[0], "user_id": parts[1]}

@pytest.fixture
def api_client():
    """Create requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

def cleanup_test_data():
    """Cleanup test data at end of test"""
    import subprocess
    subprocess.run([
        'mongosh', '--quiet', '--eval', '''
        use('test_database');
        db.users.deleteMany({email: /TEST_DIAG/});
        db.user_sessions.deleteMany({session_token: /test_diag/});
        db.projects.deleteMany({filmmaker_id: /test-diag/});
        db.gear_items.deleteMany({supplier_id: /test-diag/});
        db.leads.deleteMany({filmmaker_id: /test-diag/});
        db.payment_transactions.deleteMany({filmmaker_id: /test-diag/});
        '''
    ], capture_output=True, text=True)


# ============= HEALTH CHECK TESTS =============

class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_check(self, api_client):
        """GET /api/health returns healthy status"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "script-to-gear-api"
        print("✅ Health check passed")


# ============= AUTHENTICATION TESTS =============

class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_auth_me_no_token(self, api_client):
        """GET /api/auth/me without token returns 401"""
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✅ Unauthenticated request returns 401")
    
    def test_auth_me_invalid_token(self, api_client):
        """GET /api/auth/me with invalid token returns 401"""
        response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_xyz"}
        )
        assert response.status_code == 401
        print("✅ Invalid token returns 401")
    
    def test_auth_me_valid_token(self, api_client, filmmaker_session):
        """GET /api/auth/me with valid token returns user"""
        response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert "role" in data
        print(f"✅ Valid token returns user data: {data['email']}")
    
    def test_auth_select_role_invalid(self, api_client, filmmaker_session):
        """POST /api/auth/select-role with invalid role returns 400"""
        response = api_client.post(
            f"{BASE_URL}/api/auth/select-role",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"},
            json={"role": "invalid_role"}
        )
        assert response.status_code == 400
        print("✅ Invalid role returns 400")
    
    def test_auth_logout(self, api_client, filmmaker_session):
        """POST /api/auth/logout works"""
        # Create a separate session for logout test
        import subprocess
        result = subprocess.run([
            'mongosh', '--quiet', '--eval', '''
            use('test_database');
            var token = 'test_logout_' + Date.now();
            db.user_sessions.insertOne({
              user_id: 'test-diag-filmmaker-logout',
              session_token: token,
              expires_at: new Date(Date.now() + 7*24*60*60*1000),
              created_at: new Date()
            });
            print(token);
            '''
        ], capture_output=True, text=True)
        temp_token = result.stdout.strip()
        
        response = api_client.post(
            f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {temp_token}"}
        )
        assert response.status_code == 200
        print("✅ Logout endpoint works")


# ============= GEAR CRUD TESTS =============

class TestGearCRUD:
    """Gear CRUD endpoint tests"""
    
    gear_id = None
    
    def test_create_gear_unauthorized(self, api_client, filmmaker_session):
        """POST /api/gear by filmmaker returns 403"""
        response = api_client.post(
            f"{BASE_URL}/api/gear",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"},
            json={
                "category": "camera",
                "manufacturer": "RED",
                "model": "Komodo",
                "daily_rate": 500,
                "specs": {"sensor": "Super35"}
            }
        )
        assert response.status_code == 403
        print("✅ Filmmaker cannot create gear (403)")
    
    def test_create_gear_rental_house(self, api_client, rental_session):
        """POST /api/gear by rental house creates gear"""
        response = api_client.post(
            f"{BASE_URL}/api/gear",
            headers={"Authorization": f"Bearer {rental_session['token']}"},
            json={
                "category": "camera",
                "manufacturer": "RED",
                "model": "DIAG Komodo Test",
                "daily_rate": 500,
                "specs": {"sensor": "Super35", "resolution": "6K"}
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert "gear_id" in data
        assert data["manufacturer"] == "RED"
        TestGearCRUD.gear_id = data["gear_id"]
        print(f"✅ Rental house created gear: {data['gear_id']}")
    
    def test_get_gear_list(self, api_client, rental_session):
        """GET /api/gear returns gear list"""
        response = api_client.get(
            f"{BASE_URL}/api/gear",
            headers={"Authorization": f"Bearer {rental_session['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got gear list: {len(data)} items")
    
    def test_get_gear_by_id(self, api_client, rental_session):
        """GET /api/gear/{gear_id} returns gear details"""
        if not TestGearCRUD.gear_id:
            pytest.skip("No gear_id available")
        response = api_client.get(
            f"{BASE_URL}/api/gear/{TestGearCRUD.gear_id}",
            headers={"Authorization": f"Bearer {rental_session['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["gear_id"] == TestGearCRUD.gear_id
        print(f"✅ Got gear by ID: {data['model']}")
    
    def test_update_gear(self, api_client, rental_session):
        """PUT /api/gear/{gear_id} updates gear"""
        if not TestGearCRUD.gear_id:
            pytest.skip("No gear_id available")
        response = api_client.put(
            f"{BASE_URL}/api/gear/{TestGearCRUD.gear_id}",
            headers={"Authorization": f"Bearer {rental_session['token']}"},
            json={"daily_rate": 600}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["daily_rate"] == 600
        print(f"✅ Updated gear rate to $600")
    
    def test_update_gear_unauthorized(self, api_client, filmmaker_session):
        """PUT /api/gear/{gear_id} by filmmaker returns 403"""
        if not TestGearCRUD.gear_id:
            pytest.skip("No gear_id available")
        response = api_client.put(
            f"{BASE_URL}/api/gear/{TestGearCRUD.gear_id}",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"},
            json={"daily_rate": 100}
        )
        assert response.status_code == 403
        print("✅ Filmmaker cannot update gear (403)")
    
    def test_get_gear_not_found(self, api_client, rental_session):
        """GET /api/gear/{gear_id} with invalid ID returns 404"""
        response = api_client.get(
            f"{BASE_URL}/api/gear/nonexistent_gear_id",
            headers={"Authorization": f"Bearer {rental_session['token']}"}
        )
        assert response.status_code == 404
        print("✅ Nonexistent gear returns 404")
    
    def test_delete_gear_unauthorized(self, api_client, filmmaker_session):
        """DELETE /api/gear/{gear_id} by filmmaker returns 403"""
        if not TestGearCRUD.gear_id:
            pytest.skip("No gear_id available")
        response = api_client.delete(
            f"{BASE_URL}/api/gear/{TestGearCRUD.gear_id}",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"}
        )
        assert response.status_code == 403
        print("✅ Filmmaker cannot delete gear (403)")


# ============= PROJECT TESTS =============

class TestProjects:
    """Project endpoint tests"""
    
    project_id = None
    
    def test_create_project_unauthorized(self, api_client, rental_session):
        """POST /api/projects by rental house returns 403"""
        response = api_client.post(
            f"{BASE_URL}/api/projects",
            headers={"Authorization": f"Bearer {rental_session['token']}"},
            json={"script_text": "Test script"}
        )
        assert response.status_code == 403
        print("✅ Rental house cannot create project (403)")
    
    def test_create_project_filmmaker(self, api_client, filmmaker_session):
        """POST /api/projects by filmmaker creates project with AI analysis"""
        response = api_client.post(
            f"{BASE_URL}/api/projects",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"},
            json={"script_text": "INT. STUDIO - DAY\nA moody interior shot with dramatic lighting. Character walks across the room in slow motion."}
        )
        assert response.status_code == 201
        data = response.json()
        assert "project_id" in data
        assert "ai_analysis_result" in data
        TestProjects.project_id = data["project_id"]
        print(f"✅ Created project with AI analysis: {data['project_id']}")
        
        # Verify AI analysis has expected fields
        if data.get("ai_analysis_result") and "gear_recommendations" in data["ai_analysis_result"]:
            print(f"   AI returned {len(data['ai_analysis_result'].get('gear_recommendations', []))} gear recommendations")
    
    def test_get_projects_list(self, api_client, filmmaker_session):
        """GET /api/projects returns filmmaker's projects"""
        response = api_client.get(
            f"{BASE_URL}/api/projects",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got projects list: {len(data)} projects")
    
    def test_get_project_by_id(self, api_client, filmmaker_session):
        """GET /api/projects/{project_id} returns project details"""
        if not TestProjects.project_id:
            pytest.skip("No project_id available")
        response = api_client.get(
            f"{BASE_URL}/api/projects/{TestProjects.project_id}",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["project_id"] == TestProjects.project_id
        print(f"✅ Got project by ID")
    
    def test_get_project_unauthorized(self, api_client, rental_session):
        """GET /api/projects/{project_id} by non-owner returns 403"""
        if not TestProjects.project_id:
            pytest.skip("No project_id available")
        response = api_client.get(
            f"{BASE_URL}/api/projects/{TestProjects.project_id}",
            headers={"Authorization": f"Bearer {rental_session['token']}"}
        )
        assert response.status_code == 403
        print("✅ Non-owner cannot access project (403)")
    
    def test_get_project_not_found(self, api_client, filmmaker_session):
        """GET /api/projects/{project_id} with invalid ID returns 404"""
        response = api_client.get(
            f"{BASE_URL}/api/projects/nonexistent_project_id",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"}
        )
        assert response.status_code == 404
        print("✅ Nonexistent project returns 404")
    
    def test_retry_project_analysis(self, api_client, filmmaker_session):
        """POST /api/projects/{project_id}/retry-analysis works"""
        if not TestProjects.project_id:
            pytest.skip("No project_id available")
        response = api_client.post(
            f"{BASE_URL}/api/projects/{TestProjects.project_id}/retry-analysis",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        print(f"✅ Retry analysis: status = {data['status']}")


# ============= LEADS AND QUOTES TESTS =============

class TestLeadsAndQuotes:
    """Leads and quotes endpoint tests"""
    
    lead_id = None
    
    def test_create_lead_invalid_project(self, api_client, filmmaker_session, rental_session):
        """POST /api/leads with invalid project returns 404"""
        response = api_client.post(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"},
            json={
                "project_id": "nonexistent_project",
                "supplier_id": rental_session['user_id']
            }
        )
        assert response.status_code == 404
        print("✅ Lead with invalid project returns 404")
    
    def test_create_lead_invalid_supplier(self, api_client, filmmaker_session):
        """POST /api/leads with non-rental supplier returns 400"""
        if not TestProjects.project_id:
            pytest.skip("No project_id available")
        response = api_client.post(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"},
            json={
                "project_id": TestProjects.project_id,
                "supplier_id": filmmaker_session['user_id']  # Filmmaker, not rental house
            }
        )
        assert response.status_code == 400
        print("✅ Lead with non-rental supplier returns 400")
    
    def test_create_lead_valid(self, api_client, filmmaker_session, rental_session):
        """POST /api/leads creates lead"""
        if not TestProjects.project_id:
            pytest.skip("No project_id available")
        response = api_client.post(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"},
            json={
                "project_id": TestProjects.project_id,
                "supplier_id": rental_session['user_id']
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "lead_id" in data
        assert data["status"] == "new"
        TestLeadsAndQuotes.lead_id = data["lead_id"]
        print(f"✅ Created lead: {data['lead_id']}")
    
    def test_get_leads_filmmaker(self, api_client, filmmaker_session):
        """GET /api/leads returns filmmaker's leads"""
        response = api_client.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Filmmaker has {len(data)} leads")
    
    def test_get_leads_rental(self, api_client, rental_session):
        """GET /api/leads returns rental's leads"""
        response = api_client.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {rental_session['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Rental house has {len(data)} leads")
    
    def test_get_lead_by_id(self, api_client, filmmaker_session):
        """GET /api/leads/{lead_id} returns lead details"""
        if not TestLeadsAndQuotes.lead_id:
            pytest.skip("No lead_id available")
        response = api_client.get(
            f"{BASE_URL}/api/leads/{TestLeadsAndQuotes.lead_id}",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["lead_id"] == TestLeadsAndQuotes.lead_id
        print(f"✅ Got lead by ID: status = {data['status']}")
    
    def test_send_quote_unauthorized(self, api_client, filmmaker_session):
        """PUT /api/leads/{lead_id}/quote by filmmaker returns 403"""
        if not TestLeadsAndQuotes.lead_id:
            pytest.skip("No lead_id available")
        response = api_client.put(
            f"{BASE_URL}/api/leads/{TestLeadsAndQuotes.lead_id}/quote",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"},
            json={
                "quote_details": {"items": [], "total_amount": 500},
                "status": "quoted"
            }
        )
        assert response.status_code == 403
        print("✅ Filmmaker cannot send quote (403)")
    
    def test_send_quote_rental(self, api_client, rental_session):
        """PUT /api/leads/{lead_id}/quote by rental house sends quote"""
        if not TestLeadsAndQuotes.lead_id:
            pytest.skip("No lead_id available")
        response = api_client.put(
            f"{BASE_URL}/api/leads/{TestLeadsAndQuotes.lead_id}/quote",
            headers={"Authorization": f"Bearer {rental_session['token']}"},
            json={
                "quote_details": {
                    "items": [
                        {"name": "RED Komodo", "quantity": 1, "daily_rate": 500}
                    ],
                    "total_amount": 500
                },
                "status": "quoted"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "quoted"
        print(f"✅ Rental house sent quote: ${data['quote_details']['total_amount']}")
    
    def test_accept_quote_not_quoted(self, api_client, filmmaker_session, rental_session):
        """PUT /api/leads/{lead_id}/accept on non-quoted lead"""
        # Create a new lead that hasn't been quoted
        if not TestProjects.project_id:
            pytest.skip("No project_id available")
        
        create_response = api_client.post(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"},
            json={
                "project_id": TestProjects.project_id,
                "supplier_id": rental_session['user_id']
            }
        )
        new_lead_id = create_response.json()["lead_id"]
        
        response = api_client.put(
            f"{BASE_URL}/api/leads/{new_lead_id}/accept",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"}
        )
        assert response.status_code == 400
        print("✅ Cannot accept non-quoted lead (400)")
    
    def test_accept_quote(self, api_client, filmmaker_session):
        """PUT /api/leads/{lead_id}/accept accepts quote"""
        if not TestLeadsAndQuotes.lead_id:
            pytest.skip("No lead_id available")
        response = api_client.put(
            f"{BASE_URL}/api/leads/{TestLeadsAndQuotes.lead_id}/accept",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"}
        )
        assert response.status_code == 200
        print("✅ Accepted quote")
    
    def test_decline_quote(self, api_client, filmmaker_session, rental_session):
        """PUT /api/leads/{lead_id}/decline declines quote"""
        # Create a new lead and quote it, then decline
        if not TestProjects.project_id:
            pytest.skip("No project_id available")
        
        create_response = api_client.post(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"},
            json={
                "project_id": TestProjects.project_id,
                "supplier_id": rental_session['user_id']
            }
        )
        new_lead_id = create_response.json()["lead_id"]
        
        # Quote it
        api_client.put(
            f"{BASE_URL}/api/leads/{new_lead_id}/quote",
            headers={"Authorization": f"Bearer {rental_session['token']}"},
            json={
                "quote_details": {"items": [], "total_amount": 300},
                "status": "quoted"
            }
        )
        
        # Decline it
        response = api_client.put(
            f"{BASE_URL}/api/leads/{new_lead_id}/decline",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"}
        )
        assert response.status_code == 200
        print("✅ Declined quote")


# ============= PAYMENT TESTS =============

class TestPayments:
    """Payment endpoint tests"""
    
    def test_create_checkout_unauthorized(self, api_client, rental_session):
        """POST /api/payments/checkout by rental returns 403"""
        response = api_client.post(
            f"{BASE_URL}/api/payments/checkout",
            headers={"Authorization": f"Bearer {rental_session['token']}"},
            json={
                "lead_id": "test_lead",
                "origin_url": "https://test.com"
            }
        )
        assert response.status_code == 403
        print("✅ Rental house cannot create checkout (403)")
    
    def test_create_checkout_valid(self, api_client, filmmaker_session):
        """POST /api/payments/checkout creates Stripe session"""
        if not TestLeadsAndQuotes.lead_id:
            pytest.skip("No lead_id available")
        response = api_client.post(
            f"{BASE_URL}/api/payments/checkout",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"},
            json={
                "lead_id": TestLeadsAndQuotes.lead_id,
                "origin_url": "https://filmmaker-rental.preview.emergentagent.com"
            }
        )
        # Should return 200 with Stripe URL (test mode)
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert "session_id" in data
        print(f"✅ Created Stripe checkout session")


# ============= STRIPE CONNECT TESTS =============

class TestStripeConnect:
    """Stripe Connect endpoint tests"""
    
    def test_stripe_onboard_unauthorized(self, api_client, filmmaker_session):
        """POST /api/stripe/connect/onboard by filmmaker returns 403"""
        response = api_client.post(
            f"{BASE_URL}/api/stripe/connect/onboard",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"},
            json={
                "return_url": "https://test.com/return",
                "refresh_url": "https://test.com/refresh"
            }
        )
        assert response.status_code == 403
        print("✅ Filmmaker cannot start Stripe onboarding (403)")
    
    def test_stripe_status_unauthorized(self, api_client, filmmaker_session):
        """GET /api/stripe/connect/status by filmmaker returns 403"""
        response = api_client.get(
            f"{BASE_URL}/api/stripe/connect/status",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"}
        )
        assert response.status_code == 403
        print("✅ Filmmaker cannot check Stripe status (403)")


# ============= PROFILE TESTS =============

class TestProfile:
    """Profile endpoint tests"""
    
    def test_update_profile_name(self, api_client, filmmaker_session):
        """PUT /api/users/profile updates name"""
        response = api_client.put(
            f"{BASE_URL}/api/users/profile",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"},
            json={"name": "Updated Test Name"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Test Name"
        print("✅ Updated profile name")
    
    def test_update_profile_phone(self, api_client, filmmaker_session):
        """PUT /api/users/profile updates phone"""
        response = api_client.put(
            f"{BASE_URL}/api/users/profile",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"},
            json={"phone": "555-9999"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["phone"] == "555-9999"
        print("✅ Updated profile phone")
    
    def test_update_profile_short_name(self, api_client, filmmaker_session):
        """PUT /api/users/profile with short name returns 400"""
        response = api_client.put(
            f"{BASE_URL}/api/users/profile",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"},
            json={"name": "A"}
        )
        assert response.status_code == 400
        print("✅ Short name returns 400")
    
    def test_update_profile_empty_body(self, api_client, filmmaker_session):
        """PUT /api/users/profile with empty body returns 400"""
        response = api_client.put(
            f"{BASE_URL}/api/users/profile",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"},
            json={}
        )
        assert response.status_code == 400
        print("✅ Empty body returns 400")


# ============= OTHER ENDPOINTS TESTS =============

class TestOtherEndpoints:
    """Other endpoint tests"""
    
    def test_get_rental_houses(self, api_client, filmmaker_session):
        """GET /api/rental-houses returns list"""
        response = api_client.get(
            f"{BASE_URL}/api/rental-houses",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} rental houses")
    
    def test_get_user_by_id(self, api_client, filmmaker_session, rental_session):
        """GET /api/users/{user_id} returns user info"""
        response = api_client.get(
            f"{BASE_URL}/api/users/{rental_session['user_id']}",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        print(f"✅ Got user by ID: {data.get('name', 'Unknown')}")
    
    def test_get_user_not_found(self, api_client, filmmaker_session):
        """GET /api/users/{user_id} with invalid ID returns 404"""
        response = api_client.get(
            f"{BASE_URL}/api/users/nonexistent_user_id",
            headers={"Authorization": f"Bearer {filmmaker_session['token']}"}
        )
        assert response.status_code == 404
        print("✅ Nonexistent user returns 404")


# ============= CLEANUP =============

def test_cleanup():
    """Cleanup test data"""
    cleanup_test_data()
    print("✅ Test data cleaned up")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
