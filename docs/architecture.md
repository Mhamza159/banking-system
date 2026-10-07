# Banking Backend API — 10 System Architecture & Design Diagrams

**Document Version**: 2.0.0  
**Date**: 2026-09-14  
**Source of Truth**: [`.specify/specs/banking-backend-api/spec.md`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/.specify/specs/banking-backend-api/spec.md)  
**Status**: Formal Architectural Baseline

---

## 📋 Complete Diagram Coverage Matrix

| # | Diagram | Kyun chahiye? (Purpose) | File Link |
|---|---|---|---|
| **1** | **System / Application Flow Diagram** | **Poore project ka high-level user flow** samajhne ke liye | [`docs/diagrams/01-system-application-flow.mmd`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/docs/diagrams/01-system-application-flow.mmd) |
| **2** | **System Architecture Diagram** | Backend ke components ka structure aur layer separation | [`docs/diagrams/02-system-architecture.mmd`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/docs/diagrams/02-system-architecture.mmd) |
| **3** | **Database ER Diagram** | Models, collections aur foreign relationships | [`docs/diagrams/03-database-er.mmd`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/docs/diagrams/03-database-er.mmd) |
| **4** | **Authentication Sequence Diagram** | Register, Login, Bcrypt, JWT, aur Cookie ka actual execution | [`docs/diagrams/04-authentication-sequence.mmd`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/docs/diagrams/04-authentication-sequence.mmd) |
| **5** | **Transaction Sequence Diagram** | Transaction ke code execution, ACID session aur ledger writes ka flow | [`docs/diagrams/05-transaction-sequence.mmd`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/docs/diagrams/05-transaction-sequence.mmd) |
| **6** | **Transaction Activity Diagram** | Transaction ke decisions, validations, error branches aur forks | [`docs/diagrams/06-transaction-activity.mmd`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/docs/diagrams/06-transaction-activity.mmd) |
| **7** | **Transaction State Diagram** | Pending → Completed / Failed lifecycle state machine | [`docs/diagrams/07-transaction-state.mmd`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/docs/diagrams/07-transaction-state.mmd) |
| **8** | **Ledger & Balance Flow Diagram** | Ledger entries → Aggregation Pipeline → Derived Balance math | [`docs/diagrams/08-ledger-balance-flow.mmd`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/docs/diagrams/08-ledger-balance-flow.mmd) |
| **9** | **Logout / Blacklist Flow Diagram** | JWT revocation, MongoDB TTL index cleanup aur auth interception | [`docs/diagrams/09-logout-blacklist-flow.mmd`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/docs/diagrams/09-logout-blacklist-flow.mmd) |
| **10** | **Deployment Topology Diagram** | Nginx, Node.js PM2, Atlas 3-node Replica Set, DNS fallback aur SMTP | [`docs/diagrams/10-deployment-topology.mmd`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/docs/diagrams/10-deployment-topology.mmd) |

