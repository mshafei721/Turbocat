-- CreateEnum
CREATE TYPE "backend"."PublishingStatus" AS ENUM ('initiated', 'building', 'submitting', 'submitted', 'failed');

-- CreateTable
CREATE TABLE "backend"."publishing" (
    "id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,
    "status" "backend"."PublishingStatus" NOT NULL DEFAULT 'initiated',
    "status_message" TEXT,
    "apple_team_id" VARCHAR(50),
    "apple_key_id" VARCHAR(50),
    "apple_issuer_id" VARCHAR(100),
    "apple_private_key" TEXT,
    "expo_token" TEXT,
    "expo_build_id" VARCHAR(255),
    "app_name" VARCHAR(255) NOT NULL,
    "bundle_id" VARCHAR(255) NOT NULL,
    "version" VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    "description" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "age_rating" VARCHAR(10) NOT NULL,
    "support_url" TEXT,
    "icon_url" TEXT,
    "ipa_url" TEXT,
    "build_logs" TEXT,
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "build_started_at" TIMESTAMP(3),
    "build_completed_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publishing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "publishing_workflow_id_idx" ON "backend"."publishing"("workflow_id");

-- CreateIndex
CREATE INDEX "publishing_status_idx" ON "backend"."publishing"("status");

-- AddForeignKey
ALTER TABLE "backend"."publishing" ADD CONSTRAINT "publishing_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "backend"."workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
