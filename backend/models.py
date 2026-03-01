"""
SQLAlchemy Models for RADAR V22 / Método L.O
"""
from sqlalchemy import Column, String, Boolean, Integer, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = 'users'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    cpf = Column(String(14), unique=True, nullable=True, index=True)  # CPF format: 000.000.000-00
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    picture = Column(Text, nullable=True)
    password_hash = Column(String(255), nullable=True)  # Null for Google OAuth users
    role = Column(String(20), default='user', index=True)  # 'user' or 'admin'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    subscription = relationship("Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sessions = relationship("ActiveSession", back_populates="user", cascade="all, delete-orphan")
    usage_limit = relationship("UsageLimit", back_populates="user", uselist=False, cascade="all, delete-orphan")
    heartbeats = relationship("UsageHeartbeat", back_populates="user", cascade="all, delete-orphan")
    feature_flags = relationship("FeatureFlag", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Subscription(Base):
    __tablename__ = 'subscriptions'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    status = Column(String(20), default='trial', index=True)  # trial, active, past_due, canceled
    provider = Column(String(50), nullable=True)  # mercadopago, kirvano, etc
    provider_customer_id = Column(String(255), nullable=True)
    provider_subscription_id = Column(String(255), nullable=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationship
    user = relationship("User", back_populates="subscription")


class ActiveSession(Base):
    __tablename__ = 'active_sessions'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    device_id = Column(String(255), nullable=False)
    device_label = Column(String(255), nullable=True)  # Browser info
    session_token = Column(String(255), unique=True, nullable=False, index=True)
    session_version = Column(Integer, default=1)
    last_seen_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Relationship
    user = relationship("User", back_populates="sessions")
    
    __table_args__ = (
        Index('idx_sessions_user_device', 'user_id', 'device_id'),
    )


class UsageLimit(Base):
    __tablename__ = 'usage_limits'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    daily_seconds_limit = Column(Integer, default=7200)  # Default 2 hours = 7200 seconds
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationship
    user = relationship("User", back_populates="usage_limit")


class UsageHeartbeat(Base):
    __tablename__ = 'usage_heartbeats'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    day_date = Column(String(10), nullable=False)  # Format: YYYY-MM-DD
    seconds = Column(Integer, default=30)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationship
    user = relationship("User", back_populates="heartbeats")
    
    __table_args__ = (
        Index('idx_heartbeats_user_day', 'user_id', 'day_date'),
    )


class FeatureFlag(Base):
    __tablename__ = 'feature_flags'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    api_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationship
    user = relationship("User", back_populates="feature_flags")


# Phase 2 Models (prepared but not active yet)
class DailyRun(Base):
    __tablename__ = 'daily_runs'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    day_date = Column(String(10), nullable=False)  # Format: YYYY-MM-DD
    source = Column(String(20), default='manual')  # manual or api
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    closed_at = Column(DateTime(timezone=True), nullable=True)
    
    numbers = relationship("DailyNumber", back_populates="run", cascade="all, delete-orphan")
    metrics = relationship("DailyMetric", back_populates="run", uselist=False, cascade="all, delete-orphan")


class DailyNumber(Base):
    __tablename__ = 'daily_numbers'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    daily_run_id = Column(String(36), ForeignKey('daily_runs.id', ondelete='CASCADE'), nullable=False, index=True)
    seq_index = Column(Integer, nullable=False)
    number = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    run = relationship("DailyRun", back_populates="numbers")


class DailyMetric(Base):
    __tablename__ = 'daily_metrics'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    daily_run_id = Column(String(36), ForeignKey('daily_runs.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    metrics_json = Column(Text, nullable=True)  # JSON string with metrics
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    run = relationship("DailyRun", back_populates="metrics")
