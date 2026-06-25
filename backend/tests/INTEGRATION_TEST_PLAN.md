# Integration Test Plan (Backend)

Minimal smoke flow for the Trust Recovery API prototype.

## Prerequisites

- Node.js 22+
- Run from `backend/`: `npm test`

## Environment (isolated per run)

| Variable | Test value |
|---|---|
| `NODE_ENV` | `test` |
| `DATABASE_PATH` | temp SQLite file (auto) |
| `FRONTEND_URL` | `https://admin-proto.vercel.app` |
| `CLIENT_URL` | `https://client-proto.vercel.app` |

## Scenarios

### 1. `POST /api/users/register`

- **Body:** `{ name, email, password }`
- **Expect:** `201`, JSON with `id`, `name`, `email` (no password)
- **Fail if:** `404`, `500`, missing fields

### 2. `POST /api/recovery/request`

- **Setup:** 3 trusted contacts for the registered user (`POST /api/contacts`)
- **Body:** `{ email }`
- **Expect:** `201`, JSON with `id`, `status: "PENDING"`, `expiresAt`
- **Fail if:** `404` on route or user

### 3. `POST /api/recovery/approve`

- **Body:** `{ recoveryRequestId, contactEmail }`
- **Run twice** (2 distinct trusted contacts; prototype requires 2 approvals)
- **Expect:** `200`, JSON with `status` (`PENDING` then `APPROVED`), `approvalCount`
- **Fail if:** `404` on route or request

### 4. `POST /api/recovery/reset-password`

- **Body:** `{ recoveryRequestId, newPassword }`
- **Expect:** `200`, JSON with `message`, `userId`, `recoveryRequestId`
- **Fail if:** `404` on route; `400` if request not `APPROVED`

### 5. CORS (Vercel frontends)

- **OPTIONS** on `/api/users/register` with `Origin: https://admin-proto.vercel.app`
- **OPTIONS** with `Origin: https://client-proto.vercel.app`
- **OPTIONS** with `Origin: https://preview-branch.vercel.app` (wildcard)
- **Expect:** `Access-Control-Allow-Origin` echoes origin; not `404`

## Pass criteria

All scenarios return expected status codes and JSON shapes. No endpoint returns `404` for valid paths.
