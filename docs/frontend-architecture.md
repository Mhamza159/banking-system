# Banking Frontend React — 8 Architectural & Design Diagrams

**Document Version**: 1.0.0  
**Date**: 2026-09-15  
**Source of Truth**: [`.specify/specs/banking-frontend-react/spec.md`](../.specify/specs/banking-frontend-react/spec.md) & [`.specify/specs/banking-frontend-react/plan.md`](../.specify/specs/banking-frontend-react/plan.md)  
**Status**: Formal Frontend Architectural Baseline

---

## 📋 Complete Diagram Coverage Matrix

| # | Diagram | Kyun zaroori hai? (Purpose & Value) | Diagram File |
|---|---|---|---|
| **1** | **Frontend Architecture Diagram** | Pure client app ka high-level structure, routing, context, Axios, aur backend integration samajhne ke liye | [`docs/diagrams/frontend/01-frontend-architecture.mmd`](diagrams/frontend/01-frontend-architecture.mmd) |
| **2** | **Application / User Flow Diagram** | Landing se Registration, Login, Faucet deposit, 2-step transfer, statement filtering, aur logout ka end-to-end user journey | [`docs/diagrams/frontend/02-frontend-application-flow.mmd`](diagrams/frontend/02-frontend-application-flow.mmd) |
| **3** | **Component Architecture Diagram** | Reusable components ka tree: Layouts, Guards, Domain components (BalanceCard, TransferModal, TransactionTable), aur UI Primitives | [`docs/diagrams/frontend/03-frontend-component-architecture.mmd`](diagrams/frontend/03-frontend-component-architecture.mmd) |
| **4** | **Authentication & Session Flow** | Registration, Login, HTTP-only cookies, page reload par `/auth/me` se session hydration, aur logout par token blacklisting | [`docs/diagrams/frontend/04-frontend-authentication-flow.mmd`](diagrams/frontend/04-frontend-authentication-flow.mmd) |
| **5** | **Transaction & Idempotency Flow** | Transfer form validation, 2-step review modal, UUID v4 Idempotency Key, double-click locking, aur instant receipt rendering | [`docs/diagrams/frontend/05-frontend-transaction-flow.mmd`](diagrams/frontend/05-frontend-transaction-flow.mmd) |
| **6** | **API Integration & Error Flow** | Axios client ka pipeline: credentials, headers, 200 data unwrapping, 400 inline errors, 401 logout redirect, aur 500 error masking | [`docs/diagrams/frontend/06-frontend-api-integration-flow.mmd`](diagrams/frontend/06-frontend-api-integration-flow.mmd) |
| **7** | **State Management Flow** | Global Contexts (`AuthContext`, `BankingContext`, `ToastContext`) aur local state ke darmiyan reactive balance synchronization | [`docs/diagrams/frontend/07-frontend-state-management-flow.mmd`](diagrams/frontend/07-frontend-state-management-flow.mmd) |
| **8** | **Responsive Layout Flow** | Desktop ($\ge 1024px$) vs Mobile ($< 1024px$) layout differences: Fixed sidebar vs slide-over drawer, tables vs mobile cards | [`docs/diagrams/frontend/08-frontend-responsive-layout-flow.mmd`](diagrams/frontend/08-frontend-responsive-layout-flow.mmd) |

> [!TIP]
> **Live Interactive Viewer**: Open [`docs/diagrams/frontend/index.html`](diagrams/frontend/index.html) in your web browser to view all 8 diagrams rendered live with tabbed switching, zoom, and dark theme styling.

---

## 1. Frontend Architecture Diagram

### Purpose & Explanation (Kyun zaroori hai?):
Yeh diagram pure React + Vite frontend ka high-level bird's-eye view deta hai: Viewport layer se le kar Routing, Layout wrappers, Pages, Global Contexts, Centralized Axios Client, Transport Security Boundary, aur MongoDB Atlas backend tak.

