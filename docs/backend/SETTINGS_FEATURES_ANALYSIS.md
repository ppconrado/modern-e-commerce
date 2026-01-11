# 🔧 Análise Completa: Features de Settings

**Data:** 10 de Janeiro de 2026  
**Status:** Análise - Antes de Implementar

---

## 📋 FEATURES ATUAIS EM SETTINGS

### 1. **enableReviews** (Ativo na UI)
```
Campo: enableReviews (Boolean, default: true)
Descrição: "Allow customers to leave reviews on products"
```

**Onde é usado:**
- ✅ UI: `src/app/admin/settings/page.tsx` (Switch component, linha 287-291)
- ✅ API: `src/app/api/admin/settings/route.ts` (Schema Zod + validação)
- ✅ Banco: `prisma/schema.prisma` (StoreSettings.enableReviews)

**Onde DEVERIA ser usado:**
- ❌ `src/components/product-reviews.tsx` - **NÃO VERIFICA ESTE SETTING**
  - Linha 27-323: Formulário de reviews sempre visível
  - Deveria: Verificar se `enableReviews` é true antes de mostrar form
  - Risco: Reviews podem ser adicionados mesmo se disabled
  
- ❌ `src/app/api/products/[id]/reviews/route.ts` - **NÃO VERIFICA**
  - POST (linha 46): Aceita reviews sem verificar setting
  - Deveria: Validar `enableReviews` antes de criar review
  - Risco: API aceita reviews mesmo se feature disabled

---

### 2. **enableWishlist** → **disableWishlist** (Em Transição)
```
Campo ATUAL: enableWishlist (Boolean, default: true)
Campo NOVO: disableWishlist (Boolean, default: false)  ← JÁ ALTERADO
Descrição: "Allow customers to save products to wishlist"
```

**Status da Mudança:**
- ✅ Schema atualizado para `disableWishlist`
- ✅ API settings.route.ts atualizado
- ⚠️ Page settings ainda usa `enableWishlist` (precisa sincronizar)

**Onde é usado:**
- ✅ UI: `src/app/admin/settings/page.tsx` (Switch component, linha 302-306)
- ✅ API: `src/app/api/admin/settings/route.ts` (Schema)
- ✅ Banco: `prisma/schema.prisma` (StoreSettings.disableWishlist)

**Onde DEVERIA ser usado:**
- ❌ `src/app/wishlist/page.tsx` - **NÃO VERIFICA**
  - Linha 29: Página sempre carregável
  - Deveria: Redirecionar se wishlist disabled
  
- ❌ `src/components/WishlistButton.tsx` - **NÃO VERIFICA**
  - Linha 18-167: Botão sempre funcional
  - Deveria: Desabilitar/ocultar se wishlist disabled
  
- ❌ `src/app/api/wishlist/route.ts` - **NÃO VERIFICA**
  - POST/GET (linha 46 e 6): Sempre aceita requests
  - Deveria: Validar `disableWishlist` antes de processar
  - Risco: API continua funcionando mesmo se disabled

---

### 3. **maintenanceMode** (Ativo na UI)
```
Campo: maintenanceMode (Boolean, default: false)
Descrição: "Temporarily disable the store for customers"
```

**Onde é usado:**
- ✅ UI: `src/app/admin/settings/page.tsx` (Switch component, linha 319-323)
- ✅ API: `src/app/api/admin/settings/route.ts` (Schema)
- ✅ Banco: `prisma/schema.prisma`

**Onde DEVERIA ser usado:**
- ❌ **EM LUGAR NENHUM** - COMPLETAMENTE NÃO IMPLEMENTADO
  - Deveria: Middleware em `/pages/_middleware.ts` ou middleware.ts
  - Deveria: Redirecionar para página de manutenção se enabled
  - Deveria: Bloquear acesso a todas rotas exceto /admin e /login
  - Risco: Setting não funciona

---

## 🎯 PROBLEMA IDENTIFICADO

### Situação Atual:
```
Admin muda setting no painel
    ↓
Setting salvo no banco de dados ✅
    ↓
Frontend/API NÃO VERIFICA O SETTING ❌
    ↓
Feature continua funcionando mesmo quando "disabled"
```

### Exemplo Prático:
1. Admin disabilita Reviews em settings
2. Salva com sucesso (fica no BD)
3. Cliente entra em produto
4. Botão "Deixar Review" AINDA FUNCIONA
5. Review é criado com sucesso na API

---

## ✅ SOLUÇÃO NECESSÁRIA

### Arquitetura Proposta:

