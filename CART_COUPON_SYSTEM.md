# Implementação de Carrinho Server-Side com Sistema de Cupons

## Resumo das Alterações

Implementação completa de um sistema robusto de carrinho de compras no servidor com aplicação segura de cupons de desconto.

## Alterações Realizadas

### 1. **Schema Prisma** (`prisma/schema.prisma`)
Adicionadas 4 novas tabelas:
- **Cart**: Armazena carrinhos por usuário (userId) ou anônimo (anonymousId)
- **CartItem**: Itens individuais no carrinho com ID do item, quantidade e preço capturado
- **Coupon**: Cupons com validação por categoria, limite de uso, data de validade
- **CouponUsage**: Rastreia aplicação de cupons para auditoria

### 2. **Migration** (`prisma/migrations/20260109120000_add_cart_and_coupon_system`)
SQL para criar todas as tabelas e índices necessários

### 3. **Utilitários de Carrinho** (`src/lib/cart-utils.ts`)
Funções server-side críticas:
- `getOrCreateCart()`: Obtém ou cria carrinho para usuário/anônimo
- `recalculateCartTotals()`: Recalcula subtotal, desconto e total
- `validateCouponForCart()`: Validação completa de cupom (vencimento, limite, categoria, mínimo)
- `isCouponValid()`: Verifica se cupom está ativo e dentro das datas

### 4. **API Routes**

#### `GET/POST /api/cart`
- **GET**: Retorna carrinho do usuário autenticado
- **POST**: Adiciona item ao carrinho (validando estoque)

#### `PUT/DELETE /api/cart/[itemId]`
- **PUT**: Atualiza quantidade (0 = remove)
- **DELETE**: Remove item

#### `POST /api/cart/apply-coupon`
- Valida cupom contra carrinho
- Registra uso em CouponUsage
- Incrementa contador do cupom
- Retorna carrinho com desconto calculado

#### `POST /api/cart/remove-coupon`
- Remove cupom aplicado
- Recalcula total

#### `POST /api/cart/merge`
- **Merge de carrinho anônimo → usuário autenticado**
- Soma itens iguais
- Herda cupom se o usuário não tiver
- Deleta carrinho anônimo

### 5. **Store Zustand Atualizado** (`src/store/cart.ts`)
```typescript
interface CartItemWithId {
  id: string;        // ID do CartItem no servidor
  product: Product;
  quantity: number;
}
```
Agora inclui ID do servidor para sincronização precisa.

### 6. **Hook useServerCart** (`src/hooks/use-server-cart.ts`)
Interface unificada para operações de carrinho:
```typescript
const {
  items,                    // CartItemWithId[]
  cartId,                   // ID do carrinho
  discountAmount,           // Desconto aplicado
  subtotal, total,          // Totais
  couponCode,               // Cupom ativo
  addToCart,                // async (product, qty) → Promise
  updateItemQuantity,       // async (productId, qty) → Promise
  removeFromCart,           // async (productId) → Promise
  applyCoupon,              // async (code) → Promise
  removeCoupon,             // async () → Promise
} = useServerCart();
```

### 7. **Login com Merge de Carrinho** (`src/app/login/page.tsx`)
Após login bem-sucedido:
```typescript
const anonymousCartId = localStorage.getItem('anonCartId');
if (anonymousCartId) {
  await fetch('/api/cart/merge', {
    method: 'POST',
    body: JSON.stringify({ anonymousCartId }),
  });
  localStorage.removeItem('anonCartId');
}
```

### 8. **Componentes Atualizados**

#### Header (`src/components/header.tsx`)
- Usa `useServerCart()` em vez de `useCartStore` direto
- getTotalItems sincroniza com servidor

#### Product Card (`src/components/product-card.tsx`)
- `handleAddToCart()` chama `addToCart()` (async)
- `handleIncrement/Decrement()` chamam `updateItemQuantity()` (async)
- Remove em quantidade 1 chama `removeFromCart()`

#### Cart Page (`src/app/cart/page.tsx`)
- `removeFromCart()` async com feedback
- `updateItemQuantity()` para +/-

#### Checkout Page (`src/app/checkout/page.tsx`)
- Nova seção de cupom com input e botão "Apply"
- Exibe cupom aplicado com botão "Remove"
- Mostra desconto em verde
- `handleApplyCoupon()` e `handleRemoveCoupon()`
- Total dinâmico baseado em `getTotalPrice()`

## Fluxo de Segurança

### Por que é seguro:
1. **Validação Server-Side Completa**
   - Cupom checado em `/api/cart/apply-coupon`
   - Estoque validado a cada adição/atualização
   - Total sempre calculado no servidor

2. **Estoque Protegido**
   - Product stock verificado na API
   - Quantidade máxima não pode ser excedida

3. **Cupom Audit Trail**
   - Cada uso registrado em `CouponUsage(couponId, cartId, userId, usedAt)`
   - Contador incrementado atomicamente
   - Limite de uso respeitado

4. **Multidispositivo**
   - Carrinho vive no servidor
   - Sincroniza entre dispositivos
   - Login une anônimo → autenticado automaticamente

## Fluxo de Usuário

### Anônimo:
1. Browser gera `anonCartId` → localStorage
2. Adiciona produtos → POST /api/cart
3. Server cria Cart com `anonymousId`
4. Aplica cupom → validado no servidor

### Login:
1. Chama `/api/cart/merge` com `anonymousCartId`
2. Server mescla itens + cupom (se houver)
3. Cart é agora user-specific (userId)
4. localStorage limpo

### Autenticado:
1. Carrega carrinho → GET /api/cart (pelo userId)
2. Adiciona/remove/atualiza itens
3. Aplica cupom (validado contra carrinho)
4. Checkout usa total do servidor

## Configuração de Cupons

Exemplo de criação de cupom:
```sql
INSERT INTO "Coupon" (
  id, code, discountType, discountValue,
  minimumAmount, maxUses, isActive,
  startDate, endDate, applicableCategories
) VALUES (
  'cpn_123', 'SAVE10', 'PERCENTAGE', 10,
  50.0, 100, true,
  NOW(), NOW() + INTERVAL '30 days',
  '["electronics", "books"]'  -- JSON array ou NULL
);
```

## Próximos Passos Recomendados

1. **Webhook Stripe**: Integrar webhook para confirmar pagamento e criar Order atomicamente
2. **Session Storage**: Salvar cartId na sessão para acesso rápido
3. **Admin Panel**: CRUD de cupons com validação visual
4. **Analytics**: Rastrear cupons mais usados, taxa de abandono
5. **Email**: Enviar cupom expirado em breve, carrinho abandonado