```mermaid
flowchart TB
    subgraph Client["Client Browser (React 18 SPA + Vite)"]
        subgraph Viewport["Responsive Viewport Layer"]
            Desktop["Desktop View (>= 1024px)"]
            Mobile["Mobile / Tablet (< 1024px)"]
        end

        subgraph Routing["Routing & Security Guards (React Router v6)"]
            Router["AppRoutes"]
            PublicRoute["Public Routes (Landing /)"]
            GuestRoute["GuestGuard (/login, /register)"]
            AuthRoute["AuthGuard (/dashboard, /accounts, /transfer, /tx)"]
        end

        subgraph Layouts["Layout Architecture"]
            AppShell["AppLayout (Root + ToastContainer)"]
            AuthLayout["AuthLayout (Split Branded Panel)"]
            DashLayout["DashboardLayout (Sidebar + Header + Main)"]
        end

        subgraph Pages["Application Pages"]
            Landing["LandingPage"]
            Login["LoginPage"]
            Register["RegisterPage"]
            Dashboard["DashboardPage"]
            Accounts["AccountsPage"]
            Transfer["TransferPage"]
            Transactions["TransactionsPage"]
            Profile["ProfilePage"]
        end

        subgraph StateLayer["State Management Architecture"]
            AuthCtx["AuthContext (User, Session, Logout)"]
            BankCtx["BankingContext (Accounts, Active Account, Sync)"]
            ToastCtx["ToastContext (Global Notifications)"]
            LocalState["Component State (Forms, Modals, Filters)"]
        end

        subgraph Primitives["Reusable Design System Primitives"]
            Buttons["Button (Variants + Loading)"]
            Inputs["Input & Select (Validation)"]
            Modals["Modal (Focus Trap + Backdrop)"]
            Cards["Card (Glassmorphic Surface)"]
            Badges["Badge (Status Colors)"]
            Money["MoneyDisplay (Cents Formatter)"]
            Skeletons["Skeleton (Shimmer Loaders)"]
        end

        subgraph APILayer["API Integration Layer"]
            AxiosClient["Central Axios Client (withCredentials: true)"]
            AuthService["authService"]
            AccountService["accountService"]
            TxService["transactionService"]
            InterceptorReq["Request Interceptor (Idempotency-Key)"]
            InterceptorRes["Response Interceptor (ApiError & 401 Handler)"]
        end
    end

    subgraph SecurityBoundary["Transport & Security Protocols"]
        CookieSec["HTTP-Only Cookie (token)"]
        IdempHeader["Header: Idempotency-Key (UUID v4)"]
        CORSSec["CORS with Credentials (Origin Mirrored)"]
    end

    subgraph BackendSystem["Banking Backend Infrastructure (:3000)"]
        ExpressApp["Express.js Server (src/app.js)"]
        AuthMiddleware["authMiddleware (Cookie/Bearer + Blacklist)"]
        FeatureControllers["Auth, Account & Tx Controllers"]
        MongoAtlas[("MongoDB Atlas Replica Set\n- Users, Accounts\n- Append-Only Ledger\n- Transactions (ACID)\n- Blacklist (TTL Index)")]
    end

    Viewport --> Routing
    Routing --> Layouts
    Layouts --> Pages
    Pages --> Primitives
    Pages --> StateLayer
    StateLayer --> APILayer
    APILayer --> AxiosClient
    AxiosClient --> InterceptorReq
    AxiosClient --> InterceptorRes
    InterceptorReq --> SecurityBoundary
    SecurityBoundary --> BackendSystem
    BackendSystem --> MongoAtlas

    classDef client fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef state fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    classDef api fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc;
    classDef security fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#f8fafc;
    classDef backend fill:#1e293b,stroke:#94a3b8,stroke-width:2px,color:#f8fafc;

    class Client,Pages,Primitives,Layouts client;
    class StateLayer,AuthCtx,BankCtx,ToastCtx state;
    class APILayer,AxiosClient,AuthService,AccountService,TxService api;
    class SecurityBoundary,CookieSec,IdempHeader,CORSSec security;
    class BackendSystem,ExpressApp,AuthMiddleware,FeatureControllers,MongoAtlas backend;
```

---

## 2. Application / User Flow Diagram

### Purpose & Explanation (Kyun zaroori hai?):
Yeh diagram customer ka complete end-to-end journey dikhata hai: Landing page dekhne se account open karna, Faucet se paise deposit karna, real-time balance check karna, 2-step confirmation ke sath paisay transfer karna, statements dekhna, aur logout tak.

