-- CreateTable
CREATE TABLE "RealtimeRoomEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RealtimeRoomEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RealtimeRoomEvent_roomId_createdAt_idx" ON "RealtimeRoomEvent"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "RealtimeRoomEvent_projectId_idx" ON "RealtimeRoomEvent"("projectId");

-- CreateIndex
CREATE INDEX "RealtimeRoomEvent_userId_idx" ON "RealtimeRoomEvent"("userId");

-- AddForeignKey
ALTER TABLE "RealtimeRoomEvent" ADD CONSTRAINT "RealtimeRoomEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealtimeRoomEvent" ADD CONSTRAINT "RealtimeRoomEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
