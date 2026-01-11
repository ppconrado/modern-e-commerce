# 🚀 Guia de Deploy - E-commerce

Este guia explica como configurar e fazer deploy do projeto em diferentes ambientes.

## 📋 Índice

1. [Desenvolvimento Local](#desenvolvimento-local)
2. [Deploy em Produção (Vercel + Neon)](#deploy-em-produção-vercel--neon)
3. [Docker (Opcional)](#docker-opcional)
4. [Checklist de Deploy](#checklist-de-deploy)
5. [Solução de Problemas](#solução-de-problemas)


## 🛠️ Desenvolvimento Local

### Pré-requisitos


### 1. Configurar Banco de Dados Local

```bash
# Iniciar PostgreSQL no Docker
docker compose up -d postgres

# Verificar se está rodando
docker ps
```

O PostgreSQL estará disponível em: `localhost:5433`

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env.local

# Editar .env.local com suas credenciais
```

**Variáveis mínimas necessárias:**

```env
# Banco Local (Docker)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ecommerce_db?schema=public"

# Auth (gerar com: openssl rand -base64 32)
AUTH_SECRET="seu-secret-key-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (modo teste)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="seu_cloud_name"
CLOUDINARY_API_KEY="seu_api_key"
CLOUDINARY_API_SECRET="seu_api_secret"
```

### 3. Configurar Banco de Dados

```bash
# Instalar dependências
npm install

# Gerar Prisma Client
npm run db:generate

# Rodar migrations
npm run db:migrate

# Popular banco com dados de exemplo
npm run db:seed
npm run db:seed:coupons
```

### 4. Iniciar Aplicação

```bash
# Modo desenvolvimento
npm run dev

# Acessar: http://localhost:3000
```


## 🌐 Deploy em Produção (Vercel + Neon)

### Parte 1: Configurar Banco de Dados Neon

#### 1.1. Criar Conta no Neon

1. Acesse: https://neon.tech
2. Crie uma conta gratuita
3. Crie um novo projeto

#### 1.2. Obter Connection String

1. No dashboard do Neon, vá em **Connection Details**
2. Copie a connection string (formato pooled)
3. Exemplo: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`

#### 1.3. Rodar Migrations no Neon

```bash
# Configure DATABASE_URL temporariamente para o Neon
export DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Rodar migrations
npx prisma migrate deploy

# Popular dados iniciais (opcional)
npx prisma db seed
```

### Parte 2: Deploy no Vercel

#### 2.1. Conectar Repositório

1. Acesse: https://vercel.com
2. Faça login com GitHub
3. Click em **Add New Project**
4. Selecione seu repositório: `ppconrado/modern-e-commerce`
5. Click em **Import**

#### 2.2. Configurar Variáveis de Ambiente

No dashboard do Vercel:

1. Vá em **Settings → Environment Variables**
2. Adicione as seguintes variáveis:

**Banco de Dados:**
```
DATABASE_URL = postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Autenticação:**
```bash
# Gerar secret seguro:
openssl rand -base64 32

# Adicionar:
AUTH_SECRET = (resultado do comando acima)
NEXTAUTH_URL = https://josepaulo-e-commerce.vercel.app
```

**Stripe (Produção - Chaves LIVE):**
```
STRIPE_SECRET_KEY = sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...
STRIPE_WEBHOOK_SECRET = whsec_...
```

**Cloudinary:**
```
CLOUDINARY_CLOUD_NAME = seu_cloud_name
CLOUDINARY_API_KEY = seu_api_key
CLOUDINARY_API_SECRET = seu_api_secret
```

#### 2.3. Deploy

```bash
# Fazer commit e push
git add .
git commit -m "chore: prepare for production"
git push origin main

# Vercel fará deploy automático
```

#### 2.4. Configurar Webhook do Stripe

1. Acesse: https://dashboard.stripe.com/webhooks
2. Click em **Add endpoint**
3. URL: `https://josepaulo-e-commerce.vercel.app/api/webhooks/stripe`
4. Eventos: Selecione `payment_intent.succeeded`
5. Copie o **Signing secret** e adicione em `STRIPE_WEBHOOK_SECRET` no Vercel

#### 2.5. Verificar Deploy

Acesse: https://josepaulo-e-commerce.vercel.app/api/health

Deve retornar:
```json
{
  "status": "ok",
  "diagnostics": {
    "database": { "connected": true },
    "cart": { "canCreate": true }
  }
}
```


## 🐳 Docker (Opcional)

Para rodar aplicação completa em Docker:

### 1. Build e Run

```bash
# Build e iniciar todos os serviços
docker compose up --build

# Rodar em background
docker compose up -d

# Ver logs
docker compose logs -f app
```

### 2. Acessar Aplicação


### 3. Parar Serviços

```bash
docker compose down

# Parar e remover volumes
docker compose down -v
```


## ✅ Checklist de Deploy

### Antes do Deploy


### Após Deploy



## 🔧 Solução de Problemas

### Problema: Carrinho não aceita produtos

**Causa comum:** DATABASE_URL apontando para localhost

**Solução:**
1. Verificar variável no Vercel Dashboard
2. Deve ser URL do Neon: `postgresql://...@ep-xxx.us-east-1.aws.neon.tech/...`
3. Nunca deve conter `localhost` ou `127.0.0.1`

### Problema: Erro "output: standalone"

**Causa:** Configuração incorreta para Vercel

**Solução:**
```typescript
// next.config.ts - NÃO usar output: 'standalone' para Vercel
const nextConfig: NextConfig = {
  // output: 'standalone', // Apenas para Docker
  serverExternalPackages: ['pg', '@prisma/client'],
};
```

### Problema: Timeout em API routes

**Causa:** Limite de tempo muito curto

**Solução:**
```json
// vercel.json
{
  "functions": {
    "app/api/**": {
      "maxDuration": 30  // Aumentar para 30s
    }
  }
}
```

### Problema: Prisma não encontra banco

**Causa:** SSL/conexão não configurada

**Solução:**
```typescript
// src/lib/prisma.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Necessário para Neon
  },
});
```

### Verificar Logs no Vercel

1. Acesse: https://vercel.com/seu-projeto
2. Vá em **Deployments → Latest**
3. Click em **Runtime Logs**
4. Procure por erros começando com `[POST /api/cart]` ou `[getOrCreateCart]`

### Testar Localmente com Neon

```bash
# Temporariamente usar banco de produção
export DATABASE_URL="postgresql://...neon.tech/..."

npm run dev

# Testar se conecta e funciona
```


## 📚 Recursos Adicionais



## 🆘 Precisa de Ajuda?

1. Verifique `/api/health` primeiro
2. Consulte os logs no Vercel
3. Revise todas as variáveis de ambiente
4. Confirme que DATABASE_URL é acessível pela internet