```mermaid
flowchart TD
    Start(["User Lands on Banking App"]) --> LandingPage["1. Public Landing Page (/)<br/>- Hero Banner & Trust Indicators<br/>- Security Architecture Overview<br/>- Real-time Currency Ticker Preview"]

    LandingPage -->|New Customer| RegFlow["2. Register (/register)<br/>- Enter Name, Email & Password<br/>- Live Password Strength Indicator"]
    LandingPage -->|Existing Customer| LoginFlow["3. Login (/login)<br/>- Enter Email & Password<br/>- Inline Client Validation"]

    RegFlow --> SubmitReg["Submit Registration<br/>POST /api/v1/auth/register"]
    SubmitReg --> AutoProvision["Backend Auto-provisions 10-digit Savings Account<br/>Status: ACTIVE, Currency: USD"]
    AutoProvision --> SetAuthSession["Set HTTP-only Cookie + Update AuthContext"]
    
    LoginFlow --> SubmitLogin["Submit Login<br/>POST /api/v1/auth/login"]
    SubmitLogin --> SetAuthSession

    SetAuthSession --> Dashboard["4. Dashboard (/dashboard)<br/>- Fetch Accounts: GET /accounts/me<br/>- Derive Live Balance: GET /accounts/:id/balance<br/>- Fetch Recent Tx: GET /transactions/history"]

    subgraph CoreActions["Dashboard Quick Actions & Navigation"]
        Dashboard --> ActionDeposit["Action: Deposit via Sandbox Faucet"]
        Dashboard --> ActionNewAccount["Action: Open Secondary Account"]
        Dashboard --> ActionTransfer["Action: Send Money"]
        Dashboard --> ActionHistory["Action: View Statements"]
        Dashboard --> ActionProfile["Action: View Profile & Security"]
    end

    ActionDeposit --> FaucetModal["Faucet Deposit Modal<br/>- Select Account<br/>- Choose $50, $100, $500 chips<br/>- POST /accounts/:id/deposit"]
    FaucetModal --> UpdateBalance1["Backend records CREDIT in Ledger<br/>Live Balance updated ($Credits - $Debits)"]
    UpdateBalance1 --> Dashboard

    ActionNewAccount --> NewAccModal["Open Account Modal<br/>- Select CHECKING<br/>- POST /accounts"]
    NewAccModal --> RenderAccList["Account list refreshed in BankingContext"]
    RenderAccList --> Dashboard

    ActionTransfer --> TransferPage["5. Transfer Workflow (/transfer)<br/>- Select Source Account<br/>- Select Internal/External Recipient<br/>- Enter Amount ($) -> Converted to Cents<br/>- Live Balance Check (Disable if > Balance)"]
    TransferPage --> ReviewModal["6. Two-Step Confirmation Modal<br/>- Summary: From, To, Fee ($0.00), Net Debit<br/>- Generates RFC 4122 UUID v4 Idempotency Key"]
    ReviewModal --> ExecuteTransfer["7. Confirm & Send<br/>- Button Locked + Spinner rendered<br/>- Header: Idempotency-Key<br/>- POST /transactions/transfer"]
    ExecuteTransfer --> ACIDCommit["Backend multi-document ACID execution:<br/>- Sender balance verified in session<br/>- Writes DEBIT & CREDIT ledger entries<br/>- Commits MongoDB session"]
    ACIDCommit --> TxReceipt["8. Transaction Receipt Modal<br/>- Displays Tx ID, Status: COMPLETED<br/>- Live sender balance updated"]
    TxReceipt --> Dashboard

    ActionHistory --> TxPage["9. Transactions Journal (/transactions)<br/>- Paginated Table (page, limit)<br/>- Filter by status (ALL, COMPLETED, PENDING, FAILED)<br/>- Click row -> Single Tx Receipt Modal"]

    ActionProfile --> ProfilePage["10. Profile & Security (/profile)<br/>- Credentials, Verification Badge<br/>- Click 'Logout & Revoke Session'"]
    ProfilePage --> LogoutAction["POST /api/v1/auth/logout<br/>- Writes token to MongoDB Blacklist TTL<br/>- Clears HTTP-only cookie<br/>- Wipes AuthContext"]
    LogoutAction --> RedirectLogin["Redirect to /login<br/>(Old token cannot be reused)"]

    classDef public fill:#0369a1,stroke:#0284c7,stroke-width:2px,color:#fff;
    classDef auth fill:#4338ca,stroke:#6366f1,stroke-width:2px,color:#fff;
    classDef dashboard fill:#065f46,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef transfer fill:#854d0e,stroke:#eab308,stroke-width:2px,color:#fff;
    classDef finish fill:#1e293b,stroke:#64748b,stroke-width:2px,color:#fff;

    class Start,LandingPage public;
    class RegFlow,LoginFlow,SubmitReg,SubmitLogin,SetAuthSession,AutoProvision auth;
    class Dashboard,ActionDeposit,ActionNewAccount,ActionHistory,ActionProfile,FaucetModal,NewAccModal,UpdateBalance1,RenderAccList dashboard;
    class TransferPage,ReviewModal,ExecuteTransfer,ACIDCommit,TxReceipt transfer;
    class TxPage,ProfilePage,LogoutAction,RedirectLogin finish;
```

---

## 3. Component Architecture Diagram

### Purpose & Explanation (Kyun zaroori hai?):
Yeh diagram React component hierarchy aur separation of concerns ko visual karta hai: Root providers, Route guards, Shell layouts, Domain-specific banking widgets, aur common atomic design system primitives.

