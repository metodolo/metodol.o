# Método L.O - PRD

## Stack
React + Vite, FastAPI, Supabase Auth, MongoDB

## Core Features (Implemented)
- CPF auth, 1-device session, Admin panel, Radar de Jogo (FB, Junção, Regiões)
- Gestão de Banca, Horizontal/Vertical layout, Auto-expire subscriptions
- Active tab persistence (localStorage)

## Em Construção Tab
- Password-protected (13052017), synced with RadarTab via localStorage
- Análise Igualitários: minority color reference counting

### Multi-Strategy Signal System (Jul 2026)
- **Admin page** → "Estratégias" tab: CRUD for unlimited strategies
- Each strategy: name, trigger numbers, entry numbers, active/inactive toggle
- **Trigger**: ALL trigger numbers must be present in the 14 giros (any order)
- **Signal**: "ENTRADA CONFIRMADA" with entry numbers, 3 attempts
- **Scoring**: GREEN/RED per strategy, persisted in sessionStorage
- **All active strategies monitor simultaneously**
- Storage: localStorage `sinais_strategies`, sessionStorage `gatilho_scores`

## Upcoming Tasks
- P2: Database persistence for strategies and historical data
- P2: Automatic mode with external API
- P3: Custom domain
