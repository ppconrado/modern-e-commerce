#!/usr/bin/env bash

echo "=== TESTANDO SETTINGS FEATURES ==="

echo -e "\n1. Testando GET /api/admin/settings (sem auth)"
curl -i http://localhost:3000/api/admin/settings 2>/dev/null | grep "HTTP"

echo -e "\n2. Testando POST /api/products/[id]/reviews (sem auth)"
curl -i -X POST http://localhost:3000/api/products/123/reviews \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}' 2>/dev/null | grep "HTTP"

echo -e "\n3. Testando POST /api/wishlist (sem auth)"
curl -i -X POST http://localhost:3000/api/wishlist \
  -H "Content-Type: application/json" \
  -d '{"productId": "123"}' 2>/dev/null | grep "HTTP"

echo -e "\n=== TESTES COMPLETADOS ==="
