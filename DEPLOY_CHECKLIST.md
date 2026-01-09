# ✅ Production Deploy Checklist

**Data:** 9 Janeiro 2026  
**Status:** Pronto para deploy  
**Branch:** main  

---

## 📊 Status do Projeto

### ✅ Commits Realizados
- [x] feat(coupons): Admin coupon management UI and APIs
- [x] feat(cart): Enhanced validation and coupon logic
- [x] fix(checkout): Improved error handling and UI
- [x] feat(payment): PaymentIntent metadata and webhook cleanup
- [x] feat(infra): Logger, env validation, middleware, health
- [x] feat(testing): E2E tests for cart/coupon/checkout
- [x] docs(payments): Payment system documentation
- [x] chore: Future optimization infrastructure

### ✅ Testes Locais
- [x] E2E Tests (Playwright) - **PASSED** ✅
- [x] Server rodando em http://localhost:3000
- [x] Coupon validation working (SAVE10, SAVE50)
- [x] Cart operations (add, update, remove)
- [x] Admin coupons CRUD working

---

## 🚀 Deploy Steps (Seguir DEPLOYMENT.md)

### 1️⃣ Neon Database (3 min)

**URL:** https://console.neon.tech/

- [ ] Criar novo projeto: `ecommerce-production`
- [ ] Região: **US East (Ohio)** ou **São Paulo**
- [ ] Copiar connection string
- [ ] Limpar formato (remover `psql '`, `'`, `&channel_binding=require`)

**Connection String Format:**
```
postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
```

---

### 2️⃣ GitHub (2 min)

**Repositório:** https://github.com/JosePauloCamp/e-commerce

- [ ] Push commits: `git push origin main`
- [ ] Verificar último commit no GitHub

**Comando:**
```powershell
git push origin main
```

---

### 3️⃣ Vercel Deploy (5 min)

**URL:** https://vercel.com/

