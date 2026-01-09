/**
 * Script para testar o fluxo do cupom
 * Isso vai ajudar a identificar onde exatamente o problema está
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCouponFlow() {
  console.log('🧪 Iniciando teste do sistema de cupom...\n');

  try {
    // 1. Verificar se há cupons no banco
    console.log('📋 1. Verificando cupons existentes...');
    const coupons = await prisma.coupon.findMany({
      take: 5,
    });

    if (coupons.length === 0) {
      console.log('❌ ERRO: Nenhum cupom encontrado no banco de dados!');
      console.log('   -> Precisa criar cupons de teste primeiro\n');

      // Criar cupom de teste
      console.log('🆕 Criando cupom de teste...');
      const testCoupon = await prisma.coupon.create({
        data: {
          code: 'TEST10',
          description: 'Cupom de teste - 10% off',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          maxUses: 100,
          minimumAmount: 0,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          isActive: true,
        },
      });
      console.log(`✅ Cupom criado: ${testCoupon.code}\n`);
    } else {
      console.log(`✅ Encontrados ${coupons.length} cupom(ns):`);
      coupons.forEach((c) => {
        console.log(
          `   - ${c.code}: ${c.discountValue}${c.discountType === 'PERCENTAGE' ? '%' : '$'} (Ativo: ${c.isActive}, Usos: ${c.usedCount}/${c.maxUses || '∞'})`
        );
      });
      console.log();
    }

    // 2. Verificar se há carrinhos
    console.log('📦 2. Verificando carrinhos existentes...');
    const carts = await prisma.cart.findMany({
      include: { items: { include: { product: true } } },
      take: 3,
    });

    if (carts.length === 0) {
      console.log('❌ ERRO: Nenhum carrinho encontrado no banco de dados!');
      console.log('   -> Precisa criar um carrinho com items de teste primeiro\n');

      // Criar carrinho e produto de teste
      console.log('🆕 Criando produto e carrinho de teste...');

      const product = await prisma.product.create({
        data: {
          name: 'Produto de Teste',
          description: 'Produto para teste do sistema de cupom',
          price: 100,
          image: 'https://via.placeholder.com/300',
          category: 'test',
          stock: 100,
        },
      });

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

      console.log(`✅ Produto criado: ${product.id}`);
      console.log(`✅ Carrinho criado: ${cart.id}\n`);

      // Testar aplicação do cupom
      await testApplyCoupon(cart.id);
    } else {
      console.log(`✅ Encontrados ${carts.length} carrinho(ns):`);
      carts.forEach((c) => {
        console.log(`   - ID: ${c.id}`);
        console.log(`     Items: ${c.items.length}`);
        console.log(`     Cupom: ${c.couponCode || 'Nenhum'}`);
        console.log(`     Total: $${c.total}`);
      });
      console.log();

      // Testar aplicação do cupom no primeiro carrinho
      if (carts.length > 0) {
        await testApplyCoupon(carts[0].id);
      }
    }
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    if (error instanceof Error) {
      console.error('   Mensagem:', error.message);
      console.error('   Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function testApplyCoupon(cartId: string) {
  console.log(`\n🎯 3. Testando aplicação de cupom ao carrinho ${cartId}...`);

  try {
    // Buscar um cupom válido
    const coupon = await prisma.coupon.findFirst({
      where: { isActive: true },
    });

    if (!coupon) {
      console.log('❌ Nenhum cupom ativo encontrado');
      return;
    }

    console.log(`   Tentando aplicar cupom: ${coupon.code}`);

    // Buscar carrinho
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { product: true } } },
    });

    if (!cart) {
      console.log(`❌ Carrinho ${cartId} não encontrado`);
      return;
    }

    // Verificar itens no carrinho
    if (cart.items.length === 0) {
      console.log('❌ Carrinho vazio - não pode aplicar cupom');
      return;
    }

    // Simular cálculo do subtotal
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    console.log(`   Subtotal do carrinho: $${subtotal}`);
    console.log(
      `   Minimo requerido: $${coupon.minimumAmount}`
    );

    // Validar cupom
    if (coupon.minimumAmount > subtotal) {
      console.log(
        `❌ Compra abaixo do mínimo: $${subtotal} < $${coupon.minimumAmount}`
      );
      return;
    }

    // Atualizar carrinho com cupom
    const updatedCart = await prisma.cart.update({
      where: { id: cartId },
      data: { couponCode: coupon.code },
      include: { items: { include: { product: true } } },
    });

    console.log(`✅ Cupom aplicado com sucesso!`);
    console.log(`   Código: ${updatedCart.couponCode}`);

    // Registrar uso
    const usage = await prisma.couponUsage.create({
      data: {
        couponId: coupon.id,
        cartId: cartId,
      },
    });

    console.log(`✅ Uso do cupom registrado: ${usage.id}`);

    // Calcular desconto
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    if (coupon.maxAmount && discountAmount > coupon.maxAmount) {
      discountAmount = coupon.maxAmount;
    }

    const total = Math.max(0, subtotal - discountAmount);

    console.log(`   Desconto: $${discountAmount}`);
    console.log(`   Total com desconto: $${total}`);

    // Atualizar totais
    const finalCart = await prisma.cart.update({
      where: { id: cartId },
      data: {
        discountAmount,
        subtotal,
        total,
      },
    });

    console.log(`✅ Totais atualizados com sucesso!`);
    console.log(`   Final Cart:`, {
      subtotal: finalCart.subtotal,
      discountAmount: finalCart.discountAmount,
      total: finalCart.total,
    });
  } catch (error) {
    console.error('❌ Erro ao aplicar cupom:', error);
    if (error instanceof Error) {
      console.error('   Mensagem:', error.message);
    }
  }
}

testCouponFlow();
