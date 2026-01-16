import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const products = [
  {
    name: 'Wireless Headphones',
    description:
      'Premium noise-cancelling wireless headphones with 30-hour battery life.',
    price: 299.99,
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
    category: 'Electronics',
    stock: 15,
  },
  {
    name: 'Smart Watch',
    description: 'Fitness tracking smartwatch with heart rate monitor and GPS.',
    price: 399.99,
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    category: 'Electronics',
    stock: 23,
  },
  {
    name: 'Laptop Backpack',
    description: 'Durable water-resistant backpack with laptop compartment.',
    price: 79.99,
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    category: 'Accessories',
    stock: 42,
  },
  {
    name: 'Mechanical Keyboard',
    description: 'RGB backlit mechanical keyboard with customizable switches.',
    price: 149.99,
    image:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&h=500&fit=crop',
    category: 'Electronics',
    stock: 18,
  },
  {
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with precision tracking.',
    price: 49.99,
    image:
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop',
    category: 'Electronics',
    stock: 56,
  },
  {
    name: 'Phone Stand',
    description: 'Adjustable aluminum phone stand for desk or bedside.',
    price: 24.99,
    image:
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop',
    category: 'Accessories',
    stock: 78,
  },
  {
    name: 'USB-C Hub',
    description: '7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader.',
    price: 59.99,
    image:
      'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=500&h=500&fit=crop',
    category: 'Electronics',
    stock: 34,
  },
  {
    name: 'Cable Organizer',
    description: 'Desk cable management system with multiple clips.',
    price: 19.99,
    image:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop',
    category: 'Accessories',
    stock: 95,
  },
];

async function main() {
  console.log('Start seeding...');

  // Clear existing data (in correct order to avoid FK conflicts)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();  // ← Clear cart items first
  await prisma.couponUsage.deleteMany();  // ← Clear coupon usages
  await prisma.cart.deleteMany();  // ← Then carts
  await prisma.coupon.deleteMany();  // ← Then coupons
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Create products
  for (const product of products) {
    const created = await prisma.product.create({
      data: product,
    });
    console.log(`Created product: ${created.name}`);
  }

  // Create sample users with hashed passwords
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      fullName: 'John Doe',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      fullName: 'Jane Smith',
      password: hashedPassword,
      role: 'CUSTOMER',
    },
  });

  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      fullName: 'Test User',
      password: hashedPassword,
      role: 'CUSTOMER',
    },
  });

  console.log(
    `Created users: ${user1.fullName}, ${user2.fullName}, ${testUser.fullName}`
  );

  // Create test coupons
  const coupon1 = await prisma.coupon.create({
    data: {
      code: 'WELCOME10',
      description: '10% welcome discount on first purchase',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxUses: null,
      minimumAmount: 0,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
    },
  });
  console.log(`Created coupon: ${coupon1.code}`);

  const coupon2 = await prisma.coupon.create({
    data: {
      code: 'SAVE10',
      description: '10% discount on any purchase',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxUses: null,
      minimumAmount: 0,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
    },
  });
  console.log(`Created coupon: ${coupon2.code}`);

  const coupon3 = await prisma.coupon.create({
    data: {
      code: 'SAVE50',
      description: '$50 discount on orders over $200',
      discountType: 'FIXED',
      discountValue: 50,
      maxUses: 10,
      minimumAmount: 200,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
    },
  });
  console.log(`Created coupon: ${coupon3.code}`);

  const coupon4 = await prisma.coupon.create({
    data: {
      code: 'NEWYEAR20',
      description: '20% discount for New Year celebration',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      maxUses: 50,
      minimumAmount: 100,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
      isActive: true,
    },
  });
  console.log(`Created coupon: ${coupon4.code}`);

  const coupon5 = await prisma.coupon.create({
    data: {
      code: 'TECH25',
      description: '25% off electronics category',
      discountType: 'PERCENTAGE',
      discountValue: 25,
      maxUses: 100,
      minimumAmount: 50,
      applicableCategories: JSON.stringify(['Electronics']),
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
    },
  });
  console.log(`Created coupon: ${coupon5.code}`);

  // Create default store settings
  const storeSettings = await prisma.storeSettings.create({
    data: {
      storeName: 'E-Commerce Store',
      storeEmail: 'contact@store.com',
      storePhone: '',
      storeAddress: '',
      currency: 'USD',
      taxRate: 0,
      shippingFee: 10,
      freeShippingThreshold: 100,
      lowStockThreshold: 10,
      disableReviews: false,
      disableWishlist: false,
      disableMaintenanceMode: false,
    },
  });
  console.log('Created default store settings');

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
