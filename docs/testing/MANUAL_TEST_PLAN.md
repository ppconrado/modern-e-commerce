# 🧪 MANUAL TEST PLAN - Settings Features

**Data:** 10 de Janeiro de 2026  
**Status:** Pronto para Testes Manuais

---

## ✅ O QUE FOI IMPLEMENTADO

### 1. Schema Database
- ✅ `disableReviews` (Boolean, default: **false** = enabled)
- ✅ `disableWishlist` (Boolean, default: **false** = enabled)
- ✅ `disableMaintenanceMode` (Boolean, default: **false** = mode off)

### 2. API Backend
- ✅ `src/lib/settings-helpers.ts` - Cache + helpers para verificar settings
- ✅ `/api/admin/settings` - GET/PATCH com cache invalidation
- ✅ `/api/products/[id]/reviews` - POST verifica `disableReviews`
- ✅ `/api/wishlist` - POST/DELETE verifica `disableWishlist`

### 3. Frontend Components
- ✅ `src/app/admin/settings/page.tsx` - UI atualizada para Disable (não Enable)
- ✅ `src/components/product-reviews.tsx` - Mostra mensagem se disabled
- ✅ `src/components/WishlistButton.tsx` - Desabilita se feature disabled
- ✅ `src/app/wishlist/page.tsx` - Redireciona se disabled

---

## 📋 TEST CHECKLIST

### TESTE 1: Verificar Default Values (Tudo Habilitado)

**Pré-condição:** Banco resetado, settings criadas com defaults

```
✓ Esperado: disableReviews = false (reviews ENABLED)
✓ Esperado: disableWishlist = false (wishlist ENABLED)
✓ Esperado: disableMaintenanceMode = false (loja OPERACIONAL)
```

**Passos:**
1. Abrir http://localhost:3000/admin/settings (como ADMIN)
2. Verificar cada switch:
   - "Disable Product Reviews" deve estar **OFF** (cinza)
   - "Disable Wishlist" deve estar **OFF** (cinza)
   - "Maintenance Mode" deve estar **OFF** (cinza)

**Esperado:** Todos os switches em OFF (verde) indicando serviços HABILITADOS

---

### TESTE 2: Desabilitar Reviews

**Passos:**
1. Em `/admin/settings`, tocar no switch "Disable Product Reviews"
2. Switch deve ficar **ON** (vermelho)
3. Clicar "Save Settings"
4. Toast deve aparecer: "Settings updated successfully"

**Verificação no Frontend:**
1. Ir para qualquer página de produto (ex: `/products/[id]`)
2. Descer para seção de reviews
3. Deveria mostrar mensagem: **"Reviews are currently disabled on this store"**
4. Formulário de review deve estar **OCULTO**

**Verificação via API:**
1. Terminal: `curl -X POST http://localhost:3000/api/products/{id}/reviews -H "Content-Type: application/json" -H "Authorization: Bearer {token}" -d '{"rating": 5}'`
2. Esperado: **403 Forbidden** com mensagem "Reviews are currently disabled"

---

### TESTE 3: Desabilitar Wishlist

**Passos:**
1. Em `/admin/settings`, tocar no switch "Disable Wishlist"
2. Switch deve ficar **ON** (vermelho)
3. Clicar "Save Settings"
4. Toast deve aparecer: "Settings updated successfully"

**Verificação no Frontend:**
1. Ir para qualquer página de produto
2. Procurar por "Wishlist Button" (ícone de coração)
3. Botão deve estar **DESABILITADO** (cinza com 50% opacity)
4. Clicar no botão → Toast: "Wishlist Disabled - Wishlist is currently disabled on this store"

**Verificação em /wishlist:**
1. Ir para http://localhost:3000/wishlist
2. Deveria mostrar cartão amarelo: **"Wishlist is currently disabled on this store"**
3. Botão "Back to Shop" disponível

**Verificação via API:**
1. Terminal: `curl -X POST http://localhost:3000/api/wishlist -H "Content-Type: application/json" -H "Authorization: Bearer {token}" -d '{"productId": "xyz"}'`
2. Esperado: **403 Forbidden** com mensagem "Wishlist is currently disabled"

---

### TESTE 4: Re-habilitar Features

**Passos:**
1. Em `/admin/settings`, desativar os switches (todos para OFF)
2. Clicar "Save Settings"
3. Toast: "Settings updated successfully"

**Verificação:**
1. Recarregar página de produto (Cmd+Shift+R para hard refresh)
2. Reviews devem estar **VISÍVEIS** novamente
3. Wishlist button deve estar **ATIVO** novamente
4. Poder adicionar à wishlist com sucesso
5. Poder deixar review com sucesso

---

### TESTE 5: Manutenção Mode (Opcional - Requer Middleware)

**Status:** Implementado no backend, middleware ainda não finalizado

**Passos (quando middleware implementado):**
1. Em `/admin/settings`, ativar "Maintenance Mode"
2. Save
3. Acessar qualquer página como cliente regular → deve redirecionar para `/maintenance`
4. Acessar como ADMIN → deve funcionar normalmente

---

## 🔍 VERIFICAÇÕES ADICIONAIS

### Verificar Cache
1. Desabilitar reviews
2. Fazer POST para `/api/products/[id]/reviews` → 403
3. Re-habilitar reviews (menos de 1 minuto)
4. Fazer POST novamente → deve funcionar (cache invalidado)

### Verificar TypeScript
```bash
npm run type-check
# Esperado: Sem erros
```

### Verificar Build
```bash
npm run build
# Esperado: Sem erros, compilação com sucesso
```

---

## ⚠️ PONTOS CRÍTICOS PARA VERIFICAR

- [ ] Settings aparecem com corretocampo `disable*` (não `enable*`)
- [ ] Default values são `false` (serviços HABILITADOS por padrão)
- [ ] Componentes verificam settings corretamente
- [ ] APIs retornam 403 quando feature é desabilitada
- [ ] Toast notificações aparecem corretamente
- [ ] Cache é invalidado quando settings são salvos
- [ ] Sem erros no console do navegador
- [ ] Sem erros no terminal Next.js

---

## 📝 RELATÓRIO DE TESTES

Após completar os testes, preencha:

```
Data: ___________
Testador: ___________

✓ TESTE 1 (Defaults): ___________
✓ TESTE 2 (Disable Reviews): ___________
✓ TESTE 3 (Disable Wishlist): ___________
✓ TESTE 4 (Re-habilitar): ___________
✓ TESTE 5 (Maintenance): ___________
✓ Cache Verification: ___________
✓ Build OK: ___________
✓ TypeScript OK: ___________

Problemas encontrados:
_____________________________

Pronto para commit: [ ] SIM [ ] NÃO
```

---

## 🚀 PRÓXIMO PASSO

Após validar todos os testes com sucesso:

```bash
git add .
git commit -m "feat: implement disable-based settings system with proper feature toggles"
git push
```

---

*Documento gerado em: 10/01/2026*