> [!TIP]
> **Interactive Viewer**: Open [`docs/diagrams/index.html`](file:///c:/Users/hamih/OneDrive/Desktop/AtoZ%20Coder/Advanced%20MERN/Banking%20System/docs/diagrams/index.html) in your browser to view all 10 diagrams rendered live with interactive tabs and zoom.

---

## 1. System / Application Flow Diagram

### Purpose:
Poore banking backend ka user lifecycle flow samajhne ke liye: Registration se account provision, initial deposit, transfer, balance derivation, transaction history, aur logout tak.

```mermaid
flowchart TD
    Start([User Starts / App Opened]) --> Register[1. Register User<br/>POST /api/v1/auth/register]
    Register --> AutoAcct[Auto-provision 10-digit Savings Account<br/>Account status: ACTIVE]
    AutoAcct --> WelcomeMail[Async: Send Welcome Email via Nodemailer]
    AutoAcct --> Login[2. Login<br/>POST /api/v1/auth/login]
    
    Login --> IssueCookie[Verify bcrypt hash & Issue HTTP-Only JWT Cookie]
    IssueCookie --> AuthState[Authenticated Session Active]

    AuthState --> Faucet[3. Initial Deposit / Faucet<br/>POST /api/v1/accounts/:id/deposit]
    Faucet --> WriteDepositLedger[Record CREDIT in Ledger<br/>Money enters system]
    WriteDepositLedger --> CheckBal1[4. Check Initial Balance<br/>GET /api/v1/accounts/:id/balance]
    CheckBal1 --> DeriveBal1[Aggregate Ledger: Credits - Debits]

    DeriveBal1 --> Transfer[5. Transfer Money<br/>POST /api/v1/transactions<br/>Header: Idempotency-Key]
    
    Transfer --> TxPipeline[Execute ACID Transaction in Mongo Session:<br/>- Check Idempotency<br/>- Verify Account Statuses<br/>- Aggregate Sender Balance<br/>- Create PENDING Transaction<br/>- Write DEBIT & CREDIT in Ledger<br/>- Update COMPLETED<br/>- Commit Session]

    TxPipeline --> TxAlerts[Async: Send Debit Alert to Sender<br/>& Credit Alert to Receiver]
    TxAlerts --> CheckBal2[6. Check Updated Balances<br/>Sender balance reduced, Receiver balance increased]

    CheckBal2 --> History[7. View Transaction History<br/>GET /api/v1/transactions/history]
    
    History --> Logout[8. Logout<br/>POST /api/v1/auth/logout]
    Logout --> BlacklistSave[Store JWT in Blacklist with Mongo TTL Index]
    BlacklistSave --> ClearCookie[Clear HTTP-Only Cookie]
    ClearCookie --> EndState([Logged Out - Old Token Revoked])

    classDef primary fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef action fill:#059669,stroke:#047857,stroke-width:2px,color:#fff;
    classDef security fill:#d97706,stroke:#b45309,stroke-width:2px,color:#fff;
    classDef finish fill:#64748b,stroke:#475569,stroke-width:2px,color:#fff;

    class Start,AuthState primary;
    class Register,AutoAcct,Login,Faucet,Transfer,History action;
    class IssueCookie,TxPipeline,BlacklistSave security;
    class EndState finish;
```

---

## 2. System Architecture Diagram

### Purpose:
Backend ke layered components ka structural separation: Client $\rightarrow$ Security Perimeter $\rightarrow$ Router $\rightarrow$ Middlewares $\rightarrow$ Controllers $\rightarrow$ Services $\rightarrow$ Mongoose Models $\rightarrow$ Database & Mail Server.

```mermaid
graph TB
    subgraph Client_Layer ["Client Layer"]
        Postman["Postman API Client / Web Frontend"]
    end

    subgraph Security_Perimeter ["Security & Network Perimeter"]
        CORS["CORS Middleware (Credentials Enabled)"]
        CookieParser["Cookie Parser Middleware"]
        JSONParser["Express JSON / URL-Encoded Body Parser"]
    end

    subgraph API_Gateway ["API Gateway & Routing Layer (/api/v1)"]
        Router["Express Router (src/routes)"]
        AuthRoutes["/auth (Public & Protected)"]
        AccountRoutes["/accounts (Protected)"]
        TxRoutes["/transactions (Protected)"]
        HealthRoute["/health (Public Monitor)"]
    end

    subgraph Middleware_Guards ["Middleware & Interceptors"]
        AuthMiddleware["authMiddleware (JWT Signature & Blacklist Check)"]
        ValidationMiddleware["validateMiddleware (Schema & Header Checks)"]
        ErrorMiddleware["errorMiddleware (Global Exception Boundary)"]
    end

    subgraph Controller_Layer ["Controller Layer (src/controllers)"]
        AuthCtrl["auth.controller.js"]
        AccountCtrl["account.controller.js"]
        TxCtrl["transaction.controller.js"]
    end

    subgraph Service_Layer ["Domain Service Layer (src/services)"]
        LedgerService["ledger.service.js (Aggregation & Invariants)"]
        EmailService["email.service.js (Async Worker)"]
    end

    subgraph Persistence_Layer ["Persistence Layer (Mongoose Models)"]
        UserModel["User Model"]
        AccountModel["Account Model"]
        TxModel["Transaction Model"]
        LedgerModel["Ledger Model (Append-Only)"]
        BlacklistModel["Blacklist Model (TTL Index)"]
    end

    subgraph External_Infrastructure ["External Infrastructure"]
        AtlasCluster[("MongoDB Atlas Replica Set")]
        SMTPServer["SMTP Mail Server (Nodemailer)"]
    end

    Postman -->|HTTPS Requests & Cookies| Security_Perimeter
    Security_Perimeter --> Router

    Router --> AuthRoutes
    Router --> AccountRoutes
    Router --> TxRoutes
    Router --> HealthRoute

    AuthRoutes --> AuthMiddleware
    AccountRoutes --> AuthMiddleware
    TxRoutes --> AuthMiddleware
    TxRoutes --> ValidationMiddleware

    AuthMiddleware --> AuthCtrl
    AuthMiddleware --> AccountCtrl
    AuthMiddleware --> TxCtrl
    ValidationMiddleware --> TxCtrl

    AuthCtrl --> UserModel
    AuthCtrl --> AccountModel
    AuthCtrl --> BlacklistModel
    AuthCtrl -.->|Async Fire-and-Forget| EmailService

    AccountCtrl --> AccountModel
    AccountCtrl --> LedgerService

    TxCtrl --> TxModel
    TxCtrl --> LedgerModel
    TxCtrl --> LedgerService
    TxCtrl -.->|Async Fire-and-Forget| EmailService

    LedgerService --> LedgerModel
    LedgerService --> AccountModel
    
    UserModel --> AtlasCluster
    AccountModel --> AtlasCluster
    TxModel --> AtlasCluster
    LedgerModel --> AtlasCluster
    BlacklistModel --> AtlasCluster

    EmailService --> SMTPServer

    AuthCtrl & AccountCtrl & TxCtrl & LedgerService -.->|Exceptions / Errors| ErrorMiddleware
    ErrorMiddleware -->|Standardized JSON Error Envelope| Postman

    classDef primary fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef database fill:#059669,stroke:#047857,stroke-width:2px,color:#fff;
    classDef security fill:#d97706,stroke:#b45309,stroke-width:2px,color:#fff;
    classDef external fill:#7c3aed,stroke:#6d28d9,stroke-width:2px,color:#fff;

    class Postman primary;
    class AtlasCluster database;
    class AuthMiddleware,BlacklistModel security;
    class SMTPServer external;
```

---

## 3. Database ER Diagram

### Purpose:
Database schemas, data types, indexes, unique constraints, and relationships. Highlights that `Account` contains **no mutable balance field**.

```mermaid
erDiagram
    User ||--o{ Account : "owns (1:N)"
    Account ||--o{ Transaction : "as sender"
    Account ||--o{ Transaction : "as receiver"
    Account ||--o{ Ledger : "has journal entries (1:N)"
    Transaction ||--|{ Ledger : "produces exactly two (1:2)"

    User {
        ObjectId _id PK
        String name "min: 2, max: 100"
        String email UK "RFC 5322 regex, lowercase, indexed"
        String password "bcrypt hash (10 rounds), select: false"
        String role "enum: CUSTOMER, ADMIN"
        Boolean isEmailVerified "default: false"
        Date createdAt "timestamp"
        Date updatedAt "timestamp"
    }

    Account {
        ObjectId _id PK
        ObjectId user FK "ref: User, indexed"
        String accountNumber UK "10-digit unique string, indexed"
        String accountType "enum: SAVINGS, CHECKING"
        String currency "enum: USD, EUR, PKR, GBP"
        String status "enum: ACTIVE, INACTIVE, SUSPENDED, FROZEN, indexed"
        Date createdAt "timestamp"
        Date updatedAt "timestamp"
    }

    Transaction {
        ObjectId _id PK
        String idempotencyKey UK "UUIDv4 unique, indexed"
        ObjectId senderAccount FK "ref: Account, indexed"
        ObjectId receiverAccount FK "ref: Account, indexed"
        Number amount "positive integer in minor units (cents)"
        String currency "default: USD"
        String status "enum: PENDING, COMPLETED, FAILED, indexed"
        String failureReason "null or error description"
        String note "max: 255 chars"
        Date createdAt "timestamp, indexed"
        Date updatedAt "timestamp"
    }

    Ledger {
        ObjectId _id PK
        ObjectId transactionId FK "ref: Transaction, indexed"
        ObjectId accountId FK "ref: Account, indexed"
        String type "enum: DEBIT, CREDIT"
        Number amount "positive integer in minor units (cents)"
        String description "audit memo"
        Date createdAt "timestamp (append-only, no updatedAt)"
    }

    Blacklist {
        ObjectId _id PK
        String token UK "raw JWT string, unique, indexed"
        Date expiresAt "TTL index (expireAfterSeconds: 0)"
        Date createdAt "timestamp"
    }
```

---

## 4. Authentication Sequence Diagram

### Purpose:
Register/Login/JWT/Cookie ka actual flow: Bcrypt password hashing, constant-time comparison, JWT generation, HTTP-only cookie setting, aur non-blocking welcome email.

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant AuthCtrl as Auth Controller
    participant UserMod as User Model
    participant AcctMod as Account Model
    participant JWT as JWT Engine
    participant Cookie as Cookie Dispatcher
    participant EmailSvc as Email Service

    Note over Client,EmailSvc: Part 1: User Registration
    Client->>AuthCtrl: POST /api/v1/auth/register { name, email, password }
    AuthCtrl->>UserMod: Check if email exists
    alt Email already in use
        UserMod-->>AuthCtrl: Duplicate found
        AuthCtrl-->>Client: 409 Conflict ("Email already registered")
    else Email available
        AuthCtrl->>UserMod: Save new User
        Note over UserMod: pre('save') hashes password using bcrypt (10 rounds)
        UserMod->>UserMod: Document saved
        AuthCtrl->>AcctMod: Auto-generate 10-digit number & create Savings Account
        AcctMod->>AcctMod: Account saved (status: ACTIVE)
        AuthCtrl->>EmailSvc: sendWelcomeEmail(user, account) [Async Non-blocking]
        AuthCtrl-->>Client: 201 Created { user, account, message }
    end

    Note over Client,EmailSvc: Part 2: User Login
    Client->>AuthCtrl: POST /api/v1/auth/login { email, password }
    AuthCtrl->>UserMod: findOne({ email }).select('+password')
    alt User not found
        AuthCtrl-->>Client: 401 Unauthorized ("Invalid email or password")
    else User exists
        AuthCtrl->>UserMod: user.comparePassword(password)
        alt Password Mismatch
            AuthCtrl-->>Client: 401 Unauthorized ("Invalid email or password")
        else Password Matches
            AuthCtrl->>JWT: sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' })
            JWT-->>AuthCtrl: Signed Token String
            AuthCtrl->>Cookie: Set-Cookie: token=token; HttpOnly; SameSite=Strict; Secure
            AuthCtrl-->>Client: 200 OK { token, user, message }
        end
    end
```

---

## 5. Transaction Sequence Diagram

### Purpose:
Transaction ke code execution ka flow: Client request se le kar MongoDB ACID session, aggregation check, double-entry writes, commit, aur async email alerts tak.

```mermaid
sequenceDiagram
    autonumber
    actor SenderClient as Sender Client
    participant AuthGuard as authMiddleware
    participant TxCtrl as Transaction Controller
    participant IdempEngine as Idempotency Engine
    participant LedgerSvc as Ledger Service
    participant MongoSession as MongoDB ACID Session
    participant EmailSvc as Email Service
    actor ReceiverClient as Receiver User

    SenderClient->>AuthGuard: POST /api/v1/transactions<br/>Headers: [Idempotency-Key: UUIDv4]<br/>Body: { senderAccountId, receiverAccountNumber, amountInCents, note }
    
    AuthGuard->>AuthGuard: Validate JWT & Blacklist
    AuthGuard->>TxCtrl: Forward sanitized request (req.user attached)

    TxCtrl->>IdempEngine: Query Transaction.findOne({ idempotencyKey })
    alt Key exists & status == COMPLETED
        IdempEngine-->>SenderClient: 200 OK (Return cached transaction receipt)
    else Key exists & status == PENDING
        IdempEngine-->>SenderClient: 409 Conflict ("Transaction is currently processing. Please wait.")
    else Key does not exist (New Request)
        TxCtrl->>TxCtrl: Validate senderAccountId belongs to req.user._id
        TxCtrl->>TxCtrl: Validate senderAccount != receiverAccount (Self-Transfer check)
        TxCtrl->>TxCtrl: Validate senderAccount.status == ACTIVE && receiverAccount.status == ACTIVE
        
        alt Account validation fails (Frozen, Suspended, or Not Found)
            TxCtrl-->>SenderClient: 400/403/404 Error (Specific domain failure code)
        else Accounts Valid & Active
            TxCtrl->>MongoSession: session = mongoose.startSession()<br/>session.startTransaction()
            Note over TxCtrl,MongoSession: ACID Transaction Boundary Begins
            
            TxCtrl->>LedgerSvc: getAccountBalance(senderAccountId, session)
            Note over LedgerSvc: Executes MongoDB Aggregation Pipeline inside session
            LedgerSvc-->>TxCtrl: availableBalanceInCents

            alt availableBalanceInCents < amountInCents
                TxCtrl->>MongoSession: session.abortTransaction()
                TxCtrl->>MongoSession: session.endSession()
                TxCtrl-->>SenderClient: 400 Bad Request ("INSUFFICIENT_FUNDS")
            else Sufficient Balance Available
                TxCtrl->>MongoSession: Create Transaction [status: PENDING]
                TxCtrl->>MongoSession: Insert Ledger Entry 1: [DEBIT, senderAccountId, amountInCents]
                TxCtrl->>MongoSession: Insert Ledger Entry 2: [CREDIT, receiverAccountId, amountInCents]
                TxCtrl->>MongoSession: Update Transaction [status: COMPLETED]
                
                TxCtrl->>MongoSession: session.commitTransaction()
                TxCtrl->>MongoSession: session.endSession()
                Note over TxCtrl,MongoSession: ACID Transaction Committed (Zero Data Loss)

                TxCtrl-->>SenderClient: 201 Created (Transaction Receipt, new balance)

                par Non-Blocking Asynchronous Notifications
                    TxCtrl->>EmailSvc: sendDebitAlert(senderUser, txReceipt)
                    EmailSvc-->>SenderClient: Send Debit Alert Email
                and
                    TxCtrl->>EmailSvc: sendCreditAlert(receiverUser, txReceipt)
                    EmailSvc-->>ReceiverClient: Send Credit Alert Email
                end
            end
        end
    end
```

---

## 6. Transaction Activity Diagram

### Purpose:
Transaction ke decisions, validations, error branches, forks, aur rollbacks samajhne ke liye complete activity flowchart.

```mermaid
flowchart TD
    Start([Start: Client Sends POST /api/v1/transactions]) --> CheckAuth{"Is Request Authenticated?"}
    
    CheckAuth -- No / Blacklisted --> Err401["Return 401 Unauthorized"]
    CheckAuth -- Yes --> CheckIdemp{"Idempotency-Key present & valid UUID?"}
    
    CheckIdemp -- No --> Err400Idemp["Return 400 Bad Request<br/>(Missing/Invalid Idempotency-Key)"]
    CheckIdemp -- Yes --> QueryIdemp[Query DB for existing Idempotency-Key]
    
    QueryIdemp --> ExistsIdemp{"Key Already Exists in DB?"}
    ExistsIdemp -- "Yes (COMPLETED)" --> ReturnReplay["Return 200 OK<br/>(Cached Idempotent Replay)"]
    ExistsIdemp -- "Yes (PENDING)" --> Err409["Return 409 Conflict<br/>(In-flight request currently processing)"]
    ExistsIdemp -- "Yes (FAILED)" --> ReturnFailedReceipt["Return 400 Bad Request<br/>(Prior failure reason)"]
    
    ExistsIdemp -- "No (New Transfer)" --> CheckAccounts{"Validate Accounts:<br/>1. Sender owned by caller?<br/>2. Sender != Receiver?<br/>3. Both Status == ACTIVE?"}
    
    CheckAccounts -- Invalid / Inactive --> ErrAccount["Return 400/403/404 Error<br/>(FROZEN, SUSPENDED, or SELF_TRANSFER)"]
    
    CheckAccounts -- Valid & Active --> StartSession["Start MongoDB ACID Session<br/>session.startTransaction()"]
    
    StartSession --> DeriveBal["Run Aggregation Pipeline inside Session:<br/>Calculate Sender Available Balance"]
    
    DeriveBal --> CheckBalance{"Available Balance >= Transfer Amount?"}
    
    CheckBalance -- No --> AbortSession["session.abortTransaction()<br/>session.endSession()"]
    AbortSession --> ErrFunds["Return 400 Bad Request<br/>(INSUFFICIENT_FUNDS)"]
    
    CheckBalance -- Yes --> WritePending["1. Create Transaction (status: PENDING)"]
    WritePending --> WriteDebit["2. Insert Ledger DEBIT (Sender Account, amount)"]
    WriteDebit --> WriteCredit["3. Insert Ledger CREDIT (Receiver Account, amount)"]
    WriteCredit --> WriteCompleted["4. Update Transaction (status: COMPLETED)"]
    
    WriteCompleted --> CommitSession["session.commitTransaction()<br/>session.endSession()"]
    
    CommitSession --> ForkAsync["Fork Post-Commit Actions"]
    
    ForkAsync --> Resp201["Return HTTP 201 Created<br/>(Transaction Receipt to Sender)"]
    ForkAsync --> AsyncDebitMail["Async: Send Debit Email Alert to Sender"]
    ForkAsync --> AsyncCreditMail["Async: Send Credit Email Alert to Receiver"]
    
    Resp201 --> Done([End: Transfer Completed])
    AsyncDebitMail --> Done
    AsyncCreditMail --> Done

    classDef error fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#991b1b;
    classDef success fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#166534;
    classDef step fill:#f0f9ff,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef decision fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;

    class Err401,Err400Idemp,Err409,ReturnFailedReceipt,ErrAccount,ErrFunds error;
    class ReturnReplay,Resp201,Done success;
    class StartSession,DeriveBal,WritePending,WriteDebit,WriteCredit,WriteCompleted,CommitSession,AsyncDebitMail,AsyncCreditMail step;
    class CheckAuth,CheckIdemp,ExistsIdemp,CheckAccounts,CheckBalance decision;
```

---

## 7. Transaction State Diagram

### Purpose:
Transaction entity ka finite state machine: `PENDING` $\rightarrow$ `COMPLETED` / `FAILED`, in-flight locks, and immutable terminal states.

```mermaid
stateDiagram-v2
    [*] --> PENDING : Transaction initiated with unique Idempotency-Key

    state PENDING {
        [*] --> InFlight : Idempotency lock active
        InFlight --> CheckingBalance : Session opened
        CheckingBalance --> WritingLedger : Balance verified >= amount
    }

    PENDING --> COMPLETED : Debit and Credit written & session.commitTransaction()
    PENDING --> FAILED : Insufficient funds OR Account inactive OR DB session abort

    state COMPLETED {
        [*] --> FinalStateSuccess : Immutable terminal state
        FinalStateSuccess --> CachedReplay : Replayed with same Idempotency-Key -> Returns 200 OK
    }

    state FAILED {
        [*] --> FinalStateFailure : Immutable terminal state
        FinalStateFailure --> ErrorReplay : Replayed with same Idempotency-Key -> Returns cached failure
    }

    COMPLETED --> [*]
    FAILED --> [*]

    note right of PENDING
        If a second request arrives while in PENDING,
        the system returns HTTP 409 Conflict.
    end note

    note right of COMPLETED
        Once COMPLETED, ledger entries cannot be mutated.
        Reversals must be executed as a new REFUND transaction.
    end note
```

---

## 8. Ledger & Balance Flow Diagram

### Purpose:
Ledger $\rightarrow$ Aggregation $\rightarrow$ Balance samajhne ke liye: Double-entry bookkeeping rules ($Debit = Credit$) aur MongoDB 3-stage Aggregation Pipeline ($Credits - Debits$).

```mermaid
flowchart TD
    subgraph Transaction_Event ["Transfer Event: USD 50.00 (5,000 cents) from Account A to Account B"]
        direction LR
        Tx["Transaction: tx_98124<br/>Amount: 5,000 cents"]
    end

    subgraph Ledger_Journal ["Append-Only Ledger Collection (Immutable)"]
        direction TB
        E1["Ledger Entry #1<br/>accountId: Account A<br/>type: DEBIT<br/>amount: 5,000<br/>txId: tx_98124"]
        E2["Ledger Entry #2<br/>accountId: Account B<br/>type: CREDIT<br/>amount: 5,000<br/>txId: tx_98124"]
    end

    subgraph Mathematical_Proof ["Zero-Sum Conservation Rule"]
        Proof["Sum of Debits (5,000) = Sum of Credits (5,000)<br/>Net System Balance Delta = USD 0.00"]
    end

    subgraph Aggregation_Pipeline ["MongoDB Aggregation Pipeline: getAccountBalance(AccountId)"]
        direction TB
        Stage1["Stage 1: Match Filter<br/>account equals Account A"]
        Stage2["Stage 2: Group Aggregator<br/>Calculate totalCredits and totalDebits"]
        Stage3["Stage 3: Project Result<br/>balance equals totalCredits minus totalDebits"]
        Stage1 --> Stage2 --> Stage3
    end

    subgraph RealTime_Result ["Derived Account A Balance"]
        Result["Available Balance = totalCredits minus totalDebits<br/>(e.g., 50,000 minus 5,000 = 45,000 cents / USD 450.00)"]
    end

    Tx --> E1
    Tx --> E2
    E1 & E2 --- Mathematical_Proof
    E1 --> Stage1
    Stage3 --> Result

    classDef ledger fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef math fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef agg fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#15803d;

    class E1,E2 ledger;
    class Proof math;
    class Stage1,Stage2,Stage3,Result agg;
```

---

## 9. Logout / Blacklist Flow Diagram

### Purpose:
JWT blacklist aur logout ka flow: Token expiry extraction, MongoDB TTL index par save, cookie clearing, aur subsequent requests ka immediate 401 rejection.

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant AuthCtrl as Auth Controller
    participant JWT as JWT Engine
    participant BlacklistMod as Blacklist Model (MongoDB)
    participant AuthMiddleware as authMiddleware
    participant ProtectedRoute as Protected Route (/api/v1/accounts/me)

    Note over Client,ProtectedRoute: Step 1: User Calls Logout API
    Client->>AuthCtrl: POST /api/v1/auth/logout<br/>Cookie: [token=eyJhbGciOi...]
    AuthCtrl->>JWT: jwt.decode(token) -> extract exp timestamp
    AuthCtrl->>BlacklistMod: create({ token: token, expiresAt: new Date(exp * 1000) })
    BlacklistMod-->>AuthCtrl: Blacklist record saved with TTL index
    AuthCtrl->>Client: 200 OK + Clear-Cookie: token

    Note over Client,ProtectedRoute: Step 2: Attacker or Client Re-uses Old Token
    Client->>AuthMiddleware: GET /api/v1/accounts/me<br/>Headers: [Authorization: Bearer eyJhbGciOi...] or Stale Cookie
    AuthMiddleware->>BlacklistMod: findOne({ token: token })
    alt Token Found in Blacklist Collection
        BlacklistMod-->>AuthMiddleware: Document Exists
        AuthMiddleware-->>Client: 401 Unauthorized<br/>{ error: "Token has been revoked. Please log in again." }
    else Token Not Found & Valid
        AuthMiddleware->>ProtectedRoute: Forward Request (req.user attached)
    end

    Note over BlacklistMod: Step 3: Automatic Background Cleanup
    Note over BlacklistMod: MongoDB background TTL thread scans expiresAt index (every 60s).<br/>When expiresAt < Date.now(), MongoDB deletes the blacklisted document automatically.<br/>Zero database memory leak!
```

---

## 10. Deployment Topology Diagram

### Purpose:
Production environment topology: Nginx reverse proxy, Node.js process cluster, public DNS resolvers (8.8.8.8), MongoDB Atlas 3-node Replica Set, aur SMTP server.

```mermaid
graph LR
    subgraph Client_Network ["External Internet"]
        WebClients["Browser / Mobile Apps"]
        PostmanClient["Postman Automated Test Suite"]
    end

    subgraph Host_Server ["Production Server Environment (Node.js v20+)"]
        direction TB
        Nginx["Reverse Proxy / TLS Termination (Port 443 HTTPS)"]
        
        subgraph Process_Cluster ["Application Process Layer"]
            AppInstance["Express.js Server (Port 3000)<br/>PM2 / Docker Managed"]
            DNSConfig["Node.js DNS Resolver<br/>dns.setServers(['8.8.8.8', '8.8.4.4'])"]
            EnvConfig["dotenv (.env)<br/>PORT, MONGO_URI, JWT_SECRET, SMTP_*"]
        end
    end

    subgraph MongoDB_Cloud ["MongoDB Atlas Cloud (AWS / GCP)"]
        direction TB
        PrimaryNode[("Primary Node (Read/Write)")]
        Secondary1[("Secondary Replica 1")]
        Secondary2[("Secondary Replica 2")]
        
        PrimaryNode <-->|Replication Oplog| Secondary1
        PrimaryNode <-->|Replication Oplog| Secondary2
    end

    subgraph SMTP_Cloud ["Email Service Provider"]
        MailServer["SMTP Gateway (TLS Port 587/465)<br/>Gmail / SendGrid / Mailtrap"]
    end

    WebClients & PostmanClient -->|HTTPS + Encrypted Cookies| Nginx
    Nginx -->|Reverse Proxy HTTP:3000| AppInstance
    
    AppInstance -.-> DNSConfig
    AppInstance -.-> EnvConfig
    
    DNSConfig -->|Resolves SRV Records| AppInstance
    AppInstance -->|TLS MongoDB Wire Protocol (Port 27017)| PrimaryNode
    AppInstance -->|SMTP Protocols| MailServer

    classDef server fill:#f8fafc,stroke:#475569,stroke-width:2px;
    classDef db fill:#ecfdf5,stroke:#059669,stroke-width:2px;
    classDef mail fill:#faf5ff,stroke:#7c3aed,stroke-width:2px;

    class Host_Server server;
    class MongoDB_Cloud db;
    class SMTP_Cloud mail;
```
