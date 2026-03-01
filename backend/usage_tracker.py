"""
Usage tracking for RADAR V22 / Método L.O
Handles heartbeat and daily time limits
"""
from datetime import datetime, timezone, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from models import UsageHeartbeat, UsageLimit
import pytz
import logging

logger = logging.getLogger(__name__)

# Brazil timezone
SAO_PAULO_TZ = pytz.timezone('America/Sao_Paulo')
HEARTBEAT_INTERVAL = 30  # seconds


def get_today_date_br() -> str:
    """Get today's date in Brazil timezone"""
    now = datetime.now(SAO_PAULO_TZ)
    return now.strftime('%Y-%m-%d')


async def record_heartbeat(db: AsyncSession, user_id: str) -> dict:
    """
    Record a heartbeat for usage tracking.
    Returns current usage status.
    """
    today = get_today_date_br()
    
    # Get user's daily limit
    result = await db.execute(
        select(UsageLimit).where(UsageLimit.user_id == user_id)
    )
    limit_record = result.scalar_one_or_none()
    daily_limit = limit_record.daily_seconds_limit if limit_record else 7200  # Default 2h
    
    # Get total seconds used today
    result = await db.execute(
        select(func.sum(UsageHeartbeat.seconds)).where(
            UsageHeartbeat.user_id == user_id,
            UsageHeartbeat.day_date == today
        )
    )
    total_seconds = result.scalar() or 0
    
    # Check if limit exceeded
    if total_seconds >= daily_limit:
        return {
            "allowed": False,
            "reason": "daily_limit_exceeded",
            "seconds_used": total_seconds,
            "seconds_limit": daily_limit,
            "seconds_remaining": 0,
            "message": "Limite diário de uso atingido"
        }
    
    # Record new heartbeat
    heartbeat = UsageHeartbeat(
        user_id=user_id,
        day_date=today,
        seconds=HEARTBEAT_INTERVAL
    )
    db.add(heartbeat)
    await db.commit()
    
    new_total = total_seconds + HEARTBEAT_INTERVAL
    
    return {
        "allowed": True,
        "seconds_used": new_total,
        "seconds_limit": daily_limit,
        "seconds_remaining": max(0, daily_limit - new_total),
        "today_date": today
    }


async def get_usage_status(db: AsyncSession, user_id: str) -> dict:
    """Get current usage status without recording heartbeat"""
    today = get_today_date_br()
    
    # Get user's daily limit
    result = await db.execute(
        select(UsageLimit).where(UsageLimit.user_id == user_id)
    )
    limit_record = result.scalar_one_or_none()
    daily_limit = limit_record.daily_seconds_limit if limit_record else 7200
    
    # Get total seconds used today
    result = await db.execute(
        select(func.sum(UsageHeartbeat.seconds)).where(
            UsageHeartbeat.user_id == user_id,
            UsageHeartbeat.day_date == today
        )
    )
    total_seconds = result.scalar() or 0
    
    return {
        "seconds_used": total_seconds,
        "seconds_limit": daily_limit,
        "seconds_remaining": max(0, daily_limit - total_seconds),
        "limit_exceeded": total_seconds >= daily_limit,
        "today_date": today
    }


async def set_user_daily_limit(db: AsyncSession, user_id: str, seconds: int) -> dict:
    """Set daily usage limit for a user (admin function)"""
    result = await db.execute(
        select(UsageLimit).where(UsageLimit.user_id == user_id)
    )
    limit_record = result.scalar_one_or_none()
    
    if limit_record:
        limit_record.daily_seconds_limit = seconds
    else:
        limit_record = UsageLimit(
            user_id=user_id,
            daily_seconds_limit=seconds
        )
        db.add(limit_record)
    
    await db.commit()
    
    return {
        "user_id": user_id,
        "daily_seconds_limit": seconds,
        "hours": seconds / 3600
    }


async def get_user_usage_history(db: AsyncSession, user_id: str, days: int = 7) -> list:
    """Get usage history for last N days"""
    # This would be expanded in production to aggregate by day
    result = await db.execute(
        select(
            UsageHeartbeat.day_date,
            func.sum(UsageHeartbeat.seconds).label('total_seconds')
        ).where(
            UsageHeartbeat.user_id == user_id
        ).group_by(
            UsageHeartbeat.day_date
        ).order_by(
            UsageHeartbeat.day_date.desc()
        ).limit(days)
    )
    
    return [
        {"date": row.day_date, "seconds": row.total_seconds}
        for row in result.all()
    ]
