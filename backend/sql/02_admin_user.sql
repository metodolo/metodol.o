-- =============================================================================
-- RADAR V22 + Método L.O - Criar Usuário Admin
-- =============================================================================
-- Execute este script APÓS o 01_schema.sql
-- =============================================================================

-- Inserir usuário admin padrão
-- CPF: 000.000.000-00
-- Senha: admin123
-- (Hash gerado com bcrypt)

INSERT INTO users (cpf, email, name, password_hash, role, is_active)
VALUES (
    '000.000.000-00',
    'admin@metodolo.com.br',
    'Administrador',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.lX7q9WoZ5L5qyy',  -- senha: admin123
    'admin',
    true
)
ON CONFLICT (cpf) DO NOTHING;

-- Criar subscription para o admin
INSERT INTO subscriptions (user_id, status, provider)
SELECT id, 'active', 'manual'
FROM users
WHERE cpf = '000.000.000-00'
ON CONFLICT (user_id) DO NOTHING;

-- Criar usage_limits para o admin (24h = ilimitado na prática)
INSERT INTO usage_limits (user_id, daily_seconds_limit)
SELECT id, 86400
FROM users
WHERE cpf = '000.000.000-00'
ON CONFLICT (user_id) DO NOTHING;

-- Criar feature_flags para o admin
INSERT INTO feature_flags (user_id, api_enabled)
SELECT id, true
FROM users
WHERE cpf = '000.000.000-00'
ON CONFLICT (user_id) DO NOTHING;

-- =============================================================================
-- Verificar criação
-- =============================================================================
SELECT 
    u.id,
    u.cpf,
    u.email,
    u.name,
    u.role,
    s.status as subscription_status,
    ul.daily_seconds_limit,
    ff.api_enabled
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id
LEFT JOIN usage_limits ul ON ul.user_id = u.id
LEFT JOIN feature_flags ff ON ff.user_id = u.id
WHERE u.cpf = '000.000.000-00';