```mermaid
flowchart TD
    App["App.jsx (Root Entry)"] --> ToastProv["ToastProvider (ToastContext)"]
    ToastProv --> AuthProv["AuthProvider (AuthContext)"]
    AuthProv --> BankProv["BankingProvider (BankingContext)"]
    BankProv --> AppRoutes["AppRoutes.jsx (React Router)"]

    AppRoutes --> PublicViews["Public Route Layer"]
    AppRoutes --> GuestViews["Guest-Only Guard Layer"]
    AppRoutes --> ProtectedViews["Protected Guard Layer"]

    subgraph PublicViewsGroup["Public Views"]
        PublicViews --> LandingPage["LandingPage.jsx"]
        LandingPage --> HeroSec["HeroSection.jsx"]
        LandingPage --> FeatureGrid["FeatureGrid.jsx"]
        LandingPage --> SecurityStats["SecurityStats.jsx"]
        LandingPage --> CurrencyTicker["CurrencyTicker.jsx"]
        LandingPage --> Footer["Footer.jsx"]
    end

    subgraph GuestViewsGroup["Guest Views (Unauthenticated)"]
        GuestViews --> AuthLayout["AuthLayout.jsx (Branded Split Screen)"]
        AuthLayout --> LoginPage["LoginPage.jsx"]
        AuthLayout --> RegisterPage["RegisterPage.jsx"]
        LoginPage --> PasswordInput["Input.jsx (with Show/Hide)"]
        RegisterPage --> PasswordStrength["PasswordStrengthMeter.jsx"]
    end

    subgraph ProtectedViewsGroup["Protected Views (Authenticated Shell)"]
        ProtectedViews --> DashboardLayout["DashboardLayout.jsx"]
        
        DashboardLayout --> Sidebar["Sidebar.jsx (Desktop Navigation)"]
        DashboardLayout --> MobileNav["MobileNav.jsx (Slide-over Drawer)"]
        DashboardLayout --> Header["Header.jsx (Active Account, Avatar, Logout)"]
        DashboardLayout --> PageContent["Page Content Viewport"]

        PageContent --> DashboardPage["DashboardPage.jsx"]
        PageContent --> AccountsPage["AccountsPage.jsx"]
        PageContent --> TransferPage["TransferPage.jsx"]
        PageContent --> TransactionsPage["TransactionsPage.jsx"]
        PageContent --> ProfilePage["ProfilePage.jsx"]
    end

    subgraph DashboardComponents["Dashboard Domain Components"]
        DashboardPage --> BalanceCard["BalanceCard.jsx (Gradient + Quick Actions)"]
        DashboardPage --> LedgerSummary["LedgerSummaryCard.jsx (Inflow vs Outflow)"]
        DashboardPage --> AccountCarousel["AccountCarousel.jsx (Savings / Checking)"]
        DashboardPage --> RecentTxFeed["RecentTransactions.jsx (Activity Feed)"]
    end

    subgraph AccountsComponents["Accounts Domain Components"]
        AccountsPage --> AccountCard["AccountCard.jsx (10-Digit Copy + Status)"]
        AccountsPage --> CreateAccountModal["CreateAccountModal.jsx (Open Checking)"]
        AccountsPage --> FaucetDepositModal["FaucetDepositModal.jsx (Deposit Presets)"]
    end

    subgraph TransferComponents["Transfer Domain Components"]
        TransferPage --> TransferForm["TransferForm.jsx (Balance Validation)"]
        TransferPage --> TransferModal["TransferModal.jsx (Two-Step Review)"]
        TransferPage --> TransactionReceipt["TransactionReceipt.jsx (Print/Copy Receipt)"]
    end

    subgraph TransactionsComponents["Transactions Domain Components"]
        TransactionsPage --> TransactionFilters["TransactionFilters.jsx (Status Tabs + Search)"]
        TransactionsPage --> TransactionTable["TransactionTable.jsx (Sortable Columns)"]
        TransactionTable --> TransactionRow["TransactionRow.jsx (Credit/Debit Badges)"]
        TransactionsPage --> Pagination["Pagination.jsx (Page Jump & Limit)"]
    end

    subgraph CommonPrimitives["Shared UI Primitives (Design System)"]
        Button["Button.jsx"]
        Input["Input.jsx"]
        Select["Select.jsx"]
        Modal["Modal.jsx"]
        Card["Card.jsx"]
        Badge["Badge.jsx"]
        Skeleton["Skeleton.jsx"]
        MoneyDisplay["MoneyDisplay.jsx"]
        Toast["Toast.jsx"]
        EmptyState["EmptyState.jsx"]
    end

    classDef root fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef layout fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    classDef pages fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc;
    classDef components fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#f8fafc;
    classDef primitives fill:#1e293b,stroke:#94a3b8,stroke-width:2px,color:#f8fafc;

    class App,ToastProv,AuthProv,BankProv,AppRoutes root;
    class PublicViews,GuestViews,ProtectedViews,AuthLayout,DashboardLayout,Sidebar,MobileNav,Header layout;
    class LandingPage,LoginPage,RegisterPage,DashboardPage,AccountsPage,TransferPage,TransactionsPage,ProfilePage pages;
    class BalanceCard,LedgerSummary,AccountCard,TransferModal,TransactionTable,CreateAccountModal,FaucetDepositModal components;
    class Button,Input,Select,Modal,Card,Badge,Skeleton,MoneyDisplay,Toast,EmptyState primitives;
```

