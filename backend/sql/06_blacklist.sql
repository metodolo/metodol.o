-- =============================================================================
-- RADAR V22 + Método L.O - Tabela de Lista Negra
-- =============================================================================
-- Execute este script no SQL Editor do Supabase
-- =============================================================================

CREATE TABLE IF NOT EXISTS blacklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(10) NOT NULL CHECK (type IN ('email', 'cpf')),
    value VARCHAR(255) NOT NULL,
    reason TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(type, value)
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_blacklist_type ON blacklist(type);
CREATE INDEX IF NOT EXISTS idx_blacklist_value ON blacklist(value);

-- =============================================================================
-- FIM DO SCRIPT
-- =============================================================================