- [ ] Login (usar conta GitHub)
- [ ] Import repository: `JosePauloCamp/e-commerce`
- [ ] Framework: **Next.js** (auto-detected)
- [ ] Root Directory: **/** (padrão)

**Configure Environment Variables:**

```bash
# DATABASE (Neon)
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"

# NEXTAUTH
AUTH_SECRET="[gerar com: openssl rand -base64 32]"
NEXTAUTH_URL="https://seu-app.vercel.app"

# STRIPE (TEST MODE primeiro)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..." (configurar depois)

# CLOUDINARY
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# NEXT.JS
NEXT_PUBLIC_API_URL="https://seu-app.vercel.app"
```

- [ ] Clicar **"Deploy"**
- [ ] Aguardar build (~3 min)

---

### 4️⃣ Database Setup (3 min)

**Após deploy bem-sucedido:**

- [ ] Ir para Vercel dashboard → Settings → General
- [ ] Copiar URL de produção (ex: `https://e-commerce-xyz.vercel.app`)
- [ ] Atualizar `NEXTAUTH_URL` e `NEXT_PUBLIC_API_URL` com URL real
- [ ] Redeploy (Vercel auto-redeploy on env change)

**Seed Database (opcional):**

Via Vercel CLI ou criar endpoint `/api/admin/seed` (já existe em seed.ts):
```bash
npx prisma db seed
```

---

### 5️⃣ Stripe Webhook (5 min)

**URL:** https://dashboard.stripe.com/test/webhooks

- [ ] Criar webhook endpoint: `https://seu-app.vercel.app/api/webhooks/stripe`
- [ ] Selecionar eventos:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`
- [ ] Copiar **Signing Secret** (`whsec_...`)
- [ ] Adicionar no Vercel env vars: `STRIPE_WEBHOOK_SECRET`
- [ ] Redeploy

---

### 6️⃣ Testes de Produção (5 min)

**Playwright Production Tests:**

1. Criar `.env.production` (local):
```bash
TEST_BASE_URL="https://seu-app.vercel.app"
```

2. Rodar testes de produção:
```powershell
npx playwright test --config=playwright.config.production.ts
```

**Testes Manuais:**

- [ ] Acessar https://seu-app.vercel.app
- [ ] Criar conta e login
- [ ] Adicionar produto ao carrinho
- [ ] Aplicar cupom `SAVE10`
- [ ] Checkout com Stripe (test card: `4242 4242 4242 4242`)
- [ ] Verificar webhook logs no Stripe dashboard
- [ ] Verificar pedido criado no banco
- [ ] Verificar carrinho limpo após pagamento

---

### 7️⃣ Monitoring & Health (2 min)

**Health Endpoint:**

- [ ] Testar: `https://seu-app.vercel.app/api/monitoring/health`

Deve retornar:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "database": "connected",
  "stripe": "configured"
}
```

**Logs:**

- [ ] Vercel dashboard → Logs → Runtime Logs
- [ ] Stripe dashboard → Webhooks → Logs

---

## 🔐 Variáveis de Ambiente Obrigatórias

### Vercel Environment Variables (mínimo)

```bash
DATABASE_URL                      # Neon connection string
AUTH_SECRET                       # openssl rand -base64 32
NEXTAUTH_URL                      # https://seu-app.vercel.app
STRIPE_SECRET_KEY                 # sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY # pk_test_...
STRIPE_WEBHOOK_SECRET             # whsec_... (após criar webhook)
NEXT_PUBLIC_API_URL               # https://seu-app.vercel.app
```

### Opcionais (recomendado)

```bash
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

---

## 🐛 Troubleshooting

### Build Failure

**Erro:** `Prisma Client not generated`
- ✅ Solução: Verificar `vercel.json` tem `buildCommand: "prisma generate && npm run build"`

**Erro:** `DATABASE_URL not found`
- ✅ Solução: Adicionar `DATABASE_URL` nas env vars do Vercel

### Runtime Errors

**Erro 500 em `/api/checkout`**
- Verificar logs Vercel: `vercel logs`
- Verificar Stripe keys válidas
- Verificar DATABASE_URL correto

**Webhook não funcionando**
- Verificar URL endpoint: `https://seu-app.vercel.app/api/webhooks/stripe`
- Verificar `STRIPE_WEBHOOK_SECRET` correto
- Testar webhook no Stripe dashboard → Send test webhook

### Database Issues

**Erro:** `Can't reach database`
- Verificar Neon project ativo (free tier hiberna após inatividade)
- Verificar connection string correto (sem `psql '` wrapper)
- Testar conexão via Neon SQL Editor

---

## 📚 Documentação Relacionada

- [DEPLOYMENT.md](DEPLOYMENT.md) - Guia detalhado de deploy
- [PAYMENT_SYSTEM.md](PAYMENT_SYSTEM.md) - Sistema de pagamento
- [COUPON_MANAGEMENT.md](COUPON_MANAGEMENT.md) - Gestão de cupons
- [TESTING_STRATEGY.md](TESTING_STRATEGY.md) - Estratégia de testes

---

## ✅ Após Deploy Bem-Sucedido

- [ ] Atualizar README.md com URL de produção
- [ ] Criar tag no Git: `git tag v1.0.0 && git push --tags`
- [ ] Documentar credenciais de admin no gerenciador de senhas
- [ ] Configurar alertas Vercel (opcional)
- [ ] Monitorar primeiras 24h de uso

---

## 🎯 Próximos Passos (Pós-Deploy)

1. **Stripe Live Mode** - Quando pronto para produção real
2. **Custom Domain** - Configurar domínio próprio no Vercel
3. **Email Service** - Integrar Resend para emails transacionais
4. **Analytics** - Adicionar Google Analytics ou Vercel Analytics
5. **Performance** - Ativar cache (já preparado em `src/lib/cache.ts`)
6. **Resilience** - Ativar circuit breaker (já preparado em `src/lib/circuit-breaker.ts`)

---

**Última atualização:** 9 Janeiro 2026  
**Pronto para deploy:** ✅ SIM
