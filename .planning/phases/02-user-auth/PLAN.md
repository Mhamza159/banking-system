# Phase 2 Plan: User Model, Authentication & JWT Cookie Session

**Phase**: 02-user-auth  
**Goal**: User registration with RFC 5322 regex-validated emails and bcrypt-hashed passwords (10 rounds), login with constant-time password comparison, JWT generation, HTTP-only SameSite: Strict cookie dispatcher, protected profile endpoint (`/me`), and foundational auth guard.  
**Tasks Covered**: T010 through T016 from `.specify/specs/banking-backend-api/tasks.md`

---

## Technical Context & Scope

Phase 2 establishes the core authentication perimeter of the banking system. It ensures that user credentials are encrypted before hitting MongoDB, JWT tokens are securely scoped and signed, and tokens are protected from client-side XSS attacks via HTTP-only cookies.

### 1. User Mongoose Model (`src/models/user.model.js`)
- **Fields**:
  - `name`: String, required, trim, minlength: 2, maxlength: 100.
  - `email`: String, required, unique, lowercase, trim, indexed, validated with RFC 5322 regex (`/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/`).
  - `password`: String, required, minlength: 8, `select: false` (ensures hash is never exposed in standard queries).
  - `role`: String, enum from `src/constants/roles.js` (`CUSTOMER`, `ADMIN`), default `CUSTOMER`.
  - `isEmailVerified`: Boolean, default `false`.
  - `timestamps: true`, `versionKey: false`.
- **Mongoose Hooks**:
  - `pre('save')`: Hashes `password` using `bcrypt.hash(this.password, 10)` only when modified or newly created.
- **Instance Methods**:
  - `comparePassword(candidatePassword)`: Compares candidate password against the stored bcrypt hash using `bcrypt.compare`.

### 2. Token & Cookie Helpers (`src/utils/token.js`)
- `generateToken(payload)`: Signs JWT containing `{ id: user._id, role: user.role }` with `process.env.JWT_SECRET` and expiration (`process.env.JWT_EXPIRES_IN || "24h"`).
- `sendTokenResponse(user, statusCode, res, message)`:
  - Generates token.
  - Sets HTTP-only, `sameSite: 'strict'`, `secure: process.env.NODE_ENV === 'production'` cookie named `token`.
  - Dispatches standardized `ApiResponse.success` containing sanitized user details (excluding password).

### 3. Authentication Controller (`src/controllers/auth.controller.js`)
- `register`:
  - Validates required inputs (`name`, `email`, `password`).
  - Checks if email is already registered; returns `409 Conflict` if duplicate.
  - Creates user in MongoDB (password automatically hashed by pre-save hook).
  - Returns `201 Created` with sanitized user object and dispatches auth cookie.
- `login`:
  - Validates email & password presence.
  - Fetches user explicitly selecting `+password`.
  - Verifies credentials via `user.comparePassword()`. Returns `401 Unauthorized` with generic message if invalid.
  - Returns `200 OK` with auth cookie and user info.
- `getProfile`:
  - Returns currently authenticated user details (`req.user`) via `ApiResponse.success`.

### 4. Authentication Middleware (`src/middleware/auth.middleware.js`)
- Extracts JWT from `req.cookies.token` or `Authorization: Bearer <token>` header.
- Rejects missing tokens with `401 Unauthorized` (`"Authentication token required"`).
- Verifies JWT validity and decodes payload.
- Attaches authenticated user object to `req.user`.

### 5. Routing Layer (`src/routes/auth.routes.js`, `src/routes/index.js`, `src/app.js`)
- `src/routes/auth.routes.js`:
  - `POST /register` -> `authController.register`
  - `POST /login` -> `authController.login`
  - `GET /me` -> `authMiddleware`, `authController.getProfile`
- `src/routes/index.js`:
  - Master v1 router aggregating all feature routes (`router.use('/auth', authRoutes)`).
- `src/app.js`:
  - Mounts `/api/v1` router before the 404 handler.

---

## Execution Plan & Task Breakdown

| Task ID | Description | Target File |
|---|---|---|
| **T010** | Create `User` Mongoose schema with email regex & `password.select: false` | `src/models/user.model.js` |
| **T011** | Add Mongoose `pre('save')` bcrypt hashing hook | `src/models/user.model.js` |
| **T012** | Add `comparePassword` instance method | `src/models/user.model.js` |
| **T013** | Implement JWT and cookie helper utilities | `src/utils/token.js` |
| **T014** | Implement `authMiddleware` JWT verification guard | `src/middleware/auth.middleware.js` |
| **T015** | Implement `authController` (`register`, `login`, `getProfile`) | `src/controllers/auth.controller.js` |
| **T016** | Create auth routes & mount `/api/v1/auth` in `src/app.js` | `src/routes/auth.routes.js`<br/>`src/routes/index.js`<br/>`src/app.js` |

---

## Verification Plan

### Automated Verification Script (`scripts/verify-phase2.js`)
1. **User Model & Bcrypt Salt Smoke Test**:
   - Create test user instance, assert password is converted to bcrypt hash (`$2b$10$...`).
   - Test `comparePassword("correct")` -> returns `true`.
   - Test `comparePassword("wrong")` -> returns `false`.
2. **Registration HTTP Test**:
   - Send `POST /api/v1/auth/register` with test user.
   - Assert `201 Created` status, response has `success: true`, password field is omitted, and `Set-Cookie` contains `token`.
3. **Duplicate Email Rejection Test**:
   - Send duplicate `POST /api/v1/auth/register` with identical email.
   - Assert `409 Conflict` status with descriptive error envelope.
4. **Login HTTP Test**:
   - Send `POST /api/v1/auth/login` with correct credentials -> Assert `200 OK` and `Set-Cookie` header.
   - Send `POST /api/v1/auth/login` with wrong password -> Assert `401 Unauthorized`.
5. **Protected Profile (`/me`) Test**:
   - Send `GET /api/v1/auth/me` with cookie -> Assert `200 OK` and user profile returned.
   - Send `GET /api/v1/auth/me` without cookie -> Assert `401 Unauthorized`.
