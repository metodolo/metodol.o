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

### ✅ Gestão de Banca
- Banca inicial, Meta %, Stop %
- Botões GANHEI/PERDI
- Projeção de 30 dias
- Gráfico de evolução
- Persistência em localStorage

### ✅ Painel Admin
- Lista de usuários
- Ativar/Desativar usuários
- Ativar/Desativar API
- Derrubar sessões
- Configurar limite de tempo diário
- **Gerenciar Assinaturas:**
  - Nenhum
  - Teste (3, 7, 14, 30 dias)
  - Mensal (30 dias)
  - Anual (365 dias)
  - Vitalício (sem expiração)

### ✅ Design
- Logo da roleta como fundo
- Escrita "Método L.O" em dourado (estilo premium)
- Tamanho aumentado no desktop (zoom 1.25)

---

## Pendente

### 🔵 Integração Mercado Pago
- Pagamentos reais
- Webhook para atualização de assinaturas

---

## Changelog

### 2024-03-05
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
