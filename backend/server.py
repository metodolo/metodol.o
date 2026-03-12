"""
RADAR V22 + Método L.O - Main Server
FastAPI backend with Supabase REST API
"""
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, BackgroundTasks
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone, timedelta
import re
import secrets
import httpx
from passlib.context import CryptContext
import pytz
import resend
import mercadopago

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from supabase_client import get_supabase, get_supabase_admin, is_supabase_configured

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Brazil timezone
SAO_PAULO_TZ = pytz.timezone('America/Sao_Paulo')

# Session settings
SESSION_EXPIRE_DAYS = 7
HEARTBEAT_INTERVAL = 30

# Emergent Auth URL
EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

# Resend configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
ADMIN_EMAIL = os.environ.get('ADMIN_NOTIFICATION_EMAIL', 'lahis0319@gmail.com')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Mercado Pago configuration
MERCADO_PAGO_ACCESS_TOKEN = os.environ.get('MERCADO_PAGO_ACCESS_TOKEN')
MERCADO_PAGO_PUBLIC_KEY = os.environ.get('MERCADO_PAGO_PUBLIC_KEY')

mp_sdk = None
if MERCADO_PAGO_ACCESS_TOKEN:
    mp_sdk = mercadopago.SDK(MERCADO_PAGO_ACCESS_TOKEN)

# Subscription plans configuration (prices in BRL)
SUBSCRIPTION_PLANS = {
    "monthly": {
        "title": "Método L.O - Plano Mensal",
        "description": "Acesso completo por 30 dias",
        "price": 200.00,
        "days": 30
    },
    "annual": {
        "title": "Método L.O - Plano Anual",
        "description": "Acesso completo por 1 ano (2 meses grátis!)",
        "price": 970.00,
        "days": 365
    },
    "lifetime": {
        "title": "Método L.O - Acesso Vitalício",
        "description": "Acesso completo para sempre",
        "price": 1997.00,
        "days": 36500  # 100 years
    }
}


# ============== Helper Functions ==============

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def validate_cpf(cpf: str) -> bool:
    """Validate CPF format and checksum"""
    cpf = re.sub(r'[^0-9]', '', cpf)
    if len(cpf) != 11:
        return False
    if cpf == cpf[0] * 11:
        return False
    sum_val = sum(int(cpf[i]) * (10 - i) for i in range(9))
    digit1 = (sum_val * 10 % 11) % 10
    if digit1 != int(cpf[9]):
        return False
    sum_val = sum(int(cpf[i]) * (11 - i) for i in range(10))
    digit2 = (sum_val * 10 % 11) % 10
    if digit2 != int(cpf[10]):
        return False
    return True

def format_cpf(cpf: str) -> str:
    """Format CPF to standard format: 000.000.000-00"""
    cpf = re.sub(r'[^0-9]', '', cpf)
    if len(cpf) == 11:
        return f"{cpf[:3]}.{cpf[3:6]}.{cpf[6:9]}-{cpf[9:]}"
    return cpf

def get_today_date_br() -> str:
    """Get today's date in Brazil timezone"""
    now = datetime.now(SAO_PAULO_TZ)
    return now.strftime('%Y-%m-%d')

async def send_new_user_notification(user_email: str, user_name: str, user_cpf: str = None, auth_method: str = "CPF"):
    """Send email notification to admin when a new user registers"""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured, skipping email notification")
        return
    
    try:
        now_br = datetime.now(SAO_PAULO_TZ).strftime('%d/%m/%Y às %H:%M')
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a1a; color: #ffffff;">
            <div style="text-align: center; padding: 20px; border-bottom: 2px solid #D4AF37;">
                <h1 style="color: #D4AF37; margin: 0;">Método L.O</h1>
                <p style="color: #888; margin-top: 10px;">Novo Cadastro Realizado</p>
            </div>
            
            <div style="padding: 30px 20px;">
                <h2 style="color: #00ff95; margin-bottom: 20px;">🆕 Novo Usuário Cadastrado!</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #888;">Email:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #fff;"><strong>{user_email}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #888;">Nome:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #fff;">{user_name or 'Não informado'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #888;">CPF:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #fff;">{user_cpf or 'Login via Google'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #888;">Método de Cadastro:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #fff;">{auth_method}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #888;">Data/Hora:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #fff;">{now_br}</td>
                    </tr>
                </table>
                
                <div style="margin-top: 30px; padding: 20px; background-color: #222; border-radius: 8px; border-left: 4px solid #D4AF37;">
                    <p style="margin: 0; color: #D4AF37;"><strong>⚠️ Ação Necessária:</strong></p>
                    <p style="margin: 10px 0 0 0; color: #ccc;">
                        Acesse o Painel Admin para escolher o plano deste usuário:
                        <br>• Teste (3, 7, 14 ou 30 dias)
                        <br>• Mensal
                        <br>• Anual
                        <br>• Vitalício
                    </p>
                </div>
            </div>
            
            <div style="text-align: center; padding: 20px; border-top: 1px solid #333; color: #666; font-size: 12px;">
                <p>Este é um email automático do sistema Método L.O</p>
            </div>
        </div>
        """
        
        params = {
            "from": SENDER_EMAIL,
            "to": [ADMIN_EMAIL],
            "subject": f"🆕 Novo Cadastro - {user_email}",
            "html": html_content
        }
        
        # Run sync SDK in thread to keep FastAPI non-blocking
        email_result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email notification sent for new user: {user_email}, email_id: {email_result.get('id')}")
        
    except Exception as e:
        logger.error(f"Failed to send email notification: {str(e)}")

async def get_emergent_user_data(session_id: str) -> dict:
    """Get user data from Emergent OAuth session"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            EMERGENT_AUTH_URL,
            headers={"X-Session-ID": session_id}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Sessão OAuth inválida")
        return response.json()


