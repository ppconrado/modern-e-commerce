-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER';
