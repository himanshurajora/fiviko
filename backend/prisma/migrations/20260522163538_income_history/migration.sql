-- CreateTable
CREATE TABLE "IncomeHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "baseCurrencyAmount" DECIMAL(18,2) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'auto',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IncomeHistory_userId_idx" ON "IncomeHistory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "IncomeHistory_userId_month_key" ON "IncomeHistory"("userId", "month");

-- AddForeignKey
ALTER TABLE "IncomeHistory" ADD CONSTRAINT "IncomeHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
