# 🔐 Como Usar os Novos Sistemas de Segurança

## Quick Start Guide

### 1️⃣ Auth Helpers

Use essas funções para proteger endpoints com verificação de role:

```typescript
import { requireAdminRole, requireSuperAdminRole } from '@/lib/auth-helpers';

// Exemplo em uma rota API
export async function POST(req: NextRequest) {
  const session = await auth();
  
  // Verifica se é ADMIN ou SUPER_ADMIN
  const authError = requireAdminRole(session);
  if (authError) return authError; // Retorna erro 401/403 se não autorizado
  
  // Sua lógica aqui, session está garantida como não-null
  console.log(session.user.id);
}
```

#### Disponíveis:
- `requireAdminRole(session)` - Requer ADMIN ou SUPER_ADMIN
- `requireSuperAdminRole(session)` - Requer apenas SUPER_ADMIN
- `requireAuth(session)` - Apenas check de autenticação

---

### 2️⃣ Rate Limiting

Proteja endpoints contra abuso com rate limiting:

```typescript
import { rateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  // 10 req/min (para operações críticas)
  const limitError = rateLimit(req, { limiter: 'strict' });
  if (limitError) return limitError;
  
  // Sua lógica aqui
}
```

#### Presets Disponíveis:

| Preset | Limite | Uso |
|--------|--------|-----|
| `strict` | 10 req/min | Criar invites, deletar produtos |
| `default` | 30 req/min | Operações normais (padrão) |
| `relaxed` | 100 req/min | Leitura de dados |

```typescript
// 30 req/min (default)
rateLimit(req);

// 100 req/min
rateLimit(req, { limiter: 'relaxed' });
```

---

### 3️⃣ Store Settings (Persistência)

Settings agora salvam automaticamente no banco de dados:

```typescript
// GET - Busca settings (ou cria defaults)
const res = await fetch('/api/admin/settings');
const { settings } = await res.json();

// PATCH - Salva settings (persiste na próxima vez)
const res = await fetch('/api/admin/settings', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    storeName: 'Minha Loja',
    storeEmail: 'contato@loja.com',
    taxRate: 5,
    maintenanceMode: false,
  }),
});
```

---

## 📋 Checklist: Protegendo um Novo Endpoint

Ao criar um novo endpoint `/api/admin/...`, siga este checklist:

- [ ] **Importar helpers:**
  ```typescript
  import { requireAdminRole } from '@/lib/auth-helpers';
  import { rateLimit } from '@/lib/rate-limiter';
  ```

- [ ] **Adicionar rate limiting no início:**
  ```typescript
  const limitError = rateLimit(req, { limiter: 'strict' }); // ou outro preset
  if (limitError) return limitError;
  ```

- [ ] **Verificar autenticação/autorização:**
  ```typescript
  const session = await auth();
  const authError = requireAdminRole(session); // ou requireSuperAdminRole
  if (authError) return authError;
  ```

- [ ] **Validar input com Zod:**
  ```typescript
  const schema = z.object({ /* ... */ });
  const validatedData = schema.parse(body);
  ```

- [ ] **Handle Zod errors:**
  ```typescript
  catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }
  ```

- [ ] **Log erros (não expos ao cliente):**
  ```typescript
  console.error('Error message:', error);
  return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  ```

---

## 🔧 Exemplo Completo

Endpoint seguro e profissional:

```typescript
// src/app/api/admin/my-feature/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limiter';
import { requireAdminRole } from '@/lib/auth-helpers';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  value: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limit
    const limitError = rateLimit(req, { limiter: 'strict' });
    if (limitError) return limitError;

    // 2. Authenticate & authorize
    const session = await auth();
    const authError = requireAdminRole(session);
    if (authError) return authError;

    // 3. Validate input
    const body = await req.json();
    const validatedData = schema.parse(body);

    // 4. Process (your logic here)
    const result = await prisma.myModel.create({
      data: validatedData,
    });

    // 5. Return success
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    // 6. Error handling
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    console.error('Failed to create feature:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## ⚠️ Rate Limiting - Notas Importantes

### Desenvolvimento
- Rate limiter funciona em memória
- Reseta ao fazer restart do server
- Perfeito para desenvolvimento local

### Produção
Para produção, considere usar:
- **Upstash Redis** - Serverless Redis
- **Redis Cloud** - Managed Redis
- **AWS ElastiCache** - Redis gerenciado

Exemplo com Upstash (futuro):
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});

const { success } = await ratelimit.limit("api_user_123");
```

---

## 🚀 Padrão de Endpoint Admin

Todos endpoints `/api/admin/*` devem seguir este padrão:

```
1. Rate limit (se criação/delete)
2. Autenticação + Autorização
3. Validação Zod
4. Lógica de negócio
5. Sucesso ou erro
6. Log de erros (não expor ao cliente)
```

---

## 📊 Status de Implementação

| Arquivo | Status | Rate Limit | Auth | Zod |
|---------|--------|-----------|------|-----|
| `/api/admin/invite` | ✅ | Sim (strict) | Sim | Sim |
| `/api/admin/products` | ✅ | Sim (strict) | Sim | Sim |
| `/api/admin/orders` | ✅ | Não | Sim | Sim |
| `/api/admin/coupons` | ✅ | Não | Sim | Sim |
| `/api/admin/settings` | ✅ | Não | Sim | Sim |
| `/api/admin/analytics` | ✅ | Não | Sim | Não (optional) |

---

## 🎓 Recursos Adicionais

- [Auth Helpers](./src/lib/auth-helpers.ts) - Funções de autenticação
- [Rate Limiter](./src/lib/rate-limiter.ts) - Sistema de rate limiting
- [Audit Report](./ADMIN_AUDIT_REPORT.md) - Relatório de auditoria completo
- [Improvements Report](./IMPROVEMENTS_REPORT.md) - Detalhes das melhorias

---

**Última atualização:** 10/01/2026  
**Versão:** 1.0.0 Production Ready

