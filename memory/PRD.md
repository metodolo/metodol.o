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
- Limite de 1 dispositivo ativo por usuário (verificação a cada 15s)
- Sistema de heartbeat para controle de tempo (60s)
- Troca obrigatória de senha no primeiro login do admin
- Modo Whitelist: Somente emails pré-cadastrados pelo admin podem acessar o app

### Radar de Jogo
- Entrada de números 0-36
- Contagem Vermelho/Preto
- Análise de regiões (múltiplas destacadas)
- Radar de Ocultos (terminais)
- Família de números
- Histórico de giros (14 ou 50)
- Botões CORRIGIR/LIMPAR com tema preto e dourado
- **Números repetidos piscam em dourado**
- **Números de referência customizados abaixo de cada número**

### Cards de Histórico (Redesign)
- Removidos D/C (Dúzia/Coluna)
- Mantidos PAR/IMP com cores originais (cyan/laranja)
- Mantidos ALTO/BAIXO com cores originais (magenta/cyan)
- Número 0: tag ZERO com caixa e borda verde, alinhado com outros
- Números de referência em branco com borda dourada
- Horizontal: cards preenchem largura total (calc 100%/14)
- Vertical: cards com largura fixa (75px min) com scroll lateral
- Alinhamento vertical perfeito entre todos os tags (border normalizada)
- Números repetidos destacam piscando em dourado (blink-gold animation)

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
- **Performance:** 49 usuários carregados em <1s (6 queries bulk com maps indexados)

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
- Layout horizontal responsivo para PC/notebook/tablet
- Layout vertical para mobile

### Segurança
- Código obfuscado no build de produção
- Anti-dev-tools (bloqueio F12, right-click, etc.)
- Anti-seleção de texto e cópia

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

### P1 - Verificação Pendente
- Teste E2E do limite de sessão (1 dispositivo ativo)
- Verificação do botão "Reiniciar Tudo" na Gestão de Banca

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

### 2026-03-20 (Sessão atual)
- Redesign dos cards de histórico: removido D/C, mantido PAR/IMP e ALTO/BAIXO
- Número 0 agora tem caixas ZERO com borda verde alinhadas
- Números de referência customizados em branco com borda dourada
- Cards preenchem largura total no horizontal, tamanho fixo no vertical
- Alinhamento vertical corrigido (border transparent normalizada no .tag)
- Números repetidos piscam em dourado (animação blink-gold)
- Verificado: admin carrega 49 usuários em <1s
- Verificado: session validation 15s, heartbeat 60s (otimizações intactas)
- Testes: 100% passou (testing agent iteration 3)

### 2026-03-13
- Pagamento PIX via Mercado Pago confirmado e processado
- Configurada URL de webhook de produção (Railway)
- requirements.txt limpo (155 → 13 pacotes essenciais)
- Implementado modo Whitelist
- Otimização admin panel: ~1min → <1s
- Otimização concurrent users: redução de 80% carga servidor
- Layout horizontal responsivo
- Proteção de código (obfuscação, anti-dev-tools)

### Sessões anteriores
- Sistema de Pré-Cadastros e Lista Negra
- Troca obrigatória de senha do admin
- Integração Resend para notificações
- Integração Mercado Pago com credenciais de produção
- Sessão única por dispositivo
- Tema preto e dourado completo
- Migração para Vite
