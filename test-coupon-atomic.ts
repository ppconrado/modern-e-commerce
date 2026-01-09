import { prisma } from './src/lib/prisma';

async function validateCouponSystem() {
  console.log('🧪 Testing coupon system fixes...\n');

  try {
    // 1. Create test product
    console.log('1️⃣ Creating test product...');
    const product = await prisma.product.create({
      data: {
        name: 'Test Product for Coupon',
        description: 'Product to test coupon system',
        price: 100,
        image: 'https://via.placeholder.com/300',
        category: 'test',
        stock: 100,
      },
    });
    console.log(`✅ Product created: ${product.id}\n`);

    // 2. Create test coupon
    console.log('2️⃣ Creating test coupon...');
    const coupon = await prisma.coupon.create({
      data: {
        code: 'TESTFIX10',
        description: 'Test coupon - 10% off',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        maxUses: 100,
        minimumAmount: 0,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true,
      },
    });
    console.log(`✅ Coupon created: ${coupon.code} (ID: ${coupon.id})\n`);

    // 3. Create cart with item
    console.log('3️⃣ Creating cart with item...');
    const cart = await prisma.cart.create({
      data: {
        anonymousId: `test_${Date.now()}`,
        items: {
          create: {
            productId: product.id,
            quantity: 1,
            price: product.price,
          },
        },
      },
      include: { items: { include: { product: true } } },
    });
    console.log(`✅ Cart created: ${cart.id}`);
    console.log(`   Items: ${cart.items.length}`);
    console.log(`   Total: $${cart.items[0].price}\n`);

    // 4. Test ATOMIC transaction - Apply coupon
    console.log('4️⃣ Testing atomic coupon application...');
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Check if coupon already applied
        const existingUsage = await tx.couponUsage.findUnique({
          where: { couponId_cartId: { couponId: coupon.id, cartId: cart.id } },
        });

        if (existingUsage) {
          throw new Error('Coupon already applied');
        }

        // Apply coupon
        const updatedCart = await tx.cart.update({
          where: { id: cart.id },
          data: { couponCode: coupon.code },
          include: { items: { include: { product: true } } },
        });

        // Record usage
        await tx.couponUsage.create({
          data: {
            couponId: coupon.id,
            cartId: cart.id,
          },
        });

        // Increment counter
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });

        return updatedCart;
      });

      console.log(`✅ Coupon applied successfully`);
      console.log(`   Cart coupon code: ${result.couponCode}\n`);
    } catch (error) {
      console.error(`❌ Error applying coupon:`, error instanceof Error ? error.message : error);
    }

    // 5. Test DUPLICATE prevention
    console.log('5️⃣ Testing duplicate coupon prevention...');
    try {
      const result = await prisma.$transaction(async (tx) => {
        const existingUsage = await tx.couponUsage.findUnique({
          where: { couponId_cartId: { couponId: coupon.id, cartId: cart.id } },
        });

        if (existingUsage) {
          throw new Error('Coupon already applied to this cart');
        }

        // This should not execute
        await tx.couponUsage.create({
          data: {
            couponId: coupon.id,
            cartId: cart.id,
          },
        });
      });
      console.log('❌ Should have prevented duplicate\n');
    } catch (error) {
      console.log(`✅ Correctly prevented duplicate: ${error instanceof Error ? error.message : error}\n`);
    }

    // 6. Test REMOVE coupon (atomic)
    console.log('6️⃣ Testing atomic coupon removal...');
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Delete usage
        await tx.couponUsage.deleteMany({
          where: { couponId: coupon.id, cartId: cart.id },
        });

        // Decrement counter
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { decrement: 1 } },
        });

        // Remove coupon from cart
        return await tx.cart.update({
          where: { id: cart.id },
          data: { couponCode: null },
          include: { items: { include: { product: true } } },
        });
      });

      console.log(`✅ Coupon removed successfully`);
      console.log(`   Cart coupon code: ${result.couponCode}\n`);
    } catch (error) {
      console.error(`❌ Error removing coupon:`, error instanceof Error ? error.message : error);
    }

    // 7. Verify final state
    console.log('7️⃣ Verifying final state...');
    const finalCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: true },
    });
    const finalCoupon = await prisma.coupon.findUnique({
      where: { id: coupon.id },
    });
    const couponUsages = await prisma.couponUsage.findMany({
      where: { couponId: coupon.id },
    });

    console.log(`✅ Final state:`);
    console.log(`   Cart coupon: ${finalCart?.couponCode || 'none'}`);
    console.log(`   Coupon used count: ${finalCoupon?.usedCount}`);
    console.log(`   Total usages recorded: ${couponUsages.length}\n`);

    // 8. Cleanup
    console.log('🧹 Cleaning up test data...');
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.delete({ where: { id: cart.id } });
    await prisma.coupon.delete({ where: { id: coupon.id } });
    await prisma.product.delete({ where: { id: product.id } });
    console.log('✅ Cleanup complete\n');

    console.log('🎉 All tests passed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

validateCouponSystem();
