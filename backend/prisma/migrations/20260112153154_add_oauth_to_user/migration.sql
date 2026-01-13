-- AlterTable
ALTER TABLE "backend"."users" ADD COLUMN "oauth_provider" VARCHAR(50),
ADD COLUMN "oauth_id" VARCHAR(255),
ADD COLUMN "oauth_access_token" TEXT,
ADD COLUMN "oauth_refresh_token" TEXT;

-- CreateIndex
CREATE INDEX "users_oauth_provider_oauth_id_idx" ON "backend"."users"("oauth_provider", "oauth_id");
