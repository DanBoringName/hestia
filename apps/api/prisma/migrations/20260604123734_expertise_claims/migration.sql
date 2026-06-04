-- CreateTable
CREATE TABLE "expertise_claims" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "verificationMethod" TEXT NOT NULL,
    "institution" TEXT,
    "emailDomain" TEXT,
    "reviewerId" TEXT,
    "evidenceRef" TEXT,
    "claimedAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expertise_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expertise_claims_userId_tag_key" ON "expertise_claims"("userId", "tag");
