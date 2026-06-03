# End-to-end QA guide

Run the full four-persona flow against the real backend with seeded test users.

## Prerequisites

```bash
pnpm infra:up                 # postgres on :5433
pnpm --filter @foyer/api prisma:migrate
pnpm --filter @foyer/api prisma:seed
pnpm dev                      # api :4000, admin web :3000
```

The web app reads `NEXT_PUBLIC_API_URL` (default `http://localhost:4000/v1`).

## Test accounts

| Persona | Route | Credentials |
| --- | --- | --- |
| Customer | `/order`, `/track/[id]` | phone `0820000001`, code `000000` |
| Rider | `/rider` | phone `0820000002`, code `000000` |
| Store partner | `/partner` | `partner@qa.test` / `qa-password` (Ember outlet) |
| Operations | `/admin` | `admin@qa.test` / `qa-password` |

All login forms are pre-filled with the matching QA account.

## Happy-path simulation

1. **Customer** opens `/order`, adds items from one or more stores, taps
   "Place order and pay". Lands on `/track/[id]` with live status polling.
2. **Partner** opens `/partner` (Ember outlet). The new order appears as "New".
   Accept, then "Start preparing", then "Mark ready".
3. **Rider** opens `/rider`. The paid order shows under "Available trips".
   Claim it, pick up each ready store, then "Mark delivered".
4. **Customer** sees the timeline advance to "Delivered" and updates listed.
5. **Operations** opens `/admin` for revenue, status counts and the live order
   table with the assigned rider.

## Scripted backend check

`services/api/scripts/e2e.sh` runs the entire flow via curl and prints each step.

```bash
bash services/api/scripts/e2e.sh
```

Notes:
- The partner account is linked only to the Ember outlet, so the script orders
  from Ember to exercise the partner board.
- A rider can only collect a sub-order once the partner has marked it ready;
  delivery is blocked until every sub-order on the trip is collected.