---

## 4. Authentication & Session Lifecycle Sequence

### Purpose & Explanation (Kyun zaroori hai?):
Authentication ke chaar critical scenarios ko step-by-step explain karta hai:
1. Naye customer ki registration aur auto-account provisioning.
2. Hard browser refresh (F5) par HTTP-only cookie ke zariye `/auth/me` se session restore karna.
3. Logout par MongoDB Blacklist collection me TTL index ke zariye token revoke karna aur cookie clear karna.
4. Revoked token ko dobara chalane ki koshish par server-side 401 rejection aur login par redirect.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as React UI (Login/Register)
    participant AuthCtx as AuthContext
    participant Axios as Axios API Client
    participant Server as Express Server (:3000)
    participant DB as MongoDB Atlas

    Note over User,DB: SCENARIO 1: Registration & Instant Account Provisioning
    User->>UI: Fills name, email, password & submits
    UI->>Axios: POST /api/v1/auth/register
    Axios->>Server: HTTP POST (withCredentials: true)
    Server->>DB: Hash password (bcrypt 10 rounds) & create User
    Server->>DB: Auto-provision 10-digit Savings Account
    Server-->>Axios: 201 Created + Set-Cookie: token=<jwt>; HttpOnly; SameSite=Strict
    Axios-->>AuthCtx: { user, account, token }
    AuthCtx-->>UI: Sets isAuthenticated: true, user: user
    UI->>User: Redirects to /dashboard (Welcome toast displayed)

    Note over User,DB: SCENARIO 2: Page Refresh & Session Hydration
    User->>UI: Hard Refresh Browser (F5)
    UI->>AuthCtx: Mounts -> Checks initial state (isLoading: true)
    AuthCtx->>Axios: GET /api/v1/auth/me
    Axios->>Server: HTTP GET with Cookie: token=<jwt>
    Server->>DB: Check token against Blacklist collection
    alt Token is Revoked
        Server-->>Axios: 401 Unauthorized ("Token has been revoked")
        Axios-->>AuthCtx: Error: Session Expired
        AuthCtx-->>UI: Reset user state -> Redirect to /login
    else Token is Valid
        Server->>DB: Find user by decoded token ID
        Server-->>Axios: 200 OK { user: userProfile }
        Axios-->>AuthCtx: Sets user state (isLoading: false, isAuthenticated: true)
        AuthCtx-->>UI: Restores protected Dashboard view
    end

    Note over User,DB: SCENARIO 3: Secure Logout & Blacklist TTL Revocation
    User->>UI: Clicks "Logout & Revoke Session"
    UI->>AuthCtx: logout()
    AuthCtx->>Axios: POST /api/v1/auth/logout
    Axios->>Server: HTTP POST with Cookie: token=<jwt>
    Server->>DB: Insert token into Blacklist collection (expiresAt: decoded.exp)
    Server-->>Axios: Set-Cookie: token=none; Max-Age=0 + 200 OK
    Axios-->>AuthCtx: Success
    AuthCtx-->>UI: Wipes user & session state
    UI->>User: Redirects to /login (Toast: "Logged out successfully")

    Note over User,DB: SCENARIO 4: Revoked Token Replay Protection
    User->>UI: Attempt accessing /api/v1/auth/me with old revoked token
    UI->>Axios: GET /api/v1/auth/me
    Axios->>Server: HTTP GET with old token
    Server->>DB: Blacklist.findOne({ token }) -> Match Found!
    Server-->>Axios: 401 Unauthorized ("Token has been revoked")
    Axios-->>UI: Interceptor catches 401 -> Forces redirect to /login
