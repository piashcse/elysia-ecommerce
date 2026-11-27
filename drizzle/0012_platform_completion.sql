CREATE TABLE "two_factor_recovery_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "currencies" (
	"code" varchar(3) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"symbol" varchar(10) NOT NULL,
	"rate" numeric(12, 6) DEFAULT '1' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"locale" varchar(10) NOT NULL,
	"name" varchar(100),
	"description" text,
	"meta_title" varchar(200),
	"meta_description" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_translations_category_locale_unique" UNIQUE("category_id","locale")
);
--> statement-breakpoint
CREATE TABLE "product_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"locale" varchar(10) NOT NULL,
	"name" varchar(255),
	"description" text,
	"meta_title" varchar(200),
	"meta_description" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_translations_product_locale_unique" UNIQUE("product_id","locale")
);
--> statement-breakpoint
CREATE TABLE "search_synonyms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term" varchar(100) NOT NULL,
	"synonyms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "search_synonyms_term_unique" UNIQUE("term")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "coupon_codes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "currency" varchar(3) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "exchange_rate" numeric(12, 6) DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE "email_outbox" ADD COLUMN "next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "two_factor_recovery_codes" ADD CONSTRAINT "two_factor_recovery_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_translations" ADD CONSTRAINT "category_translations_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_translations" ADD CONSTRAINT "product_translations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "two_factor_recovery_codes_user_idx" ON "two_factor_recovery_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "two_factor_recovery_codes_hash_idx" ON "two_factor_recovery_codes" USING btree ("code_hash");--> statement-breakpoint
CREATE INDEX "currencies_active_idx" ON "currencies" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "category_translations_category_idx" ON "category_translations" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_translations_product_idx" ON "product_translations" USING btree ("product_id");--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "products_search_fts_idx" ON "products" USING gin (to_tsvector('english', coalesce("name", '') || ' ' || coalesce("description", '') || ' ' || coalesce("sku", '')));--> statement-breakpoint
CREATE INDEX "products_name_trgm_idx" ON "products" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "products_sku_trgm_idx" ON "products" USING gin ("sku" gin_trgm_ops);--> statement-breakpoint
INSERT INTO "currencies" ("code", "name", "symbol", "rate") VALUES ('USD', 'US Dollar', '$', '1') ON CONFLICT ("code") DO NOTHING;
