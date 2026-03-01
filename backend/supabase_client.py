"""
Supabase client configuration
Uses Supabase REST API instead of direct PostgreSQL connection
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_ANON_KEY')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

# Client for normal operations (with anon key)
supabase: Client = None
# Client for admin operations (with service key)
supabase_admin: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_supabase() -> Client:
    """Get Supabase client for normal operations"""
    if not supabase:
        raise Exception("Supabase not configured")
    return supabase


def get_supabase_admin() -> Client:
    """Get Supabase client for admin operations (bypasses RLS)"""
    if not supabase_admin:
        # Fallback to normal client if service key not available
        return get_supabase()
    return supabase_admin
