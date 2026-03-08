# Backend StepLog

API Flask organizada por camadas, com suporte a Firebase Realtime Database e fallback local em JSON.

## Estrutura

- `app.py`: ponto de entrada e app factory
- `routes/`: definicao dos endpoints HTTP
- `controllers/`: logica de negocio
- `models/`: mapeamento/normalizacao dos dados
- `services/`: acesso a Firebase + repositorio de dados
- `data/local_seed.json`: base local NoSQL para desenvolvimento sem chaves

## Variaveis de ambiente

- `FIREBASE_DATABASE_URL` (opcional): URL da tua Realtime Database
- `FIREBASE_AUTH_TOKEN` (opcional): token/secret da RTDB
- `STEPLOG_LOCAL_SEED_PATH` (opcional): caminho para seed local custom

Se `FIREBASE_DATABASE_URL` nao estiver definida (ou falhar), a API usa `data/local_seed.json`.

## Arrancar local

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python backend/app.py
```