def check_blacklist(sb, email: str = None, cpf: str = None) -> bool:
    """Check if email or CPF is blacklisted. Returns True if blocked."""
    try:
        if email:
            result = sb.table('blacklist').select('id').eq('type', 'email').eq('value', email.lower()).execute()
            if result.data:
                return True
        
        if cpf:
            # Clean CPF for comparison
            cpf_clean = re.sub(r'[^0-9]', '', cpf)
            result = sb.table('blacklist').select('id').eq('type', 'cpf').eq('value', cpf_clean).execute()
            if result.data:
                return True
        
        return False
    except Exception as e:
        logger.warning(f"Blacklist check error: {e}")
        return False


# ============== Auth Helpers ==============

async def get_current_user_from_request(request: Request):
    """Extract and validate current user from request"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    
    sb = get_supabase_admin()
    
    # Find session
    result = sb.table('active_sessions').select('*').eq('session_token', session_token).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Sessão inválida")
    
    session = result.data[0]
    
    # Check expiry
    expires_at = datetime.fromisoformat(session['expires_at'].replace('Z', '+00:00'))
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Sessão expirada")
    
    # Get user
    user_result = sb.table('users').select('*').eq('id', session['user_id']).execute()
    if not user_result.data:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    user = user_result.data[0]
    if not user.get('is_active', True):
        raise HTTPException(status_code=403, detail="Conta desativada")
    
    return user, session


# ============== Create App ==============

app = FastAPI(title="RADAR V22 API", version="1.0.0")
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

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class BlacklistRequest(BaseModel):
    type: str  # 'email' or 'cpf'
    value: str
    reason: Optional[str] = None

class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None
    daily_seconds_limit: Optional[int] = None
    subscription_status: Optional[str] = None
    api_enabled: Optional[bool] = None
    trial_days: Optional[int] = None

class PendingSubscriptionCreate(BaseModel):
    email: EmailStr
    subscription_type: str  # trial, monthly, yearly, lifetime
    trial_days: Optional[int] = 7
    notes: Optional[str] = None

class CreatePaymentRequest(BaseModel):
    plan_type: str  # monthly, annual, lifetime
    user_id: Optional[str] = None


# ============== Auth Routes ==============

async def apply_pending_subscription(sb, user_id: str, email: str):
    """Check and apply pending subscription for a new user"""
    pending = sb.table('pending_subscriptions').select('*').eq('email', email.lower()).execute()
    
    if not pending.data:
        # No pending subscription, create default trial
        sb.table('subscriptions').insert({
            'user_id': user_id,
            'status': 'trial'
        }).execute()
        return None
    
    pending_sub = pending.data[0]
    subscription_type = pending_sub['subscription_type']
    
    # Calculate subscription data based on type
    subscription_data = {
        'user_id': user_id,
        'provider': 'pre-registered'
    }
    
    if subscription_type == 'trial':
        days = pending_sub.get('trial_days') or 7
        subscription_data['status'] = 'trial'
        subscription_data['current_period_end'] = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
    elif subscription_type == 'monthly':
        subscription_data['status'] = 'active'
        subscription_data['current_period_end'] = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    elif subscription_type == 'yearly':
        subscription_data['status'] = 'active'
        subscription_data['current_period_end'] = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
    elif subscription_type == 'lifetime':
        subscription_data['status'] = 'active'
        subscription_data['current_period_end'] = (datetime.now(timezone.utc) + timedelta(days=36500)).isoformat()
    else:
        subscription_data['status'] = 'trial'
    
    # Create subscription
    sb.table('subscriptions').insert(subscription_data).execute()
    
    # Delete pending subscription (it's been applied)
    sb.table('pending_subscriptions').delete().eq('id', pending_sub['id']).execute()
    
    return pending_sub


@api_router.post("/auth/register")
async def register_cpf(request: CPFRegisterRequest):
    """Register a new user with CPF"""
    if not validate_cpf(request.cpf):
        raise HTTPException(status_code=400, detail="CPF inválido")
    
    formatted_cpf = format_cpf(request.cpf)
    cpf_clean = re.sub(r'[^0-9]', '', request.cpf)
    sb = get_supabase_admin()
    
    # Check blacklist
    if check_blacklist(sb, email=request.email, cpf=cpf_clean):
        raise HTTPException(status_code=403, detail="Acesso bloqueado. Entre em contato com o suporte.")
    
    # Check if CPF exists
    existing = sb.table('users').select('id').eq('cpf', formatted_cpf).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="CPF já cadastrado")
    
    # Check if email exists
    existing = sb.table('users').select('id').eq('email', request.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Create user
    password_hash = get_password_hash(request.password)
    user_data = {
        'cpf': formatted_cpf,
        'email': request.email.lower(),
        'name': request.name,
        'password_hash': password_hash,
        'role': 'user',
        'is_active': True
    }
    
    result = sb.table('users').insert(user_data).execute()
    user = result.data[0]
    
    # Apply pending subscription or create default trial
    applied_pending = await apply_pending_subscription(sb, user['id'], request.email)
    
    # Create usage limit (2 hours default)
    sb.table('usage_limits').insert({
        'user_id': user['id'],
        'daily_seconds_limit': 7200
    }).execute()
    
    # Create feature flags
    sb.table('feature_flags').insert({
        'user_id': user['id'],
        'api_enabled': False
    }).execute()
    
    # Send email notification to admin (only if no pending subscription was applied)
    if not applied_pending:
        await send_new_user_notification(
            user_email=request.email,
            user_name=request.name,
            user_cpf=formatted_cpf,
            auth_method="CPF/Senha"
        )
    
    message = "Usuário criado com sucesso"
    if applied_pending:
        message = f"Usuário criado com assinatura {applied_pending['subscription_type']} pré-configurada"
    
    return {"message": message, "user_id": user['id']}


@api_router.post("/auth/login/cpf")
async def login_cpf(request: CPFLoginRequest, response: Response):
    """Login with CPF and password"""
    cpf_clean = re.sub(r'[^0-9]', '', request.cpf)
    formatted_cpf = format_cpf(cpf_clean)
    
    sb = get_supabase_admin()
    
    # Check blacklist
    if check_blacklist(sb, cpf=cpf_clean):
        raise HTTPException(status_code=403, detail="Acesso bloqueado. Entre em contato com o suporte.")
    
    # Find user
    result = sb.table('users').select('*').eq('cpf', formatted_cpf).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="CPF ou senha incorretos")
    
    user = result.data[0]
    
    # Check blacklist by email too
    if check_blacklist(sb, email=user.get('email')):
        raise HTTPException(status_code=403, detail="Acesso bloqueado. Entre em contato com o suporte.")
    
    if not user.get('password_hash'):
        raise HTTPException(status_code=401, detail="Esta conta usa login via Google")
    
    if not verify_password(request.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="CPF ou senha incorretos")
    
    if not user.get('is_active', True):
        raise HTTPException(status_code=403, detail="Conta desativada")
    
    # Delete existing sessions (single device)
    sb.table('active_sessions').delete().eq('user_id', user['id']).execute()
    
    # Create new session
    session_token = secrets.token_urlsafe(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=SESSION_EXPIRE_DAYS)).isoformat()
    
    sb.table('active_sessions').insert({
        'user_id': user['id'],
        'device_id': request.device_id,
        'device_label': request.device_label,
        'session_token': session_token,
        'expires_at': expires_at
    }).execute()
    
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
    
    # Get subscription
    sub_result = sb.table('subscriptions').select('*').eq('user_id', user['id']).execute()
    subscription = sub_result.data[0] if sub_result.data else {'status': 'none'}
    
    return {
        "user": {
            "id": user['id'],
            "cpf": user.get('cpf'),
            "email": user['email'],
            "name": user.get('name'),
            "role": user.get('role', 'user'),
            "must_change_password": user.get('must_change_password', False)
        },
        "subscription": {"status": subscription.get('status', 'none')},
        "session_token": session_token
    }


@api_router.post("/auth/login/google")
async def login_google(request: GoogleAuthRequest, response: Response):
    """Login with Google OAuth (via Emergent)"""
    emergent_data = await get_emergent_user_data(request.session_id)
    
    email = emergent_data.get("email")
    name = emergent_data.get("name")
    picture = emergent_data.get("picture")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email não fornecido pelo Google")
    
    sb = get_supabase_admin()
    
    # Check blacklist
    if check_blacklist(sb, email=email):
        raise HTTPException(status_code=403, detail="Acesso bloqueado. Entre em contato com o suporte.")
    
    # Find or create user
    result = sb.table('users').select('*').eq('email', email.lower()).execute()
    
    applied_pending = None
    if not result.data:
        # Create new user
        user_data = {
            'email': email.lower(),
            'name': name,
            'picture': picture,
            'role': 'user',
            'is_active': True
        }
        result = sb.table('users').insert(user_data).execute()
        user = result.data[0]
        
        # Apply pending subscription or create default trial
        applied_pending = await apply_pending_subscription(sb, user['id'], email)
        
        # Create usage limit and feature flags
        sb.table('usage_limits').insert({'user_id': user['id'], 'daily_seconds_limit': 7200}).execute()
        sb.table('feature_flags').insert({'user_id': user['id'], 'api_enabled': False}).execute()
        
        # Send email notification to admin (only if no pending subscription was applied)
        if not applied_pending:
            await send_new_user_notification(
                user_email=email,
                user_name=name,
                user_cpf=None,
                auth_method="Google OAuth"
            )
    else:
        user = result.data[0]
        # Update info
        sb.table('users').update({'name': name or user.get('name'), 'picture': picture or user.get('picture')}).eq('id', user['id']).execute()
    
    if not user.get('is_active', True):
        raise HTTPException(status_code=403, detail="Conta desativada")
    
    # Delete existing sessions
    sb.table('active_sessions').delete().eq('user_id', user['id']).execute()
    
    # Create new session
    session_token = secrets.token_urlsafe(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=SESSION_EXPIRE_DAYS)).isoformat()
    
    sb.table('active_sessions').insert({
        'user_id': user['id'],
        'device_id': request.device_id,
        'device_label': request.device_label,
        'session_token': session_token,
        'expires_at': expires_at
    }).execute()
    
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
    
    # Get subscription
    sub_result = sb.table('subscriptions').select('*').eq('user_id', user['id']).execute()
    subscription = sub_result.data[0] if sub_result.data else {'status': 'none'}
    
    return {
        "user": {
            "id": user['id'],
            "cpf": user.get('cpf'),
            "email": user['email'],
            "name": user.get('name'),
            "picture": user.get('picture'),
            "role": user.get('role', 'user')
        },
        "subscription": {"status": subscription.get('status', 'none')},
        "session_token": session_token
    }


@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current authenticated user"""
    user, session = await get_current_user_from_request(request)
    sb = get_supabase_admin()
    
    # Get subscription
    sub_result = sb.table('subscriptions').select('*').eq('user_id', user['id']).execute()
    subscription = sub_result.data[0] if sub_result.data else {'status': 'none'}
    
    # Get usage limit
    limit_result = sb.table('usage_limits').select('*').eq('user_id', user['id']).execute()
    usage_limit = limit_result.data[0] if limit_result.data else {'daily_seconds_limit': 7200}
    
    # Get today's usage
    today = get_today_date_br()
    heartbeats = sb.table('usage_heartbeats').select('seconds').eq('user_id', user['id']).eq('day_date', today).execute()
    seconds_used = sum(h['seconds'] for h in heartbeats.data) if heartbeats.data else 0
    daily_limit = usage_limit.get('daily_seconds_limit', 7200)
    
    # Get feature flags
    flags_result = sb.table('feature_flags').select('*').eq('user_id', user['id']).execute()
    flags = flags_result.data[0] if flags_result.data else {'api_enabled': False}
    
    return {
        "user": {
            "id": user['id'],
            "cpf": user.get('cpf'),
            "email": user['email'],
            "name": user.get('name'),
            "picture": user.get('picture'),
            "role": user.get('role', 'user'),
            "must_change_password": user.get('must_change_password', False)
        },
        "subscription": {
            "status": subscription.get('status', 'none'),
            "current_period_end": subscription.get('current_period_end')
        },
        "usage": {
            "seconds_used": seconds_used,
            "seconds_limit": daily_limit,
            "seconds_remaining": max(0, daily_limit - seconds_used),
            "limit_exceeded": seconds_used >= daily_limit
        },
        "features": {
            "api_enabled": flags.get('api_enabled', False)
        }
    }


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout current session"""
    session_token = request.cookies.get("session_token")
    if session_token:
        sb = get_supabase_admin()
        sb.table('active_sessions').delete().eq('session_token', session_token).execute()
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logout realizado com sucesso"}


@api_router.post("/auth/change-password")
async def change_password(request: Request, body: ChangePasswordRequest):
    """Change user password"""
    user, _ = await get_current_user_from_request(request)
    
    sb = get_supabase_admin()
    
    # Verify current password
    user_data = sb.table('users').select('password_hash').eq('id', user['id']).execute()
    if not user_data.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if not verify_password(body.current_password, user_data.data[0]['password_hash']):
        raise HTTPException(status_code=401, detail="Senha atual incorreta")
    
    # Validate new password
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="A nova senha deve ter pelo menos 6 caracteres")
    
    if body.current_password == body.new_password:
        raise HTTPException(status_code=400, detail="A nova senha deve ser diferente da atual")
    
    # Update password and remove must_change_password flag
    new_hash = get_password_hash(body.new_password)
    sb.table('users').update({
        'password_hash': new_hash,
        'must_change_password': False
    }).eq('id', user['id']).execute()
    
    return {"message": "Senha alterada com sucesso"}


@api_router.post("/auth/validate-session")
async def validate_user_session(request: Request, body: SessionValidateRequest):
    """Validate current session and device"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        return {"valid": False, "reason": "no_session"}
    
    sb = get_supabase_admin()
    result = sb.table('active_sessions').select('*').eq('session_token', session_token).execute()
    
    if not result.data:
        return {"valid": False, "reason": "session_not_found"}
    
    session = result.data[0]
    
    # Check expiry
    expires_at = datetime.fromisoformat(session['expires_at'].replace('Z', '+00:00'))
    if expires_at < datetime.now(timezone.utc):
        return {"valid": False, "reason": "session_expired"}
    
    # Check device
    if session['device_id'] != body.device_id:
        return {
            "valid": False,
            "reason": "device_mismatch",
            "message": "Sua conta foi conectada em outro dispositivo"
        }
    
    # Update last seen
    sb.table('active_sessions').update({'last_seen_at': datetime.now(timezone.utc).isoformat()}).eq('id', session['id']).execute()
    
    return {"valid": True, "user_id": session['user_id']}


