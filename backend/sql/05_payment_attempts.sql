-- =============================================================================
-- RADAR V22 + Método L.O - Tabela de Tentativas de Pagamento
-- =============================================================================
-- Execute este script no SQL Editor do Supabase para criar a tabela
-- =============================================================================

-- Tabela de Tentativas de Pagamento
CREATE TABLE IF NOT EXISTS payment_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL,
    external_reference VARCHAR(255) UNIQUE NOT NULL,
    preference_id VARCHAR(255),
    payment_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_payment_attempts_user_id ON payment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_external_ref ON payment_attempts(external_reference);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON payment_attempts(status);

-- =============================================================================
-- FIM DO SCRIPT
-- =============================================================================
