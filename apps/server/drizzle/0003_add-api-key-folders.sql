CREATE TABLE "api_key_folders" (
	"id" varchar PRIMARY KEY NOT NULL,
	"team_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "folder_id" varchar;--> statement-breakpoint
ALTER TABLE "api_key_folders" ADD CONSTRAINT "api_key_folders_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_key_folders_team_id_index" ON "api_key_folders" USING btree ("team_id");--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_folder_id_api_key_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."api_key_folders"("id") ON DELETE set null ON UPDATE no action;