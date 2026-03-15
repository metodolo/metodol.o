# RADAR V22 + Método L.O - Product Requirements Document

## Status: FUNCIONAL - PRONTO PARA VENDA

### URLs de Produção
| Serviço | URL |
|---------|-----|
| Frontend (Vercel) | https://metodol-o.vercel.app |
| Backend (Railway) | https://metodolo-production-19fc.up.railway.app |

### Credenciais Admin
| Campo | Valor |
|-------|-------|
| CPF | `154.831.997-07` |
| Senha | `admin123` (troca obrigatória no primeiro login) |

---

## Funcionalidades Implementadas

### Autenticação
- Login com CPF/Senha
- Login com Google OAuth (Emergent)
- Limite de 1 dispositivo ativo por usuário (verificação a cada 5s)
- Sistema de heartbeat para controle de tempo
- Troca obrigatória de senha no primeiro login do admin
- **Modo Whitelist: Somente emails pré-cadastrados pelo admin podem acessar o app**

### Radar de Jogo
- Entrada de números 0-36
- Contagem Vermelho/Preto
- Análise de regiões (múltiplas destacadas)
- Radar de Ocultos (terminais)
- Família de números
- Histórico de giros (14 ou 50)
- Botões CORRIGIR/LIMPAR com tema preto e dourado

### Gestão de Banca
- Banca inicial, Meta %, Stop %
- Botões GANHEI/PERDI
- Projeção de 30 dias
- Gráfico de evolução
- Persistência em localStorage

### Painel Admin
- **Aba Usuários:** Lista, ativar/desativar, derrubar sessões, configurar limite de tempo, gerenciar assinaturas
- **Aba Pré-Cadastros:** Adicionar email + plano antes do usuário se registrar (funciona como whitelist)
- **Aba Lista Negra:** Bloquear usuários por email ou CPF

### Pagamentos (Mercado Pago)
- Integração completa com credenciais de PRODUÇÃO
- Suporte a PIX, cartão de crédito, boleto
- Webhook automático para ativação de assinatura
- Planos: Mensal (R$200), Anual (R$970), Vitalício (R$1.997)
- Notificação por email ao admin quando pagamento é confirmado

### Notificações (Resend)
- Email ao admin quando novo usuário se registra
- Email ao admin quando pagamento é confirmado

### Design
- Tema preto e dourado em toda a aplicação
- Logo da roleta como fundo
- Escrita "Método L.O" em dourado (estilo premium)

---

## Configuração de Produção

### Variáveis de Ambiente (Railway)
```
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, JWT_SECRET
MERCADO_PAGO_ACCESS_TOKEN (PRODUÇÃO)
MERCADO_PAGO_PUBLIC_KEY (PRODUÇÃO)
BACKEND_URL=https://metodolo-production-19fc.up.railway.app
FRONTEND_URL=https://metodol-o.vercel.app
RESEND_API_KEY, ADMIN_NOTIFICATION_EMAIL, SENDER_EMAIL
```

### Webhook Mercado Pago
- URL: `https://metodolo-production-19fc.up.railway.app/api/payments/webhook`

---

## Pendente / Backlog

### P2 - Futuro
- Modo "Automático" com API externa
- Persistência de dados históricos
- Página de pagamento/planos voltada ao usuário
- Domínio customizado

### Refatoração
- `server.py` (1500+ linhas) -> dividir em módulos
- `AdminPage.jsx` (850+ linhas) -> extrair componentes

---

## Changelog

### 2026-03-13 (Sessão atual)
- Pagamento PIX via Mercado Pago confirmado e processado com sucesso
- Configurada URL de webhook de produção (Railway)
- Corrigido bug no .env (chave pública MP concatenada)
- requirements.txt limpo (155 → 13 pacotes essenciais)
- **Implementado modo Whitelist: somente emails pré-cadastrados pelo admin podem registrar/entrar**

### Sessões anteriores
- Implementado sistema de Pré-Cadastros
- Implementada troca obrigatória de senha do admin
- Implementada Lista Negra (blacklist)
- Integração Resend para notificações por email
- Integração Mercado Pago com credenciais de produção
- Sessão única por dispositivo (verificação a cada 5s)
- Tema preto e dourado completo
- Migração para Vite
