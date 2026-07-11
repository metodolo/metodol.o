# Método L.O - PRD (Product Requirements Document)

## Original Problem Statement
Convert HTML-based "RADAR V22" / "Método L.O" roulette tracking app into a modern full-stack web application with black and gold theme, admin panel, complex pattern detection, and advanced UI/UX.

## Stack
- Frontend: React + Vite, Tailwind CSS
- Backend: FastAPI (Python)
- Auth: Supabase
- Database: MongoDB

## Core Features (Implemented)
- CPF-based auth with 1-device session limit
- Admin panel for user subscription management
- Radar de Jogo: digital roots, regions, hidden numbers, parities, Alto/Médio/Baixo
- Estratégia FB: oldest-number targeting with 14-spin limit and hit detection
- Junção dos Números: combined number analysis
- Gestão de Banca: bankroll management
- Background task: auto-deactivate expired subscriptions (every 5 min)
- Horizontal/Vertical responsive layout

## Em Construção Tab (Experimental Signals)
- Password-protected (13052017) clone of RadarTab
- Bidirectional sync with RadarTab via localStorage
- Análise Igualitários: minority color reference counting (top 2)
- **Gatilhos de Entrada** (NEW - Jul 2026):
  - Detects Alto(25-36)/Médio(13-24)/Baixo(1-12) sequences
  - Trigger: 2+ consecutive same category followed by different → signal for new category
  - Numbers filtered by dominant color of board (14 spins)
  - 3-attempt hit detection
  - Win/Red scoreboard

## Upcoming Tasks
- P2: Database persistence for daily runs/metrics/historical analysis
- P2: Automatic mode with external API
- P3: Custom domain configuration

## Backlog
- Refactor: Extract shared components from RadarTab/SinaisTab
- Session limit E2E verification (user pending)
