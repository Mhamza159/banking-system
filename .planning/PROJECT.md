# Complete MERN Banking System — Project Definition

## Executive Summary
A production-grade, enterprise-ready full-stack MERN Banking Application. The system combines:
1. **Robust Backend API** (Milestone 1, 100% Complete & Verified): Node.js, Express, MongoDB Atlas multi-document ACID transactions, append-only double-entry ledger, dynamic balance derivation via aggregation pipelines, and server-side token blacklisting.
2. **Industry-Standard React Frontend** (Milestone 2, Active Milestone): React 18+, Vite, Tailwind CSS, React Router v6, Axios (`withCredentials: true`), and Lucide React. Delivers an executive financial cockpit with live balance aggregation, 2-step transfer confirmation with UUID v4 idempotency keys, multi-account switching, and dark glassmorphic aesthetics inspired by Revolut and Mercury.

## Sources of Truth
All implementation phases strictly adhere to the Spec Kit and Archify artifacts:
- **Frontend Specification**: [`.specify/specs/banking-frontend-react/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/banking-frontend-react/spec.md)
- **Frontend Technical Plan**: [`.specify/specs/banking-frontend-react/plan.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/banking-frontend-react/plan.md)
- **Frontend Tasks Breakdown (55 Tasks)**: [`.specify/specs/banking-frontend-react/tasks.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/banking-frontend-react/tasks.md)
- **Frontend Architecture & 8 Diagrams**: [`docs/frontend-architecture.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/docs/frontend-architecture.md) & [`docs/diagrams/frontend/index.html`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/docs/diagrams/frontend/index.html)
- **Backend Architecture & Baseline**: [`docs/architecture.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/docs/architecture.md) & [`.specify/specs/banking-backend-api/`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/banking-backend-api/)

## Full Tech Stack
- **Client (Frontend)**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React, UUID
- **Server (Backend)**: Node.js (v20+), Express.js (v5.x), Mongoose (v9.x), Nodemailer
- **Database**: MongoDB Atlas Replica Set (Primary-Secondary-Secondary)
- **Security & Session**: HTTP-only `SameSite=Strict` cookies, Bcrypt (10 rounds), MongoDB Blacklist TTL index, RFC 4122 UUID v4 Idempotency keys
- **Styling Philosophy**: FinTech-grade dark theme (`#090D16`), Financial Emerald (`#10B981`), Electric Indigo (`#6366F1`), and glassmorphic card surfaces (`backdrop-blur-md`).

## Non-Negotiable Core Invariants
1. **Zero Modification to Existing Backend**: The verified backend remains intact. No backend modifications unless an explicit integration blocking issue is identified.
2. **Financial Precision**: All monetary values are rendered from integer cents. Zero floating-point drift in client calculations.
3. **Double-Click & Idempotency Protection**: Every money transfer generates a client-side UUID v4 `Idempotency-Key` header, locks the submit button with a spinner, and presents a 2-step confirmation modal before execution.
4. **No Mocking**: 100% of data rendered in the application originates from live MongoDB Atlas backend endpoints.
5. **Session Safety & Revocation**: Respects server-side session termination via `POST /api/v1/auth/logout`.
