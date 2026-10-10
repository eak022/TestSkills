-- CreateEnum
CREATE TYPE "BotAgentStatus" AS ENUM ('online', 'offline', 'starting', 'stopping', 'error');

-- CreateEnum
CREATE TYPE "BotWorkState" AS ENUM ('standby', 'in_progress', 'stopped');

-- CreateEnum
CREATE TYPE "BotCommandType" AS ENUM ('start', 'stop', 'restart', 'status', 'update');

-- CreateEnum
CREATE TYPE "BotCommandRunStatus" AS ENUM ('queued', 'running', 'success', 'failed');

-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('INITIATED', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "botAgent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "status" "BotAgentStatus" NOT NULL DEFAULT 'offline',
    "workState" "BotWorkState" NOT NULL DEFAULT 'stopped',
    "cpuPercent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "memoryPercent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "uptimeSeconds" BIGINT NOT NULL DEFAULT 0,
    "lastHeartbeat" TIMESTAMP(3),
    "codeVersion" TEXT,
    "lastJobResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "botAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "botCommand" (
    "id" SERIAL NOT NULL,
    "botId" TEXT NOT NULL,
    "command" "BotCommandType" NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "status" "BotCommandRunStatus" NOT NULL DEFAULT 'queued',
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "botCommand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditLog" (
    "id" SERIAL NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "systemSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "systemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "paymentAttempt" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'INITIATED',
    "providerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhookEvent" (
    "eventId" TEXT NOT NULL,
    "orderNo" TEXT,
    "outcome" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhookEvent_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "systemAlert" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "orderNo" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "systemAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "botCommand_botId_createdAt_idx" ON "botCommand"("botId", "createdAt");

-- CreateIndex
CREATE INDEX "auditLog_createdAt_idx" ON "auditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "paymentAttempt_orderId_key" ON "paymentAttempt"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "paymentAttempt_providerRef_key" ON "paymentAttempt"("providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "systemAlert_type_orderNo_key" ON "systemAlert"("type", "orderNo");

-- AddForeignKey
ALTER TABLE "botCommand" ADD CONSTRAINT "botCommand_botId_fkey" FOREIGN KEY ("botId") REFERENCES "botAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paymentAttempt" ADD CONSTRAINT "paymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