# ============== Usage Routes ==============

@api_router.post("/usage/heartbeat")
async def send_heartbeat(request: Request, body: HeartbeatRequest):
    """Record usage heartbeat"""
    user, session = await get_current_user_from_request(request)
    
    # Check device match
    if session['device_id'] != body.device_id:
        return {
            "allowed": False,
            "reason": "device_mismatch",
            "message": "Sua conta foi conectada em outro dispositivo"
        }
    
    sb = get_supabase_admin()
    today = get_today_date_br()
    
    # Get usage limit
    limit_result = sb.table('usage_limits').select('*').eq('user_id', user['id']).execute()
    daily_limit = limit_result.data[0]['daily_seconds_limit'] if limit_result.data else 7200
    
    # Get today's usage
    heartbeats = sb.table('usage_heartbeats').select('seconds').eq('user_id', user['id']).eq('day_date', today).execute()
    total_seconds = sum(h['seconds'] for h in heartbeats.data) if heartbeats.data else 0
    
    # Check limit
    if total_seconds >= daily_limit:
        return {
            "allowed": False,
            "reason": "daily_limit_exceeded",
            "seconds_used": total_seconds,
            "seconds_limit": daily_limit,
            "seconds_remaining": 0,
            "message": "Limite diário de uso atingido"
        }
    
    # Record heartbeat
    sb.table('usage_heartbeats').insert({
        'user_id': user['id'],
        'day_date': today,
        'seconds': HEARTBEAT_INTERVAL
    }).execute()
    
    new_total = total_seconds + HEARTBEAT_INTERVAL
    
    return {
        "allowed": True,
        "seconds_used": new_total,
        "seconds_limit": daily_limit,
        "seconds_remaining": max(0, daily_limit - new_total)
    }