```

---

## 5. Transaction Flow & Idempotency Engine

### Purpose & Explanation (Kyun zaroori hai?):
Financial applications me paise ka transfer sabse nazuk operation hota hai. Yeh diagram dikhata hai ke:
- Client pehle balance check karta hai taake fazool network calls na hon.
- Review Modal me user transaction summary confirm karta hai.
- Unique RFC 4122 UUID v4 Idempotency Key banti hai.
- Button lock ho jata hai aur spinner chalta hai taake user double-click na kar sakay.
- Backend multi-document ACID transaction commit karta hai.
- Success par receipt screen open hoti hai aur `BankingContext` dashboard ke balances ko live sync kar deta hai.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Form as TransferForm.jsx
    participant Modal as TransferModal.jsx (Review)
    participant BankCtx as BankingContext
    participant Axios as Axios API Client
    participant Server as Express Server (:3000)
    participant MongoSession as MongoDB ACID Session

    User->>Form: Selects source account, enters recipient & amount ($100.00)
    Form->>Form: Checks client rules:<br/>- amount > 0<br/>- senderAccountId != receiverAccountId<br/>- availableBalance >= amountInCents (10,000)
    alt Balance Insufficient
        Form-->>User: Inline Error: "Insufficient funds. Available: $50.00, Required: $100.00"<br/>("Review Transfer" button disabled)
    else Balance Sufficient
        User->>Form: Clicks "Review Transfer"
    end

    Form->>Modal: Opens Confirmation Dialog with transfer details
    Modal->>Modal: Generates RFC 4122 UUID v4 Idempotency Key:<br/>e.g. "idemp-uuid-7a91-4c28-98e1"
    Modal->>User: Displays Transaction Summary:<br/>- Sender Account: 9178200360<br/>- Recipient Account: 6751823154<br/>- Amount: $100.00 (Fee: $0.00)<br/>- Net Deduction: $100.00

    User->>Modal: Clicks "Confirm & Send Funds"
    Modal->>Modal: Locks UI: isSubmitting = true (Disables button, renders spinner)<br/>Prevents accidental double-clicks

    Modal->>Axios: POST /api/v1/transactions/transfer<br/>Header: Idempotency-Key: idemp-uuid-7a91-4c28-98e1<br/>Body: { senderAccountId, receiverAccountId, amountInCents: 10000, description }
    Axios->>Server: HTTP POST (withCredentials: true)

    Server->>Server: 1. Verify Idempotency Cache
    Server->>Server: 2. Validate Accounts are ACTIVE & Not Frozen
    Server->>MongoSession: 3. session.startTransaction()
    MongoSession->>MongoSession: 4. Aggregate sender balance within session
    MongoSession->>MongoSession: 5. Insert Transaction (status: PENDING)
    MongoSession->>MongoSession: 6. Insert DEBIT entry in Ledger for Sender
    MongoSession->>MongoSession: 7. Insert CREDIT entry in Ledger for Receiver
    MongoSession->>MongoSession: 8. Update Transaction (status: COMPLETED)
    MongoSession->>Server: 9. session.commitTransaction()

    Server-->>Axios: 201 Created { transaction: { id, status: "COMPLETED", ... }, senderBalance: { balanceInCents: 40000 } }
    Axios-->>Modal: Success Payload
    Modal->>Modal: Closes review modal -> Opens TransactionReceipt.jsx
    Modal->>BankCtx: refreshBalances() (Triggers re-sync of active accounts)
    BankCtx-->>Form: Global balance updated to $400.00
    Modal->>User: Displays Verified Receipt with Copyable Transaction ID

    Note over User,Server: REPLAY SCENARIO: Network Retry with Identical Idempotency-Key
    User->>Server: Re-submits POST with same Idempotency-Key
    Server->>Server: Detects existing COMPLETED transaction in DB
    Server-->>User: 200 OK (cached: true, returns original receipt without modifying ledger)
```

---

## 6. API Integration & Error Interception Flow

### Purpose & Explanation (Kyun zaroori hai?):
Axios HTTP client aur centralized interceptor pipeline ko visual karta hai: Request pe cookies aur headers lagana, 200 responses ko cleanly unwrap karna, aur har error code (400 validation, 401 unauthorized, 403 forbidden, 404 not found, 409 conflict, 500 server error) ko handle karna.

