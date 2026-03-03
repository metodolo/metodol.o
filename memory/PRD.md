# RADAR V22 + Método L.O - Product Requirements Document

## Problema Original

O usuário deseja converter um arquivo HTML contendo a lógica do "RADAR V22" e "Método L.O" em uma aplicação web moderna full-stack.

### Requisitos Originais
- **Stack Desejado**: Next.js, TypeScript, TailwindCSS (frontend); Supabase (Auth/DB); Vercel (frontend); Railway (backend)
- **Lógica Core**: Replicar fielmente o layout, lógica e regras do HTML fornecido
- **Fase 1**: Autenticação (Google OAuth e CPF/Senha), Controle de Sessão (1 dispositivo), Modo Manual, Modo Automático (stub), Painel Admin, Controle de Uso, Pagamento (stub)

### Mudanças de Stack
- Frontend migrado de **Create React App** para **Vite** para compatibilidade com Vercel/Railway
- Backend usa **FastAPI** em vez de framework Node.js
- Autenticação via **Emergent OAuth** para Google

---

## Status Atual: COMPLETO ✅

### O que foi implementado

#### Frontend (React + Vite + TailwindCSS)
- [x] Migração de Create React App para Vite
- [x] Página de Login (CPF/Senha + Google OAuth)
- [x] Dashboard com abas (Radar de Jogo e Gestão de Banca)
- [x] Radar de Jogo - lógica completa do HTML original
- [x] Gestão de Banca - controle financeiro completo
- [x] Painel Admin (/admin)
- [x] Modo Automático (stub)
- [x] Persistência via localStorage
- [x] Configuração para deploy no Vercel E Railway

#### Backend (FastAPI + Python)
- [x] Autenticação CPF/Senha com bcrypt
- [x] Integração Google OAuth via Emergent
- [x] Controle de sessão única (1 dispositivo)
- [x] Sistema de heartbeat para controle de uso
- [x] APIs de administração
- [x] Integração com Supabase
- [x] Configuração para deploy no Railway

#### Banco de Dados (Supabase)
- [x] Schema SQL completo
- [x] Tabelas: users, active_sessions, subscriptions, usage_limits, usage_heartbeats, feature_flags
- [x] Script para criar usuário admin

#### Documentação
- [x] README.md completo com instruções de deploy
- [x] Scripts SQL
- [x] Variáveis de ambiente documentadas
- [x] Guia para desenvolvedores

---

## Arquitetura Final

```
frontend/                    # React + Vite
├── src/
│   ├── components/          # RadarTab, GestaoTab, UI
│   ├── pages/               # Login, Dashboard, Admin
│   ├── context/             # AuthContext
│   ├── services/            # api.js
│   ├── engine/              # radarEngine.js (lógica)
│   └── main.jsx             # Entry point
├── vite.config.js           # Config Vite
├── vercel.json              # Config Vercel
└── railway.toml             # Config Railway

backend/                     # FastAPI
├── server.py                # API principal
├── supabase_client.py       # Cliente Supabase
├── requirements.txt         # Dependências
├── railway.toml             # Config Railway
└── sql/                     # Scripts SQL
```

---

## Credenciais de Teste

| Campo | Valor |
|-------|-------|
| CPF | `000.000.000-00` |
| Senha | `admin123` |

---

## Backlog (Futuro)

### P1 - Alta Prioridade
- [ ] Implementar persistência de dados do Radar no banco
- [ ] Implementar persistência de dados da Gestão no banco
- [ ] Integrar sistema de pagamento real (Mercado Pago)

### P2 - Média Prioridade
- [ ] Modo Automático - integração com API externa
- [ ] Notificações push
- [ ] Histórico de sessões

### P3 - Baixa Prioridade
- [ ] Migrar para Next.js (se necessário no futuro)
- [ ] PWA (Progressive Web App)
- [ ] Modo offline

---

## Changelog

### 2024-03-03
- Migração completa de Create React App para Vite
- Frontend funcional em Vite 6 + React 18
- Configurações de deploy para Vercel e Railway
- README.md completo
- Scripts SQL para Supabase
- PRD.md criado

---

## Notas Técnicas

### Por que Vite em vez de CRA?
- Create React App usa `react-scripts` que é incompatível com Node.js 24+ (usado no Vercel)
- Vite é mais moderno, rápido e compatível com ambas plataformas

### Variáveis de Ambiente
- Frontend usa `import.meta.env.VITE_*` (padrão Vite)
- Backend usa `os.environ.get()`

### Autenticação
- JWT armazenado em cookie httpOnly + localStorage
- Sessão válida por 7 dias
- Heartbeat a cada 30 segundos para controle de uso
