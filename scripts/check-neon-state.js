#!/usr/bin/env node

/**
 * Script para verificar o estado das tabelas e dados no Neon (Produção)
 * Execute com: node scripts/check-neon-state.js
 */

import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não configurada em .env.production');
  process.exit(1);
}

console.log('🔍 Verificando estado do banco de dados no Neon...\n');

// Queries SQL para verificação
const queries = [
  {
    name: 'Verificar tabelas existentes',
    sql: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('Cart', 'CartItem', 'Coupon', 'CouponUsage')
      ORDER BY table_name;
    `,
  },
  {
    name: 'Contar carrinhos',
    sql: 'SELECT COUNT(*) as total FROM "Cart";',
  },
  {
    name: 'Contar itens de carrinho',
    sql: 'SELECT COUNT(*) as total FROM "CartItem";',
  },
  {
    name: 'Contar cupons',
    sql: 'SELECT COUNT(*) as total FROM "Coupon";',
  },
  {
    name: 'Contar usos de cupom',
    sql: 'SELECT COUNT(*) as total FROM "CouponUsage";',
  },
  {
    name: 'Listar cupons disponíveis',
    sql: `
      SELECT 
        id, code, description, "discountType", "discountValue",
        "isActive", "maxUses", "usedCount", "startDate", "endDate"
      FROM "Coupon"
      LIMIT 5;
    `,
  },
  {
    name: 'Verificar carrinhos com cupom',
    sql: `
      SELECT id, "userId", "couponCode", subtotal, "discountAmount", total
      FROM "Cart"
      WHERE "couponCode" IS NOT NULL
      LIMIT 5;
    `,
  },
  {
    name: 'Verificar constraint unique em CouponUsage',
    sql: `
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'CouponUsage'
      AND constraint_type = 'UNIQUE';
    `,
  },
];

// Executar cada query
for (const query of queries) {
  console.log(`\n📋 ${query.name}`);
  console.log('─'.repeat(60));
  try {
    const cmd = `echo "${query.sql.replace(/"/g, '\\"')}" | psql "${DATABASE_URL}" -P format=unaligned`;
    const result = execSync(cmd, { encoding: 'utf-8' }).trim();
    console.log(result);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

console.log('\n✅ Verificação concluída\n');
