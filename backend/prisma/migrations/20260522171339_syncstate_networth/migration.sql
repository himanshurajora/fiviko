-- CreateTable
CREATE TABLE "SyncState" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3) NOT NULL,
    "meta" TEXT,

    CONSTRAINT "SyncState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetWorthHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "netWorth" DECIMAL(18,2) NOT NULL,
    "liquidNetWorth" DECIMAL(18,2) NOT NULL,
    "totalAssets" DECIMAL(18,2) NOT NULL,
    "totalLiabilities" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetWorthHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SyncState_key_key" ON "SyncState"("key");

-- CreateIndex
CREATE INDEX "NetWorthHistory_userId_idx" ON "NetWorthHistory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NetWorthHistory_userId_month_key" ON "NetWorthHistory"("userId", "month");

-- AddForeignKey
ALTER TABLE "NetWorthHistory" ADD CONSTRAINT "NetWorthHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