@api_router.get("/usage/status")
async def get_usage(request: Request):
    """Get current usage status"""
    user, _ = await get_current_user_from_request(request)
    sb = get_supabase_admin()
    today = get_today_date_br()
    
    limit_result = sb.table('usage_limits').select('*').eq('user_id', user['id']).execute()
    daily_limit = limit_result.data[0]['daily_seconds_limit'] if limit_result.data else 7200
    
    heartbeats = sb.table('usage_heartbeats').select('seconds').eq('user_id', user['id']).eq('day_date', today).execute()
    total_seconds = sum(h['seconds'] for h in heartbeats.data) if heartbeats.data else 0
    
    return {
        "seconds_used": total_seconds,
        "seconds_limit": daily_limit,
        "seconds_remaining": max(0, daily_limit - total_seconds),
        "limit_exceeded": total_seconds >= daily_limit
    }


# ============== Admin Routes ==============

@api_router.get("/admin/users")
async def admin_list_users(request: Request):
    """List all users (admin only)"""
    user, _ = await get_current_user_from_request(request)
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    sb = get_supabase_admin()
    today = get_today_date_br()
    
    users_result = sb.table('users').select('*').order('created_at', desc=True).execute()
    
    user_list = []
    for u in users_result.data:
        # Get subscription
        sub_result = sb.table('subscriptions').select('*').eq('user_id', u['id']).execute()
        sub = sub_result.data[0] if sub_result.data else None
        sub_status = sub['status'] if sub else 'none'
        
        # Get usage limit
        limit = sb.table('usage_limits').select('daily_seconds_limit').eq('user_id', u['id']).execute()
        daily_limit = limit.data[0]['daily_seconds_limit'] if limit.data else 7200
        
        # Get today's usage
        heartbeats = sb.table('usage_heartbeats').select('seconds').eq('user_id', u['id']).eq('day_date', today).execute()
        seconds_used = sum(h['seconds'] for h in heartbeats.data) if heartbeats.data else 0
        
        # Get feature flags
        flags = sb.table('feature_flags').select('api_enabled').eq('user_id', u['id']).execute()
        api_enabled = flags.data[0]['api_enabled'] if flags.data else False
        
        # Get active session
        session = sb.table('active_sessions').select('*').eq('user_id', u['id']).execute()
        active_session = session.data[0] if session.data else None
        
        user_list.append({
            "id": u['id'],
            "cpf": u.get('cpf'),
            "email": u['email'],
            "name": u.get('name'),
            "role": u.get('role', 'user'),
            "is_active": u.get('is_active', True),
            "subscription_status": sub_status,
            "subscription_end": sub.get('current_period_end') if sub else None,
            "daily_seconds_limit": daily_limit,
            "seconds_used_today": seconds_used,
            "api_enabled": api_enabled,
            "last_activity": active_session['last_seen_at'] if active_session else None,
            "device_label": active_session['device_label'] if active_session else None,
            "created_at": u.get('created_at')
        })
    
    return {"users": user_list}


