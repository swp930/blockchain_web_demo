# Simple Blockchain Demo

A small **Node + Express + React** project that shows how a blockchain works:

- Blocks linked by hashes (`previousHash` → current `hash`)
- SHA-256 hashing
- Proof-of-work (find a `nonce` so the hash starts with N zeros)
- A pending transaction pool (mempool)
- Mining a block that includes transactions + a miner reward
- Chain validation

## Run it

You need Node.js 18+.

```bash
# terminal 1 — API
cd backend
npm install
npm start
# http://localhost:4000

# terminal 2 — UI
cd frontend
npm install
npm run dev
# http://localhost:5173
```

The Vite dev server proxies `/api` to the Express app.

## How to use the UI

1. Queue a transaction (from / to / amount).
2. Click **Mine block**. The server brute-forces a nonce until the hash has enough leading zeros.
3. Watch the new block appear, linked to the previous hash.
4. Raise difficulty to see mining take longer.
5. The badge at the top re-validates the whole chain after every change.

## API

| Method | Path | What it does |
|--------|------|----------------|
| GET | `/api/chain` | Full chain + pending txs |
| GET | `/api/validate` | Recalculates hashes and links |
| POST | `/api/transaction` | `{ from, to, amount }` |
| POST | `/api/mine` | `{ miner }` — mine pending txs |
| POST | `/api/mine-data` | `{ data }` — mine arbitrary data |
| POST | `/api/difficulty` | `{ difficulty: 1–5 }` |
| GET | `/api/balance/:address` | Sum of txs for an address |

## Mental model

```
Genesis → Block 1 → Block 2 → …
   hash      prev=genesis.hash
             hash = SHA256(index + prev + time + data + nonce)
```

Change any past data and `GET /api/validate` will fail, because hashes no longer match.
