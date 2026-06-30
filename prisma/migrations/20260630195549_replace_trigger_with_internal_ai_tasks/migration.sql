/*
  Warnings:

  - You are about to drop the `TaskRun` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AiTaskType" AS ENUM ('design_agent', 'generate_spec');

-- CreateEnum
CREATE TYPE "AiTaskStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'timed_out', 'retrying');

-- DropTable
DROP TABLE "TaskRun";

-- CreateTable
CREATE TABLE "AiTaskRun" (
    "id" TEXT NOT NULL,
    "type" "AiTaskType" NOT NULL,
    "status" "AiTaskStatus" NOT NULL DEFAULT 'queued',
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "resultJson" JSONB,
    "errorMessage" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 2,
    "runAfter" TIMESTAMP(3),
    "leaseUntil" TIMESTAMP(3),
    "heartbeatAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AiTaskRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTaskEvent" (
    "id" TEXT NOT NULL,
    "taskRunId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "AiTaskStatus",
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiTaskEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTaskAttempt" (
    "id" TEXT NOT NULL,
    "taskRunId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "AiTaskAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiTaskRun_status_runAfter_idx" ON "AiTaskRun"("status", "runAfter");

-- CreateIndex
CREATE INDEX "AiTaskRun_projectId_idx" ON "AiTaskRun"("projectId");

-- CreateIndex
CREATE INDEX "AiTaskRun_userId_projectId_idx" ON "AiTaskRun"("userId", "projectId");

-- CreateIndex
CREATE INDEX "AiTaskRun_leaseUntil_idx" ON "AiTaskRun"("leaseUntil");

-- CreateIndex
CREATE INDEX "AiTaskRun_createdAt_idx" ON "AiTaskRun"("createdAt");

-- CreateIndex
CREATE INDEX "AiTaskEvent_taskRunId_createdAt_idx" ON "AiTaskEvent"("taskRunId", "createdAt");

-- CreateIndex
CREATE INDEX "AiTaskAttempt_taskRunId_idx" ON "AiTaskAttempt"("taskRunId");

-- CreateIndex
CREATE UNIQUE INDEX "AiTaskAttempt_taskRunId_attemptNumber_key" ON "AiTaskAttempt"("taskRunId", "attemptNumber");

-- AddForeignKey
ALTER TABLE "AiTaskRun" ADD CONSTRAINT "AiTaskRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTaskRun" ADD CONSTRAINT "AiTaskRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTaskEvent" ADD CONSTRAINT "AiTaskEvent_taskRunId_fkey" FOREIGN KEY ("taskRunId") REFERENCES "AiTaskRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTaskAttempt" ADD CONSTRAINT "AiTaskAttempt_taskRunId_fkey" FOREIGN KEY ("taskRunId") REFERENCES "AiTaskRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
