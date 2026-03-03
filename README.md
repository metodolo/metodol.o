# RADAR V22 + Método L.O

Sistema completo de análise de jogos de roleta com gestão de banca.

## Sumário

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Deploy](#deploy)
  - [Vercel (Frontend)](#deploy-no-vercel-frontend)
  - [Railway (Backend)](#deploy-no-railway-backend)
  - [Railway (Frontend Alternativo)](#deploy-no-railway-frontend-alternativo)
- [Configuração do Supabase](#configuração-do-supabase)
- [Configuração do Google Auth](#configuração-do-google-auth)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Credenciais de Teste](#credenciais-de-teste)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Lógica de Estratégias (HTML Original)](#lógica-de-estratégias-html-original)
- [API Endpoints](#api-endpoints)
- [Guia para Desenvolvedores](#guia-para-desenvolvedores)

---

## Visão Geral

O **RADAR V22 + Método L.O** é uma aplicação full-stack para análise de jogos de roleta, incluindo:

- **Radar de Jogo**: Análise de números, regiões, terminais ocultos e tendências
- **Gestão de Banca**: Controle financeiro com metas e stops diários
- **Sistema de Autenticação**: Login via CPF/Senha ou Google OAuth
- **Controle de Sessão**: Limite de 1 dispositivo ativo por usuário
- **Controle de Uso**: Limite de tempo diário baseado em heartbeats
- **Painel Admin**: Gerenciamento de usuários e assinaturas

---

## Funcionalidades

### Radar de Jogo
- Entrada manual de números (0-36)
- Análise de frequência de regiões (2/3, 6/5, 7/6, 8/3, 9/4, 5)
- Radar de Ocultos (terminais com maior peso)
- Família de números baseada no terminal selecionado
- Tendência de cor (Vermelho vs Preto)
- Histórico de giros com limite configurável (14 ou 50)

### Gestão de Banca
- Configuração de banca inicial, meta % e stop %
- Registro de ganhos e perdas
- Projeção de 30 dias
- Gráfico de evolução da banca
- Histórico de operações

### Autenticação e Segurança
- Login via CPF e senha
- Login via Google (Emergent OAuth)
- Sessão única por usuário (dispositivo único)
- Tokens de sessão com expiração de 7 dias

### Painel Admin (/admin)
- Listagem de todos os usuários
- Ativar/desativar contas
- Simular pagamentos
- Configurar limites de uso
- Habilitar/desabilitar API
- Invalidar sessões

---

## Arquitetura do Sistema

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│   Supabase      │
│   (Vite/React)  │     │   (FastAPI)     │     │   (PostgreSQL)  │
│   Vercel/Railway│     │    Railway      │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Google OAuth   │     │   Emergent      │
│  (via Emergent) │     │   Auth Server   │
└─────────────────┘     └─────────────────┘
```

### Stack Tecnológico

| Componente | Tecnologia |
|------------|------------|
| Frontend | React 18 + Vite 6 + TailwindCSS |
| Backend | Python 3.11 + FastAPI |
| Banco de Dados | Supabase (PostgreSQL) |
| Autenticação | JWT + Emergent Google OAuth |
| Deploy Frontend | Vercel ou Railway |
| Deploy Backend | Railway |

---

## Deploy

### Deploy no Vercel (Frontend)

1. **Conecte seu repositório ao Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Clique em "New Project"
   - Importe o repositório do GitHub

2. **Configure o projeto**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

3. **Adicione as variáveis de ambiente**
   ```
   VITE_BACKEND_URL=https://seu-backend.railway.app
   ```

4. **Deploy**
   - Clique em "Deploy"
   - O Vercel irá buildar e publicar automaticamente

### Deploy no Railway (Backend)

1. **Acesse [railway.app](https://railway.app)**

2. **Crie um novo projeto**
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Escolha seu repositório

3. **Configure o serviço**
   - **Root Directory**: `backend`
   - O Railway detectará automaticamente o arquivo `railway.toml`

4. **Adicione as variáveis de ambiente**
   ```
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_ANON_KEY=sua_anon_key
   SUPABASE_SERVICE_KEY=sua_service_key
   JWT_SECRET=sua_chave_secreta
   CORS_ORIGINS=https://seu-frontend.vercel.app,https://seu-frontend.railway.app
   ```

5. **Configure o domínio público**
   - Em "Settings" > "Networking" > "Public Networking"
   - Clique em "Generate Domain" ou configure um domínio customizado

### Deploy no Railway (Frontend Alternativo)

Se preferir fazer o deploy do frontend também no Railway:

1. **Crie outro serviço no Railway**
   - No mesmo projeto, clique em "New"
   - Selecione "Deploy from GitHub repo"

2. **Configure o serviço**
   - **Root Directory**: `frontend`
   - O Railway detectará o `nixpacks.toml`

3. **Adicione as variáveis de ambiente**
   ```
   VITE_BACKEND_URL=https://seu-backend.railway.app
   ```

4. **Configure o domínio público**

---

## Configuração do Supabase

### Passo 1: Criar Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Escolha nome, senha e região (preferencialmente São Paulo)
4. Aguarde a criação do projeto

### Passo 2: Executar Scripts SQL

1. No painel do Supabase, vá para "SQL Editor"
2. Execute o arquivo `backend/sql/01_schema.sql`
3. Execute o arquivo `backend/sql/02_admin_user.sql`

### Passo 3: Obter Credenciais

1. Vá para "Project Settings" > "API"
2. Copie:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon/public key**: Para uso geral
   - **service_role key**: Para operações admin (GUARDE COM SEGURANÇA!)

---

## Configuração do Google Auth

O sistema usa o **Emergent Auth** para autenticação Google. Não é necessária configuração adicional - o auth é gerenciado automaticamente.

### Como funciona:

1. Usuário clica em "Entrar com Google"
2. Redireciona para `auth.emergentagent.com`
3. Usuário faz login no Google
4. Callback retorna com `session_id`
5. Backend valida e cria sessão local

---

## Variáveis de Ambiente

### Frontend (.env)

```env
# URL do Backend (sem / no final)
VITE_BACKEND_URL=https://seu-backend.railway.app
```

### Backend (.env)

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT (gere uma chave segura)
JWT_SECRET=sua-chave-secreta-muito-segura-123

# CORS (URLs permitidas, separadas por vírgula)
CORS_ORIGINS=https://seu-frontend.vercel.app,https://localhost:3000
```

---

## Credenciais de Teste

### Usuário Admin

| Campo | Valor |
|-------|-------|
| CPF | `000.000.000-00` |
| Senha | `admin123` |
| Email | `admin@metodolo.com.br` |
| Role | `admin` |

> **Importante**: Altere a senha do admin em produção!

---

## Estrutura do Projeto

```
/
├── frontend/                    # Aplicação React/Vite
│   ├── src/
│   │   ├── components/          # Componentes React
│   │   │   ├── RadarTab.jsx     # Tab do Radar de Jogo
│   │   │   ├── GestaoTab.jsx    # Tab de Gestão de Banca
│   │   │   └── ui/              # Componentes UI (shadcn)
│   │   ├── pages/               # Páginas da aplicação
│   │   │   ├── LoginPage.jsx    # Página de login
│   │   │   ├── Dashboard.jsx    # Dashboard principal
│   │   │   ├── AdminPage.jsx    # Painel administrativo
│   │   │   ├── AuthCallback.jsx # Callback do OAuth
│   │   │   └── AutomaticPage.jsx# Modo automático (stub)
│   │   ├── context/             # Context API
│   │   │   └── AuthContext.jsx  # Contexto de autenticação
│   │   ├── services/            # Serviços/API
│   │   │   └── api.js           # Cliente da API
│   │   ├── engine/              # Lógica de estratégias
│   │   │   └── radarEngine.js   # Motor do radar
│   │   ├── App.jsx              # Componente raiz
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Estilos globais
│   ├── index.html               # HTML template
│   ├── vite.config.js           # Configuração Vite
│   ├── tailwind.config.js       # Configuração Tailwind
│   ├── vercel.json              # Configuração Vercel
│   ├── railway.toml             # Configuração Railway
│   └── package.json             # Dependências
│
├── backend/                     # API FastAPI
│   ├── server.py                # Servidor principal
│   ├── supabase_client.py       # Cliente Supabase
│   ├── requirements.txt         # Dependências Python
│   ├── railway.toml             # Configuração Railway
│   └── sql/                     # Scripts SQL
│       ├── 01_schema.sql        # Schema do banco
│       └── 02_admin_user.sql    # Usuário admin
│
└── README.md                    # Este arquivo
```

---

## Lógica de Estratégias (HTML Original)

A lógica do sistema foi fielmente portada do HTML original. Aqui estão os principais conceitos:

### Números Vermelhos
```javascript
const VERMELHOS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
```

### Setores da Roleta
```javascript
const ZERO_REG = [0, 32, 15, 12, 26, 3, 35];
const VOISINS = [22, 18, 29, 7, 28, 19, 4, 21, 2, 25];
const TIER = [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33];
const ORPH = [1, 20, 14, 31, 9, 6, 34, 17];
```

### Regiões Mapeadas
```javascript
const REGIOES_MAPEADAS = {
  "2/3": [2, 11, 20, 14, 21, 25, 30, 36],
  "6/5": [6, 15, 24, 33, 16, 27, 32],
  "7/6": [7, 18, 25, 34, 6, 17, 28, 29, 27],
  "8/3": [8, 26, 35, 0, 3, 12, 30, 17, 25, 28],
  "9/4": [9, 18, 27, 36, 13, 31, 22, 29, 19, 4],
  "5": [5, 10, 23, 14, 16, 27, 32]
};
```

### Pesos Master (Radar de Ocultos)

A lógica de pesos está definida em `frontend/src/engine/radarEngine.js`. Cada número contribui para diferentes terminais com pesos específicos. Esta é a mesma lógica do HTML original.

### Cálculo da Família de Terminais
```javascript
// Para números de 10-36:
// - Soma dos dígitos = terminal
// - OU diferença dos dígitos = terminal

// Exemplo: Terminal 7
// Família: 7, 16, 25, 34 (soma = 7 ou diferença = 7)
```

---

## API Endpoints

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registrar novo usuário |
| POST | `/api/auth/login/cpf` | Login com CPF/senha |
| POST | `/api/auth/login/google` | Login com Google OAuth |
| GET | `/api/auth/me` | Obter usuário atual |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/validate-session` | Validar sessão |

### Uso

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/usage/heartbeat` | Enviar heartbeat |
| GET | `/api/usage/status` | Status de uso |

### Admin

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/admin/users` | Listar usuários |
| PATCH | `/api/admin/users/{id}` | Atualizar usuário |
| POST | `/api/admin/users/{id}/simulate-payment` | Simular pagamento |
| DELETE | `/api/admin/users/{id}/sessions` | Invalidar sessões |

### Saúde

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Health check |

---

## Guia para Desenvolvedores

### Executar Localmente

#### Frontend
```bash
cd frontend
npm install
npm run dev
# Acesse http://localhost:3000
```

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
# API em http://localhost:8001
```

### Modificar Estratégias

As estratégias estão em `frontend/src/engine/radarEngine.js`:

1. **VERMELHOS**: Lista de números vermelhos
2. **REGIOES_MAPEADAS**: Mapeamento de regiões
3. **PESOS_MASTER**: Pesos para cálculo de terminais
4. **getTerminalFamily()**: Cálculo da família de um terminal

### Adicionar Nova Feature

1. **Backend**: Adicione endpoint em `server.py`
2. **Frontend**: Adicione chamada em `services/api.js`
3. **UI**: Crie/modifique componentes em `components/`

---

## Suporte

Para dúvidas ou problemas:

1. Verifique os logs no Railway
2. Verifique o console do navegador
3. Verifique as variáveis de ambiente
4. Confirme que o Supabase está acessível

---

## Licença

Projeto proprietário - Todos os direitos reservados.