@api_router.patch("/admin/users/{user_id}")
async def admin_update_user(user_id: str, body: AdminUserUpdate, request: Request):
    """Update user settings (admin only)"""
    user, _ = await get_current_user_from_request(request)
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    sb = get_supabase_admin()
    
    # Update user
    user_updates = {}
    if body.is_active is not None:
        user_updates['is_active'] = body.is_active
    if body.role is not None:
        user_updates['role'] = body.role
    
    if user_updates:
        sb.table('users').update(user_updates).eq('id', user_id).execute()
    
    # Update subscription
    if body.subscription_status is not None:
        subscription_data = {'status': body.subscription_status}
        
        # Calculate period end based on subscription type
        if body.subscription_status == 'trial':
            days = body.trial_days or 7  # Default 7 days trial
            subscription_data['current_period_end'] = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
            subscription_data['provider'] = 'trial'
        elif body.subscription_status == 'monthly':
            subscription_data['current_period_end'] = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
            subscription_data['provider'] = 'admin'
            subscription_data['status'] = 'active'
        elif body.subscription_status == 'yearly':
            subscription_data['current_period_end'] = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
            subscription_data['provider'] = 'admin'
            subscription_data['status'] = 'active'
        elif body.subscription_status == 'lifetime':
            subscription_data['current_period_end'] = (datetime.now(timezone.utc) + timedelta(days=36500)).isoformat()  # 100 years
            subscription_data['provider'] = 'lifetime'
            subscription_data['status'] = 'active'
        elif body.subscription_status == 'none':
            subscription_data['current_period_end'] = None
            subscription_data['provider'] = None
        
        existing = sb.table('subscriptions').select('id').eq('user_id', user_id).execute()
        if existing.data:
            sb.table('subscriptions').update(subscription_data).eq('user_id', user_id).execute()
        else:
            subscription_data['user_id'] = user_id
            sb.table('subscriptions').insert(subscription_data).execute()
    
    # Update usage limit
    if body.daily_seconds_limit is not None:
        existing = sb.table('usage_limits').select('id').eq('user_id', user_id).execute()
        if existing.data:
            sb.table('usage_limits').update({'daily_seconds_limit': body.daily_seconds_limit}).eq('user_id', user_id).execute()
        else:
            sb.table('usage_limits').insert({'user_id': user_id, 'daily_seconds_limit': body.daily_seconds_limit}).execute()
    
    # Update feature flags
    if body.api_enabled is not None:
        existing = sb.table('feature_flags').select('id').eq('user_id', user_id).execute()
        if existing.data:
            sb.table('feature_flags').update({'api_enabled': body.api_enabled}).eq('user_id', user_id).execute()
        else:
            sb.table('feature_flags').insert({'user_id': user_id, 'api_enabled': body.api_enabled}).execute()
    
    return {"message": "Usuário atualizado com sucesso"}


@api_router.post("/admin/users/{user_id}/simulate-payment")
async def admin_simulate_payment(user_id: str, request: Request):
    """Simulate payment to activate subscription (admin only)"""
    user, _ = await get_current_user_from_request(request)
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    sb = get_supabase_admin()
    period_end = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    
    existing = sb.table('subscriptions').select('id').eq('user_id', user_id).execute()
    if existing.data:
        sb.table('subscriptions').update({
            'status': 'active',
            'provider': 'simulated',
            'current_period_end': period_end
        }).eq('user_id', user_id).execute()
    else:
        sb.table('subscriptions').insert({
            'user_id': user_id,
            'status': 'active',
            'provider': 'simulated',
            'current_period_end': period_end
        }).execute()
    
    return {"message": "Pagamento simulado com sucesso", "valid_until": period_end}


