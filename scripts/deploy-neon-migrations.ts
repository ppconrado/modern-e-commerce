/**
 * Script seguro para aplicar migrations no Neon SEM apagar dados
 * Aplica apenas migrations pendentes
 */
import 'dotenv/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { config } from 'dotenv';
import fs from 'fs';

const execAsync = promisify(exec);

// Carregar .env.production
const envPath = path.join(process.cwd(), '.env.production');
if (fs.existsSync(envPath)) {
  config({ path: envPath, override: true });
}

async function applyMigrationsToNeon() {
  console.log('🚀 Applying Migrations to Neon (Production)...\n');

  const productionUrl = process.env.DATABASE_URL;
  
  if (!productionUrl) {
    console.error('❌ DATABASE_URL not found in .env.production');
    process.exit(1);
  }

  const host = productionUrl.match(/@([^/]+)/)?.[1] || 'unknown';
  console.log('🔗 Target:', host.includes('neon') ? '🟢 Neon Cloud Database' : 'Database');
  console.log('📁 Migrations directory: prisma/migrations\n');

  try {
    console.log('⏳ Running: prisma migrate deploy\n');
    console.log('This will:');
    console.log('  ✅ Apply ONLY pending migrations');
    console.log('  ✅ PRESERVE all existing data');
    console.log('  ✅ Skip already applied migrations\n');

    const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: productionUrl }
    });

    if (stdout) {
      console.log(stdout);
    }
    
    if (stderr && !stderr.includes('warn')) {
      console.error('⚠️ Warnings:', stderr);
    }

    console.log('\n✅ Migrations applied successfully!');
    console.log('\n📊 Next steps:');
    console.log('  1. Verify tables: npm run db:check-prod');
    console.log('  2. Test production: https://josepaulo-e-commerce.vercel.app');
    console.log('  3. Push code: git push origin main\n');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    process.exit(1);
  }
}

applyMigrationsToNeon();
