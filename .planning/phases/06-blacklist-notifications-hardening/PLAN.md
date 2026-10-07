# Phase 6 Plan: Token Blacklisting, Nodemailer Notifications, Postman Suite & Hardening

**Phase**: 06-blacklist-notifications-hardening  
**Goal**: Complete server-side token revocation on logout using MongoDB TTL index, non-blocking email alerts via Nodemailer, Postman test collection updates, and production hardening.  
**Tasks Covered**: T035 through T048 from `.specify/specs/banking-backend-api/tasks.md`

---

## Technical Context & Scope

### 1. Token Blacklisting with MongoDB TTL (`src/models/blacklist.model.js`)
- JWTs are stateless by default. To implement real server-side logout, blacklisted tokens are stored in MongoDB.
- Schema fields:
  - `token`: String, required, unique, indexed.
  - `expiresAt`: Date, required, indexed with `{ expireAfterSeconds: 0 }` (MongoDB automatically removes expired tokens when their lifetime is over, preventing indefinite database bloat).
- Updates to `src/middleware/auth.middleware.js`:
  - Check `Blacklist.findOne({ token })` on every authenticated request.
  - If token is found, immediately reject with `401 Unauthorized` ("Token has been revoked").
- Add `authController.logout`:
  - Extracts token from request.
  - Decodes token `exp` timestamp and saves it to `Blacklist`.
  - Clears `token` HTTP-only cookie.
  - Returns `200 OK`.

### 2. Asynchronous Email Notification Subsystem (`src/config/email.js`, `src/services/email.service.js`)
- `src/config/email.js`:
  - Configures Nodemailer transport with environment credentials.
  - Provides a safe development/test fallback logger if SMTP credentials are not configured.
- `src/services/email.service.js`:
  - `sendWelcomeEmail(user)`: Welcomes customer upon registration.
  - `sendDebitAlert(senderUser, amount, receiverAccountNumber, balance)`: Transaction alert on money sent.
  - `sendCreditAlert(receiverUser, amount, senderAccountNumber, balance)`: Transaction alert on money received.
- Non-blocking execution:
  - Dispatched asynchronously with `.catch(err => console.error("Email error:", err))` so email latency or SMTP issues NEVER block or slow down HTTP responses.

### 3. Production Hardening & Postman Suite
- Enable CORS with credentials support in `src/app.js`.
- Add `POST /api/v1/auth/logout` to Postman collection.
- Automated verification script (`scripts/verify-phase6.js`).

---

## Execution Plan & Task Breakdown

| Task ID | Description | Target File |
|---|---|---|
| **T035** | Create `Blacklist` schema with unique `token` and `expiresAt` TTL index | `src/models/blacklist.model.js` |
| **T036** | Update `authMiddleware` to check `Blacklist` collection | `src/middleware/auth.middleware.js` |
| **T037** | Implement `authController.logout` saving token to blacklist and clearing cookie | `src/controllers/auth.controller.js` |
| **T038** | Expose `POST /api/v1/auth/logout` route | `src/routes/auth.routes.js` |
| **T039** | Configure Nodemailer transport with dev/test fallback logger | `src/config/email.js` |
| **T040–T042** | Implement `emailService` (welcome, debit alert, credit alert) | `src/services/email.service.js` |
| **T043** | Integrate non-blocking email dispatch into `register` and `transfer` | `src/controllers/auth.controller.js`<br/>`src/controllers/transaction.controller.js` |
| **T044–T046** | Update Postman collection, CORS configuration, and security headers | `src/app.js`<br/>`postman/Banking-Backend-API.postman_collection.json` |
| **T047–T048** | End-to-end automated verification script | `scripts/verify-phase6.js` |

---

## Verification Plan

### Automated Verification Script (`scripts/verify-phase6.js`)
1. **Logout & Blacklist Revocation**:
   - Register user -> Login -> Call `POST /api/v1/auth/logout`.
   - Assert HTTP 200 OK and cookie cleared.
   - Assert token document exists in MongoDB `Blacklist` with TTL date.
   - Re-use the revoked token -> Assert HTTP 401 Unauthorized ("Token has been revoked").
2. **Email Subsystem Triggering**:
   - Register customer -> Verify `sendWelcomeEmail` dispatched.
   - Perform transfer -> Verify `sendDebitAlert` and `sendCreditAlert` dispatched.
3. **CORS & Hardening**:
   - Verify OPTIONS / pre-flight headers and health check.
