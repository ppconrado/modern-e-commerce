# 📋 Sistema de Gerenciamento de Cupons

## 🎯 Funcionalidades Completas

### ✅ CRUD Completo
- **Criar Cupons** - Novo cupom com validação
- **Listar Cupons** - Visão completa com status e estatísticas
- **Editar Cupons** - Atualizar dados do cupom
- **Deletar Cupons** - Remover cupom e seus registros de uso

### 🎟️ Tipos de Desconto
- **Percentual (%)** - Ex: 10%, 25%, 50%
- **Valor Fixo ($)** - Ex: $5, $50, $100

### ⚙️ Configurações Avançadas

| Configuração | Descrição | Exemplo |
|-------------|-----------|---------|
| **Código** | Código único do cupom | `SAVE10`, `WELCOME10`, `TECH25` |
| **Descrição** | Texto descritivo | "10% desconto em qualquer compra" |
| **Tipo de Desconto** | Percentual ou valor fixo | `PERCENTAGE` ou `FIXED` |
| **Valor** | Quantidade do desconto | `10` (para 10%) ou `50` (para $50) |
| **Valor Mínimo** | Compra mínima para usar | `$0`, `$50`, `$200` |
| **Uso Máximo** | Limite de utilizações | `10`, `100`, `null` (ilimitado) |
| **Ativo** | Se cupom está disponível | `true` ou `false` |
| **Data Inicial** | Quando cupom começa a funcionar | `01/01/2026` |
| **Data Final** | Quando cupom para de funcionar | `31/12/2026` |

## 🔐 Cupons Pré-Configurados (Seed)

Ao rodar `npx prisma db seed`, esses cupons são criados:

### 1. **WELCOME10**
- Desconto: 10% (PERCENTAGE)
- Descrição: Welcome discount on first purchase
- Ativo: Sim
- Uso: Ilimitado
- Período: 2026 (ano todo)
- Ideal para: Novos clientes

### 2. **SAVE10**
- Desconto: 10% (PERCENTAGE)
- Descrição: 10% discount on any purchase
- Ativo: Sim
- Uso: Ilimitado
- Período: 2026 (ano todo)
- Ideal para: Desconto geral

### 3. **SAVE50**
- Desconto: $50 (FIXED)
- Descrição: $50 discount on orders over $200
- Ativo: Sim
- Uso: Máximo 10 vezes
- Valor Mínimo: $200
- Período: Jan-Dez 2026
- Ideal para: Grandes compras

### 4. **NEWYEAR20**
- Desconto: 20% (PERCENTAGE)
- Descrição: 20% discount for New Year celebration
- Ativo: Sim
- Uso: Máximo 50 vezes
- Valor Mínimo: $100
- Período: 01/01 - 31/01/2026
- Ideal para: Promoção sazonal

### 5. **TECH25**
- Desconto: 25% (PERCENTAGE)
- Descrição: 25% off electronics category
- Ativo: Sim
- Uso: Máximo 100 vezes
- Valor Mínimo: $50
- Período: 2026 (ano todo)
- Ideal para: Desconto por categoria

## 📍 Como Acessar

### Via Dashboard Admin
1. Faça login como ADMIN ou SUPER_ADMIN
2. Acesse `/admin`
3. Clique em "Coupons"

### URL Direta
- Gerenciar cupons: `http://localhost:3000/admin/coupons`
- API GET: `GET /api/admin/coupons`
- API POST: `POST /api/admin/coupons`

## 🔌 API Endpoints

### Listar Todos os Cupons
```bash
GET /api/admin/coupons

Response:
{
  "coupons": [
    {
      "id": "uuid",
      "code": "SAVE10",
      "description": "10% discount",
      "discountType": "PERCENTAGE",
      "discountValue": 10,
      "maxUses": null,
      "usedCount": 5,
      "minimumAmount": 0,
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-12-31T23:59:59.000Z",
      "isActive": true,
      "createdAt": "2026-01-09T20:00:00.000Z"
    }
  ]
}
```

