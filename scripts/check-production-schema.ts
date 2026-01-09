/**
 * Script para verificar se o schema de produção (Neon) está atualizado
 * Compara as migrations aplicadas no Neon vs migrations locais
 * 
 * IMPORTANTE: Crie um arquivo .env.production com DATABASE_URL do Neon
 * Esse arquivo está no .gitignore e não será commitado
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Carregar .env.production se existir
const envPath = path.join(process.cwd(), '.env.production');
if (fs.existsSync(envPath)) {
  config({ path: envPath });
  console.log('📄 Loaded .env.production\n');
}

async function checkProductionSchema() {
  console.log('🔍 Checking Production Schema (Neon)...\n');

  const productionUrl = process.env.DATABASE_URL;
  
  if (!productionUrl) {
    console.error('❌ DATABASE_URL não encontrada');
    console.log('\nCrie um arquivo .env.production com:');
    console.log('DATABASE_URL="postgresql://..." (URL do Neon)');
    process.exit(1);
  }

  // Mascarar senha na exibição
  const maskedUrl = productionUrl.replace(/:[^:@]+@/, ':****@');
  const host = productionUrl.match(/@([^/]+)/)?.[1] || 'unknown';
  console.log('🔗 Connecting to:', host.includes('neon') ? '🟢 Neon Cloud' : maskedUrl);

  const pool = new Pool({ connectionString: productionUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Verificar conexão
    await prisma.$connect();
    console.log('✅ Connected to production database\n');

    // 2. Verificar tabela _prisma_migrations
    const migrations = await prisma.$queryRaw<Array<{
      id: string;
      checksum: string;
      finished_at: Date | null;
      migration_name: string;
      logs: string | null;
      rolled_back_at: Date | null;
      started_at: Date;
      applied_steps_count: number;
    }>>`
      SELECT * FROM "_prisma_migrations"
      ORDER BY started_at DESC
    `;

    console.log(`📊 Applied Migrations in Production: ${migrations.length}\n`);

    migrations.forEach((m, i) => {
      const status = m.finished_at ? '✅' : '⏳';
      const date = m.started_at.toISOString().split('T')[0];
      console.log(`${status} ${i + 1}. ${m.migration_name} (${date})`);
    });

    // 3. Ler migrations locais
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    const localMigrations = fs.readdirSync(migrationsDir)
      .filter(f => f !== 'migration_lock.toml')
      .sort();

    console.log(`\n📁 Local Migrations: ${localMigrations.length}\n`);

    localMigrations.forEach((name, i) => {
      console.log(`${i + 1}. ${name}`);
    });

    // 4. Comparar
    console.log('\n🔍 Analysis:\n');

    const appliedNames = new Set(migrations.map(m => m.migration_name));
    const missingInProduction = localMigrations.filter(name => !appliedNames.has(name));

    if (missingInProduction.length === 0) {
      console.log('✅ Production schema is UP TO DATE');
      console.log('✅ All local migrations have been applied to Neon');
    } else {
      console.log('⚠️  Production schema is OUT OF SYNC\n');
      console.log('❌ Missing migrations in production:\n');
      missingInProduction.forEach((name, i) => {
        console.log(`   ${i + 1}. ${name}`);
      });

      console.log('\n🚀 To sync production, run:\n');
      console.log('   npx prisma migrate deploy\n');
      console.log('   (Make sure DATABASE_URL points to Neon)\n');
    }

    // 5. Verificar tabelas críticas
    console.log('\n📋 Critical Tables Check:\n');

    const tables = ['User', 'Product', 'Order', 'Cart', 'Coupon'];
    
    for (const table of tables) {
      try {
        const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`);
        const recordCount = (count as any)[0].count;
        console.log(`✅ ${table.padEnd(15)} - ${recordCount} records`);
      } catch (e: any) {
        console.log(`❌ ${table.padEnd(15)} - TABLE NOT FOUND`);
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkProductionSchema();
