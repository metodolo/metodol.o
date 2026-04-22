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
- Histórico de giros (12, 14 ou 50)
- Botões CORRIGIR/LIMPAR com tema preto e dourado
- Números repetidos piscam em dourado
- Números de referência customizados abaixo de cada número
- Ordem do histórico invertida (mais recente à esquerda)

### Cards de Histórico (Redesign)
- Removidos D/C (Dúzia/Coluna)
- Mantidos PAR/IMP com cores originais (cyan/laranja)
- Mantidos ALTO/BAIXO com cores originais (magenta/cyan)
- Número 0: tag ZERO com caixa e borda verde, alinhado com outros
- Números de referência em branco com borda dourada, fonte bold
- Horizontal: cards preenchem largura total (calc 100%/limiteGiros)
- Vertical: cards com largura fixa (75px min) com scroll lateral
- Alinhamento vertical perfeito (border transparent normalizada no .tag)

### Tabela Junção dos Números (NOVO)
- Tabela exibida ao lado da Família (horizontal) ou abaixo (vertical)
- Mostra dados de junção quando números se repetem no histórico
- Números em formato de bola (mini-ball) igual à Família
- Números da região mais forte destacados com borda dourada brilhante
- Scrollbar dourada visível para navegar múltiplos repetidos
- Dados completos de junção para todos os 37 números (0-36)

### Gestão de Banca
- Banca inicial, Meta %, Stop %
- Botões GANHEI/PERDI
- Projeção de 30 dias
- Gráfico de evolução
- Persistência em localStorage

### Estratégia FB (NOVO)
- Detecção de padrões baseada na raiz digital dos números
- Regra: QUALQUER par dos 3 últimos números que compartilhe raiz digital forma padrão (a-b, b-c, ou a-c)
- Alvo = número que NÃO combina (o "sobrante"), Entrada = grupo associado ao alvo
- Formada exibida com par primeiro (mais recente do par primeiro), alvo por último
- TODOS os números da entrada com borda dourada brilhante
- Grupos de exceção: n=1→[1,12,21,23,32,34], n=10/19/28→[10,19,28], n=11/29→[11,29], n=2/20→[2,11,20,29]
- 3 tentativas por padrão (countdown automático, sem remoção por acerto)
- Múltiplos padrões simultâneos com contagens independentes
- Card com borda dourada, texto "tentativas" legível, números grandes, barra de rolagem
- Funciona em layout vertical e horizontal (compact)

### Bloqueio de Usuários Desativados (NOVO)
- Tela BlockedScreen para usuários com status desativado
- Interceptação de erro 403 no AuthContext
- Link de renovação via LastLink/Telegram

### Painel Admin (Atualizado)
- **Aba Usuários:** Lista, ativar/desativar, derrubar sessões, configurar limite de tempo, gerenciar assinaturas
- **Aba Pré-Cadastros:** Adicionar email + plano antes do usuário se registrar (funciona como whitelist)
- **Aba Lista Negra:** Bloquear usuários por email ou CPF
- **Performance:** 49 usuários carregados em <1s (6 queries bulk com maps indexados)
- **Busca e ordenação:** Pesquisa por nome/email, ordenação alfabética

### Pagamentos (Mercado Pago)
- Integração completa com credenciais de PRODUÇÃO
- Suporte a PIX, cartão de crédito, boleto
- Webhook automático para ativação de assinatura
- Planos: Mensal (R$200), Anual (R$970), Vitalício (R$1.997)

### Regiões do Radar
- Região 6/5 corrigida: agora inclui números 0 e 5

### Design
- Tema preto e dourado
- Layout horizontal responsivo para PC/notebook/tablet
- Layout vertical para mobile
- Proteção de código (obfuscação, anti-dev-tools)

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

### 2026-04-22
- **Estratégia FB completa**: detecção de padrões por raiz digital
- TODAS as combinações de pares: a-b, b-c, a-c (qualquer par que compartilhe raiz)
- Alvo = número que não combina, exibição na ordem do histórico (mais recente primeiro)
- Múltiplos padrões simultâneos com countdown independente de 3 tentativas
- Sem remoção por acerto - padrão só sai quando countdown chega a 0
- UI: borda dourada, texto "tentativas" legível, números maiores, barra de rolagem
- Testes: 100% (iteration 4 + iteration 5 + iteration 6)


### 2026-03-22 (Sessão atual)
- Redesign dos cards de histórico: removido D/C, mantido PAR/IMP e ALTO/BAIXO
- Número 0 agora tem caixas ZERO com borda verde alinhadas
- Números de referência customizados em branco com borda dourada
- Cards preenchem largura total no horizontal, tamanho fixo no vertical
- Alinhamento vertical corrigido (border transparent normalizada no .tag)
- Números repetidos piscam em dourado (animação blink-gold)
- **NOVA tabela "Junção dos Números"** com bolas coloridas e scroll dourado
- Números da junção na região forte destacados em dourado
- Região 6/5 corrigida: adicionados números 0 e 5
- Família + Junção preenchem a tela sem espaço preto
- Verificado: admin carrega 49 usuários em <1s
- Verificado: session validation 15s, heartbeat 60s (otimizações intactas)
- Testes: 100% passou (testing agent iteration 3)

### 2026-03-20
- Otimização admin panel: ~1min → <1s
- Otimização concurrent users: redução de 80% carga servidor
- Layout horizontal responsivo
- Proteção de código (obfuscação, anti-dev-tools)
- Modo Whitelist implementado
- requirements.txt limpo para Railway

### Sessões anteriores
- Sistema de Pré-Cadastros e Lista Negra
- Integração Mercado Pago e Resend
- Sessão única por dispositivo
- Tema preto e dourado completo
- Migração para Vite
