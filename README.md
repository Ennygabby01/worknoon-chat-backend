# Worknoon Chat Backend

Backend API and Socket.IO server for the Worknoon real-time chat assessment. It owns authentication, roles, conversations, messages, read state, admin read endpoints, and realtime delivery.

## Stack

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- Socket.IO
- Zod
- JWT
- bcrypt

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
- Role-based protected endpoints.
- Profile read/update.
- Admin read endpoints for users and conversations.
- Conversation creation/list/read-state APIs.
- Plain-text message creation/list APIs with `clientMessageId` idempotency.
- Socket.IO authentication, rooms, message delivery, and typing updates.
- SMTP email verification and password reset.

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

Profile updates only accept explicit safe fields: `name` and `avatarUrl`.

## Admin Endpoints

- `GET /api/v1/admin/conversations` admin only

## Conversation Endpoints

- `GET /api/v1/conversations`
- `POST /api/v1/conversations`
- `GET /api/v1/conversations/:id`
- `PATCH /api/v1/conversations/:id/read`

Direct conversation creation uses a stable participant key so duplicate direct conversations return the existing conversation.

## Message Endpoints

- `GET /api/v1/messages/:conversationId`
- `POST /api/v1/messages/:conversationId`

Message sending requires `clientMessageId` so retries and double sends do not create duplicate messages.

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
- `typing:update`
- `error`

Client events:

- `conversation:join`
- `conversation:leave`
- `message:send`
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
