CREATE TABLE "railway_containers" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"task_id" text NOT NULL,
	"container_id" text NOT NULL,
	"metro_url" text NOT NULL,
	"status" text DEFAULT 'starting' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"resource_usage" jsonb,
	CONSTRAINT "railway_containers_container_id_unique" UNIQUE("container_id")
);
--> statement-breakpoint
CREATE TABLE "skill_executions" (
	"id" text PRIMARY KEY NOT NULL,
	"skill_id" text NOT NULL,
	"user_id" text NOT NULL,
	"task_id" text,
	"input_prompt" text NOT NULL,
	"detected_confidence" numeric(3, 2) NOT NULL,
	"execution_trace" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"duration_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"category" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"scope" text DEFAULT 'global' NOT NULL,
	"content" text NOT NULL,
	"mcp_dependencies" jsonb DEFAULT '[]'::jsonb,
	"triggers" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"success_rate" numeric(5, 2) DEFAULT '0',
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skills_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "max_duration" SET DEFAULT 300;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "platform" text DEFAULT 'web' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "metro_url" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "container_id" text;--> statement-breakpoint
ALTER TABLE "railway_containers" ADD CONSTRAINT "railway_containers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "railway_containers" ADD CONSTRAINT "railway_containers_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_executions" ADD CONSTRAINT "skill_executions_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_executions" ADD CONSTRAINT "skill_executions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_executions" ADD CONSTRAINT "skill_executions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tasks_platform" ON "tasks" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "idx_tasks_container_id" ON "tasks" USING btree ("container_id");--> statement-breakpoint
CREATE INDEX "idx_railway_containers_user_id" ON "railway_containers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_railway_containers_status" ON "railway_containers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_railway_containers_last_activity_at" ON "railway_containers" USING btree ("last_activity_at");