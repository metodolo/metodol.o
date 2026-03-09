# RADAR V22 + Método L.O - Product Requirements Document

## Status: ✅ FUNCIONAL

### URLs de Produção
| Serviço | URL |
|---------|-----|
| Frontend (Vercel) | https://metodol-o.vercel.app |
| Backend (Railway) | https://metodolo-production-19fc.up.railway.app |

### Credenciais Admin
| Campo | Valor |
|-------|-------|
| CPF | `000.000.000-00` |
| Senha | `admin123` |

---

## Funcionalidades Implementadas

### ✅ Autenticação
- Login com CPF/Senha
- Login com Google OAuth (Emergent)
- Limite de 1 dispositivo ativo por usuário
- Sistema de heartbeat para controle de tempo

### ✅ Radar de Jogo
- Entrada de números 0-36
- Contagem Vermelho/Preto
- Análise de regiões (múltiplas destacadas)
- Radar de Ocultos (terminais)
- Família de números
- Histórico de giros (14 ou 50)
- Botões CORRIGIR/LIMPAR com tema preto e dourado

### ✅ Gestão de Banca
- Banca inicial, Meta %, Stop %
- Botões GANHEI/PERDI
- Projeção de 30 dias
- Gráfico de evolução
- Persistência em localStorage

### ✅ Painel Admin
- **Aba Usuários:**
  - Lista de usuários cadastrados
  - Ativar/Desativar usuários
  - Ativar/Desativar API
  - Derrubar sessões
  - Configurar limite de tempo diário
  - Gerenciar Assinaturas: Nenhum, Teste, Mensal, Anual, Vitalício
  
- **Aba Pré-Cadastros (NOVO):**
  - Adicionar email de futuro usuário
  - Selecionar tipo de assinatura antes do cadastro
  - Opções: Teste (3, 7, 14, 30 dias), Mensal, Anual, Vitalício
  - Observações opcionais
  - Quando o usuário se cadastrar, recebe automaticamente o plano configurado

### ✅ Design
- Logo da roleta como fundo
- Escrita "Método L.O" em dourado (estilo premium)
- Tamanho aumentado no desktop (zoom 1.25)
- Tema preto e dourado em toda a aplicação

---

## Pendente

### 🔴 Script SQL Necessário (AÇÃO NECESSÁRIA)
Para a funcionalidade de pré-cadastros funcionar, execute o script:
`/app/backend/sql/03_pending_subscriptions.sql` no SQL Editor do Supabase

### 🔵 Integração Mercado Pago
- Pagamentos reais
- Webhook para atualização de assinaturas

---

## Changelog

### 2024-03-09
- Implementado sistema de Pré-Cadastros no Painel Admin
- Adicionada aba "Pré-Cadastros" para cadastrar emails antes do usuário se registrar
- Backend: novos endpoints `/api/admin/pending-subscriptions`
- Fluxo de registro modificado para aplicar assinaturas pendentes automaticamente
- Script SQL criado: `03_pending_subscriptions.sql`

### 2024-03-05
- Botões CORRIGIR/LIMPAR alterados para tema preto e dourado
- Logo da roleta como fundo
- Escrita "Método L.O" em dourado
- Gerenciamento de assinaturas completo no Admin

### 2024-03-04
- Bug das regiões múltiplas corrigido
- Tamanho do app aumentado
- Domínio Railway corrigido

### 2024-03-03
- Migração para Vite
- Deploy Vercel + Railway funcionando
