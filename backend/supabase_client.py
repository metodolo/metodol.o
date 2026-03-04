"""
Supabase client configuration
Uses Supabase REST API instead of direct PostgreSQL connection
"""
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_ANON_KEY', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

# Client for normal operations (with anon key)
supabase = None
# Client for admin operations (with service key)
supabase_admin = None

# Only try to create clients if credentials are provided
if SUPABASE_URL and SUPABASE_KEY and len(SUPABASE_KEY) > 50:
    try:
        from supabase import create_client, Client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"[Supabase] Connected to {SUPABASE_URL}")
    except Exception as e:
        print(f"[Supabase] Warning: Could not connect with anon key: {e}")
        supabase = None

if SUPABASE_URL and SUPABASE_SERVICE_KEY and len(SUPABASE_SERVICE_KEY) > 50:
    try:
        from supabase import create_client, Client
        supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print(f"[Supabase] Admin client connected")
    except Exception as e:
        print(f"[Supabase] Warning: Could not connect with service key: {e}")
        supabase_admin = None


def get_supabase():
    """Get Supabase client for normal operations"""
    return supabase


def get_supabase_admin():
    """Get Supabase client for admin operations (bypasses RLS)"""
    if supabase_admin:
        return supabase_admin
    return supabase


def is_supabase_configured():
    """Check if Supabase is properly configured"""
    return supabase is not None
