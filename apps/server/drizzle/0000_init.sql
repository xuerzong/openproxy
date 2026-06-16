CREATE TABLE "accounts" (
	"id" varchar PRIMARY KEY NOT NULL,
	"account_id" varchar NOT NULL,
	"provider_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_provider_api_keys" (
	"id" varchar PRIMARY KEY NOT NULL,
	"ai_provider_id" varchar NOT NULL,
	"api_key" text NOT NULL,
	"api_key_hash" varchar NOT NULL,
	"remark" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_providers" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"base_url" text NOT NULL,
	"api_key" text NOT NULL,
	"api_key_hash" varchar NOT NULL,
	"icon" text DEFAULT '' NOT NULL,
	"base_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"supported_styles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"docs_url" text DEFAULT '' NOT NULL,
	"adapter_kind" text DEFAULT 'default' NOT NULL,
	"is_built_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_providers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"team_id" varchar NOT NULL,
	"name" text NOT NULL,
	"api_key" varchar NOT NULL,
	"api_key_hash" varchar NOT NULL,
	"status" smallint DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone,
	"max_requests" integer DEFAULT 0 NOT NULL,
	"max_quota" numeric(20, 10) DEFAULT '0' NOT NULL,
	"total_requests" integer DEFAULT 0 NOT NULL,
	"total_quota" numeric(20, 10) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_keys_to_models" (
	"api_key_id" varchar NOT NULL,
	"model_id" text NOT NULL,
	CONSTRAINT "api_keys_to_models_api_key_id_model_id_pk" PRIMARY KEY("api_key_id","model_id")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"message" text NOT NULL,
	"type" smallint DEFAULT 0 NOT NULL,
	"invite_user_id" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" varchar PRIMARY KEY NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"model" text NOT NULL,
	"owned_by" text NOT NULL,
	"context_window" integer DEFAULT 0 NOT NULL,
	"max_tokens" integer DEFAULT 0 NOT NULL,
	"type" text NOT NULL,
	"styles" text[] DEFAULT '{}' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"pricing" jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "models_to_ai_providers" (
	"id" varchar PRIMARY KEY NOT NULL,
	"model_id" varchar NOT NULL,
	"ai_provider_id" varchar NOT NULL,
	"status" smallint DEFAULT 0 NOT NULL,
	"model" text DEFAULT '' NOT NULL,
	"weight" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"order_id" varchar(20) PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"team_id" varchar NOT NULL,
	"trade_no" varchar DEFAULT '' NOT NULL,
	"type" smallint NOT NULL,
	"amount" numeric(20, 2) NOT NULL,
	"status" smallint DEFAULT 0 NOT NULL,
	"usage_status" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" varchar,
	"user_agent" varchar,
	"team_id" varchar,
	"user_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_access_tokens" (
	"id" varchar PRIMARY KEY NOT NULL,
	"team_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"name" text NOT NULL,
	"token_hash" varchar NOT NULL,
	"token" varchar NOT NULL,
	"scopes" text[] DEFAULT '{}' NOT NULL,
	"expires_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "team_users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"team_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"logo" text,
	"plan" varchar DEFAULT 'free' NOT NULL,
	"invite_code" varchar NOT NULL,
	"amount" numeric(20, 10) DEFAULT '0.00' NOT NULL,
	"api_key_limit" integer DEFAULT 20 NOT NULL,
	"users_limit" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "usages" (
	"id" varchar PRIMARY KEY NOT NULL,
	"team_id" varchar NOT NULL,
	"api_key_id" varchar DEFAULT '' NOT NULL,
	"model_id" varchar DEFAULT '' NOT NULL,
	"model_name" text DEFAULT '' NOT NULL,
	"model_owned_by" text DEFAULT '' NOT NULL,
	"ai_provider_id" varchar DEFAULT '' NOT NULL,
	"is_stream" boolean DEFAULT false NOT NULL,
	"response_time" integer NOT NULL,
	"completed_time" integer DEFAULT 0 NOT NULL,
	"cost" numeric(20, 10) NOT NULL,
	"tokens_prompt" integer NOT NULL,
	"tokens_completion" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_configs" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"invite_code" varchar(8) NOT NULL,
	"total_token_usage" bigint DEFAULT 0 NOT NULL,
	"amount" numeric(20, 2) DEFAULT '0.00' NOT NULL,
	"cost" numeric(20, 10) DEFAULT '0' NOT NULL,
	"monthly_free_allowance" numeric(20, 10) DEFAULT '0' NOT NULL,
	"monthly_free_used" numeric(20, 10) DEFAULT '0' NOT NULL,
	"monthly_free_last_reset_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar,
	"email_verified" boolean DEFAULT false NOT NULL,
	"phone_number" varchar,
	"phone_number_verified" boolean DEFAULT false NOT NULL,
	"image" varchar,
	"role" text DEFAULT 'tenant' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" varchar PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_provider_api_keys" ADD CONSTRAINT "ai_provider_api_keys_ai_provider_id_ai_providers_id_fk" FOREIGN KEY ("ai_provider_id") REFERENCES "public"."ai_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_team_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."team_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys_to_models" ADD CONSTRAINT "api_keys_to_models_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys_to_models" ADD CONSTRAINT "api_keys_to_models_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invite_user_id_users_id_fk" FOREIGN KEY ("invite_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models_to_ai_providers" ADD CONSTRAINT "models_to_ai_providers_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models_to_ai_providers" ADD CONSTRAINT "models_to_ai_providers_ai_provider_id_ai_providers_id_fk" FOREIGN KEY ("ai_provider_id") REFERENCES "public"."ai_providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_team_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."team_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_access_tokens" ADD CONSTRAINT "team_access_tokens_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_access_tokens" ADD CONSTRAINT "team_access_tokens_created_by_team_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_monthly_usages" ADD CONSTRAINT "team_monthly_usages_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_users" ADD CONSTRAINT "team_users_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_users" ADD CONSTRAINT "team_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usages" ADD CONSTRAINT "usages_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_configs" ADD CONSTRAINT "user_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_provider_api_keys_ai_provider_id_index" ON "ai_provider_api_keys" USING btree ("ai_provider_id");--> statement-breakpoint
CREATE INDEX "ai_provider_api_keys_hash_index" ON "ai_provider_api_keys" USING btree ("api_key_hash");--> statement-breakpoint
CREATE INDEX "api_keys_status_index" ON "api_keys" USING btree ("status");--> statement-breakpoint
CREATE INDEX "api_keys_hash_index" ON "api_keys" USING btree ("api_key_hash");--> statement-breakpoint
CREATE INDEX "api_keys_team_id_index" ON "api_keys" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "models_owned_by_index" ON "models" USING btree ("owned_by");--> statement-breakpoint
CREATE INDEX "models_type_index" ON "models" USING btree ("type");--> statement-breakpoint
CREATE INDEX "models_is_public_index" ON "models" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "models_to_ai_providers_model_id_index" ON "models_to_ai_providers" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "orders_status_index" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_usage_status_index" ON "orders" USING btree ("usage_status");--> statement-breakpoint
CREATE INDEX "orders_team_id_index" ON "orders" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_unique" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "team_access_tokens_team_id_index" ON "team_access_tokens" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_access_tokens_token_hash_index" ON "team_access_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "team_monthly_usages_team_id_index" ON "team_monthly_usages" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_monthly_usages_team_month_unique" ON "team_monthly_usages" USING btree ("team_id","month_start");--> statement-breakpoint
CREATE INDEX "usages_team_id_index" ON "usages" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_unique" ON "users" USING btree ("phone_number") WHERE phone_number IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email") WHERE email IS NOT NULL;