"""
Session management for RADAR V22 / Método L.O
Handles single device restriction and session validation
"""
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from models import ActiveSession, User
import secrets
import logging

logger = logging.getLogger(__name__)

SESSION_EXPIRE_DAYS = 7


async def create_session(
    db: AsyncSession,
    user_id: str,
    device_id: str,
    device_label: str = None
) -> str:
    """
    Create a new session for the user.
    This will invalidate ALL previous sessions (single device enforcement).
    """
    # Delete all existing sessions for this user (single device rule)
    await db.execute(
        delete(ActiveSession).where(ActiveSession.user_id == user_id)
    )
    
    # Create new session
    session_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_EXPIRE_DAYS)
    
    new_session = ActiveSession(
        user_id=user_id,
        device_id=device_id,
        device_label=device_label,
        session_token=session_token,
        session_version=1,
        expires_at=expires_at
    )
    
    db.add(new_session)
    await db.commit()
    
    logger.info(f"Created new session for user {user_id}, device {device_id}")
    return session_token


async def validate_session(
    db: AsyncSession,
    session_token: str,
    device_id: str
) -> dict:
    """
    Validate session and check device match.
    Returns session info or raises exception.
    """
    result = await db.execute(
        select(ActiveSession).where(ActiveSession.session_token == session_token)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        return {"valid": False, "reason": "session_not_found"}
    
    # Check expiry
    if session.expires_at.tzinfo is None:
        expires_at = session.expires_at.replace(tzinfo=timezone.utc)
    else:
        expires_at = session.expires_at
    
    if expires_at < datetime.now(timezone.utc):
        return {"valid": False, "reason": "session_expired"}
    
    # Check device match (single device enforcement)
    if session.device_id != device_id:
        return {
            "valid": False,
            "reason": "device_mismatch",
            "message": "Sua conta foi conectada em outro dispositivo"
        }
    
    # Update last seen
    session.last_seen_at = datetime.now(timezone.utc)
    await db.commit()
    
    return {"valid": True, "user_id": session.user_id, "session": session}


async def invalidate_session(db: AsyncSession, session_token: str) -> bool:
    """Invalidate a specific session (logout)"""
    result = await db.execute(
        delete(ActiveSession).where(ActiveSession.session_token == session_token)
    )
    await db.commit()
    return result.rowcount > 0


async def invalidate_all_user_sessions(db: AsyncSession, user_id: str) -> int:
    """Invalidate all sessions for a user"""
    result = await db.execute(
        delete(ActiveSession).where(ActiveSession.user_id == user_id)
    )
    await db.commit()
    return result.rowcount


async def get_active_session_info(db: AsyncSession, user_id: str) -> dict:
    """Get information about user's active session"""
    result = await db.execute(
        select(ActiveSession).where(ActiveSession.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        return None
    
    return {
        "device_id": session.device_id,
        "device_label": session.device_label,
        "last_seen_at": session.last_seen_at.isoformat() if session.last_seen_at else None,
        "created_at": session.created_at.isoformat() if session.created_at else None
    }
