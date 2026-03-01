# RADAR V22 + Método L.O - PRD

## Problem Statement Original
Aplicativo web completo para análise de números de roleta com gestão de banca, migrado fielmente do HTML original com autenticação, controle de sessão única e painel admin.

## Architecture
- **Frontend**: React + TailwindCSS
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL via REST API)
- **Auth**: CPF/Senha + Google OAuth (Emergent)

## User Personas
1. **Jogador Regular**: Usa o radar para analisar números e gestão de banca
2. **Admin**: Gerencia usuários, assinaturas e limites

## Core Requirements (Static)
- ✅ Login via CPF/Senha
- ✅ Login via Google OAuth
- ✅ Controle de 1 dispositivo ativo
- ✅ Controle de tempo de uso (heartbeat)
- ✅ Radar de Jogo (teclado 0-36, histórico, regiões, ocultos)
- ✅ Gestão de Banca (metas/stops, gráfico)
- ✅ Painel Admin
- ✅ Modo Automático (stub preparado)
- ✅ Estrutura de pagamentos (stub)

## What's Been Implemented (01/03/2026)
- Backend completo com Supabase REST API
- Autenticação CPF + Google OAuth
- Controle de sessão única (single device)
- Heartbeat para controle de tempo
- Frontend fiel ao HTML original
- Radar de Jogo com todas as regras originais
- Gestão de Banca com gráfico e projeções
- Painel Admin funcional
- Marca d'água de fundo

## Prioritized Backlog
### P0 (Done)
- [x] Login/Auth
- [x] Radar de Jogo
- [x] Gestão de Banca
- [x] Admin

### P1 (Next)
- [ ] Integração Mercado Pago (pagamentos reais)
- [ ] Modo Automático (conectar API externa)
- [ ] Salvar dados no Supabase (Fase 2)

### P2 (Future)
- [ ] Métricas diárias
- [ ] Histórico de sessões
- [ ] Notificações

## Next Tasks
1. Configurar Google OAuth no Emergent (se não feito)
2. Integrar pagamentos (Mercado Pago)
3. Ativar modo automático com API externa