@api_router.delete("/admin/users/{user_id}/sessions")
async def admin_invalidate_sessions(user_id: str, request: Request):
    """Invalidate all sessions for a user (admin only)"""
    user, _ = await get_current_user_from_request(request)
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    sb = get_supabase_admin()
    sb.table('active_sessions').delete().eq('user_id', user_id).execute()
    
    return {"message": "Sessões invalidadas"}


# ============== Pending Subscriptions Routes ==============

@api_router.get("/admin/pending-subscriptions")
async def admin_list_pending_subscriptions(request: Request):
    """List all pending subscriptions (admin only)"""
    user, _ = await get_current_user_from_request(request)
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    sb = get_supabase_admin()
    try:
        result = sb.table('pending_subscriptions').select('*').order('created_at', desc=True).execute()
        return {"pending_subscriptions": result.data or []}
    except Exception as e:
        if 'PGRST205' in str(e) or 'pending_subscriptions' in str(e):
            raise HTTPException(
                status_code=503, 
                detail="Tabela de pré-cadastros não encontrada. Execute o script SQL: /app/backend/sql/03_pending_subscriptions.sql no Supabase."
            )
        raise


@api_router.post("/admin/pending-subscriptions")
async def admin_create_pending_subscription(body: PendingSubscriptionCreate, request: Request):
    """Create a pending subscription for a future user (admin only)"""
    user, _ = await get_current_user_from_request(request)
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    sb = get_supabase_admin()
    
    try:
        # Check if email already has a pending subscription
        existing_pending = sb.table('pending_subscriptions').select('id').eq('email', body.email.lower()).execute()
        if existing_pending.data:
            raise HTTPException(status_code=400, detail="Este email já tem uma assinatura pendente configurada")
        
        # Check if user already exists
        existing_user = sb.table('users').select('id').eq('email', body.email.lower()).execute()
        if existing_user.data:
            raise HTTPException(status_code=400, detail="Este email já está cadastrado no sistema. Use o painel de usuários para gerenciar.")
        
        # Create pending subscription
        pending_data = {
            'email': body.email.lower(),
            'subscription_type': body.subscription_type,
            'trial_days': body.trial_days if body.subscription_type == 'trial' else None,
            'notes': body.notes,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'created_by': user['id']
        }
        
        result = sb.table('pending_subscriptions').insert(pending_data).execute()
        
        return {"message": "Pré-cadastro criado com sucesso", "pending_subscription": result.data[0] if result.data else None}
    except HTTPException:
        raise
    except Exception as e:
        if 'PGRST205' in str(e) or 'pending_subscriptions' in str(e):
            raise HTTPException(
                status_code=503, 
                detail="Tabela de pré-cadastros não encontrada. Execute o script SQL: /app/backend/sql/03_pending_subscriptions.sql no Supabase."
            )
        raise


@api_router.delete("/admin/pending-subscriptions/{pending_id}")
async def admin_delete_pending_subscription(pending_id: str, request: Request):
    """Delete a pending subscription (admin only)"""
    user, _ = await get_current_user_from_request(request)
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    sb = get_supabase_admin()
    sb.table('pending_subscriptions').delete().eq('id', pending_id).execute()
    
    return {"message": "Pré-cadastro removido"}


# ============== Blacklist Routes ==============

@api_router.get("/admin/blacklist")
async def admin_list_blacklist(request: Request):
    """List all blacklisted emails and CPFs (admin only)"""
    user, _ = await get_current_user_from_request(request)
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    sb = get_supabase_admin()
    try:
        result = sb.table('blacklist').select('*').order('created_at', desc=True).execute()
        return {"blacklist": result.data or []}
    except Exception as e:
        if 'PGRST205' in str(e):
            return {"blacklist": [], "message": "Tabela não existe. Execute o SQL 06_blacklist.sql"}
        raise


@api_router.post("/admin/blacklist")
async def admin_add_to_blacklist(body: BlacklistRequest, request: Request):
    """Add email or CPF to blacklist (admin only)"""
    user, _ = await get_current_user_from_request(request)
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    if body.type not in ['email', 'cpf']:
        raise HTTPException(status_code=400, detail="Tipo deve ser 'email' ou 'cpf'")
    
    # Clean value
    value = body.value.lower().strip() if body.type == 'email' else re.sub(r'[^0-9]', '', body.value)
    
    if not value:
        raise HTTPException(status_code=400, detail="Valor inválido")
    
    sb = get_supabase_admin()
    
    try:
        # Check if already exists
        existing = sb.table('blacklist').select('id').eq('type', body.type).eq('value', value).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Este valor já está na lista negra")
        
        # Add to blacklist
        result = sb.table('blacklist').insert({
            'type': body.type,
            'value': value,
            'reason': body.reason,
            'created_by': user['id'],
            'created_at': datetime.now(timezone.utc).isoformat()
        }).execute()
        
        # If it's an email, also deactivate and remove sessions of existing user
        if body.type == 'email':
            user_result = sb.table('users').select('id').eq('email', value).execute()
            if user_result.data:
                user_id = user_result.data[0]['id']
                sb.table('users').update({'is_active': False}).eq('id', user_id).execute()
                sb.table('active_sessions').delete().eq('user_id', user_id).execute()
        
        # If it's a CPF, also deactivate and remove sessions of existing user
        if body.type == 'cpf':
            # Try to find user with this CPF (formatted)
            formatted_cpf = f"{value[:3]}.{value[3:6]}.{value[6:9]}-{value[9:]}" if len(value) == 11 else value
            user_result = sb.table('users').select('id').eq('cpf', formatted_cpf).execute()
            if user_result.data:
                user_id = user_result.data[0]['id']
                sb.table('users').update({'is_active': False}).eq('id', user_id).execute()
                sb.table('active_sessions').delete().eq('user_id', user_id).execute()
        
        return {"message": f"{body.type.upper()} adicionado à lista negra", "blacklist_entry": result.data[0] if result.data else None}
    
    except HTTPException:
        raise
    except Exception as e:
        if 'PGRST205' in str(e):
            raise HTTPException(status_code=503, detail="Tabela blacklist não existe. Execute o SQL 06_blacklist.sql")
        raise


