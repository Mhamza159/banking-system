# Phase 1 Plan: Shared Infrastructure & Foundations

**Phase**: 01-shared-infrastructure  
**Goal**: Establish production dependencies, domain constants, financial utility functions, standardized API error/response handlers, and base Express pipeline.  
**Tasks Covered**: T001 through T009 from `.specify/specs/banking-backend-api/tasks.md`

---

## Technical Context & Scope

Phase 1 provides the foundational building blocks required by all subsequent banking phases (Auth, Accounts, Ledger, Transactions, and Notifications).

### 1. Dependencies to Install (`package.json`)
- `bcrypt`: Salted password hashing with 10 rounds.
- `jsonwebtoken`: Stateless JWT token generation & verification.
- `cookie-parser`: Secure HTTP-only cookie parsing.
- `nodemailer`: SMTP email transport.
- `uuid`: UUID v4 validation and generation for idempotency keys.

### 2. Environment Configuration (`.env.example`)
Template for all required environment variables:
- `PORT` (Default 3000)
- `MONGO_URI` (MongoDB connection string)
- `JWT_SECRET` (High-entropy secret key)
- `JWT_EXPIRES_IN` (Default 24h)
- `COOKIE_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `NODE_ENV` (`development` / `production`)

### 3. Domain Constants (`src/constants/`)
- `roles.js`: `CUSTOMER: "CUSTOMER"`, `ADMIN: "ADMIN"`
- `accountStatus.js`: `ACTIVE: "ACTIVE"`, `INACTIVE: "INACTIVE"`, `SUSPENDED: "SUSPENDED"`, `FROZEN: "FROZEN"`
- `transactionStatus.js`: `PENDING: "PENDING"`, `COMPLETED: "COMPLETED"`, `FAILED: "FAILED"`

### 4. Utilities (`src/utils/`)
- `apiError.js`: Custom class extending `Error` (`statusCode`, `message`, `errors = []`, `stack`).
- `apiResponse.js`: Standard response envelope `{ success, message, data }`.
- `currency.js`:
  - `toCents(amount)`: Converts dollar decimals to integer minor units safely without float loss.
  - `toDollars(cents)`: Converts integer minor units to formatted string `"$XX.XX"`.
- `generator.js`:
  - `generateAccountNumber()`: Generates random 10-digit numeric string (avoiding leading zeros if preferred, uniform length).

### 5. Middleware & Pipeline (`src/middleware/`, `src/app.js`)
- `error.middleware.js`: Global Express error handler catching `ApiError`, Mongoose CastError, ValidationError, Duplicate Key (`11000`), and returning standard JSON error envelope `{ success: false, error: { code, message, details } }`.
- `src/app.js`: Express configuration mounting `express.json()`, `express.urlencoded()`, `cookieParser()`, and global error handler.

---

## Execution Plan & Task Breakdown

| Task ID | Description | Target File |
|---|---|---|
| **T001** | Install dependencies via npm | `package.json` |
| **T002** | Create `.env.example` template | `.env.example` |
| **T003** | Create domain constant enums | `src/constants/roles.js`<br/>`src/constants/accountStatus.js`<br/>`src/constants/transactionStatus.js` |
| **T004** | Implement custom `ApiError` class | `src/utils/apiError.js` |
| **T005** | Implement standard `ApiResponse` wrapper | `src/utils/apiResponse.js` |
| **T006** | Implement currency conversion helpers | `src/utils/currency.js` |
| **T007** | Implement 10-digit account number generator | `src/utils/generator.js` |
| **T008** | Implement global error handling middleware | `src/middleware/error.middleware.js` |
| **T009** | Configure `src/app.js` pipeline | `src/app.js` |

---

## Verification Plan
1. **Dependency Audit**: Verify `package.json` and run `npm list --depth=0` to confirm all 5 packages installed cleanly without peer conflicts.
2. **Utility Unit Smoke Tests**:
   - Run a Node script testing `currency.js` (`toCents(10.50) === 1050`, `toDollars(1050) === "$10.50"`).
   - Run a Node script verifying `generateAccountNumber()` generates a 10-digit string.
   - Run a Node script testing `ApiError` properties.
3. **HTTP & Error Middleware Verification**:
   - Start the server and send a request to an undefined route.
   - Assert the response returns a clean `404 Not Found` JSON object matching the standard error schema:
     ```json
     {
       "success": false,
       "error": {
         "code": "NOT_FOUND",
         "message": "Resource not found on this server"
       }
     }
     ```
