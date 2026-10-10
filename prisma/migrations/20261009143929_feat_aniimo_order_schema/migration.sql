-- CreateEnum
CREATE TYPE "AniimoOrderStatus" AS ENUM ('DRAFT');

-- CreateTable
CREATE TABLE "aniimoOrder" (
    "id" SERIAL NOT NULL,
    "orderNo" TEXT NOT NULL,
    "status" "AniimoOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted" BOOLEAN NOT NULL DEFAULT false,
    "uid" TEXT NOT NULL,
    "characterName" TEXT NOT NULL,
    "server" TEXT NOT NULL,
    "serverId" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "regionName" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "productType" INTEGER NOT NULL,
    "coin" INTEGER NOT NULL,
    "bonusCoin" INTEGER NOT NULL,
    "firstPurchaseBonusCoin" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "originalPrice" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL,
    "discountRate" DECIMAL(4,2) NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "subChannelId" TEXT NOT NULL,
    "paymentHost" TEXT NOT NULL,
    "payUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aniimoOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aniimoOrder_orderNo_key" ON "aniimoOrder"("orderNo");

-- CreateIndex
CREATE INDEX "aniimoOrder_createdAt_idx" ON "aniimoOrder"("createdAt");
