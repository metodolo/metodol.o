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
- Active tab persistence (localStorage)

## Em Construção Tab (Experimental Signals)
- Password-protected (13052017) clone of RadarTab
- Bidirectional sync with RadarTab via localStorage
- Análise Igualitários: minority color reference counting (top 2)
- **Gatilhos de Entrada — Configurable Strategy** (Jul 2026):
  - Admin gear icon opens config modal
  - Configure: strategy name, trigger numbers, entry numbers, attempts (2 or 3)
  - When a trigger number appears → "ENTRADA CONFIRMADA" with entry numbers
  - N-attempt hit detection (GREEN/RED scoreboard)
  - Config persisted in localStorage, scoreboard in sessionStorage
  - ~~Old Alto/Médio/Baixo system removed~~

## Upcoming Tasks
- P2: Database persistence for daily runs/metrics/historical analysis
- P2: Automatic mode with external API
- P3: Custom domain configuration

## Backlog
- Refactor: Extract shared components from RadarTab/SinaisTab (~554 lines)
- Session limit E2E verification (user pending)
