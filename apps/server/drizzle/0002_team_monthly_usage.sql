CREATE TABLE "team_monthly_usages" (
	"id" varchar PRIMARY KEY NOT NULL,
	"team_id" varchar NOT NULL,
	"month_start" timestamp with time zone NOT NULL,
	"month_end" timestamp with time zone NOT NULL,
	"total_requests" integer DEFAULT 0 NOT NULL,
	"tokens_prompt" integer DEFAULT 0 NOT NULL,
	"tokens_completion" integer DEFAULT 0 NOT NULL,
	"total_cost" numeric(20, 10) DEFAULT '0' NOT NULL,
	"model_breakdown" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "team_monthly_usages" ADD CONSTRAINT "team_monthly_usages_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "team_monthly_usages_team_id_index" ON "team_monthly_usages" USING btree ("team_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "team_monthly_usages_team_month_unique" ON "team_monthly_usages" USING btree ("team_id","month_start");