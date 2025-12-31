# E-Commerce Project: Architecture & Technology Overview

## 1. Project Structure Overview

```
/ (root)
├── src/
│   ├── app/           # Next.js app directory (pages, API routes)
│   ├── components/    # React UI components
│   ├── lib/           # Utility functions
│   └── ...
├── prisma/            # Prisma schema and seed
├── tests/             # Playwright E2E and edge case tests
├── package.json       # Project dependencies and scripts
└── ...
```

---

## 2. Technology Stack & Integration

| Layer           | Technology          | Purpose/Integration                                                                               |
| --------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| **Frontend**    | React (Next.js)     | UI, routing, SSR/SSG, API routes. Provides the user interface and navigation.                     |
| **State/Fetch** | TanStack Query      | Data fetching, caching, React Suspense integration. Ensures efficient and consistent data access. |
| **Auth**        | NextAuth.js         | Authentication, session management. Handles login, registration, and session cookies.             |
| **Backend API** | Next.js API routes  | Handles business logic, connects to DB. All data and auth requests go through these endpoints.    |
| **ORM/DB**      | Prisma + PostgreSQL | Database access, migrations, seeding. Prisma provides a type-safe interface to the database.      |
| **Testing**     | Playwright          | E2E, edge case, and robustness tests. Simulates real user flows and checks for regressions.       |

**Integration Explanation:**

- The frontend (React/Next.js) renders UI and calls API routes for data and actions.
- TanStack Query manages all data fetching and caching, and integrates with React Suspense for smooth loading states.
- NextAuth.js provides secure authentication and session management, using Prisma to store user data in PostgreSQL.
- All backend logic (including auth) is handled in Next.js API routes, which use Prisma to interact with the database.
- Playwright tests run against the full stack, simulating real user actions and verifying both frontend and backend behavior.

---

## 3. Data Flow: Frontend ↔ Backend (Profissional e Didático)

```mermaid
flowchart TD
  User -->|1. Interage| Browser
  Browser -->|2. Renderiza| ReactUI
  ReactUI -->|3. Solicita| TanStack
  TanStack -->|4. Chama API| APIRoute
  APIRoute -->|5. Consulta| Prisma
  Prisma -->|6. SQL| Postgres
  Postgres -->|7. Retorna| Prisma
  Prisma -->|8. Valida| APIRoute
  APIRoute -->|9. Responde| TanStack
  TanStack -->|10. Atualiza| ReactUI
  ReactUI -->|11. Atualiza| Browser
```

### Legenda do Fluxo (Passo a Passo)

1. **Usuário**: Clica, digita, envia formulários.
2. **Browser**: Renderiza a interface React.
3. **React UI**: Usa TanStack Query para buscar ou atualizar dados.
4. **TanStack Query**: Faz requisição para API REST (Next.js API Route).
5. **API Route**: Recebe a requisição, executa lógica de negócio.
6. **Prisma ORM**: Traduz requisição para SQL e acessa o banco.
7. **Banco de Dados**: Retorna dados para o Prisma.
8. **Prisma ORM**: Valida e retorna dados para a API.
9. **API Route**: Responde com JSON para o frontend.
10. **TanStack Query**: Atualiza cache e repassa dados para a UI.
11. **React UI**: Atualiza a tela do usuário instantaneamente.

### Dicas para Estudantes

- Cada etapa é separada para facilitar manutenção e testes.
- O uso de cache (TanStack Query) evita requisições desnecessárias.
- O backend (API + ORM) garante segurança e integridade dos dados.
- O fluxo é assíncrono: cada etapa só avança quando a anterior termina.

---

## 4. Authentication Flow (Login)

```mermaid
flowchart TD
  A[User] --> B[Login Form]
  B --> C[signIn]
  C --> D[NextAuth]
  D --> E[Prisma]
  E --> F[PostgreSQL]
  F --> E
  E --> D
  D -->|Valid?| D2{User Valid?}
  D2 -- Yes --> G[Set Session]
  D2 -- No --> H[Error]
  G --> I[Session Stored]
  I --> J[Redirected]
  H --> B
```

**Step-by-step Explanation:**

1. User fills out the login form and submits.
2. The form calls `signIn('credentials')` from NextAuth.js.
3. NextAuth.js API route receives the credentials and uses Prisma to check the database.
4. If the user is valid, a session cookie is set and the user is redirected to the app.
5. If invalid, an error is shown in the UI.

**Key Points for Students:**

- NextAuth.js abstracts away most session/cookie logic.
- Prisma ensures secure, type-safe DB access.

---

erDiagram

## 5. Database: Entities & Relationships (ERD)

```mermaid
erDiagram
  User {
    int id
    string email
    string password
    string name
  }
  Address {
    int id
    int userId
    string street
    string city
  }
  Product {
    int id
    string name
    float price
    int stock
  }
  Order {
    int id
    int userId
    string status
  }
  OrderItem {
    int id
    int orderId
    int productId
    int quantity
  }
  CartItem {
    int id
    int userId
    int productId
    int quantity
  }
  User ||--o{ Order : places
  User ||--o{ Address : has
  Order ||--|{ OrderItem : contains
  Product ||--o{ OrderItem : in
  Product ||--o{ CartItem : in
  User ||--o{ CartItem : has
```

