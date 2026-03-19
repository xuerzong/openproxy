CREATE TABLE "ai_provider_api_keys" (
    "id" varchar PRIMARY KEY NOT NULL,
    "ai_provider_id" varchar NOT NULL,
    "api_key" text NOT NULL,
    "api_key_hash" varchar NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_provider_api_keys"
ADD CONSTRAINT "ai_provider_api_keys_ai_provider_id_ai_providers_id_fk" FOREIGN KEY ("ai_provider_id") REFERENCES "public"."ai_providers" ("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "ai_provider_api_keys_ai_provider_id_index" ON "ai_provider_api_keys" USING btree ("ai_provider_id");
--> statement-breakpoint
CREATE INDEX "ai_provider_api_keys_hash_index" ON "ai_provider_api_keys" USING btree ("api_key_hash");
--> statement-breakpoint
INSERT INTO
    "ai_provider_api_keys" (
        "id",
        "ai_provider_id",
        "api_key",
        "api_key_hash",
        "created_at",
        "updated_at"
    )
SELECT
    concat(
        'apk_',
        md5(
            concat(
                "id",
                ':',
                "api_key_hash",
                ':',
                random()::text
            )
        )
    ),
    "id",
    "api_key",
    "api_key_hash",
    COALESCE("created_at", now()),
    COALESCE("updated_at", now())
FROM "ai_providers"
WHERE
    btrim("api_key") <> ''
    AND btrim("api_key_hash") <> '';