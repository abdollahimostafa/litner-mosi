-- CreateTable
CREATE TABLE "CardItem" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "chapter" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stepIndex" INTEGER NOT NULL DEFAULT 0,
    "nextReview" TIMESTAMP(3) NOT NULL,
    "cycleCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CardItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoryEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "action" TEXT NOT NULL,
    "stepDays" INTEGER NOT NULL,
    "cardId" TEXT NOT NULL,

    CONSTRAINT "HistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CardItem_nextReview_idx" ON "CardItem"("nextReview");

-- CreateIndex
CREATE INDEX "CardItem_topic_idx" ON "CardItem"("topic");

-- CreateIndex
CREATE INDEX "HistoryEntry_cardId_idx" ON "HistoryEntry"("cardId");

-- AddForeignKey
ALTER TABLE "HistoryEntry" ADD CONSTRAINT "HistoryEntry_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CardItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