**Entity Relationship Explanation:**

- **User**: Can have many orders, addresses, and cart items.
- **Order**: Belongs to a user, contains many order items.
- **OrderItem**: Connects orders and products, tracks quantity.
- **CartItem**: Tracks products in a user's cart.
- **Address**: Stores user shipping/billing addresses.
- **Product**: Can be in many order items and cart items.

**For Students:**

- This ERD shows how data is structured and related in a real e-commerce app.

---

## 6. Testing: Playwright E2E (End-to-End)

**Test Types:**

- Edge cases (invalid login, registration, admin access, etc)
- Authenticated flows (cart, checkout, etc)

**How Playwright Works (Step-by-Step):**

1. **Test script** launches a real browser (Chromium, Firefox, WebKit).
2. **Simulates user actions**: navigation, clicks, form fills, etc.
3. **Waits for UI elements** to appear, checks for correct navigation, error messages, and UI state.
4. **Uses robust selectors and explicit waits** to handle async UI/data.
5. **Reports pass/fail** for each scenario, with screenshots and logs for failures.

**Example Test:**

```ts
await page.goto('/login');
await page.fill('input[name="email"]', 'test@example.com');
await page.click('button:has-text("Sign in")');
await expect(page.getByRole('alert')).toBeVisible();
```

**Testing Flow Diagram:**

```mermaid
flowchart TD
  A[Playwright Test Script]:::test -->|Launch| B[Browser]
  B -->|Simulate| C[Next.js App]
  C -->|API Calls| D[API Routes]
  D -->|DB Query| E[(PostgreSQL DB)]
  C -->|UI Response| B
  B -->|Check| A

  classDef test fill:#fdd,stroke:#333,stroke-width:2;
```

**For Students:**

- Playwright tests the entire stack, from UI to backend and database, as a real user would experience it.
- E2E tests are essential for catching bugs that only appear when all parts of the app work together.

---

## 7. How Technologies Integrate

- **Next.js**: The core framework, providing both the frontend (React UI, routing, SSR/SSG) and backend (API routes for business logic and data access) in a single codebase.
- **TanStack Query**: Handles all data fetching and caching in the frontend, making API calls to Next.js API routes and integrating with React Suspense for smooth loading and error states.
- **NextAuth.js**: Manages authentication and session, using Prisma to store and validate users in the database. Integrates seamlessly with Next.js API routes.
- **Prisma**: The ORM layer, providing type-safe access to the PostgreSQL database for both business logic (API routes) and authentication (NextAuth.js).
- **Playwright**: Runs end-to-end tests, simulating real user flows and verifying that the entire stack (UI, API, DB) works as expected.

**Comprehensive Integration Flow:**

1. User interacts with the React UI (Next.js frontend).
2. UI uses TanStack Query to fetch/mutate data via API routes.
3. API routes use Prisma to read/write data in PostgreSQL.
4. NextAuth.js handles login/session, also using Prisma.
5. Playwright tests simulate all flows, ensuring reliability.

---

## 8. Fullstack Architecture Diagram (Annotated)

```mermaid
flowchart TD
  U[User] --> Browser
  Browser --> React
  React --> Query
  Query --> API
  React --> Auth
  Auth --> API
  API --> Prisma
  Prisma --> DB
  DB --> Prisma
  Prisma --> API
  API --> Query
  Query --> React
  React --> Browser
```

**Detailed Explanation for Students:**

- **User**: Interacts with the app via the browser (clicks, types, submits forms).
- **Browser**: Renders the React UI, receives updates from the app.
- **React Components**: Build the UI, handle user input, and display data.
- **TanStack Query**: Handles all data fetching, caching, and background updates for the UI.
- **NextAuth.js**: Manages authentication and session, making sure users are logged in securely.
- **Next.js API Routes**: The backend logic, handling requests from the frontend and returning data or errors.
- **Prisma ORM**: Provides a type-safe way to access and validate data in the database.
- **PostgreSQL**: The relational database where all persistent data is stored.

---

## 9. Key Points for Web Coding Students

- **Separation of Concerns**: Each technology has a clear role (UI, data, API, DB, auth, testing).
- **Type Safety & Security**: Prisma and NextAuth.js ensure data is validated and users are authenticated securely.
- **Modern Data Fetching**: TanStack Query and React Suspense provide a smooth, modern UX for loading and error states.
- **Fullstack Testing**: Playwright simulates real user flows, ensuring the whole stack works together.
- **Scalability**: This architecture can grow with your app, supporting more features and users.
- **Developer Experience**: Next.js, Prisma, and Playwright all provide great DX, with type safety, hot reload, and fast feedback.

---

_For more, see the codebase and Playwright test files for real-world examples and practical usage. Diagrams are editable and can be used for presentations or further study._
