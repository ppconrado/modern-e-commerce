import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const connectionString = process.env.DATABASE_URL!;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function updateExistingUsers() {
  try {
    console.log('Updating existing users with passwords...');

    // Get all users without passwords
    const users = await prisma.user.findMany();

    for (const user of users) {
      if (!user.password || user.password === '') {
        // Set default password "password123" for existing users
        const hashedPassword = await hash('password123', 10);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            role: user.email.includes('admin') ? 'ADMIN' : 'CUSTOMER',
          },
        });

        console.log(
          `Updated user: ${user.email} (role: ${
            user.email.includes('admin') ? 'ADMIN' : 'CUSTOMER'
          })`
        );
      }
    }

    console.log('✅ All users updated successfully!');
    console.log('\nTest credentials:');
    console.log('- Admin users: password = "password123"');
    console.log('- Regular users: password = "password123"');
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

updateExistingUsers();
