# Worknoon Chat Backend

![Node.js](https://img.shields.io/badge/Node.js-API-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-REST-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Persistence-47A248?logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?logo=socket.io&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)

Backend API and Socket.IO server for the Worknoon real-time chat assessment. It owns authentication, roles, conversations, messages, read state, admin read endpoints, and realtime delivery.

## Demo Video

- [Worknoon Chat demo walkthrough](https://www.loom.com/share/7f0a051d7c7f46a9bf3c7261adcc0d0f)

## Related Repositories

- [Frontend - Next.js chat UI](https://github.com/Ennygabby01/worknoon-chat-frontend)
- [WordPress - plugin integration](https://github.com/Ennygabby01/worknoon-chat-wordpress)

## Technologies

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- Socket.IO
- Zod
- JWT
- bcrypt

## What This Service Does

The backend is the source of truth for authentication, role authorization, users, conversations, messages, read state, orders, support assignment, and realtime events.

It exposes a versioned REST API under `/api/v1` and a Socket.IO server on the same origin.

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The API runs at `http://localhost:4000` by default.

MongoDB must be running at the configured `MONGODB_URI`. For local development, run MongoDB directly or with Docker:

```bash
docker run --name worknoon-chat-mongodb -p 27017:27017 -d mongo:8
```

MailHog can be used for local email delivery:

```bash
docker run --name worknoon-chat-mailhog -p 1025:1025 -p 8025:8025 -d mailhog/mailhog:v1.0.1
```

MailHog SMTP listens on `127.0.0.1:1025`; its web inbox is available at `http://localhost:8025`.

To create or update the first local admin account, set the `SEED_ADMIN_*` values in `.env` and run:

```bash
npm run seed:admin
```

To seed demo users across all roles plus conversations, directory metadata, and buyer orders, set `SEED_DEMO_PASSWORD` in `.env` and run:

```bash
npm run seed:demo
```

All demo accounts created by `seed:demo` use `SEED_DEMO_PASSWORD`. This is separate from `SEED_AGENT_PASSWORD`, which is only used by `npm run seed:agents`.

Useful local commands:

```bash
make dev
make seed-demo
make lint
make typecheck
make build
make start
```

## Environment

```bash
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/worknoon_chat
JWT_ACCESS_SECRET=generate-a-long-random-secret
JWT_ACCESS_EXPIRES_IN=15m
REFRESH_TOKEN_COOKIE_NAME=worknoon_refresh_token
REFRESH_TOKEN_EXPIRES_DAYS=7
CORS_ORIGIN=http://localhost:3000
APP_ORIGIN=http://localhost:3000
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=Worknoon Chat <no-reply@worknoon.local>
```

For production, set `APP_ORIGIN` to the frontend origin and configure `SMTP_*` values for a real SMTP provider.

## Features

- JWT signup/login with refresh-session rotation.
- Public signup for customer, designer, and merchant accounts.
- Admin seeding for the first administrative user.
- Demo seeding for users, agents, designers, merchants, customers, chat threads, directory stats, and orders.
- Role-based protected endpoints.
- Profile read/update.
- Admin read endpoints for users and conversations.
- Conversation creation/list/read-state APIs.
- Plain-text message creation/list APIs with `clientMessageId` idempotency.
- Socket.IO authentication, rooms, REST message broadcasts, conversation updates, presence updates, and typing updates.
- SMTP email verification and password reset.

## Demo Accounts

After running `npm run seed:demo`, use the password configured as `SEED_DEMO_PASSWORD` for every seeded demo account.

Useful seeded users include:

- `bamiduroeniolagabriel@gmail.com` - admin
- `gabriel@example.com` - customer
- `alice@example.com` - designer
- `hello@techstore.com` - merchant
- `amara.osei@worknoon.io` - support agent

Separate agent-only seed accounts, such as `agent1@worknoon.dev`, are created only when `npm run seed:agents` is run.

## Auth Endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/email-verification/request`
- `POST /api/v1/auth/email-verification/confirm`
- `POST /api/v1/auth/password-reset/request`
- `POST /api/v1/auth/password-reset/confirm`

Access tokens are returned in response bodies and should be sent as bearer tokens. Refresh tokens are stored as `httpOnly` cookies and hashed in MongoDB.

Email verification and password reset requests create hashed, expiring action tokens in MongoDB and send email through configured SMTP. Use MailHog in development and a real SMTP provider in production.

## User/Profile Endpoints

- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `GET /api/v1/users` admin only

Profile updates only accept explicit safe fields: `name`, `avatarUrl`, `bio`, and `location`.

## Admin Endpoints

- `GET /api/v1/admin/users` admin only
- `PATCH /api/v1/admin/users/:id` admin only
- `GET /api/v1/admin/conversations` admin only

## Conversation Endpoints

- `GET /api/v1/conversations`
- `POST /api/v1/conversations`
- `POST /api/v1/conversations/support`
- `GET /api/v1/conversations/:id`
- `PATCH /api/v1/conversations/:id/read`

Direct conversation creation uses a stable participant key so duplicate direct conversations return the existing conversation.
Direct conversation creation emits realtime `conversation:new` events to participants.
Support conversation creation accepts an opening message or structured bot/customer transcript and creates an escalated queue conversation for agents to claim.

## Message Endpoints

- `GET /api/v1/messages/:conversationId`
- `POST /api/v1/messages/:conversationId`

Message sending requires `clientMessageId` so retries and double sends do not create duplicate messages.

## Order Endpoints

- `GET /api/v1/orders`

Orders are scoped to the authenticated buyer and support optional status filtering.

## Agent and Support Flow

- `GET /api/v1/conversations/queue` agent only
- `GET /api/v1/conversations/my-cases` agent only
- `POST /api/v1/conversations/:id/claim` agent only
- `POST /api/v1/conversations/:id/escalate`
- `POST /api/v1/conversations/:id/resolve` agent only

Support handoff uses `POST /api/v1/conversations/support` so the backend can persist the assistant/customer transcript and place the case in the agent queue in one operation. Agent claim is atomic; concurrent claims return only one winner, and repeated claims by the winning agent are idempotent.

## Socket.IO Events

Socket.IO connections require an access token:

```ts
io(process.env.NEXT_PUBLIC_API_URL, {
  auth: { token: accessToken }
});
```

Server events:

- `connection:ready`
- `conversation:joined`
- `message:new`
- `message:sent`
- `conversation:new`
- `conversation:update`
- `presence:update`
- `typing:update`
- `error`

Client events:

- `conversation:join`
- `conversation:leave`
- `message:send`
- `presence:request`
- `typing:start`
- `typing:stop`

`message:send` requires:

```json
{
  "conversationId": "mongodb-object-id",
  "body": "Plain text message",
  "clientMessageId": "client-generated-id"
}
```

## Challenges and Tradeoffs

- Support handoff first produced a self-chat because the frontend could create a support conversation without an agent participant. I moved support conversation creation into a dedicated backend endpoint so the bot/customer transcript, queue placement, and realtime notification are handled together.
- Agent takeover needed concurrency safety. Instead of adding queues or locks, claim uses an atomic MongoDB update: one agent wins, repeated claims by the same winner are idempotent, and other agents receive a conflict.
- Demo credentials caused confusion because `seed:demo` and `seed:agents` intentionally use different env values. Demo users, including demo agents, use `SEED_DEMO_PASSWORD`; `SEED_AGENT_PASSWORD` only applies after running `seed:agents`.
- Contact preloading exposed a contract mismatch: the frontend requested `limit=200`, while backend pagination originally capped requests lower. The pagination cap was raised so role/name metadata can load reliably for chat headers.
- Duplicate messages and duplicate direct conversations were real race risks, so message sends use `clientMessageId` idempotency and direct conversations use a stable participant key.
- I kept refresh tokens in `httpOnly` cookies and access tokens in frontend memory/session state. That is simpler than a full OAuth-style setup while still avoiding query-string tokens and localStorage refresh tokens.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```
