-- Inserir cupons de desconto no banco de dados

-- Cupom de 10% de desconto
INSERT INTO "Coupon" (id, code, description, "discountType", "discountValue", "maxUses", "usedCount", "minimumAmount", "startDate", "endDate", "isActive", "createdAt", "updatedAt")
VALUES (
  'coupon_welcome10',
  'WELCOME10',
  '10% de desconto para novos clientes',
  'PERCENTAGE',
  10,
  100,
  0,
  0,
  NOW(),
  NOW() + INTERVAL '30 days',
  true,
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- Cupom de R$ 50 fixo (mínimo R$ 200)
INSERT INTO "Coupon" (id, code, description, "discountType", "discountValue", "maxUses", "usedCount", "minimumAmount", "startDate", "endDate", "isActive", "createdAt", "updatedAt")
VALUES (
  'coupon_save50',
  'SAVE50',
  'R$ 50 de desconto em compras acima de R$ 200',
  'FIXED',
  50,
  50,
  0,
  200,
  NOW(),
  NOW() + INTERVAL '30 days',
  true,
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- Cupom de 20% (categoria ELECTRONICS)
INSERT INTO "Coupon" (id, code, description, "discountType", "discountValue", "applicableCategories", "maxUses", "usedCount", "minimumAmount", "startDate", "endDate", "isActive", "createdAt", "updatedAt")
VALUES (
  'coupon_tech20',
  'TECH20',
  '20% de desconto em Eletrônicos',
  'PERCENTAGE',
  20,
  '["ELECTRONICS"]',
  75,
  0,
  0,
  NOW(),
  NOW() + INTERVAL '15 days',
  true,
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- Cupom de frete grátis
INSERT INTO "Coupon" (id, code, description, "discountType", "discountValue", "maxUses", "usedCount", "minimumAmount", "startDate", "endDate", "isActive", "createdAt", "updatedAt")
VALUES (
  'coupon_freeship',
  'FREESHIP',
  'Frete grátis em compras acima de R$ 100',
  'FIXED',
  0,
  200,
  0,
  100,
  NOW(),
  NOW() + INTERVAL '60 days',
  true,
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- Cupom de 15%
INSERT INTO "Coupon" (id, code, description, "discountType", "discountValue", "maxUses", "usedCount", "minimumAmount", "startDate", "endDate", "isActive", "createdAt", "updatedAt")
VALUES (
  'coupon_first15',
  'FIRST15',
  '15% de desconto na primeira compra',
  'PERCENTAGE',
  15,
  1000,
  0,
  0,
  NOW(),
  NOW() + INTERVAL '90 days',
  true,
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;
