import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Carregar variáveis de ambiente do .env
config({ path: resolve(__dirname, '../.env') });

// Verificar se DATABASE_URL está configurado
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não encontrado no arquivo .env');
}

console.log('📡 Conectando ao banco:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

// Configurar pool de conexão
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🎟️  Criando cupons de desconto...');

  // Cupom de 10% de desconto
  const coupon1 = await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: '10% de desconto para novos clientes',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxUses: 100,
      usedCount: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      isActive: true,
    },
  });

  // Cupom de R$ 50 fixo (mínimo R$ 200)
  const coupon2 = await prisma.coupon.upsert({
    where: { code: 'SAVE50' },
    update: {},
    create: {
      code: 'SAVE50',
      description: 'R$ 50 de desconto em compras acima de R$ 200',
      discountType: 'FIXED',
      discountValue: 50,
      minimumAmount: 200,
      maxUses: 50,
      usedCount: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  // Cupom de 20% (categoria específica - exemplo: ELECTRONICS)
  const coupon3 = await prisma.coupon.upsert({
    where: { code: 'TECH20' },
    update: {},
    create: {
      code: 'TECH20',
      description: '20% de desconto em Eletrônicos',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      applicableCategories: JSON.stringify(['ELECTRONICS']),
      maxUses: 75,
      usedCount: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
      isActive: true,
    },
  });

  // Cupom de frete grátis (R$ 0 de desconto, apenas para marcar)
  const coupon4 = await prisma.coupon.upsert({
    where: { code: 'FREESHIP' },
    update: {},
    create: {
      code: 'FREESHIP',
      description: 'Frete grátis em compras acima de R$ 100',
      discountType: 'FIXED',
      discountValue: 0, // Implementação de frete seria separada
      minimumAmount: 100,
      maxUses: 200,
      usedCount: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 dias
      isActive: true,
    },
  });

  // Cupom de 15% (sem limite de uso único por usuário neste schema)
  const coupon5 = await prisma.coupon.upsert({
    where: { code: 'FIRST15' },
    update: {},
    create: {
      code: 'FIRST15',
      description: '15% de desconto na primeira compra',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      maxUses: 1000,
      usedCount: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 dias
      isActive: true,
    },
  });

  console.log('✅ Cupons criados com sucesso!');
  console.log('\n📋 Cupons disponíveis:');
  console.log('1. WELCOME10  - 10% de desconto');
  console.log('2. SAVE50     - R$ 50 OFF em compras acima de R$ 200');
  console.log('3. TECH20     - 20% OFF em Eletrônicos');
  console.log('4. FREESHIP   - Frete grátis acima de R$ 100');
  console.log('5. FIRST15    - 15% OFF (uso único por usuário)');
  console.log('\n🎉 Pronto para testar no checkout!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar cupons:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });
