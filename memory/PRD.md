# Método L.O - PRD

## Stack
React + Vite, FastAPI, Supabase Auth, MongoDB

## Core Features
- CPF auth, 1-device session, Admin panel
- Radar de Jogo (FB with GREEN/RED scoreboard, Junção, Regiões)
- Gestão de Banca, Horizontal/Vertical layout
- Auto-expire subscriptions, Active tab persistence

## Em Construção Tab
- Password-protected (13052017), synced with RadarTab
- Análise Igualitários: minority color reference counting

### Multi-Strategy Signal System (Jul-Aug 2026)
- **Admin → Estratégias tab**: CRUD via MongoDB API (shared with all users)
- Trigger: when latest giro is a trigger number → fires immediately
- Signal: ENTRADA CONFIRMADA with entry numbers, 3 attempts
- Scoring: GREEN/RED per strategy in PLACAR section (always visible)
- Signal disappears after GREEN or 3 REDs, re-fires on next trigger
- **API-backed**: POST/PUT/DELETE admin-only, GET for all authenticated users
- SinaisTab polls /api/strategies every 5s

## Upcoming
- P2: Automatic mode with external API
- P3: Custom domain
