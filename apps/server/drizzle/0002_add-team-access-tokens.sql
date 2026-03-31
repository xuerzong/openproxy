CREATE TABLE "team_access_tokens" (
    "id" varchar PRIMARY KEY NOT NULL,
    "team_id" varchar NOT NULL,
    "created_by" varchar NOT NULL,
    "name" text NOT NULL,
    "token_hash" varchar NOT NULL,
    "token" varchar NOT NULL,
    "scopes" text [] DEFAULT '{}' NOT NULL,
    "expires_at" timestamp with time zone,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "team_access_tokens"
ADD CONSTRAINT "team_access_tokens_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams" ("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "team_access_tokens"
ADD CONSTRAINT "team_access_tokens_created_by_team_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_users" ("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "team_access_tokens_team_id_index" ON "team_access_tokens" USING btree ("team_id");
--> statement-breakpoint
CREATE INDEX "team_access_tokens_token_hash_index" ON "team_access_tokens" USING btree ("token_hash");