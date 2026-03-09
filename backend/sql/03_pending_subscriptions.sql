-- =============================================================================
-- RADAR V22 + Método L.O - Tabela de Pré-Cadastros de Assinaturas
-- =============================================================================
-- Execute este script no SQL Editor do Supabase para criar a tabela
-- =============================================================================

-- 9. Tabela de Assinaturas Pendentes (pré-cadastro)
CREATE TABLE IF NOT EXISTS pending_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    subscription_type VARCHAR(20) NOT NULL CHECK (subscription_type IN ('trial', 'monthly', 'yearly', 'lifetime')),
    trial_days INTEGER DEFAULT 7,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por email
CREATE INDEX IF NOT EXISTS idx_pending_subscriptions_email ON pending_subscriptions(email);

-- =============================================================================
-- FIM DO SCRIPT
-- =============================================================================
