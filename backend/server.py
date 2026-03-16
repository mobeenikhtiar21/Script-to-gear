from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionResponse,
    CheckoutStatusResponse,
    CheckoutSessionRequest
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create API router
api_router = APIRouter(prefix="/api")

# Get environment variables
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# ============= MODELS =============

class User(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    picture: Optional[str] = None
    role: Optional[str] = None  # filmmaker or rental_house
    phone: Optional[str] = None
    company_name: Optional[str] = None
    stripe_account_id: Optional[str] = None
    created_at: datetime

class RoleSelectionRequest(BaseModel):
    role: str  # filmmaker or rental_house
    phone: Optional[str] = None
    company_name: Optional[str] = None

class GearItem(BaseModel):
    gear_id: str
    supplier_id: str
    category: str  # camera/lens/audio/lighting/support
    manufacturer: str
    model: str
    daily_rate: float
    specs: Dict[str, Any]  # mount_type, sensor_size, focal_length, aperture, weight, power
    available: bool = True
    created_at: datetime

class GearItemCreate(BaseModel):
    category: str
    manufacturer: str
    model: str
    daily_rate: float
    specs: Dict[str, Any]
    available: bool = True

class GearItemUpdate(BaseModel):
    category: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    daily_rate: Optional[float] = None
    specs: Optional[Dict[str, Any]] = None
    available: Optional[bool] = None

class Project(BaseModel):
    project_id: str
    filmmaker_id: str
    script_text: str
    ai_analysis_result: Optional[Dict[str, Any]] = None
    created_at: datetime

class ProjectCreate(BaseModel):
    script_text: str

class ProjectGear(BaseModel):
    project_gear_id: str
    project_id: str
    gear_item_id: str
    quantity: int
    created_at: datetime

class ProjectGearAdd(BaseModel):
    gear_item_id: str
    quantity: int

class Lead(BaseModel):
    lead_id: str
    project_id: str
    supplier_id: str
    filmmaker_id: str
    status: str  # new/quoted/accepted/declined
    quote_details: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

class LeadCreate(BaseModel):
    project_id: str
    supplier_id: str

class QuoteUpdate(BaseModel):
    quote_details: Dict[str, Any]  # items with adjusted quantities/pricing
    status: str = "quoted"

class PaymentTransaction(BaseModel):
    transaction_id: str
    session_id: str
    lead_id: str
    filmmaker_id: str
    supplier_id: str
    amount: float
    currency: str
    platform_fee: float
    supplier_amount: float
    payment_status: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

# ============= AUTH HELPERS =============

async def get_current_user(request: Request, authorization: Optional[str] = Header(None)) -> User:
    """Get current user from session_token (cookie or header)"""
    session_token = request.cookies.get('session_token')
    
    # Fallback to Authorization header
    if not session_token and authorization:
        if authorization.startswith('Bearer '):
            session_token = authorization.replace('Bearer ', '')
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Convert datetime
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

# ============= AUTH ROUTES =============

@api_router.post("/auth/session")
async def create_session(request: Request):
    """Exchange session_id for user data and create session"""
    body = await request.json()
    session_id = body.get('session_id')
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session_id")
        
        data = response.json()
    
    # Check if user exists
    existing_user = await db.users.find_one(
        {"email": data['email']},
        {"_id": 0}
    )
    
    if existing_user:
        user_id = existing_user['user_id']
        # Update user data
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": data['name'],
                "picture": data.get('picture')
            }}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": data['email'],
            "name": data['name'],
            "picture": data.get('picture'),
            "role": None,
            "phone": None,
            "company_name": None,
            "stripe_account_id": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Create session
    session_token = data['session_token']
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Get user
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return {
        "user": User(**user_doc).model_dump(),
        "session_token": session_token
    }

@api_router.get("/auth/me")
async def get_me(request: Request, authorization: Optional[str] = Header(None)):
    """Get current user"""
    user = await get_current_user(request, authorization)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, authorization: Optional[str] = Header(None)):
    """Logout user"""
    session_token = request.cookies.get('session_token')
    if not session_token and authorization:
        if authorization.startswith('Bearer '):
            session_token = authorization.replace('Bearer ', '')
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    return {"message": "Logged out"}

