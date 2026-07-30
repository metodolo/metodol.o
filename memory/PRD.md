# Método L.O - PRD

## Stack
React + Vite, FastAPI, Supabase Auth, MongoDB

## Core Features
- CPF auth, 1-device session, Admin panel, Radar de Jogo
- Estratégia FB with GREEN/RED scoreboard counter
- Junção, Regiões, Gestão de Banca, Horizontal/Vertical layout
- Auto-expire subscriptions, Active tab persistence

## Em Construção Tab
- Password-protected (13052017), synced with RadarTab
- Análise Igualitários: minority color reference counting

### Multi-Strategy Signal System (Jul 2026)
- Admin → "Estratégias" tab: CRUD unlimited strategies with activate/deactivate
- Trigger: ALL trigger numbers present in 14 giros (any order)
- Signal: ENTRADA CONFIRMADA with entry numbers, 3 attempts
- Scoring: GREEN/RED per strategy, combined total when idle
- **UI**: Single idle card when no trigger. Only triggered cards shown. Multiple simultaneous triggers display together.
- All active strategies monitor simultaneously

## Upcoming
- P2: Persist strategies in MongoDB
- P2: Automatic mode
- P3: Custom domain
