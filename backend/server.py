from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Depends
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import base64
import io
from PIL import Image
import aiofiles

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Upload directories
UPLOAD_DIR = ROOT_DIR / "uploads"
PROCESSED_DIR = ROOT_DIR / "processed"
UPLOAD_DIR.mkdir(exist_ok=True)
PROCESSED_DIR.mkdir(exist_ok=True)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    credits: int = 5  # Free monthly credits
    subscription: str = "free"  # free, premium
    created_at: datetime
    last_credit_reset: datetime

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class ImageRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    image_id: str
    user_id: str
    original_filename: str
    original_path: str
    processed_path: Optional[str] = None
    status: str = "pending"  # pending, processing, completed, failed
    created_at: datetime
    processed_at: Optional[datetime] = None

class ProcessingResponse(BaseModel):
    image_id: str
    status: str
    original_url: str
    processed_url: Optional[str] = None
    message: str

class UserProfile(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    credits: int
    subscription: str
    images_this_month: int = 0

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> User:
    """Get current user from session token (cookie or header)"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry with timezone awareness
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Convert datetime strings back to datetime objects
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    if isinstance(user_doc.get('last_credit_reset'), str):
        user_doc['last_credit_reset'] = datetime.fromisoformat(user_doc['last_credit_reset'])
    
    return User(**user_doc)

async def check_and_reset_monthly_credits(user: User) -> User:
    """Reset credits if a new month has started"""
    now = datetime.now(timezone.utc)
    last_reset = user.last_credit_reset
    if isinstance(last_reset, str):
        last_reset = datetime.fromisoformat(last_reset)
    if last_reset.tzinfo is None:
        last_reset = last_reset.replace(tzinfo=timezone.utc)
    
    if now.month != last_reset.month or now.year != last_reset.year:
        # Reset credits for free users
        if user.subscription == "free":
            await db.users.update_one(
                {"user_id": user.user_id},
                {"$set": {"credits": 5, "last_credit_reset": now.isoformat()}}
            )
            user.credits = 5
            user.last_credit_reset = now
    return user

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id for session_token via Emergent Auth"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client_http:
        auth_response = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    
    if auth_response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    
    user_data = auth_response.json()
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info if needed
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": user_data["name"], "picture": user_data.get("picture")}}
        )
    else:
        # Create new user with 5 free credits
        new_user = {
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "credits": 5,
            "subscription": "free",
            "created_at": now.isoformat(),
            "last_credit_reset": now.isoformat()
        }
        await db.users.insert_one(new_user)
    
    # Create session
    session_token = user_data.get("session_token", f"session_{uuid.uuid4().hex}")
    expires_at = now + timedelta(days=7)
    
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": now.isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set httpOnly cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    # Get user for response
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.get("/auth/me")
async def get_current_user_info(user: User = Depends(get_current_user)):
    """Get current authenticated user info"""
    user = await check_and_reset_monthly_credits(user)
    
    # Count images this month
    now = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    images_count = await db.images.count_documents({
        "user_id": user.user_id,
        "created_at": {"$gte": start_of_month.isoformat()}
    })
    
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "credits": user.credits if user.subscription == "free" else -1,  # -1 = unlimited
        "subscription": user.subscription,
        "images_this_month": images_count
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user and clear session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== IMAGE ENDPOINTS ====================

@api_router.post("/images/upload")
async def upload_image(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    """Upload an image for processing"""
    user = await check_and_reset_monthly_credits(user)
    
    # Check credits for free users
    if user.subscription == "free" and user.credits <= 0:
        raise HTTPException(status_code=403, detail="No credits remaining. Upgrade to premium for unlimited access.")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPEG, PNG, WebP, HEIC")
    
    # Generate unique filename
    image_id = f"img_{uuid.uuid4().hex[:12]}"
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    original_filename = f"{image_id}_original.{ext}"
    original_path = UPLOAD_DIR / original_filename
    
    # Save file
    async with aiofiles.open(original_path, "wb") as f:
        content = await file.read()
        await f.write(content)
    
    # Create image record
    now = datetime.now(timezone.utc)
    image_record = {
        "image_id": image_id,
        "user_id": user.user_id,
        "original_filename": file.filename,
        "original_path": str(original_path),
        "processed_path": None,
        "status": "pending",
        "created_at": now.isoformat(),
        "processed_at": None
    }
    await db.images.insert_one(image_record)
    
    return {
        "image_id": image_id,
        "status": "pending",
        "original_url": f"/api/images/file/{image_id}/original",
        "message": "Image uploaded successfully. Ready for processing."
    }

@api_router.post("/images/process/{image_id}")
async def process_image(image_id: str, user: User = Depends(get_current_user)):
    """Process an uploaded image (remove background + enhance)"""
    user = await check_and_reset_monthly_credits(user)
    
    # Check credits
    if user.subscription == "free" and user.credits <= 0:
        raise HTTPException(status_code=403, detail="No credits remaining")
    
    # Get image record
    image_doc = await db.images.find_one({"image_id": image_id, "user_id": user.user_id}, {"_id": 0})
    if not image_doc:
        raise HTTPException(status_code=404, detail="Image not found")
    
    if image_doc["status"] == "completed":
        return {
            "image_id": image_id,
            "status": "completed",
            "original_url": f"/api/images/file/{image_id}/original",
            "processed_url": f"/api/images/file/{image_id}/processed",
            "message": "Image already processed"
        }
    
    # Update status to processing
    await db.images.update_one({"image_id": image_id}, {"$set": {"status": "processing"}})
    
    try:
        # Load original image
        original_path = Path(image_doc["original_path"])
        
        # Remove background using rembg
        from rembg import remove
        
        with open(original_path, "rb") as f:
            input_data = f.read()
        
        # Remove background
        output_data = remove(input_data)
        
        # Create image with white background
        img_no_bg = Image.open(io.BytesIO(output_data)).convert("RGBA")
        
        # Create white background
        white_bg = Image.new("RGBA", img_no_bg.size, (255, 255, 255, 255))
        
        # Composite
        final_img = Image.alpha_composite(white_bg, img_no_bg).convert("RGB")
        
        # Enhance image (brightness, contrast, sharpness)
        from PIL import ImageEnhance
        
        # Slight contrast boost
        enhancer = ImageEnhance.Contrast(final_img)
        final_img = enhancer.enhance(1.1)
        
        # Slight sharpness boost
        enhancer = ImageEnhance.Sharpness(final_img)
        final_img = enhancer.enhance(1.2)
        
        # Slight brightness adjustment
        enhancer = ImageEnhance.Brightness(final_img)
        final_img = enhancer.enhance(1.05)
        
        # Save processed image
        processed_filename = f"{image_id}_processed.jpg"
        processed_path = PROCESSED_DIR / processed_filename
        final_img.save(processed_path, "JPEG", quality=95)
        
        # Update record
        now = datetime.now(timezone.utc)
        await db.images.update_one(
            {"image_id": image_id},
            {"$set": {
                "processed_path": str(processed_path),
                "status": "completed",
                "processed_at": now.isoformat()
            }}
        )
        
        # Deduct credit for free users
        if user.subscription == "free":
            await db.users.update_one(
                {"user_id": user.user_id},
                {"$inc": {"credits": -1}}
            )
        
        return {
            "image_id": image_id,
            "status": "completed",
            "original_url": f"/api/images/file/{image_id}/original",
            "processed_url": f"/api/images/file/{image_id}/processed",
            "message": "Image processed successfully"
        }
        
    except Exception as e:
        logger.error(f"Error processing image {image_id}: {str(e)}")
        await db.images.update_one({"image_id": image_id}, {"$set": {"status": "failed"}})
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@api_router.get("/images/file/{image_id}/{type}")
async def get_image_file(image_id: str, type: str):
    """Get image file (original or processed)"""
    image_doc = await db.images.find_one({"image_id": image_id}, {"_id": 0})
    if not image_doc:
        raise HTTPException(status_code=404, detail="Image not found")
    
    if type == "original":
        file_path = Path(image_doc["original_path"])
    elif type == "processed":
        if not image_doc.get("processed_path"):
            raise HTTPException(status_code=404, detail="Processed image not available")
        file_path = Path(image_doc["processed_path"])
    else:
        raise HTTPException(status_code=400, detail="Invalid type. Use 'original' or 'processed'")
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path, media_type="image/jpeg")

@api_router.get("/images/history")
async def get_image_history(user: User = Depends(get_current_user)):
    """Get user's image processing history"""
    images = await db.images.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Add URLs to each image
    for img in images:
        img["original_url"] = f"/api/images/file/{img['image_id']}/original"
        if img.get("processed_path"):
            img["processed_url"] = f"/api/images/file/{img['image_id']}/processed"
    
    return images

@api_router.delete("/images/{image_id}")
async def delete_image(image_id: str, user: User = Depends(get_current_user)):
    """Delete an image from history"""
    image_doc = await db.images.find_one({"image_id": image_id, "user_id": user.user_id}, {"_id": 0})
    if not image_doc:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Delete files
    if image_doc.get("original_path"):
        try:
            Path(image_doc["original_path"]).unlink(missing_ok=True)
        except:
            pass
    if image_doc.get("processed_path"):
        try:
            Path(image_doc["processed_path"]).unlink(missing_ok=True)
        except:
            pass
    
    # Delete record
    await db.images.delete_one({"image_id": image_id})
    
    return {"message": "Image deleted successfully"}

# ==================== USER/SUBSCRIPTION ENDPOINTS ====================

@api_router.get("/user/profile")
async def get_user_profile(user: User = Depends(get_current_user)):
    """Get user profile with stats"""
    user = await check_and_reset_monthly_credits(user)
    
    # Count total images
    total_images = await db.images.count_documents({"user_id": user.user_id})
    
    # Count images this month
    now = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    images_this_month = await db.images.count_documents({
        "user_id": user.user_id,
        "created_at": {"$gte": start_of_month.isoformat()}
    })
    
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "credits": user.credits if user.subscription == "free" else -1,
        "subscription": user.subscription,
        "total_images": total_images,
        "images_this_month": images_this_month
    }

@api_router.post("/user/upgrade")
async def upgrade_to_premium(user: User = Depends(get_current_user)):
    """Upgrade user to premium (mock - in production, integrate with Stripe)"""
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"subscription": "premium"}}
    )
    return {"message": "Upgraded to premium successfully", "subscription": "premium"}

@api_router.post("/user/downgrade")
async def downgrade_to_free(user: User = Depends(get_current_user)):
    """Downgrade user to free plan"""
    now = datetime.now(timezone.utc)
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"subscription": "free", "credits": 5, "last_credit_reset": now.isoformat()}}
    )
    return {"message": "Downgraded to free plan", "subscription": "free", "credits": 5}

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "VintedPro API - Photo Optimizer for Resale", "status": "healthy"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
