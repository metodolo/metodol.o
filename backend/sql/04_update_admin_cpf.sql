-- =============================================================================
-- RADAR V22 + Método L.O - Atualização do Admin e Campo de Alteração de Senha
-- =============================================================================
-- Execute este script no SQL Editor do Supabase
-- =============================================================================

-- 1. Adicionar coluna must_change_password na tabela users (se não existir)
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- 2. Atualizar o CPF do admin e marcar para trocar senha no primeiro acesso
UPDATE users 
SET 
    cpf = '154.831.997-07',
    must_change_password = true
WHERE cpf = '000.000.000-00';

-- =============================================================================
-- FIM DO SCRIPT
-- =============================================================================
