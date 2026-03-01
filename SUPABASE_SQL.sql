-- =====================================================
-- RADAR V22 / MÉTODO L.O - SQL PARA SUPABASE
-- Execute este SQL no Supabase SQL Editor
-- https://supabase.com/dashboard/project/qbsusnyqkqanhsthhgvq/sql
-- =====================================================

-- STEP 1: Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf VARCHAR(14) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    picture TEXT,
    password_hash VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 2: Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'trial',
    provider VARCHAR(50),
    provider_customer_id VARCHAR(255),
    provider_subscription_id VARCHAR(255),
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- STEP 3: Criar tabela de sessões ativas
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    device_label VARCHAR(255),
    session_token VARCHAR(255) NOT NULL UNIQUE,
    session_version INTEGER DEFAULT 1,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- STEP 4: Criar tabela de limites de uso
CREATE TABLE IF NOT EXISTS usage_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    daily_seconds_limit INTEGER DEFAULT 7200,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- STEP 5: Criar tabela de heartbeats de uso
CREATE TABLE IF NOT EXISTS usage_heartbeats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_date VARCHAR(10) NOT NULL,
    seconds INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 6: Criar tabela de feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- STEP 7: Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON active_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_heartbeats_user_day ON usage_heartbeats(user_id, day_date);

-- STEP 8: Desabilitar RLS (para simplificar - o service_key já bypassa)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits DISABLE ROW LEVEL SECURITY;
ALTER TABLE usage_heartbeats DISABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- TABELAS PARA FASE 2 (MODO AUTOMÁTICO - PREPARAÇÃO)
-- =====================================================

-- STEP 9: Criar tabela de runs diários (Fase 2)
CREATE TABLE IF NOT EXISTS daily_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_date VARCHAR(10) NOT NULL,
    source VARCHAR(20) DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- STEP 10: Criar tabela de números diários (Fase 2)
CREATE TABLE IF NOT EXISTS daily_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_run_id UUID NOT NULL REFERENCES daily_runs(id) ON DELETE CASCADE,
    seq_index INTEGER NOT NULL,
    number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 11: Criar tabela de métricas diárias (Fase 2)
CREATE TABLE IF NOT EXISTS daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_run_id UUID NOT NULL REFERENCES daily_runs(id) ON DELETE CASCADE,
    metrics_json TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(daily_run_id)
);

-- Desabilitar RLS nas tabelas de Fase 2 também
ALTER TABLE daily_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_numbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- CRIAR USUÁRIO ADMIN INICIAL
-- =====================================================

-- STEP 12: Inserir usuário admin (você pode mudar o email e CPF)
INSERT INTO users (email, name, role, is_active, cpf, password_hash)
VALUES (
    'admin@metodo-lo.com',
    'Administrador',
    'admin',
    true,
    '000.000.000-00',
    -- Senha: admin123 (hash bcrypt)
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4./AthuBGLGwVpRu'
)
ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- Criar registros relacionados para o admin
INSERT INTO subscriptions (user_id, status)
SELECT id, 'active' FROM users WHERE email = 'admin@metodo-lo.com'
ON CONFLICT (user_id) DO UPDATE SET status = 'active';

INSERT INTO usage_limits (user_id, daily_seconds_limit)
SELECT id, 86400 FROM users WHERE email = 'admin@metodo-lo.com'
ON CONFLICT (user_id) DO UPDATE SET daily_seconds_limit = 86400;

INSERT INTO feature_flags (user_id, api_enabled)
SELECT id, true FROM users WHERE email = 'admin@metodo-lo.com'
ON CONFLICT (user_id) DO UPDATE SET api_enabled = true;

-- =====================================================
-- PRONTO! Todas as tabelas foram criadas.
-- O usuário admin é: admin@metodo-lo.com / admin123
-- =====================================================