```
src/lib/settings-helpers.ts (NOVO)
├── getStoreSettings()           // Fetch settings with cache
├── isReviewsEnabled()           // Usa settings
├── isWishlistEnabled()          // Usa settings
├── isMaintenanceMode()          // Usa settings
└── getSettingFromCache()        // Cache in-memory

src/middleware.ts (NOVO/MELHORADO)
├── Verifica maintenanceMode
├── Redireciona se ativo (exceto /admin, /login)
└── Adiciona settings ao request context

MUDANÇAS NAS APIs:
├── /api/admin/settings/route.ts
│   └── Quando salva, invalida cache
├── /api/products/[id]/reviews/route.ts
│   └── POST: Verifica isReviewsEnabled()
├── /api/wishlist/route.ts
│   └── POST/GET/DELETE: Verifica isWishlistEnabled()
└── /api/wishlist?productId=X
    └── Verifica isWishlistEnabled()

MUDANÇAS NOS COMPONENTES:
├── src/components/product-reviews.tsx
│   └── Se !enableReviews → renderizar mensagem
├── src/components/WishlistButton.tsx
│   └── Se disableWishlist → desabilitar botão
└── src/app/wishlist/page.tsx
    └── Se disableWishlist → redirecionar para home

MUDANÇAS NA PAGE:
└── src/app/admin/settings/page.tsx
    └── Atualizar para usar disableWishlist (não enableWishlist)
```

---

## 📊 PRIORIDADE DE IMPLEMENTAÇÃO

### P1 (CRÍTICO):
1. ✅ Atualizar schema.prisma (DONE)
2. ✅ Atualizar API settings (DONE)
3. ❌ Atualizar UI settings/page.tsx (MISSING - ainda usa enableWishlist)
4. ❌ Adicionar validação em `/api/products/[id]/reviews/route.ts`
5. ❌ Adicionar validação em `/api/wishlist/route.ts`

### P2 (IMPORTANTE):
6. ❌ Criar `src/lib/settings-helpers.ts`
7. ❌ Atualizar `product-reviews.tsx` para verificar setting
8. ❌ Atualizar `WishlistButton.tsx` para verificar setting
9. ❌ Atualizar `wishlist/page.tsx` para verificar setting

### P3 (MEDIUM):
10. ❌ Implementar middleware para maintenanceMode
11. ❌ Criar página de manutenção

---

## 🔄 FLUXO CORRETO ESPERADO

### Reviews:
```
1. Admin desabilita reviews em settings
2. Setting salvo no BD (enableReviews = false)
3. Cliente abre página de produto
4. product-reviews.tsx verifica enableReviews
5. Se false → mostra "Reviews desabilitados"
6. Se tenta acessar API → POST em /api/products/[id]/reviews retorna 403
```

### Wishlist:
```
1. Admin disabilita wishlist em settings
2. Setting salvo no BD (disableWishlist = true)
3. Cliente abre página de produto
4. WishlistButton.tsx verifica disableWishlist
5. Se true → botão desabilitado/oculto
6. Se tenta acessar página /wishlist → redireciona para home
7. Se tenta chamar API /api/wishlist → POST retorna 403
```

### Maintenance Mode:
```
1. Admin ativa maintenance mode
2. Setting salvo no BD (maintenanceMode = true)
3. Cliente tenta acessar qualquer página
4. Middleware intercepta
5. Se NOT admin/super_admin → redireciona para /maintenance
6. Admin pode acessar tudo normalmente
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Atualizar `src/app/admin/settings/page.tsx` para usar `disableWishlist`
- [ ] Criar `src/lib/settings-helpers.ts`
- [ ] Validar reviews em `/api/products/[id]/reviews/route.ts`
- [ ] Validar wishlist em `/api/wishlist/route.ts`
- [ ] Atualizar `product-reviews.tsx`
- [ ] Atualizar `WishlistButton.tsx`
- [ ] Atualizar `wishlist/page.tsx`
- [ ] Implementar middleware para maintenanceMode
- [ ] Criar página /maintenance
- [ ] Testar cada feature localmente
- [ ] Commit quando tudo funcionar

---

## ⚠️ PROBLEMA IMEDIATO

A página de settings ainda tem:
```tsx
enableWishlist: boolean;  // ← Mas banco tem disableWishlist
```

Isso causa inconsistência! Quando user toca no switch:
- UI envia `enableWishlist: true`
- API recebe e ignora (espera `disableWishlist`)
- Setting não é atualizado corretamente

**Solução imediata:**
Atualizar `src/app/admin/settings/page.tsx` para usar `disableWishlist` em vez de `enableWishlist`.

---

## 🎓 RESUMO

**Status Atual:** 50% Implementado
- ✅ UI permite salvar settings
- ✅ Banco armazena settings
- ❌ Frontend não verifica settings
- ❌ APIs não verificam settings
- ❌ Maintenance mode não implementado

**Próximo Passo:** Sincronizar UI → Implementar validações → Testar
