-- Rollback Migration for Phase 4: Mobile Development Schema Extensions
-- This script reverses the changes made in 0021_next_the_twelve.sql
--
-- Usage: Execute this SQL script to rollback the mobile schema changes
-- WARNING: This will drop the railway_containers table and remove mobile columns from tasks

-- Drop indexes first
DROP INDEX IF EXISTS "idx_railway_containers_last_activity_at";
DROP INDEX IF EXISTS "idx_railway_containers_status";
DROP INDEX IF EXISTS "idx_railway_containers_user_id";
DROP INDEX IF EXISTS "idx_tasks_container_id";
DROP INDEX IF EXISTS "idx_tasks_platform";

-- Drop foreign key constraints
ALTER TABLE "railway_containers" DROP CONSTRAINT IF EXISTS "railway_containers_task_id_tasks_id_fk";
ALTER TABLE "railway_containers" DROP CONSTRAINT IF EXISTS "railway_containers_user_id_users_id_fk";

-- Drop railway_containers table
DROP TABLE IF EXISTS "railway_containers";

-- Remove new columns from tasks table
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "container_id";
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "metro_url";
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "platform";

-- Revert max_duration default (check previous migration for correct value)
-- ALTER TABLE "tasks" ALTER COLUMN "max_duration" SET DEFAULT 5;

-- Note: Skills tables (skills, skill_executions) are NOT rolled back as they belong to Phase 3
-- If you need to rollback Phase 3 as well, use the Phase 3 rollback script
