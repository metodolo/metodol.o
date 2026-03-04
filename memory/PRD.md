# RADAR V22 + Método L.O - Product Requirements Document

## Problema Original

O usuário deseja converter um arquivo HTML contendo a lógica do "RADAR V22" e "Método L.O" em uma aplicação web moderna full-stack.

### Requisitos Originais
- **Stack**: React + Vite (frontend), FastAPI (backend), Supabase (DB)
- **Deploy**: Vercel (frontend), Railway (backend)
- **Lógica Core**: Replicar fielmente o layout, lógica e regras do HTML fornecido

---

## Status Atual

### ✅ COMPLETO
- [x] Migração de Create React App para Vite
- [x] Deploy no Vercel funcionando
- [x] Deploy no Railway funcionando
- [x] Login com Google OAuth (Emergent)
- [x] Login com CPF/Senha
- [x] Radar de Jogo - lógica completa
- [x] Gestão de Banca - controle financeiro
- [x] **Bug corrigido: Regiões múltiplas** - números que pertencem a 2+ regiões agora contam para todas
- [x] **UI aumentada** - tamanho do app maior no desktop (zoom 1.25)

### 🟡 EM PROGRESSO
- [ ] Limite de 1 dispositivo ativo por usuário (backend pronto, falta integrar frontend)
- [ ] Sistema de heartbeat para controle de tempo (backend pronto, frontend envia)
- [ ] Completar painel Admin

### 🔵 FUTURO
- [ ] Integração Mercado Pago para pagamentos
- [ ] Persistência de dados do Radar/Gestão no banco
- [ ] Modo Automático com API externa

---

## URLs de Produção

| Serviço | URL |
|---------|-----|
| Frontend (Vercel) | https://metodol-o.vercel.app |
| Backend (Railway) | https://metodolo-production-19fc.up.railway.app |

---

## Credenciais de Teste

| Campo | Valor |
|-------|-------|
| CPF | `000.000.000-00` |
| Senha | `admin123` |

---

## Arquitetura

```
frontend/                    # React + Vite
├── src/
│   ├── components/          # RadarTab, GestaoTab
│   ├── pages/               # Login, Dashboard, Admin
│   ├── engine/              # radarEngine.js (lógica)
│   └── services/            # api.js
├── vite.config.js
└── vercel.json

backend/                     # FastAPI
├── server.py                # API principal
├── supabase_client.py
├── requirements.txt
├── railway.toml
└── sql/                     # Scripts SQL
```

---

## Changelog

### 2024-03-04
- Corrigido bug: regiões múltiplas agora destacam todas com mesmo valor máximo
- Aumentado tamanho do app no desktop (zoom 1.25, container 900px)
- Corrigido domínio Railway (porta 8080)

### 2024-03-03
- Migração completa para Vite
- Deploy Vercel + Railway funcionando
- README.md completo
