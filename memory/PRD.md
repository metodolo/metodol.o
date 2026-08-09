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

## Completed Features (Aug 2026)
- Multi-strategy signal configuration in Admin panel
- Array-based trigger numbers replacing Alto/Médio/Baixo
- "Cor Oposta = LOSS imediato" logic
- Individual Win/Red scoreboards per strategy
- Signal trigger re-arming (fires on every trigger number appearance)
- Estratégia FB duplicate Win counting fix
- pymongo Railway deployment fix (cleaned requirements.txt)
- Admin login fix (passlib → direct bcrypt for Python 3.12)
- Railway deployment guide for strategies API fix (RAILWAY_FIX_GUIDE.md)

## Railway Deployment Issue (Current)
- User deploys to Railway via personal GitHub (metodolo/metodol.o)
- Issue: server.py in GitHub missing MongoDB connection + strategy routes
- Fix guide provided at /app/memory/RAILWAY_FIX_GUIDE.md
- User action needed: copy code blocks, add pymongo to requirements.txt, set MONGO_URL + DB_NAME in Railway variables

## Upcoming
- P2: Persist daily runs/numbers for historical analysis
- P2: Automatic mode with external API
- P3: Custom domain
