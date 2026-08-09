# Guia para Corrigir o Botão "Adicionar Estratégia" no Railway

## Problema
O botão "Adicionar" na aba Estratégias retorna erro 500 no Railway porque o `server.py` no seu GitHub não tem o código de conexão com MongoDB para estratégias.

---

## PASSO 1: Adicionar imports no topo do `server.py`

Abra o arquivo `server.py` no seu GitHub e procure os imports no início do arquivo. Adicione estas duas linhas (se ainda não existem):

```python
from pymongo import MongoClient
from bson import ObjectId
```

---

## PASSO 2: Adicionar a conexão MongoDB

Logo ABAIXO da linha onde você configura o Mercado Pago (ou qualquer outra configuração), adicione este bloco:

```python
# MongoDB connection for strategies (optional - graceful if not configured)
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')
strategies_col = None
if MONGO_URL and DB_NAME:
    try:
        mongo_client = MongoClient(MONGO_URL)
        mongo_db = mongo_client[DB_NAME]
        strategies_col = mongo_db['strategies']
        logger.info(f"[MongoDB] Connected to {DB_NAME}")
    except Exception as e:
        logger.warning(f"[MongoDB] Failed to connect: {e}")
else:
    logger.warning("[MongoDB] MONGO_URL or DB_NAME not set - strategies disabled")
```

---

## PASSO 3: Adicionar as rotas de estratégias

Procure um bom lugar no seu `server.py` (por exemplo, ANTES da seção de pagamentos ou no final das rotas) e adicione este bloco COMPLETO:

```python
# ============== Strategy Routes (MongoDB) ==============

@api_router.get("/strategies")
async def list_strategies(request: Request):
    """List all strategies - any authenticated user can read"""
    await get_current_user_from_request(request)
    if strategies_col is None:
        return []
    docs = list(strategies_col.find())
    result = []
    for d in docs:
        d['id'] = str(d['_id'])
        del d['_id']
        result.append(d)
    return result

@api_router.post("/strategies")
async def create_strategy(request: Request):
    """Create a strategy - admin only"""
    user, _ = await get_current_user_from_request(request)
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Apenas admin")
    if strategies_col is None:
        raise HTTPException(status_code=503, detail="MongoDB não configurado")
    body = await request.json()
    doc = {
        'name': body.get('name', 'Sem nome'),
        'triggerNums': body.get('triggerNums', []),
        'entryNums': body.get('entryNums', []),
        'active': body.get('active', True),
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
    result = strategies_col.insert_one(doc)
    doc['id'] = str(result.inserted_id)
    del doc['_id']
    return doc

@api_router.put("/strategies/{strategy_id}")
async def update_strategy(strategy_id: str, request: Request):
    """Update a strategy - admin only"""
    user, _ = await get_current_user_from_request(request)
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Apenas admin")
    if strategies_col is None:
        raise HTTPException(status_code=503, detail="MongoDB não configurado")
    body = await request.json()
    update = {}
    if 'name' in body: update['name'] = body['name']
    if 'triggerNums' in body: update['triggerNums'] = body['triggerNums']
    if 'entryNums' in body: update['entryNums'] = body['entryNums']
    if 'active' in body: update['active'] = body['active']
    if not update:
        raise HTTPException(status_code=400, detail="Nada para atualizar")
    strategies_col.update_one({'_id': ObjectId(strategy_id)}, {'$set': update})
    return {"message": "Atualizado"}

@api_router.delete("/strategies/{strategy_id}")
async def delete_strategy(strategy_id: str, request: Request):
    """Delete a strategy - admin only"""
    user, _ = await get_current_user_from_request(request)
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Apenas admin")
    if strategies_col is None:
        raise HTTPException(status_code=503, detail="MongoDB não configurado")
    strategies_col.delete_one({'_id': ObjectId(strategy_id)})
    return {"message": "Removido"}
```

---

## PASSO 4: Adicionar `pymongo` no `requirements.txt`

No seu arquivo `requirements.txt` no GitHub, adicione esta linha (se não existe):

```
pymongo==4.12.1
```

---

## PASSO 5: Configurar variáveis no Railway

No painel do Railway, vá em **Settings → Variables** e adicione:

- `MONGO_URL` = sua URL do MongoDB (ex: `mongodb+srv://usuario:senha@cluster.mongodb.net/`)
- `DB_NAME` = nome do banco (ex: `metodo_lo`)

> **IMPORTANTE**: Se você não tem um MongoDB na nuvem, pode criar um GRÁTIS em https://www.mongodb.com/atlas (plano M0 é gratuito).

---

## PASSO 6: Commit e Deploy

1. Faça commit das alterações no GitHub
2. O Railway vai fazer deploy automático
3. Teste acessando: `https://metodolo-production-19fc.up.railway.app/api/strategies`

---

## Como testar

Depois do deploy, faça login como Admin e vá na aba **Estratégias**. O botão **ADICIONAR** deve funcionar normalmente.