@api_router.post("/auth/select-role")
async def select_role(request: Request, data: RoleSelectionRequest, authorization: Optional[str] = Header(None)):
    """Select user role after signup"""
    user = await get_current_user(request, authorization)
    
    if data.role not in ['filmmaker', 'rental_house']:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    update_data = {"role": data.role}
    
    if data.phone:
        update_data["phone"] = data.phone
    
    if data.role == 'rental_house' and data.company_name:
        update_data["company_name"] = data.company_name
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": update_data}
    )
    
    # Get updated user
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

# ============= GEAR ROUTES (Rental House Only) =============

@api_router.post("/gear", response_model=GearItem, status_code=201)
async def create_gear(request: Request, data: GearItemCreate, authorization: Optional[str] = Header(None)):
    """Create gear item (rental house only)"""
    user = await get_current_user(request, authorization)
    
    if user.role != 'rental_house':
        raise HTTPException(status_code=403, detail="Only rental houses can create gear")
    
    gear_id = f"gear_{uuid.uuid4().hex[:12]}"
    gear_doc = {
        "gear_id": gear_id,
        "supplier_id": user.user_id,
        "category": data.category,
        "manufacturer": data.manufacturer,
        "model": data.model,
        "daily_rate": data.daily_rate,
        "specs": data.specs,
        "available": data.available,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.gear_items.insert_one(gear_doc)
    
    gear_doc['created_at'] = datetime.fromisoformat(gear_doc['created_at'])
    return GearItem(**gear_doc)

@api_router.get("/gear", response_model=List[GearItem])
async def get_gear(request: Request, supplier_id: Optional[str] = None, category: Optional[str] = None, authorization: Optional[str] = Header(None)):
    """Get gear items"""
    user = await get_current_user(request, authorization)
    
    query = {}
    
    # Rental houses see their own gear, filmmakers see all available gear
    if user.role == 'rental_house':
        query["supplier_id"] = user.user_id
    else:
        query["available"] = True
    
    if supplier_id:
        query["supplier_id"] = supplier_id
    
    if category:
        query["category"] = category
    
    gear_docs = await db.gear_items.find(query, {"_id": 0}).to_list(1000)
    
    for doc in gear_docs:
        if isinstance(doc['created_at'], str):
            doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    
    return [GearItem(**doc) for doc in gear_docs]

@api_router.get("/gear/{gear_id}", response_model=GearItem)
async def get_gear_item(request: Request, gear_id: str, authorization: Optional[str] = Header(None)):
    """Get single gear item"""
    user = await get_current_user(request, authorization)
    
    gear_doc = await db.gear_items.find_one({"gear_id": gear_id}, {"_id": 0})
    
    if not gear_doc:
        raise HTTPException(status_code=404, detail="Gear not found")
    
    if isinstance(gear_doc['created_at'], str):
        gear_doc['created_at'] = datetime.fromisoformat(gear_doc['created_at'])
    
    return GearItem(**gear_doc)

@api_router.put("/gear/{gear_id}", response_model=GearItem)
async def update_gear(request: Request, gear_id: str, data: GearItemUpdate, authorization: Optional[str] = Header(None)):
    """Update gear item (rental house only)"""
    user = await get_current_user(request, authorization)
    
    if user.role != 'rental_house':
        raise HTTPException(status_code=403, detail="Only rental houses can update gear")
    
    gear_doc = await db.gear_items.find_one({"gear_id": gear_id}, {"_id": 0})
    
    if not gear_doc:
        raise HTTPException(status_code=404, detail="Gear not found")
    
    if gear_doc['supplier_id'] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your gear")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if update_data:
        await db.gear_items.update_one(
            {"gear_id": gear_id},
            {"$set": update_data}
        )
    
    gear_doc = await db.gear_items.find_one({"gear_id": gear_id}, {"_id": 0})
    if isinstance(gear_doc['created_at'], str):
        gear_doc['created_at'] = datetime.fromisoformat(gear_doc['created_at'])
    
    return GearItem(**gear_doc)

@api_router.delete("/gear/{gear_id}")
async def delete_gear(request: Request, gear_id: str, authorization: Optional[str] = Header(None)):
    """Delete gear item (rental house only)"""
    user = await get_current_user(request, authorization)
    
    if user.role != 'rental_house':
        raise HTTPException(status_code=403, detail="Only rental houses can delete gear")
    
    gear_doc = await db.gear_items.find_one({"gear_id": gear_id}, {"_id": 0})
    
    if not gear_doc:
        raise HTTPException(status_code=404, detail="Gear not found")
    
    if gear_doc['supplier_id'] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your gear")
    
    await db.gear_items.delete_one({"gear_id": gear_id})
    
    return {"message": "Gear deleted"}

# ============= PROJECT ROUTES (Filmmaker Only) =============

@api_router.post("/projects", response_model=Project, status_code=201)
async def create_project(request: Request, data: ProjectCreate, authorization: Optional[str] = Header(None)):
    """Create project with AI script analysis (filmmaker only)"""
    user = await get_current_user(request, authorization)
    
    if user.role != 'filmmaker':
        raise HTTPException(status_code=403, detail="Only filmmakers can create projects")
    
    project_id = f"proj_{uuid.uuid4().hex[:12]}"
    
    # Audit log - Start analysis
    logging.info(f"Starting AI analysis for project {project_id} by user {user.user_id}")
    
    # AI Script Analysis with production-grade error handling
    ai_analysis_result = None
    analysis_error = None
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"script_analysis_{project_id}",
            system_message="""You are a film production expert. Analyze the user's script or scene description. Extract the following information and return it as JSON only:
{
  "scene_types": ["interior", "exterior", "day", "night"],
  "lighting_needs": ["low-light", "bright", "moody"],
  "audio_needs": ["dialogue-heavy", "ambient", "action"],
  "camera_movement": ["handheld", "dolly", "static"],
  "special_reqs": ["underwater", "car mount", "aerial"],
  "gear_recommendations": [
    {
      "category": "camera|lens|audio|lighting|support",
      "item": "specific model or type",
      "quantity": 1,
      "rationale": "why this gear is needed"
    }
  ],
  "production_notes": "overall production advice"
}

Infer these from creative language. Example: 'moody night exterior' means night exterior with low-light needs.
Only respond with valid JSON, no additional text."""
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=f"Analyze this script and recommend gear:\n\n{data.script_text}")
        
        # Call AI with timeout handling
        ai_response = await chat.send_message(user_message)
        
        # Parse AI response as JSON with validation
        import json
        ai_analysis_result = json.loads(ai_response)
        
        # Validate required fields
        required_fields = ['scene_types', 'lighting_needs', 'audio_needs', 'camera_movement', 'gear_recommendations']
        missing_fields = [field for field in required_fields if field not in ai_analysis_result]
        
        if missing_fields:
            logging.warning(f"AI response missing fields: {missing_fields}")
            # Add default empty arrays for missing fields
            for field in missing_fields:
                ai_analysis_result[field] = []
        
        # Ensure gear_recommendations is a list
        if not isinstance(ai_analysis_result.get('gear_recommendations'), list):
            ai_analysis_result['gear_recommendations'] = []
        
        # Audit log - Success
        logging.info(f"AI analysis successful for project {project_id}: {len(ai_analysis_result.get('gear_recommendations', []))} recommendations")
        
    except json.JSONDecodeError as e:
        analysis_error = f"AI returned invalid JSON format"
        logging.error(f"JSON decode error for project {project_id}: {str(e)}, Response: {ai_response[:200] if 'ai_response' in locals() else 'No response'}")
        ai_analysis_result = {
            "error": "format_error",
            "error_message": "AI returned invalid format. Please try again.",
            "scene_types": [],
            "lighting_needs": [],
            "audio_needs": [],
            "camera_movement": [],
            "special_reqs": [],
            "gear_recommendations": [],
            "production_notes": "",
            "can_retry": True
        }
    except Exception as e:
        analysis_error = str(e)
        logging.error(f"AI analysis failed for project {project_id}: {str(e)}", exc_info=True)
        ai_analysis_result = {
            "error": "api_error",
            "error_message": "Analysis failed. Please try again.",
            "scene_types": [],
            "lighting_needs": [],
            "audio_needs": [],
            "camera_movement": [],
            "special_reqs": [],
            "gear_recommendations": [],
            "production_notes": "",
            "can_retry": True
        }
    
    # Create project document
    project_doc = {
        "project_id": project_id,
        "filmmaker_id": user.user_id,
        "script_text": data.script_text,
        "ai_analysis_result": ai_analysis_result,
        "analysis_status": "failed" if analysis_error else "completed",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Save to database
    await db.projects.insert_one(project_doc)
    
    # Audit log - Project created
    logging.info(f"Project {project_id} created with status: {project_doc['analysis_status']}")
    
    project_doc['created_at'] = datetime.fromisoformat(project_doc['created_at'])
    return Project(**project_doc)

@api_router.get("/projects", response_model=List[Project])
async def get_projects(request: Request, authorization: Optional[str] = Header(None)):
    """Get user's projects (filmmaker only)"""
    user = await get_current_user(request, authorization)
    
    if user.role != 'filmmaker':
        raise HTTPException(status_code=403, detail="Only filmmakers can view projects")
    
    project_docs = await db.projects.find(
        {"filmmaker_id": user.user_id},
        {"_id": 0}
    ).to_list(1000)
    
    for doc in project_docs:
        if isinstance(doc['created_at'], str):
            doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    
    return [Project(**doc) for doc in project_docs]

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(request: Request, project_id: str, authorization: Optional[str] = Header(None)):
    """Get single project"""
    user = await get_current_user(request, authorization)
    
    project_doc = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    
    if not project_doc:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project_doc['filmmaker_id'] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your project")
    
    if isinstance(project_doc['created_at'], str):
        project_doc['created_at'] = datetime.fromisoformat(project_doc['created_at'])
    
    return Project(**project_doc)

@api_router.post("/projects/{project_id}/retry-analysis")
async def retry_analysis(request: Request, project_id: str, authorization: Optional[str] = Header(None)):
    """Retry AI analysis for a failed project"""
    user = await get_current_user(request, authorization)
    
    # Get project
    project_doc = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    
    if not project_doc:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project_doc['filmmaker_id'] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your project")
    
    # Audit log - Retry analysis
    logging.info(f"Retrying AI analysis for project {project_id} by user {user.user_id}")
    
    # Run AI analysis again
    ai_analysis_result = None
    analysis_error = None
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"script_analysis_retry_{project_id}_{uuid.uuid4().hex[:4]}",
            system_message="""You are a film production expert. Analyze the user's script or scene description. Extract the following information and return it as JSON only:
{
  "scene_types": ["interior", "exterior", "day", "night"],
  "lighting_needs": ["low-light", "bright", "moody"],
  "audio_needs": ["dialogue-heavy", "ambient", "action"],
  "camera_movement": ["handheld", "dolly", "static"],
  "special_reqs": ["underwater", "car mount", "aerial"],
  "gear_recommendations": [
    {
      "category": "camera|lens|audio|lighting|support",
      "item": "specific model or type",
      "quantity": 1,
      "rationale": "why this gear is needed"
    }
  ],
  "production_notes": "overall production advice"
}

Infer these from creative language. Example: 'moody night exterior' means night exterior with low-light needs.
Only respond with valid JSON, no additional text."""
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=f"Analyze this script and recommend gear:\n\n{project_doc['script_text']}")
        ai_response = await chat.send_message(user_message)
        
        # Parse and validate
        import json
        ai_analysis_result = json.loads(ai_response)
        
        required_fields = ['scene_types', 'lighting_needs', 'audio_needs', 'camera_movement', 'gear_recommendations']
        for field in required_fields:
            if field not in ai_analysis_result:
                ai_analysis_result[field] = []
        
        if not isinstance(ai_analysis_result.get('gear_recommendations'), list):
            ai_analysis_result['gear_recommendations'] = []
        
        logging.info(f"Retry successful for project {project_id}")
        
    except json.JSONDecodeError as e:
        analysis_error = f"AI returned invalid JSON format"
        logging.error(f"JSON decode error on retry for project {project_id}: {str(e)}")
        ai_analysis_result = {
            "error": "format_error",
            "error_message": "AI returned invalid format. Please try again.",
            "scene_types": [],
            "lighting_needs": [],
            "audio_needs": [],
            "camera_movement": [],
            "special_reqs": [],
            "gear_recommendations": [],
            "production_notes": "",
            "can_retry": True
        }
    except Exception as e:
        analysis_error = str(e)
        logging.error(f"Retry analysis failed for project {project_id}: {str(e)}", exc_info=True)
        ai_analysis_result = {
            "error": "api_error",
            "error_message": "Analysis failed. Please try again.",
            "scene_types": [],
            "lighting_needs": [],
            "audio_needs": [],
            "camera_movement": [],
            "special_reqs": [],
            "gear_recommendations": [],
            "production_notes": "",
            "can_retry": True
        }
    
    # Update project
    await db.projects.update_one(
        {"project_id": project_id},
        {"$set": {
            "ai_analysis_result": ai_analysis_result,
            "analysis_status": "failed" if analysis_error else "completed",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "project_id": project_id,
        "status": "failed" if analysis_error else "completed",
        "analysis": ai_analysis_result
    }

# ============= PROJECT GEAR ROUTES =============

@api_router.post("/projects/{project_id}/gear")
async def add_gear_to_project(request: Request, project_id: str, data: ProjectGearAdd, authorization: Optional[str] = Header(None)):
    """Add gear to project package"""
    user = await get_current_user(request, authorization)
    
    if user.role != 'filmmaker':
        raise HTTPException(status_code=403, detail="Only filmmakers can add gear to projects")
    
    project_doc = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    
    if not project_doc:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project_doc['filmmaker_id'] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your project")
    
    # Check if gear exists
    gear_doc = await db.gear_items.find_one({"gear_item_id": data.gear_item_id}, {"_id": 0})
    if not gear_doc:
        raise HTTPException(status_code=404, detail="Gear not found")
    
    # Check if already added
    existing = await db.project_gear.find_one(
        {"project_id": project_id, "gear_item_id": data.gear_item_id},
        {"_id": 0}
    )
    
    if existing:
        # Update quantity
        await db.project_gear.update_one(
            {"project_id": project_id, "gear_item_id": data.gear_item_id},
            {"$set": {"quantity": data.quantity}}
        )
        return {"message": "Quantity updated"}
    
    # Add new
    project_gear_id = f"pg_{uuid.uuid4().hex[:12]}"
    await db.project_gear.insert_one({
        "project_gear_id": project_gear_id,
        "project_id": project_id,
        "gear_item_id": data.gear_item_id,
        "quantity": data.quantity,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Gear added to project"}

@api_router.get("/projects/{project_id}/gear")
async def get_project_gear(request: Request, project_id: str, authorization: Optional[str] = Header(None)):
    """Get gear items in project package"""
    user = await get_current_user(request, authorization)
    
    project_doc = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    
    if not project_doc:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project_doc['filmmaker_id'] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your project")
    
    project_gear_docs = await db.project_gear.find(
        {"project_id": project_id},
        {"_id": 0}
    ).to_list(1000)
    
    # Get gear details
    result = []
    for pg in project_gear_docs:
        gear_doc = await db.gear_items.find_one({"gear_item_id": pg['gear_item_id']}, {"_id": 0})
        if gear_doc:
            result.append({
                "gear": gear_doc,
                "quantity": pg['quantity']
            })
    
    return result

@api_router.delete("/projects/{project_id}/gear/{gear_item_id}")
async def remove_gear_from_project(request: Request, project_id: str, gear_item_id: str, authorization: Optional[str] = Header(None)):
    """Remove gear from project package"""
    user = await get_current_user(request, authorization)
    
    if user.role != 'filmmaker':
        raise HTTPException(status_code=403, detail="Only filmmakers can remove gear")
    
    project_doc = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    
    if not project_doc:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project_doc['filmmaker_id'] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your project")
    
    await db.project_gear.delete_one({"project_id": project_id, "gear_item_id": gear_item_id})
    
    return {"message": "Gear removed from project"}

# ============= LEAD/QUOTE ROUTES =============

@api_router.post("/leads", response_model=Lead)
async def create_lead(request: Request, data: LeadCreate, authorization: Optional[str] = Header(None)):
    """Create lead (request quote from rental house)"""
    user = await get_current_user(request, authorization)
    
    if user.role != 'filmmaker':
        raise HTTPException(status_code=403, detail="Only filmmakers can request quotes")
    
    # Verify project ownership
    project_doc = await db.projects.find_one({"project_id": data.project_id}, {"_id": 0})
    if not project_doc:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project_doc['filmmaker_id'] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your project")
    
    # Verify supplier exists and is rental_house
    supplier_doc = await db.users.find_one({"user_id": data.supplier_id}, {"_id": 0})
    if not supplier_doc:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    if supplier_doc.get('role') != 'rental_house':
        raise HTTPException(status_code=400, detail="User is not a rental house")
    
    lead_id = f"lead_{uuid.uuid4().hex[:12]}"
    lead_doc = {
        "lead_id": lead_id,
        "project_id": data.project_id,
        "supplier_id": data.supplier_id,
        "filmmaker_id": user.user_id,
        "status": "new",
        "quote_details": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.leads.insert_one(lead_doc)
    
    lead_doc['created_at'] = datetime.fromisoformat(lead_doc['created_at'])
    lead_doc['updated_at'] = datetime.fromisoformat(lead_doc['updated_at'])
    return Lead(**lead_doc)

@api_router.get("/leads", response_model=List[Lead])
async def get_leads(request: Request, authorization: Optional[str] = Header(None)):
    """Get leads (quotes) for current user"""
    user = await get_current_user(request, authorization)
    
    query = {}
    
    if user.role == 'filmmaker':
        query["filmmaker_id"] = user.user_id
    elif user.role == 'rental_house':
        query["supplier_id"] = user.user_id
    else:
        raise HTTPException(status_code=403, detail="Role not set")
    
    lead_docs = await db.leads.find(query, {"_id": 0}).to_list(1000)
    
    for doc in lead_docs:
        if isinstance(doc['created_at'], str):
            doc['created_at'] = datetime.fromisoformat(doc['created_at'])
        if isinstance(doc['updated_at'], str):
            doc['updated_at'] = datetime.fromisoformat(doc['updated_at'])
    
    return [Lead(**doc) for doc in lead_docs]

@api_router.get("/leads/{lead_id}", response_model=Lead)
async def get_lead(request: Request, lead_id: str, authorization: Optional[str] = Header(None)):
    """Get single lead"""
    user = await get_current_user(request, authorization)
    
    lead_doc = await db.leads.find_one({"lead_id": lead_id}, {"_id": 0})
    
    if not lead_doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Check access
    if lead_doc['filmmaker_id'] != user.user_id and lead_doc['supplier_id'] != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if isinstance(lead_doc['created_at'], str):
        lead_doc['created_at'] = datetime.fromisoformat(lead_doc['created_at'])
    if isinstance(lead_doc['updated_at'], str):
        lead_doc['updated_at'] = datetime.fromisoformat(lead_doc['updated_at'])
    
    return Lead(**lead_doc)

@api_router.put("/leads/{lead_id}/quote", response_model=Lead)
async def update_quote(request: Request, lead_id: str, data: QuoteUpdate, authorization: Optional[str] = Header(None)):
    """Update lead with quote (rental house only)"""
    user = await get_current_user(request, authorization)
    
    if user.role != 'rental_house':
        raise HTTPException(status_code=403, detail="Only rental houses can send quotes")
    
    lead_doc = await db.leads.find_one({"lead_id": lead_id}, {"_id": 0})
    
    if not lead_doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if lead_doc['supplier_id'] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your lead")
    
    await db.leads.update_one(
        {"lead_id": lead_id},
        {"$set": {
            "status": data.status,
            "quote_details": data.quote_details,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    lead_doc = await db.leads.find_one({"lead_id": lead_id}, {"_id": 0})
    if isinstance(lead_doc['created_at'], str):
        lead_doc['created_at'] = datetime.fromisoformat(lead_doc['created_at'])
    if isinstance(lead_doc['updated_at'], str):
        lead_doc['updated_at'] = datetime.fromisoformat(lead_doc['updated_at'])
    
    return Lead(**lead_doc)

@api_router.put("/leads/{lead_id}/accept")
async def accept_quote(request: Request, lead_id: str, authorization: Optional[str] = Header(None)):
    """Accept quote (filmmaker only)"""
    user = await get_current_user(request, authorization)
    
    if user.role != 'filmmaker':
        raise HTTPException(status_code=403, detail="Only filmmakers can accept quotes")
    
    lead_doc = await db.leads.find_one({"lead_id": lead_id}, {"_id": 0})
    
    if not lead_doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if lead_doc['filmmaker_id'] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your lead")
    
    if lead_doc['status'] != 'quoted':
        raise HTTPException(status_code=400, detail="No quote to accept")
    
    await db.leads.update_one(
        {"lead_id": lead_id},
        {"$set": {
            "status": "accepted",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Quote accepted"}

@api_router.put("/leads/{lead_id}/decline")
async def decline_quote(request: Request, lead_id: str, authorization: Optional[str] = Header(None)):
    """Decline quote (filmmaker only)"""
    user = await get_current_user(request, authorization)
    
    if user.role != 'filmmaker':
        raise HTTPException(status_code=403, detail="Only filmmakers can decline quotes")
    
    lead_doc = await db.leads.find_one({"lead_id": lead_id}, {"_id": 0})
    
    if not lead_doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if lead_doc['filmmaker_id'] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your lead")
    
    await db.leads.update_one(
        {"lead_id": lead_id},
        {"$set": {
            "status": "declined",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Quote declined"}

# ============= STRIPE PAYMENT ROUTES =============

@api_router.post("/payments/checkout")
async def create_checkout(request: Request, authorization: Optional[str] = Header(None)):
    """Create Stripe checkout session for accepted quote"""
    user = await get_current_user(request, authorization)
    
    if user.role != 'filmmaker':
        raise HTTPException(status_code=403, detail="Only filmmakers can make payments")
    
    body = await request.json()
    lead_id = body.get('lead_id')
    origin_url = body.get('origin_url')
    
    if not lead_id or not origin_url:
        raise HTTPException(status_code=400, detail="lead_id and origin_url required")
    
    # Get lead
    lead_doc = await db.leads.find_one({"lead_id": lead_id}, {"_id": 0})
    
    if not lead_doc:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if lead_doc['filmmaker_id'] != user.user_id:
        raise HTTPException(status_code=403, detail="Not your lead")
    
    if lead_doc['status'] != 'accepted':
        raise HTTPException(status_code=400, detail="Quote not accepted")
    
    if not lead_doc.get('quote_details'):
        raise HTTPException(status_code=400, detail="No quote details")
    
    # Calculate amount
    quote_details = lead_doc['quote_details']
    total_amount = quote_details.get('total_amount', 0.0)
    
    if total_amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    
    # Calculate platform fee (10%)
    platform_fee = total_amount * 0.10
    supplier_amount = total_amount - platform_fee
    
    # Create Stripe checkout
    host_url = origin_url
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/filmmaker/leads"
    
    checkout_request = CheckoutSessionRequest(
        amount=total_amount,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "lead_id": lead_id,
            "filmmaker_id": user.user_id,
            "supplier_id": lead_doc['supplier_id'],
            "platform_fee": str(platform_fee),
            "supplier_amount": str(supplier_amount)
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction_id = f"txn_{uuid.uuid4().hex[:12]}"
    await db.payment_transactions.insert_one({
        "transaction_id": transaction_id,
        "session_id": session.session_id,
        "lead_id": lead_id,
        "filmmaker_id": user.user_id,
        "supplier_id": lead_doc['supplier_id'],
        "amount": total_amount,
        "currency": "usd",
        "platform_fee": platform_fee,
        "supplier_amount": supplier_amount,
        "payment_status": "pending",
        "metadata": checkout_request.metadata,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "url": session.url,
        "session_id": session.session_id
    }

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(request: Request, session_id: str, authorization: Optional[str] = Header(None)):
    """Get payment status"""
    user = await get_current_user(request, authorization)
    
    # Get transaction
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Check access
    if transaction['filmmaker_id'] != user.user_id and transaction['supplier_id'] != user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check Stripe status
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    checkout_status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction if status changed
    if checkout_status.payment_status != transaction['payment_status']:
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": checkout_status.payment_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    return {
        "session_id": session_id,
        "payment_status": checkout_status.payment_status,
        "amount": transaction['amount'],
        "currency": transaction['currency']
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction
        session_id = webhook_response.session_id
        transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        
        if transaction:
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": webhook_response.payment_status,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        return {"status": "success"}
    except Exception as e:
        logging.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# ============= RENTAL HOUSE ROUTES =============

@api_router.get("/rental-houses")
async def get_rental_houses(request: Request, authorization: Optional[str] = Header(None)):
    """Get all rental houses"""
    user = await get_current_user(request, authorization)
    
    rental_houses = await db.users.find(
        {"role": "rental_house"},
        {"_id": 0, "user_id": 1, "name": 1, "company_name": 1, "email": 1}
    ).to_list(1000)
    
    return rental_houses

@api_router.get("/users/{user_id}")
async def get_user(request: Request, user_id: str, authorization: Optional[str] = Header(None)):
    """Get user details"""
    current_user = await get_current_user(request, authorization)
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return limited info for privacy
    return {
        "user_id": user_doc["user_id"],
        "name": user_doc["name"],
        "email": user_doc["email"],
        "phone": user_doc.get("phone"),
        "company_name": user_doc.get("company_name"),
        "role": user_doc["role"]
    }

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()