```mermaid
flowchart TD
    ComponentReq(["UI Component calls Service Method<br/>(e.g. authService, accountService, transactionService)"]) --> AxiosInstance["Central Axios Client (src/services/api.js)"]

    subgraph RequestPipeline["Axios Request Interceptor Pipeline"]
        AxiosInstance --> SetBase["1. Set Base URL: http://localhost:3000/api/v1"]
        SetBase --> SetCreds["2. Set withCredentials: true (Send HTTP-only cookies)"]
        SetCreds --> SetHeaders["3. Set Content-Type: application/json"]
        SetHeaders --> CheckIdemp{"Is Transfer Request?"}
        CheckIdemp -->|Yes| AttachIdemp["Attach Header: Idempotency-Key: &lt;UUID v4&gt;"]
        CheckIdemp -->|No| SendReq["Send HTTP Request"]
        AttachIdemp --> SendReq
    end

    SendReq --> ExpressAPI["Express.js Server (:3000)"]
    ExpressAPI --> MongoDB[("MongoDB Atlas")]
    MongoDB --> ExpressAPI

    ExpressAPI --> AxiosResponse["Axios Response Interceptor Pipeline"]

    subgraph ResponsePipeline["Response Interceptor & Error Normalization"]
        AxiosResponse --> StatusCheck{"HTTP Status Code?"}
        
        StatusCheck -->|200 / 201 Success| UnpackData["Unpack response.data<br/>Return { success: true, data: ... } directly to caller"]

        StatusCheck -->|400 Bad Request| Err400["400 BAD_REQUEST / VALIDATION_ERROR<br/>Extract field error messages -> Render inline in form"]
        StatusCheck -->|401 Unauthorized| Err401["401 UNAUTHORIZED / TOKEN_EXPIRED / REVOKED<br/>Emit 'banking:unauthorized' -> Reset AuthContext -> Redirect /login"]
        StatusCheck -->|403 Forbidden| Err403["403 FORBIDDEN<br/>Trigger Toast: 'Access denied: You do not own this account'"]
        StatusCheck -->|404 Not Found| Err404["404 NOT_FOUND<br/>Trigger Toast: 'Account or transaction resource not found'"]
        StatusCheck -->|409 Conflict| Err409["409 CONFLICT<br/>Trigger Toast: 'Email already registered' or 'In-flight transaction conflict'"]
        StatusCheck -->|500 / Network Error| Err500["500 INTERNAL_ERROR or Network Offline<br/>Mask technical trace -> Trigger Toast: 'Banking server temporarily unavailable'"]
    end

    UnpackData --> ResolvePromise(["Promise Resolved -> Component updates state & renders data"])
    Err400 --> RejectPromise(["Promise Rejected -> Display user-friendly error banners"])
    Err401 --> RejectPromise
    Err403 --> RejectPromise
    Err404 --> RejectPromise
    Err409 --> RejectPromise
    Err500 --> RejectPromise

    classDef normal fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef success fill:#065f46,stroke:#10b981,stroke-width:2px,color:#f8fafc;
    classDef warning fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#f8fafc;
    classDef error fill:#881337,stroke:#f43f5e,stroke-width:2px,color:#f8fafc;

    class ComponentReq,AxiosInstance,SetBase,SetCreds,SetHeaders,CheckIdemp,AttachIdemp,SendReq,ExpressAPI,MongoDB,AxiosResponse,StatusCheck normal;
    class UnpackData,ResolvePromise success;
    class Err400,Err409 warning;
    class Err401,Err403,Err404,Err500,RejectPromise error;
```

---

## 7. State Management Flow

### Purpose & Explanation (Kyun zaroori hai?):
Global state (`AuthContext`, `BankingContext`, `ToastContext`) aur local state (form inputs, modals, filters) ke darmiyan coordination dikhata hai. Khas tor par yeh reactive cycle ke jab transfer ya deposit complete hota hai, tou `BankingContext` auto-refresh karke BalanceCard aur Accounts list ko bina page reload kiye update kar deta hai.

```mermaid
flowchart TD
    subgraph GlobalContexts["Global State Layer (React Context API)"]
        subgraph AuthState["1. AuthContext"]
            UserObj["user: { id, name, email, role }"]
            AuthFlags["isAuthenticated: boolean<br/>isLoading: boolean"]
            AuthMethods["Actions: login(), register(), logout(), checkSession()"]
        end

        subgraph BankingState["2. BankingContext"]
            AccountList["accounts: Array of Account Documents"]
            ActiveAccount["activeAccount: Selected Account (e.g. SAVINGS)"]
            SyncTrigger["refreshBalances(): Triggers global re-fetch"]
        end

        subgraph ToastState["3. ToastContext"]
            ToastList["toasts: Array of { id, type, message }"]
            ToastMethods["Actions: showToast(type, msg), dismissToast(id)"]
        end
    end

    subgraph ComponentConsumers["Component Viewport Consumers"]
        HeaderComp["Header.jsx<br/>- User Name & Role<br/>- Active Account Selector<br/>- Logout Trigger"]
        DashboardView["DashboardPage.jsx<br/>- BalanceCard (Listens to ActiveAccount)<br/>- RecentTransactions Feed"]
        AccountsView["AccountsPage.jsx<br/>- Renders all accounts<br/>- Faucet Deposit Modal<br/>- Create Account Modal"]
        TransferView["TransferPage.jsx<br/>- Source Account Selector<br/>- Transfer Confirmation Modal"]
        TransactionsView["TransactionsPage.jsx<br/>- Paginated Transaction Table"]
    end

    subgraph LocalStateLayer["Local Component State (useState / useReducer)"]
        FormState["Form Input State (Amount, Recipient, Description)"]
        ModalState["Modal Visibility (isReviewOpen, isReceiptOpen, isFaucetOpen)"]
        TableState["Table State (currentPage, filterStatus, searchQuery)"]
        LoadingState["Action Loading (isSubmitting: boolean)"]
    end

    subgraph ReactiveSync["Reactive Financial Synchronization Cycle"]
        DepositEvent["Faucet Deposit Completed<br/>POST /accounts/:id/deposit"] --> TriggerSync["Call BankingContext.refreshBalances()"]
        TransferEvent["Money Transfer Completed<br/>POST /transactions/transfer"] --> TriggerSync
        TriggerSync --> FetchMe["GET /accounts/me"]
        TriggerSync --> FetchBal["GET /accounts/:id/balance"]
        FetchMe --> UpdateAccList["Update BankingContext.accounts"]
        FetchBal --> UpdateBal["Update BalanceCard & LedgerSummary"]
    end

    AuthState -.->|Provides User & Session| HeaderComp & DashboardView & AccountsView & TransferView
    BankingState -.->|Provides Accounts & Balance| HeaderComp & DashboardView & AccountsView & TransferView
    ToastState -.->|Renders Floating Alerts| HeaderComp & TransferView & AccountsView

    TransferView --> LocalStateLayer
    AccountsView --> LocalStateLayer
    TransactionsView --> LocalStateLayer

    DepositEvent -.-> ToastState
    TransferEvent -.-> ToastState

    classDef global fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    classDef views fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef local fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc;
    classDef sync fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#f8fafc;

    class GlobalContexts,AuthState,BankingState,ToastState,UserObj,AuthFlags,AuthMethods,AccountList,ActiveAccount,SyncTrigger,ToastList,ToastMethods global;
    class ComponentConsumers,HeaderComp,DashboardView,AccountsView,TransferView,TransactionsView views;
    class LocalStateLayer,FormState,ModalState,TableState,LoadingState local;
    class ReactiveSync,DepositEvent,TransferEvent,TriggerSync,FetchMe,FetchBal,UpdateAccList,UpdateBal sync;
```

