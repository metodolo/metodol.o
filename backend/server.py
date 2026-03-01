"""
RADAR V22 + Método L.O - Main Server
FastAPI backend with Supabase PostgreSQL
"""
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from contextlib import asynccontextmanager
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from database import get_db, engine, Base
from models import User, Subscription, ActiveSession, UsageLimit, UsageHeartbeat, FeatureFlag
from auth import (
    get_password_hash, verify_password, validate_cpf, format_cpf,
    get_emergent_user_data, get_current_user, require_admin
)
from session_manager import create_session, validate_session, invalidate_session, get_active_session_info
from usage_tracker import record_heartbeat, get_usage_status, set_user_daily_limit

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Lifespan for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    if engine:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created/verified")
    yield
    # Shutdown
    if engine:
        await engine.dispose()


# Create the main app
app = FastAPI(lifespan=lifespan, title="RADAR V22 API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ============== Pydantic Models ==============

class CPFLoginRequest(BaseModel):
    cpf: str
    password: str
    device_id: str
    device_label: Optional[str] = None

class CPFRegisterRequest(BaseModel):
    cpf: str
    email: EmailStr
    password: str
    name: Optional[str] = None

class GoogleAuthRequest(BaseModel):
    session_id: str
    device_id: str
    device_label: Optional[str] = None

class SessionValidateRequest(BaseModel):
    device_id: str

class HeartbeatRequest(BaseModel):
    device_id: str

class UserResponse(BaseModel):
    id: str
    cpf: Optional[str] = None
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    role: str
    is_active: bool

class SubscriptionResponse(BaseModel):
    status: str
    provider: Optional[str] = None
    current_period_end: Optional[str] = None

class UsageResponse(BaseModel):
    seconds_used: int
    seconds_limit: int
    seconds_remaining: int
    limit_exceeded: bool

class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None
    daily_seconds_limit: Optional[int] = None
    subscription_status: Optional[str] = None
    api_enabled: Optional[bool] = None

class AdminUserResponse(BaseModel):
    id: str
    cpf: Optional[str] = None
    email: str
    name: Optional[str] = None
    role: str
    is_active: bool
    subscription_status: Optional[str] = None
    daily_seconds_limit: int
    seconds_used_today: int
    api_enabled: bool
    last_activity: Optional[str] = None
    device_label: Optional[str] = None


# ============== Auth Routes ==============

@api_router.post("/auth/register")
async def register_cpf(request: CPFRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user with CPF"""
    # Validate CPF
    if not validate_cpf(request.cpf):
        raise HTTPException(status_code=400, detail="CPF inválido")
    
    formatted_cpf = format_cpf(request.cpf)
    
    # Check if CPF already exists
    result = await db.execute(select(User).where(User.cpf == formatted_cpf))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="CPF já cadastrado")
    
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Create user
    password_hash = get_password_hash(request.password)
    user = User(
        cpf=formatted_cpf,
        email=request.email,
        name=request.name,
        password_hash=password_hash,
        role='user'
    )
    db.add(user)
    await db.flush()
    
    # Create default subscription (trial)
    subscription = Subscription(user_id=user.id, status='trial')
    db.add(subscription)
    
    # Create default usage limit (2 hours)
    usage_limit = UsageLimit(user_id=user.id, daily_seconds_limit=7200)
    db.add(usage_limit)
    
    # Create feature flags
    feature_flag = FeatureFlag(user_id=user.id, api_enabled=False)
    db.add(feature_flag)
    
    await db.commit()
    
    return {"message": "Usuário criado com sucesso", "user_id": user.id}


@api_router.post("/auth/login/cpf")
async def login_cpf(request: CPFLoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """Login with CPF and password"""
    # Format and validate CPF
    cpf_clean = re.sub(r'[^0-9]', '', request.cpf)
    formatted_cpf = format_cpf(cpf_clean)
    
    # Find user by CPF
    result = await db.execute(select(User).where(User.cpf == formatted_cpf))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="CPF ou senha incorretos")
    
    if not user.password_hash:
        raise HTTPException(status_code=401, detail="Esta conta usa login via Google")
    
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="CPF ou senha incorretos")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Conta desativada")
    
    # Create session (invalidates previous sessions - single device)
    session_token = await create_session(
        db, user.id, request.device_id, request.device_label
    )
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,  # 7 days
        path="/"
    )
    
    # Get subscription status
    result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    subscription = result.scalar_one_or_none()
    
    return {
        "user": {
            "id": user.id,
            "cpf": user.cpf,
            "email": user.email,
            "name": user.name,
            "role": user.role
        },
        "subscription": {
            "status": subscription.status if subscription else "none"
        },
        "session_token": session_token
    }


@api_router.post("/auth/login/google")
async def login_google(request: GoogleAuthRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """Login with Google OAuth (via Emergent)"""
    # Get user data from Emergent
    emergent_data = await get_emergent_user_data(request.session_id)
    
    email = emergent_data.get("email")
    name = emergent_data.get("name")
    picture = emergent_data.get("picture")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email não fornecido pelo Google")
    
    # Find or create user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        # Create new user
        user = User(
            email=email,
            name=name,
            picture=picture,
            role='user'
        )
        db.add(user)
        await db.flush()
        
        # Create default records
        subscription = Subscription(user_id=user.id, status='trial')
        db.add(subscription)
        
        usage_limit = UsageLimit(user_id=user.id, daily_seconds_limit=7200)
        db.add(usage_limit)
        
        feature_flag = FeatureFlag(user_id=user.id, api_enabled=False)
        db.add(feature_flag)
        
        await db.commit()
    else:
        # Update existing user info
        user.name = name or user.name
        user.picture = picture or user.picture
        await db.commit()
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Conta desativada")
    
    # Create session
    session_token = await create_session(
        db, user.id, request.device_id, request.device_label
    )
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    # Get subscription status
    result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    subscription = result.scalar_one_or_none()
    
    return {
        "user": {
            "id": user.id,
            "cpf": user.cpf,
            "email": user.email,
            "name": user.name,
            "picture": user.picture,
            "role": user.role
        },
        "subscription": {
            "status": subscription.status if subscription else "none"
        },
        "session_token": session_token
    }


@api_router.get("/auth/me")
async def get_me(request: Request, db: AsyncSession = Depends(get_db)):
    """Get current authenticated user"""
    user = await get_current_user(request, db)
    
    # Get subscription
    result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    subscription = result.scalar_one_or_none()
    
    # Get usage
    usage = await get_usage_status(db, user.id)
    
    # Get feature flags
    result = await db.execute(select(FeatureFlag).where(FeatureFlag.user_id == user.id))
    flags = result.scalar_one_or_none()
    
    return {
        "user": {
            "id": user.id,
            "cpf": user.cpf,
            "email": user.email,
            "name": user.name,
            "picture": user.picture,
            "role": user.role
        },
        "subscription": {
            "status": subscription.status if subscription else "none",
            "current_period_end": subscription.current_period_end.isoformat() if subscription and subscription.current_period_end else None
        },
        "usage": usage,
        "features": {
            "api_enabled": flags.api_enabled if flags else False
        }
    }


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """Logout current session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await invalidate_session(db, session_token)
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logout realizado com sucesso"}


@api_router.post("/auth/validate-session")
async def validate_user_session(request: Request, body: SessionValidateRequest, db: AsyncSession = Depends(get_db)):
    """Validate current session and device"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        return {"valid": False, "reason": "no_session"}
    
    result = await validate_session(db, session_token, body.device_id)
    return result


# ============== Usage Routes ==============

@api_router.post("/usage/heartbeat")
async def send_heartbeat(request: Request, body: HeartbeatRequest, db: AsyncSession = Depends(get_db)):
    """Record usage heartbeat"""
    user = await get_current_user(request, db)
    
    # Validate session first
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    validation = await validate_session(db, session_token, body.device_id)
    if not validation.get("valid"):
        return {
            "allowed": False,
            "reason": validation.get("reason"),
            "message": validation.get("message", "Sessão inválida")
        }
    
    # Record heartbeat
    result = await record_heartbeat(db, user.id)
    return result


@api_router.get("/usage/status")
async def get_usage(request: Request, db: AsyncSession = Depends(get_db)):
    """Get current usage status"""
    user = await get_current_user(request, db)
    return await get_usage_status(db, user.id)


# ============== Admin Routes ==============

@api_router.get("/admin/users")
async def admin_list_users(request: Request, db: AsyncSession = Depends(get_db)):
    """List all users (admin only)"""
    await require_admin(request, db)
    
    from usage_tracker import get_today_date_br
    today = get_today_date_br()
    
    # Get all users with their related data
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    
    user_list = []
    for user in users:
        # Get subscription
        sub_result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
        subscription = sub_result.scalar_one_or_none()
        
        # Get usage limit
        limit_result = await db.execute(select(UsageLimit).where(UsageLimit.user_id == user.id))
        usage_limit = limit_result.scalar_one_or_none()
        
        # Get today's usage
        usage_result = await db.execute(
            select(func.sum(UsageHeartbeat.seconds)).where(
                UsageHeartbeat.user_id == user.id,
                UsageHeartbeat.day_date == today
            )
        )
        seconds_used = usage_result.scalar() or 0
        
        # Get feature flags
        flags_result = await db.execute(select(FeatureFlag).where(FeatureFlag.user_id == user.id))
        flags = flags_result.scalar_one_or_none()
        
        # Get active session
        session_result = await db.execute(select(ActiveSession).where(ActiveSession.user_id == user.id))
        active_session = session_result.scalar_one_or_none()
        
        user_list.append({
            "id": user.id,
            "cpf": user.cpf,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "is_active": user.is_active,
            "subscription_status": subscription.status if subscription else "none",
            "daily_seconds_limit": usage_limit.daily_seconds_limit if usage_limit else 7200,
            "seconds_used_today": seconds_used,
            "api_enabled": flags.api_enabled if flags else False,
            "last_activity": active_session.last_seen_at.isoformat() if active_session and active_session.last_seen_at else None,
            "device_label": active_session.device_label if active_session else None,
            "created_at": user.created_at.isoformat() if user.created_at else None
        })
    
    return {"users": user_list}


@api_router.patch("/admin/users/{user_id}")
async def admin_update_user(user_id: str, body: AdminUserUpdate, request: Request, db: AsyncSession = Depends(get_db)):
    """Update user settings (admin only)"""
    await require_admin(request, db)
    
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Update user fields
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.role is not None:
        user.role = body.role
    
    # Update subscription
    if body.subscription_status is not None:
        sub_result = await db.execute(select(Subscription).where(Subscription.user_id == user_id))
        subscription = sub_result.scalar_one_or_none()
        if subscription:
            subscription.status = body.subscription_status
        else:
            subscription = Subscription(user_id=user_id, status=body.subscription_status)
            db.add(subscription)
    
    # Update usage limit
    if body.daily_seconds_limit is not None:
        limit_result = await db.execute(select(UsageLimit).where(UsageLimit.user_id == user_id))
        usage_limit = limit_result.scalar_one_or_none()
        if usage_limit:
            usage_limit.daily_seconds_limit = body.daily_seconds_limit
        else:
            usage_limit = UsageLimit(user_id=user_id, daily_seconds_limit=body.daily_seconds_limit)
            db.add(usage_limit)
    
    # Update feature flags
    if body.api_enabled is not None:
        flags_result = await db.execute(select(FeatureFlag).where(FeatureFlag.user_id == user_id))
        flags = flags_result.scalar_one_or_none()
        if flags:
            flags.api_enabled = body.api_enabled
        else:
            flags = FeatureFlag(user_id=user_id, api_enabled=body.api_enabled)
            db.add(flags)
    
    await db.commit()
    
    return {"message": "Usuário atualizado com sucesso"}


@api_router.post("/admin/users/{user_id}/simulate-payment")
async def admin_simulate_payment(user_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Simulate payment to activate subscription (admin only)"""
    await require_admin(request, db)
    
    # Get subscription
    result = await db.execute(select(Subscription).where(Subscription.user_id == user_id))
    subscription = result.scalar_one_or_none()
    
    if not subscription:
        subscription = Subscription(user_id=user_id)
        db.add(subscription)
    
    # Activate subscription
    subscription.status = 'active'
    subscription.provider = 'simulated'
    subscription.current_period_end = datetime.now(timezone.utc) + timedelta(days=30)
    
    await db.commit()
    
    return {
        "message": "Pagamento simulado com sucesso",
        "subscription_status": "active",
        "valid_until": subscription.current_period_end.isoformat()
    }


@api_router.delete("/admin/users/{user_id}/sessions")
async def admin_invalidate_sessions(user_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Invalidate all sessions for a user (admin only)"""
    await require_admin(request, db)
    
    result = await db.execute(delete(ActiveSession).where(ActiveSession.user_id == user_id))
    await db.commit()
    
    return {"message": f"Todas as sessões invalidadas", "sessions_removed": result.rowcount}


# ============== Health Check ==============

@api_router.get("/")
async def root():
    return {"message": "RADAR V22 API", "status": "online"}


@api_router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint"""
    try:
        # Test database connection
        result = await db.execute(select(func.now()))
        db_time = result.scalar()
        return {
            "status": "healthy",
            "database": "connected",
            "server_time": datetime.now(timezone.utc).isoformat(),
            "db_time": str(db_time)
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "unhealthy", "error": str(e)}
        )


# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