@api_router.delete("/admin/blacklist/{blacklist_id}")
async def admin_remove_from_blacklist(blacklist_id: str, request: Request):
    """Remove entry from blacklist (admin only)"""
    user, _ = await get_current_user_from_request(request)
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    sb = get_supabase_admin()
    sb.table('blacklist').delete().eq('id', blacklist_id).execute()
    
    return {"message": "Removido da lista negra"}


# ============== Payment Routes (Mercado Pago) ==============

@api_router.get("/payments/plans")
async def get_payment_plans():
    """Get available subscription plans"""
    return {
        "plans": [
            {
                "id": "monthly",
                "name": SUBSCRIPTION_PLANS["monthly"]["title"],
                "description": SUBSCRIPTION_PLANS["monthly"]["description"],
                "price": SUBSCRIPTION_PLANS["monthly"]["price"],
                "price_formatted": f"R$ {SUBSCRIPTION_PLANS['monthly']['price']:.2f}".replace('.', ',')
            },
            {
                "id": "annual",
                "name": SUBSCRIPTION_PLANS["annual"]["title"],
                "description": SUBSCRIPTION_PLANS["annual"]["description"],
                "price": SUBSCRIPTION_PLANS["annual"]["price"],
                "price_formatted": f"R$ {SUBSCRIPTION_PLANS['annual']['price']:.2f}".replace('.', ',')
            },
            {
                "id": "lifetime",
                "name": SUBSCRIPTION_PLANS["lifetime"]["title"],
                "description": SUBSCRIPTION_PLANS["lifetime"]["description"],
                "price": SUBSCRIPTION_PLANS["lifetime"]["price"],
                "price_formatted": f"R$ {SUBSCRIPTION_PLANS['lifetime']['price']:.2f}".replace('.', ',')
            }
        ],
        "public_key": MERCADO_PAGO_PUBLIC_KEY
    }


@api_router.post("/payments/create-preference")
async def create_payment_preference(body: CreatePaymentRequest, request: Request):
    """Create a Mercado Pago payment preference"""
    if not mp_sdk:
        raise HTTPException(status_code=503, detail="Mercado Pago não configurado")
    
    user, _ = await get_current_user_from_request(request)
    
    plan = SUBSCRIPTION_PLANS.get(body.plan_type)
    if not plan:
        raise HTTPException(status_code=400, detail="Plano inválido")
    
    # Create unique reference for this payment
    external_reference = f"{user['id']}_{body.plan_type}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    
    # Base URL for redirects (will be updated for production)
    base_url = os.environ.get('FRONTEND_URL', 'https://metodol-o.vercel.app')
    
    preference_data = {
        "items": [
            {
                "title": plan["title"],
                "description": plan["description"],
                "quantity": 1,
                "currency_id": "BRL",
                "unit_price": plan["price"]
            }
        ],
        "payer": {
            "email": user.get('email', '')
        },
        "payment_methods": {
            "excluded_payment_types": [],
            "excluded_payment_methods": [],
            "installments": 12
        },
        "external_reference": external_reference,
        "back_urls": {
            "success": f"{base_url}/pagamento/sucesso",
            "failure": f"{base_url}/pagamento/erro",
            "pending": f"{base_url}/pagamento/pendente"
        },
        "auto_return": "approved",
        "notification_url": f"{os.environ.get('BACKEND_URL', 'https://radar-management.preview.emergentagent.com')}/api/payments/webhook",
        "statement_descriptor": "METODO LO",
        "metadata": {
            "user_id": user['id'],
            "plan_type": body.plan_type,
            "user_email": user.get('email', '')
        }
    }
    
    try:
        result = mp_sdk.preference().create(preference_data)
        
        if result["status"] == 201:
            response_data = result["response"]
            
            # Try to save payment attempt to database (non-blocking)
            try:
                sb = get_supabase_admin()
                sb.table('payment_attempts').insert({
                    'user_id': user['id'],
                    'plan_type': body.plan_type,
                    'external_reference': external_reference,
                    'preference_id': response_data['id'],
                    'amount': plan["price"],
                    'status': 'pending',
                    'created_at': datetime.now(timezone.utc).isoformat()
                }).execute()
            except Exception as db_error:
                logger.warning(f"Could not save payment attempt: {db_error}")
            
            return {
                "preference_id": response_data["id"],
                "init_point": response_data["init_point"],
                "sandbox_init_point": response_data.get("sandbox_init_point"),
                "external_reference": external_reference
            }
        else:
            logger.error(f"Mercado Pago error: {result}")
            raise HTTPException(status_code=400, detail="Erro ao criar preferência de pagamento")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment preference error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@api_router.post("/payments/webhook")
