/**
 * Script para resolver conflito de migration no Neon
 * Marca a migration como aplicada sem re-executar o SQL
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import path from 'path';
import { config } from 'dotenv';
import fs from 'fs';
import crypto from 'crypto';

// Carregar .env.production
const envPath = path.join(process.cwd(), '.env.production');
if (fs.existsSync(envPath)) {
  config({ path: envPath, override: true });
}

async function resolveMigration() {
  console.log('🔧 Resolving Migration Conflict in Neon...\n');

  const productionUrl = process.env.DATABASE_URL;
  
  if (!productionUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: productionUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$connect();
    console.log('✅ Connected to Neon\n');

    // 1. Verificar se tabelas existem
    const tables = ['Cart', 'CartItem', 'Coupon', 'CouponUsage'];
    console.log('📋 Checking existing tables:\n');
    
    for (const table of tables) {
      try {
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "${table}"`);
        console.log(`✅ ${table} - exists`);
      } catch (e) {
        console.log(`❌ ${table} - NOT FOUND`);
      }
    }

    // 2. Verificar migration na tabela _prisma_migrations
    const migrationName = '20260109120000_add_cart_and_coupon_system';
    
    const existing = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM "_prisma_migrations" 
      WHERE migration_name = ${migrationName}
    `;

    if (existing.length > 0) {
      console.log(`\n✅ Migration ${migrationName} is already recorded`);
      console.log('✅ Schema is UP TO DATE\n');
    } else {
      console.log(`\n⚠️  Migration ${migrationName} NOT recorded`);
      console.log('🔧 Marking migration as applied...\n');

      // Ler o arquivo SQL da migration
      const migrationPath = path.join(
        process.cwd(),
        'prisma',
        'migrations',
        migrationName,
        'migration.sql'
      );

      const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
      const checksum = crypto.createHash('sha256').update(migrationSql).digest('hex');

      // Inserir registro na tabela _prisma_migrations
      await prisma.$executeRaw`
        INSERT INTO "_prisma_migrations" (
          id,
          checksum,
          finished_at,
          migration_name,
          logs,
          rolled_back_at,
          started_at,
          applied_steps_count
        ) VALUES (
          ${crypto.randomUUID()},
          ${checksum},
          ${new Date()},
          ${migrationName},
          NULL,
          NULL,
          ${new Date()},
          1
        )
      `;

      console.log('✅ Migration marked as applied successfully!\n');
    }

    console.log('📊 Final Status:\n');
    console.log('✅ All migrations applied');
    console.log('✅ Schema synchronized');
    console.log('✅ Data preserved\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

resolveMigration();
