# 🏦 Enterprise Banking Backend API

A high-performance, production-grade Banking System API built with **Node.js, Express, MongoDB (Atlas Multi-Document ACID Transactions)**, and **Double-Entry Ledger Architecture**.

---

## 🌟 Key Features

- **Double-Entry Ledger Architecture**: Append-only transaction journal storing integer minor units (cents) to eliminate IEEE 754 floating-point errors.
- **Dynamic Balance Aggregation**: Balances are calculated in real-time using high-speed MongoDB Aggregation Pipelines (`$Credits - $Debits`).
- **ACID Transaction Transfers**: Multi-document atomic money transfers via MongoDB Sessions & Transactions (`session.startTransaction()`) guaranteeing rollback safety.
- **Distributed Idempotency Engine**: Unique UUID/header-based idempotency tracking prevents double deductions during retries or network timeouts.
- **Bank-Grade Authentication**:
  - RFC 5322 regex email validation.
  - Constant-time bcrypt hashing (10 salt rounds).
  - Secure JWT session dispatch via `HttpOnly`, `SameSite=Strict` cookies.
  - Server-side token revocation on logout via MongoDB TTL Index (`expires: 0`).
- **Automated Bank Account Provisioning**: Auto-generates unique collision-resistant 10-digit account numbers on user registration.
- **Asynchronous Email Subsystem**: Non-blocking transactional alerts (Welcome Email, Debit Alert, Credit Alert) powered by Nodemailer.
- **Enterprise Error Boundary**: Centralized `ApiError` hierarchy with production-safe error masking and standardized JSON responses (`ApiResponse`).

---

## 🏗 System Architecture & Diagrams

For exhaustive architecture documentation and diagrams:
- **Backend Architecture (10 Diagrams)**: [`docs/architecture.md`](docs/architecture.md) • [Interactive Viewer](docs/diagrams/index.html)
- **Frontend Architecture (8 Diagrams)**: [`docs/frontend-architecture.md`](docs/frontend-architecture.md) • [Interactive Viewer](docs/diagrams/frontend/index.html)
- **Spec Kit Baseline**:
  - Backend Specification: [`.specify/specs/banking-backend-api/`](.specify/specs/banking-backend-api/)
  - Frontend Specification: [`.specify/specs/banking-frontend-react/`](.specify/specs/banking-frontend-react/)

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js `>= 18.x`
- MongoDB Replica Set (MongoDB Atlas or local replica set for multi-document ACID transactions)

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Key environment variables:
```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/banking-db?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
COOKIE_SECRET=your_cookie_secret_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Enterprise Banking" <no-reply@banking.com>
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
# or
npm start
```

Server boots on `http://localhost:3000`.

---

## 🧪 Verification & Automated Test Suites

The repository includes comprehensive end-to-end automated verification suites covering all architectural layers:

```bash
# Run all automated phase verification tests
npm test
# or
npm run verify

# Test asynchronous email notifications
npm run test:email

# Clean dummy/test data from MongoDB Atlas
npm run clean:db
```

### Test Coverage Summary:
- **Phase 2 (`scripts/verify-phase2.js`)**: User registration, bcrypt hashing, login, profile, and JWT cookies.
- **Phase 3 (`scripts/verify-phase3.js`)**: 10-digit account generation, account listing, and initial faucet funding.
- **Phase 4 (`scripts/verify-phase4.js`)**: Double-entry ledger append-only writes, MongoDB aggregation pipeline balance calculation, cross-user authorization.
- **Phase 5 (`scripts/verify-phase5.js`)**: Multi-document ACID session transfers, balance verification inside sessions, idempotency replay caching, insufficient fund prevention, self-transfer blocking.
- **Phase 6 (`scripts/verify-phase6.js`)**: Token blacklisting via TTL index, post-logout rejection, asynchronous debit/credit alerts, CORS preflight checks, and `/health`.

---

## 📡 API Reference Overview

### Health
- `GET /health` — Server and database connectivity status.

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` — Register user & auto-provision 10-digit savings account.
- `POST /api/v1/auth/login` — Authenticate and receive `token` cookie.
- `GET /api/v1/auth/me` — Retrieve profile of authenticated user.
- `POST /api/v1/auth/logout` — Revoke token in blacklist collection and clear cookie.

### Accounts (`/api/v1/accounts`)
- `GET /api/v1/accounts/me` — List all accounts owned by authenticated user.
- `POST /api/v1/accounts` — Open an additional checking/savings account.
- `POST /api/v1/accounts/:accountId/deposit` — Deposit initial funds (faucet).
- `GET /api/v1/accounts/:accountId/balance` — Calculate and return live balance via aggregation pipeline.

### Transactions (`/api/v1/transactions`)
- `POST /api/v1/transactions` — Atomic transfer between accounts (`Header: Idempotency-Key`).
- `GET /api/v1/transactions/history` — List transaction history for the user's accounts.
- `GET /api/v1/transactions/:transactionId` — Get receipt and details of a single transaction.

---

## 📁 Project Structure

```
├── .specify/             # Spec Kit specifications, plans, and task trackers
├── docs/                 # Architectural specifications and Mermaid diagrams
│   ├── diagrams/         # 10 comprehensive architectural diagrams + HTML viewer
│   └── architecture.md   # Architectural design reference
├── postman/              # Ready-to-import Postman Collection with tests
├── scripts/              # Automated verification & DB maintenance scripts
│   ├── clean-db.js       # Cleans test data from MongoDB Atlas
│   ├── test-email.js     # Standalone email test runner
│   ├── verify-all.js     # Master test runner across all phases
│   ├── verify-phase2.js  # Auth & cookie tests
│   ├── verify-phase3.js  # Account provisioning tests
│   ├── verify-phase4.js  # Double-entry ledger tests
│   ├── verify-phase5.js  # ACID transaction tests
│   └── verify-phase6.js  # Blacklisting & hardening tests
├── src/
│   ├── config/           # Database & Nodemailer configuration
│   ├── constants/        # Enums (roles, accountStatus, transactionStatus)
│   ├── controllers/      # Route handler controllers
│   ├── middleware/       # Auth guard & global error handler
│   ├── models/           # Mongoose schemas (User, Account, Ledger, Transaction, Blacklist)
│   ├── routes/           # Express router definitions
│   ├── services/         # Business logic (Ledger aggregation, Email dispatcher)
│   ├── utils/            # ApiError, ApiResponse, currency converter, generator
│   └── app.js            # Express application entrypoint
├── requests.http         # VS Code REST Client test script
├── server.js             # HTTP server entrypoint
└── package.json
```

---

## 📄 License
ISC License