### Criar Novo Cupom
```bash
POST /api/admin/coupons

Body:
{
  "code": "SUMMER30",
  "description": "Summer sale - 30% off",
  "discountType": "PERCENTAGE",
  "discountValue": 30,
  "maxUses": 100,
  "minimumAmount": 50,
  "startDate": "2026-06-01T00:00:00Z",
  "endDate": "2026-08-31T23:59:59Z",
  "isActive": true
}
```

### Obter Cupom Específico
```bash
GET /api/admin/coupons/:id
```

### Atualizar Cupom
```bash
PATCH /api/admin/coupons/:id

Body:
{
  "description": "Updated description",
  "isActive": false,
  "maxUses": 50
}
```

### Deletar Cupom
```bash
DELETE /api/admin/coupons/:id
```

## 🎯 Fluxo do Cliente

1. **Cliente adiciona itens ao carrinho**
   - Valor: $299.99

2. **Cliente aplica cupom "SAVE10"**
   - Desconto: 10% = $29.99
   - Novo total: $269.99

3. **Backend valida:**
   - ✅ Cupom existe
   - ✅ Cupom está ativo
   - ✅ Dentro do período válido
   - ✅ Não foi usado neste carrinho
   - ✅ Conta de uso não excedida

4. **Cliente finaliza compra**
   - Stripe Payment Intent criado
   - Cupom é marcado como usado
   - Contador incrementado

## 🔒 Segurança e Validações

### Backend Validations
- Código único (não permite duplicatas)
- Datas válidas (início < fim)
- Valor desconto positivo
- Uso máximo inteiro positivo

### Proteções
- Apenas ADMIN/SUPER_ADMIN podem gerenciar
- Cupons deletados removem registros de uso
- Transações atômicas no Stripe
- Logging de todas as operações

## 🗄️ Modelo de Dados

### Tabela: Coupon
```sql
CREATE TABLE "Coupon" (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255) NOT NULL,
  discountType ENUM('PERCENTAGE', 'FIXED') NOT NULL,
  discountValue DECIMAL(10,2) NOT NULL,
  maxUses INTEGER,
  usedCount INTEGER DEFAULT 0,
  minimumAmount DECIMAL(10,2) DEFAULT 0,
  applicableCategories JSON,
  startDate TIMESTAMP NOT NULL,
  endDate TIMESTAMP NOT NULL,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela: CouponUsage
```sql
CREATE TABLE "CouponUsage" (
  couponId ID,
  cartId ID,
  userId ID OPTIONAL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (couponId, cartId)
};
```

## 📊 Estatísticas Disponíveis

No painel do admin você pode ver:

- **Cupom** - Código do cupom
- **Desconto** - Valor e tipo (10%, $50)
- **Mín. Compra** - Valor mínimo requerido
- **Uso** - Quantas vezes foi usado vs máximo (5/100)
- **Período** - Data inicial até data final
- **Status** - Ativo ou Inativo (badge colorida)
- **Ações** - Editar ou Deletar

## ✨ Exemplos de Uso

### Criar Cupom de Boas-vindas
```bash
POST /api/admin/coupons
{
  "code": "BEM_VINDO20",
  "description": "Desconto de 20% para novo cliente",
  "discountType": "PERCENTAGE",
  "discountValue": 20,
  "maxUses": null,
  "minimumAmount": 0,
  "startDate": "2026-01-09T00:00:00Z",
  "endDate": "2026-12-31T23:59:59Z",
  "isActive": true
}
```

### Criar Cupom Black Friday (limitado)
```bash
POST /api/admin/coupons
{
  "code": "BLACK_FRIDAY",
  "description": "50% off Black Friday",
  "discountType": "PERCENTAGE",
  "discountValue": 50,
  "maxUses": 500,
  "minimumAmount": 0,
  "startDate": "2026-11-24T00:00:00Z",
  "endDate": "2026-11-28T23:59:59Z",
  "isActive": true
}
```

### Pausar um Cupom
```bash
PATCH /api/admin/coupons/:id
{
  "isActive": false
}
```

## 🚀 Próximas Melhorias Sugeridas

- [ ] Analytics de cupons mais usados
- [ ] Relatórios de ROI por cupom
- [ ] Histórico de alterações (audit log)
- [ ] Cupons por email/usuário específico
- [ ] Cupons com código automático para clientes VIP
- [ ] Integração com email marketing
