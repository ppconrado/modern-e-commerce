# 🔐 Authorization System - Complete Analysis

**Data:** 10 de Janeiro de 2026  
**Status:** Sistema analisado e melhorado

---

## 📊 ARQUITETURA GLOBAL DE AUTENTICAÇÃO

### Fluxo de Autenticação

```
Login Form (login/page.tsx)
    ↓
signIn() NextAuth
    ↓
CredentialsProvider (src/auth.ts)
    ↓
Banco de Dados (User.password)
    ↓
bcryptjs compare()
    ↓
JWT Token gerado + Stored in Cookie
    ↓
Session criada com role
    ↓
Disponível em: session.user.role
```

---

## 🔑 ARQUIVOS CHAVE

### 1. `src/auth.ts` - Configuração NextAuth
**Responsabilidades:**
- ✅ Credentials provider (email/senha)
- ✅ JWT callbacks para role propagation
- ✅ Session callbacks para user data

**Fluxo:**
```typescript
authorize(credentials)        // Valida email/senha
    ↓
return { id, email, name, role }
    ↓
jwt callback                  // token.role = user.role
    ↓
session callback              // session.user.role = token.role
```

**Tipo de Estratégia:** JWT (melhor para APIs)

---

### 2. `src/app/api/auth/[...nextauth]/route.ts` - Handler
**Responsabilidade:**
- Expor GET/POST para NextAuth
- Redireciona para `/login` se não autenticado

```typescript
export const { GET, POST } = handlers; // De src/auth.ts
```

---

### 3. `types/next-auth.d.ts` - Type Augmentation (NOVO)
**Problema resolvido:**
- ❌ Antes: TypeScript não sabia que `user.role` existia
- ✅ Depois: Type augmentation define a estrutura

```typescript
declare module 'next-auth' {
  interface User {
    id: string;
    role: string;  // ✅ Adiciona role ao User type
  }

  interface Session {
    user: {
      id: string;
      role: string;  // ✅ Adiciona role ao Session type
    } & DefaultSession['user'];
  }
}
```

---

## 🛡️ CAMADAS DE SEGURANÇA

### Camada 1: Autenticação (src/auth.ts)
```
✅ Valida credenciais (email + senha)
✅ Compara hash com bcryptjs
✅ Retorna null se falhar
✅ Gera JWT token se sucesso
```

### Camada 2: Sessão (JWT)
```
✅ Token assinado com AUTH_SECRET
✅ Contém: id, email, name, role
✅ Armazenado em cookie seguro
✅ Validado em cada request
```

### Camada 3: Autorização (Role-Based)
```
✅ CUSTOMER - Usuário comum
✅ ADMIN - Pode gerenciar produtos/pedidos
✅ SUPER_ADMIN - Gerencia tudo (invites, usuários)
```

---

## 📍 ONDE VERIFICAR AUTENTICAÇÃO

### Em Rotas API (`src/app/api/**/route.ts`)

```typescript
// ✅ PADRÃO CORRETO
import { auth } from '@/auth';
import { requireAdminRole } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  const session = await auth();
  
  // Verificar autenticação
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Verificar autorização
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // ✅ Ou usar helper:
  const authError = requireAdminRole(session);
  if (authError) return authError;
}
```

### Em Páginas (Pages Components)

```typescript
// ✅ CLIENT SIDE
import { useSession } from 'next-auth/react';

export default function AdminPage() {
  const { data: session, status } = useSession();
  
  if (status === 'unauthenticated') {
    return router.push('/login');
  }
  
  if (session?.user?.role !== 'ADMIN') {
    return router.push('/');
  }
}
```

---

## 🔄 FLUXO COMPLETO: Login → API Call

```
1. USER LOGS IN
   Login Form → signIn('credentials', { email, password })
        ↓
2. NextAuth VALIDATES
   authorize() → prisma.user.findUnique() → bcryptjs.compare()
        ↓
3. TOKEN CREATED
   jwt callback → token.role = user.role → JWT signed
        ↓
4. SESSION AVAILABLE
   session callback → session.user.role = token.role
        ↓
5. MAKING API CALL
   fetch('/api/admin/products')
   + Cookie with JWT automatically sent
        ↓
6. API VALIDATES
   const session = await auth() → validates JWT from cookie
   requireAdminRole(session) → checks session.user.role
        ↓
7. AUTHORIZED OR REJECTED
   If role === ADMIN/SUPER_ADMIN → Process request
   Else → return 401/403
```

---

## ⚠️ PROBLEMAS ENCONTRADOS & SOLUÇÕES

### Problema 1: Type Safety em Roles
**Status:** ✅ RESOLVIDO

