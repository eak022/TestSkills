/*
  Warnings:

  - The primary key for the `idempotencyKey` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `response` on the `idempotencyKey` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[apiKeyHash]` on the table `botAgent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `idempotencyKey` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `order` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN');

-- DropForeignKey
ALTER TABLE "order" DROP CONSTRAINT "order_userId_fkey";

-- AlterTable
ALTER TABLE "botAgent" ADD COLUMN     "apiKeyHash" TEXT;

-- AlterTable
ALTER TABLE "idempotencyKey" DROP CONSTRAINT "idempotencyKey_pkey",
DROP COLUMN "response",
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "idempotencyKey_pkey" PRIMARY KEY ("userId", "key");

-- AlterTable
ALTER TABLE "order" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER';

-- CreateIndex
CREATE UNIQUE INDEX "botAgent_apiKeyHash_key" ON "botAgent"("apiKeyHash");

-- CreateIndex
CREATE INDEX "order_userId_createdAt_idx" ON "order"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotencyKey" ADD CONSTRAINT "idempotencyKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