async def handle_payment_webhook(request: Request, background_tasks: BackgroundTasks):
    """Handle Mercado Pago payment webhooks"""
    try:
        body = await request.json()
        logger.info(f"Webhook received: {body}")
        
        # Only process payment notifications
        if body.get("type") != "payment":
            return JSONResponse(status_code=200, content={"status": "ignored"})
        
        payment_id = body.get("data", {}).get("id")
        if not payment_id:
            return JSONResponse(status_code=200, content={"status": "no_payment_id"})
        
        # Verify payment with Mercado Pago
        if not mp_sdk:
            return JSONResponse(status_code=200, content={"status": "mp_not_configured"})
        
        payment_result = mp_sdk.payment().get(payment_id)
        
        if payment_result["status"] != 200:
            logger.error(f"Failed to get payment info: {payment_result}")
            return JSONResponse(status_code=200, content={"status": "payment_fetch_failed"})
        
        payment = payment_result["response"]
        external_reference = payment.get("external_reference", "")
        payment_status = payment.get("status")
        
        logger.info(f"Payment {payment_id} status: {payment_status}, ref: {external_reference}")
        
        # Process approved payments
        if payment_status == "approved":
            background_tasks.add_task(
                process_approved_payment,
                external_reference,
                payment_id,
                payment.get("transaction_amount"),
                payment.get("metadata", {})
            )
        
        return JSONResponse(status_code=200, content={"status": "received"})
    
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return JSONResponse(status_code=200, content={"status": "error"})


async def process_approved_payment(external_reference: str, payment_id: str, amount: float, metadata: dict):
    """Process an approved payment and activate subscription"""
    try:
        # Parse external reference: user_id_plan_type_timestamp
        parts = external_reference.split("_")
        if len(parts) < 2:
            logger.error(f"Invalid external reference: {external_reference}")
            return
        
        user_id = parts[0]
        plan_type = parts[1]
        
        plan = SUBSCRIPTION_PLANS.get(plan_type)
        if not plan:
            logger.error(f"Invalid plan type in reference: {plan_type}")
            return
        
        sb = get_supabase_admin()
        
        # Calculate subscription end date
        days = plan["days"]
        end_date = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
        
        # Update subscription
        sb.table('subscriptions').upsert({
            'user_id': user_id,
            'status': 'active',
            'provider': 'mercadopago',
            'provider_subscription_id': str(payment_id),
            'current_period_end': end_date,
            'updated_at': datetime.now(timezone.utc).isoformat()
        }, on_conflict='user_id').execute()
        
        # Update payment attempt status
        sb.table('payment_attempts').update({
            'status': 'approved',
            'payment_id': str(payment_id),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }).eq('external_reference', external_reference).execute()
        
        logger.info(f"Subscription activated for user {user_id}, plan {plan_type}")
        
        # Send confirmation email to admin
        user_result = sb.table('users').select('email, name').eq('id', user_id).execute()
        if user_result.data and RESEND_API_KEY:
            user_data = user_result.data[0]
            await send_payment_notification(user_data.get('email'), user_data.get('name'), plan_type, amount)
    
    except Exception as e:
        logger.error(f"Error processing approved payment: {str(e)}")


async def send_payment_notification(user_email: str, user_name: str, plan_type: str, amount: float):
    """Send payment confirmation email to admin"""
    if not RESEND_API_KEY:
        return
    
    try:
        plan = SUBSCRIPTION_PLANS.get(plan_type, {})
        now_br = datetime.now(SAO_PAULO_TZ).strftime('%d/%m/%Y às %H:%M')
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a1a; color: #ffffff;">
            <div style="text-align: center; padding: 20px; border-bottom: 2px solid #D4AF37;">
                <h1 style="color: #D4AF37; margin: 0;">Método L.O</h1>
                <p style="color: #888; margin-top: 10px;">💰 Pagamento Confirmado!</p>
            </div>
            
            <div style="padding: 30px 20px;">
                <h2 style="color: #00ff95; margin-bottom: 20px;">✅ Novo Pagamento Recebido!</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #888;">Cliente:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #fff;"><strong>{user_email}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #888;">Nome:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #fff;">{user_name or 'Não informado'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #888;">Plano:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #fff;">{plan.get('title', plan_type)}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #888;">Valor:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #00ff95; font-weight: bold;">R$ {amount:.2f}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #888;">Data/Hora:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #333; color: #fff;">{now_br}</td>
                    </tr>
                </table>
            </div>
            
            <div style="text-align: center; padding: 20px; border-top: 1px solid #333; color: #666; font-size: 12px;">
                <p>Este é um email automático do sistema Método L.O</p>
            </div>
        </div>
        """
        
        params = {
            "from": SENDER_EMAIL,
            "to": [ADMIN_EMAIL],
            "subject": f"💰 Pagamento Confirmado - R$ {amount:.2f} - {user_email}",
            "html": html_content
        }
        
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Payment notification email sent for {user_email}")
        
    except Exception as e:
        logger.error(f"Failed to send payment notification: {str(e)}")


@api_router.get("/payments/status/{external_reference}")
async def check_payment_status(external_reference: str, request: Request):
    """Check payment status by external reference"""
    user, _ = await get_current_user_from_request(request)
    
    sb = get_supabase_admin()
    result = sb.table('payment_attempts').select('*').eq('external_reference', external_reference).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    payment = result.data[0]
    
    # Verify user owns this payment
    if payment['user_id'] != user['id'] and user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    return {
        "status": payment.get('status'),
        "plan_type": payment.get('plan_type'),
        "amount": payment.get('amount'),
        "created_at": payment.get('created_at')
    }


# ============== Health Check ==============

@api_router.get("/")
async def root():
    return {"message": "RADAR V22 API", "status": "online"}


@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        sb = get_supabase_admin()
        if sb:
            # Simple query to test connection
            sb.table('users').select('id').limit(1).execute()
            return {
                "status": "healthy",
                "database": "connected",
                "server_time": datetime.now(timezone.utc).isoformat()
            }
        else:
            return {
                "status": "healthy",
                "database": "not_configured",
                "server_time": datetime.now(timezone.utc).isoformat()
            }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "unhealthy", "error": str(e)}
        )


# Include the router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
