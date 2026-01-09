# 🔐 Configuração de Variáveis de Ambiente - Vercel

## 📝 Passo a Passo para Configurar Produção

### 1. Acessar Dashboard do Vercel

1. Vá para: https://vercel.com
2. Faça login
3. Selecione o projeto: **josepaulo-e-commerce**
4. Clique em **Settings** (menu superior)
5. Clique em **Environment Variables** (menu lateral)

---

### 2. Adicionar Variáveis Obrigatórias

Clique em **Add New** para cada variável abaixo:

#### 🗄️ DATABASE_URL (Neon PostgreSQL)

**Nome:** `DATABASE_URL`

**Valor:** Obter do Neon (https://console.neon.tech):
```
postgresql://user:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Environment:** Production

⚠️ **IMPORTANTE:** 
- NÃO use `localhost` ou `127.0.0.1`
- DEVE incluir `?sslmode=require` no final
- URL deve ser acessível pela internet

---

#### 🔐 AUTH_SECRET

**Nome:** `AUTH_SECRET`

**Valor:** Gerar com comando:
```bash
openssl rand -base64 32
```

Exemplo de resultado:
```
kJ8mN2pQ4rS6tU8vW0xY2zA3bC5dE7fG9hI1jK3lM5n=
```

**Environment:** Production

⚠️ **IMPORTANTE:** Use um valor único e seguro (não use o exemplo acima)

---

#### 🌐 NEXTAUTH_URL

**Nome:** `NEXTAUTH_URL`

**Valor:** 
```
https://josepaulo-e-commerce.vercel.app
```

**Environment:** Production

---

#### 💳 STRIPE_SECRET_KEY

**Nome:** `STRIPE_SECRET_KEY`

**Valor:** Obter do Stripe Dashboard (https://dashboard.stripe.com/apikeys)

**Para TESTE (Development):**
```
sk_test_51xxx...
```

**Para PRODUÇÃO (Production):**
```
sk_live_51xxx...
```

**Environment:** Selecione de acordo com o tipo de chave

⚠️ **IMPORTANTE:** Nunca use chaves de teste em produção!

---

#### 🔑 NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

**Nome:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Valor:** Obter do Stripe Dashboard

**Para TESTE:**
```
pk_test_51xxx...
```

**Para PRODUÇÃO:**
```
pk_live_51xxx...
```

**Environment:** Selecione de acordo com o tipo de chave

---

#### 🪝 STRIPE_WEBHOOK_SECRET

**Nome:** `STRIPE_WEBHOOK_SECRET`

**Valor:** Obter do Stripe Webhooks

**Como obter:**
1. Acesse: https://dashboard.stripe.com/webhooks
2. Clique em **Add endpoint**
3. URL do endpoint: `https://josepaulo-e-commerce.vercel.app/api/webhooks/stripe`
4. Eventos a ouvir: Selecione `payment_intent.succeeded`
5. Copie o **Signing secret** (começa com `whsec_`)

**Valor:**
```
whsec_xxx...
```

**Environment:** Production

---

#### ☁️ Cloudinary (3 variáveis)

Obter em: https://console.cloudinary.com/

**CLOUDINARY_CLOUD_NAME**
```
Nome: CLOUDINARY_CLOUD_NAME
Valor: seu_cloud_name
Environment: Production
```

**CLOUDINARY_API_KEY**
```
Nome: CLOUDINARY_API_KEY
Valor: 123456789012345
Environment: Production
```

**CLOUDINARY_API_SECRET**
```
Nome: CLOUDINARY_API_SECRET
Valor: seu_api_secret_aqui
Environment: Production
```

---

### 3. Resumo das Variáveis

Ao final, você deve ter estas variáveis configuradas:

- ✅ `DATABASE_URL` - Neon PostgreSQL
- ✅ `AUTH_SECRET` - Chave de autenticação
- ✅ `NEXTAUTH_URL` - URL do app
- ✅ `STRIPE_SECRET_KEY` - Chave secreta do Stripe
- ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Chave pública do Stripe
- ✅ `STRIPE_WEBHOOK_SECRET` - Secret do webhook
- ✅ `CLOUDINARY_CLOUD_NAME` - Nome do cloud
- ✅ `CLOUDINARY_API_KEY` - API key
- ✅ `CLOUDINARY_API_SECRET` - API secret

---

### 4. Aplicar Mudanças

Após adicionar todas as variáveis:

1. Vá para **Deployments**
2. Clique nos **...** do último deployment
3. Clique em **Redeploy**
4. Aguarde o build completar (1-2 minutos)

---

### 5. Verificar Configuração

Após o redeploy, teste:

**Health Check:**
```
https://josepaulo-e-commerce.vercel.app/api/health
```

Deve retornar:
```json
{
  "status": "ok",
  "diagnostics": {
    "database": {
      "connected": true,
      "canQuery": true
    },
    "cart": {
      "canCreate": true
    }
  }
}
```

---

## 🔍 Verificação Rápida

### ❌ Se DATABASE_URL estiver errado:
```json
{
  "status": "error",
  "diagnostics": {
    "database": {
      "connected": false,
      "error": "Connection timeout"
    }
  }
}
```

**Solução:** Verifique a DATABASE_URL no Neon

---

### ❌ Se AUTH_SECRET estiver faltando:
O login não funcionará

**Solução:** Adicione AUTH_SECRET gerado com `openssl rand -base64 32`

---

### ❌ Se Stripe estiver errado:
Pagamentos não funcionarão

**Solução:** Verifique as 3 variáveis do Stripe

---

## 📞 Suporte

Se mesmo após configurar tudo ainda não funcionar:

1. Vá em **Deployments → Runtime Logs**
2. Tente adicionar produto ao carrinho
3. Procure por erros com `[POST /api/cart]`
4. Compartilhe o erro para análise
