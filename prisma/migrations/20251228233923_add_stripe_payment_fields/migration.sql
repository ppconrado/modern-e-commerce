/*
  Warnings:

  - A unique constraint covering the columns `[stripeSessionId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "stripeSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "Order"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "Order_stripeSessionId_idx" ON "Order"("stripeSessionId");
