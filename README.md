# Worknoon Chat Backend

Backend API and Socket.IO server for the Worknoon real-time chat assessment.

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

The API defaults to `http://localhost:4000`.

MongoDB must be running at the configured `MONGODB_URI`. From the workspace root, Docker users can run:

```bash
make mongo-up
make mongo-status
make dev-backend
```

If MongoDB is not running, the backend will fail with `ECONNREFUSED 127.0.0.1:27017`.

The Docker Compose setup only runs MongoDB. The backend and frontend still run locally through npm scripts.

MailHog is available for local email delivery:

```bash
make mail-up
```

MailHog SMTP listens on `127.0.0.1:1025`, and the web inbox is available at `http://localhost:8025`.

Public signup only creates customer, designer, or merchant users. To create or update the first local admin account, set the `SEED_ADMIN_*` values in `.env` and run:

```bash
npm run seed:admin
```

From the workspace root:

```bash
make seed-admin
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

## Current Status

Implemented:

- JWT signup/login
- User roles
- Refresh session rotation
- Safe error responses
- JSON request validation foundation
- Header/content-type/security middleware
- Conversation CRUD foundation
- Message create/list foundation
- Idempotent message creation with `clientMessageId`
- Read markers for conversations and messages
- Socket.IO authentication
- Socket.IO conversation rooms
- Socket.IO message send/broadcast
- Socket.IO typing updates
- Email verification through SMTP
- Password reset through SMTP
- Profile read/update
- Admin user listing
- Admin conversation listing

Pending:

- Frontend integration
- WordPress plugin integration