```typescript
// ❌ ANTES: Role existia mas TypeScript não sabia
token.role = user.role; // Type: unknown

// ✅ DEPOIS: Type augmentation define tipos
types/next-auth.d.ts → User interface { role: string }
```

**Solução Implementada:**
- Criar `types/next-auth.d.ts` com module augmentation
- Extends User, Session, JWT interfaces

---

### Problema 2: Role não propagava corretamente
**Status:** ✅ VERIFICADO

```typescript
// JWT Callback - Role propagation
jwt({ token, user }) {
  if (user) {
    token.role = user.role;  // ✅ Role copiado do User
    token.id = user.id;
  }
  return token;
}

// Session Callback - Role to session
session({ session, token }) {
  if (session.user) {
    session.user.role = token.role;  // ✅ Role copiado do Token
    session.user.id = token.id;
  }
  return session;
}
```

**Funciona corretamente** - Role está disponível em `session.user.role`

---

### Problema 3: SELECT no Prisma
**Status:** ✅ OTIMIZADO

```typescript
// ❌ ANTES: Retornava TODOS os campos incluindo password
const user = await prisma.user.findUnique({
  where: { email: credentials.email as string },
});

// ✅ DEPOIS: Apenas campos necessários
const user = await prisma.user.findUnique({
  where: { email: credentials.email as string },
  select: {
    id: true,
    email: true,
    fullName: true,
    password: true,  // Apenas para comparação
    role: true,
  },
});
```

**Benefício:** Menor payload, mais seguro

---

## 🔒 VERIFICAÇÃO GLOBAL

### Endpoints Protegidos por Role

| Endpoint | Role Requerido | Status |
|----------|----------------|---------| 
| `GET /api/admin/users` | SUPER_ADMIN | ✅ Verificado |
| `POST /api/admin/invite` | SUPER_ADMIN | ✅ Com rate limit |
| `GET/POST /api/admin/products` | ADMIN+ | ✅ Com rate limit |
| `PATCH /api/admin/coupons` | ADMIN+ | ✅ Com validação |
| `GET /api/user/profile` | CUSTOMER+ | ✅ Qualquer autenticado |

### Páginas Protegidas

| Página | Role Requerido | Status |
|--------|----------------|---------| 
| `/admin/*` | ADMIN+ | ✅ Middleware |
| `/admin/users` | SUPER_ADMIN | ✅ Verificado |
| `/account` | CUSTOMER+ | ✅ Cliente-side |

---

## 📋 CHECKLIST: Sistema de Autorização

- [x] NextAuth configurado com Credentials Provider
- [x] JWT strategy implementada
- [x] Role propagado para session
- [x] Type augmentation criada (types/next-auth.d.ts)
- [x] Helpers de autorização criados (auth-helpers.ts)
- [x] Rate limiting implementado
- [x] SELECT otimizado no Prisma
- [x] Endpoints críticos protegidos
- [x] Páginas admin protegidas

---

## 🚀 RESUMO DE MELHORIAS

### Antes
```
❌ Tipo role era 'unknown'
❌ Poder estar null sem verificação
❌ SELECT retornava todos campos
❌ Autorização repetida em muitos lugares
```

### Depois
```
✅ Tipo augmentation define role: string
✅ Funções helpers garantem validação
✅ SELECT apenas campos necessários
✅ Helpers reutilizáveis (requireAdminRole, etc)
✅ Rate limiting protege endpoints críticos
✅ Documentação completa do sistema
```

---

## 🔧 Como Adicionar Nova Role

Se precisar adicionar nova role (ex: MODERATOR):

**1. Atualizar Enum no Prisma:**
```prisma
enum UserRole {
  CUSTOMER
  ADMIN
  SUPER_ADMIN
  MODERATOR  // ← Novo
}
```

**2. Atualizar Type Augmentation:**
```typescript
// types/next-auth.d.ts
interface User {
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN' | 'MODERATOR';
}
```

**3. Adicionar Helper:**
```typescript
export function requireModeratorRole(session: Session | null) {
  if (!session || session.user.role !== 'MODERATOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}
```

---

## 📚 RECURSOS

- [NextAuth Docs](https://next-auth.js.org/)
- [JWT Strategy](https://next-auth.js.org/strategies/credentials)
- [Type Augmentation](https://next-auth.js.org/getting-started/typescript)
- [Role-Based Access Control](https://en.wikipedia.org/wiki/Role-based_access_control)

---

## ✅ CONCLUSÃO

**Sistema de Autorização:** Production Ready ✅

- Type-safe ✅
- Well-structured ✅
- Documented ✅
- Protected ✅
- DRY ✅

---

*Analisado e melhorado em: 10/01/2026*

