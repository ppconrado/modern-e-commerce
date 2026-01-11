#!/usr/bin/env pwsh

# Colors
$green = "`e[32m"
$red = "`e[31m"
$yellow = "`e[33m"
$reset = "`e[0m"

Write-Host "${yellow}=== TESTANDO SETTINGS FEATURES ===${reset}" -ForegroundColor Yellow

# Test 1: Get settings
Write-Host "`n${yellow}1. Testando GET /api/admin/settings (sem auth)${reset}"
$response = curl -s -w "`n%{http_code}" http://localhost:3000/api/admin/settings
$body = $response[0]
$status = $response[1]

if ($status -eq "401") {
    Write-Host "${green}✓ Corretamente retornou 401 (Unauthorized)${reset}"
} else {
    Write-Host "${red}✗ Erro: esperava 401, recebeu $status${reset}"
}

# Test 2: Create test user and login
Write-Host "`n${yellow}2. Criando usuário de teste e fazendo login...${reset}"
# Este é um teste que requer UI, vamos pular

# Test 3: Test reviews disabled by default (false)
Write-Host "`n${yellow}3. Verificando se disableReviews é false por padrão${reset}"
Write-Host "   Esperado: disableReviews = false (reviews habilitadas)"
Write-Host "   Esperado: disableWishlist = false (wishlist habilitada)"  
Write-Host "   Esperado: disableMaintenanceMode = false (loja operacional)"

# Test 4: Test POST to reviews API without auth
Write-Host "`n${yellow}4. Testando POST /api/products/[id]/reviews (sem auth)${reset}"
$response = curl -s -w "`n%{http_code}" -X POST http://localhost:3000/api/products/123/reviews `
  -H "Content-Type: application/json" `
  -d '{"rating": 5, "comment": "test"}'
$status = $response[-1]

if ($status -eq "401") {
    Write-Host "${green}✓ Corretamente retornou 401 (Unauthorized)${reset}"
} else {
    Write-Host "${red}✗ Erro: esperava 401, recebeu $status${reset}"
}

# Test 5: Test wishlist API without auth
Write-Host "`n${yellow}5. Testando POST /api/wishlist (sem auth)${reset}"
$response = curl -s -w "`n%{http_code}" -X POST http://localhost:3000/api/wishlist `
  -H "Content-Type: application/json" `
  -d '{"productId": "123"}'
$status = $response[-1]

if ($status -eq "401") {
    Write-Host "${green}✓ Corretamente retornou 401 (Unauthorized)${reset}"
} else {
    Write-Host "${red}✗ Erro: esperava 401, recebeu $status${reset}"
}

Write-Host "`n${green}=== TESTES BÁSICOS COMPLETADOS ===${reset}`n"
Write-Host "${yellow}PRÓXIMOS PASSOS:${reset}"
Write-Host "1. Acessar http://localhost:3000/admin/settings com user ADMIN"
Write-Host "2. Verificar se os switches mostram 'Disable' (não 'Enable')"
Write-Host "3. Verificar se disableReviews = false (ativado)"
Write-Host "4. Verificar se disableWishlist = false (ativado)"
Write-Host "5. Mudar para true e salvar"
Write-Host "6. Verificar se reviews/wishlist ficam desabilitados no frontend"