---

## 8. Responsive Layout & Viewport Adaptation

### Purpose & Explanation (Kyun zaroori hai?):
Desktop screens ($\ge 1024px$) aur Mobile devices ($< 1024px$) ke darmiyan intentional UX differences dikhata hai: Fixed desktop sidebar vs sliding off-canvas drawer, multi-column transaction table vs touch-friendly cards, aur centered modals vs mobile bottom-sheets.

```mermaid
flowchart TB
    ViewportDetector["Browser Viewport Dimensions (window.innerWidth)"] --> LayoutBranch{"Viewport Breakpoint?"}

    subgraph DesktopLayout["Desktop Viewport (>= 1024px) — High Data Density"]
        LayoutBranch -->|">= 1024px"| DesktopShell["DashboardLayout (Desktop)"]
        DesktopShell --> FixedSidebar["Fixed Desktop Sidebar (w-64)<br/>- Full logo, Nav links with active pill<br/>- Quick Account switcher<br/>- Logout button"]
        DesktopShell --> DesktopHeader["Sticky Header<br/>- Live Search bar<br/>- Current active account dropdown<br/>- User avatar with status badge"]
        DesktopShell --> DesktopMain["Main Grid Viewport<br/>- BalanceCard (Large horizontal layout with action pills)<br/>- 2-Column Ledger Summary & Quick Analytics<br/>- Comprehensive Multi-column Transaction Table"]
        DesktopShell --> DesktopModals["Centered Modal Dialogs<br/>- Max width: max-w-lg with backdrop blur"]
    end

    subgraph MobileLayout["Mobile / Tablet Viewport (< 1024px) — Touch-Optimized"]
        LayoutBranch -->|"< 1024px"| MobileShell["DashboardLayout (Mobile)"]
        MobileShell --> MobileTopNav["Compact Mobile Topbar<br/>- Hamburger icon (toggles drawer)<br/>- Brand logo mark<br/>- Mini user avatar"]
        MobileShell --> MobileDrawer["Off-Canvas MobileNav Drawer<br/>- Slides from left with transition<br/>- Dark semi-transparent overlay backdrop<br/>- Touch-friendly navigation links with 44px tap targets"]
        MobileShell --> MobileMain["Mobile Content Area<br/>- BalanceCard (Stacked vertical layout)<br/>- Horizontal swipeable Account Carousel<br/>- Compact Transaction Cards with tap-to-inspect receipt"]
        MobileShell --> MobileBottomSheets["Touch-Friendly Dialogs<br/>- Bottom-sheet presentation on small devices"]
    end

    classDef detector fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    classDef desktop fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc;
    classDef mobile fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#f8fafc;

    class ViewportDetector,LayoutBranch detector;
    class DesktopShell,FixedSidebar,DesktopHeader,DesktopMain,DesktopModals desktop;
    class MobileShell,MobileTopNav,MobileDrawer,MobileMain,MobileBottomSheets mobile;
```
