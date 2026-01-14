-- AlterTable
ALTER TABLE "backend"."users" ADD COLUMN "verification_token" VARCHAR(64),
ADD COLUMN "verification_token_expiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_verification_token_key" ON "backend"."users"("verification_token");

-- CreateIndex
CREATE INDEX "users_verification_token_idx" ON "backend"."users"("verification_token") WHERE "verification_token" IS NOT NULL;
