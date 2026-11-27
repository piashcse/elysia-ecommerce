CREATE TYPE "public"."fulfillment_status" AS ENUM('pending', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('pending', 'paid', 'cancelled');--> statement-breakpoint
CREATE TABLE "coupon_categories" (
	"coupon_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "coupon_categories_coupon_category_unique" UNIQUE("coupon_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "coupon_products" (
	"coupon_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	CONSTRAINT "coupon_products_coupon_product_unique" UNIQUE("coupon_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "seller_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "payout_status" DEFAULT 'pending' NOT NULL,
	"reference" varchar(100),
	"notes" text,
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"method" varchar(10) NOT NULL,
	"path" varchar(500) NOT NULL,
	"status" varchar(20),
	"ip" varchar(100),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gift_card_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gift_card_id" uuid NOT NULL,
	"user_id" uuid,
	"order_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gift_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"initial_balance" numeric(10, 2) NOT NULL,
	"balance" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gift_cards_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "commission_rate" numeric(5, 4) DEFAULT '0.1' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "gift_card_code" varchar(50);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "gift_card_amount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "fulfillment_status" "fulfillment_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "stackable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "applies_to_shipping" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "coupon_categories" ADD CONSTRAINT "coupon_categories_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_categories" ADD CONSTRAINT "coupon_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_products" ADD CONSTRAINT "coupon_products_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_products" ADD CONSTRAINT "coupon_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_payouts" ADD CONSTRAINT "seller_payouts_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_transactions" ADD CONSTRAINT "gift_card_transactions_gift_card_id_gift_cards_id_fk" FOREIGN KEY ("gift_card_id") REFERENCES "public"."gift_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_transactions" ADD CONSTRAINT "gift_card_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "seller_payouts_seller_idx" ON "seller_payouts" USING btree ("seller_id","created_at");--> statement-breakpoint
CREATE INDEX "seller_payouts_status_idx" ON "seller_payouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_path_idx" ON "audit_logs" USING btree ("path");--> statement-breakpoint
CREATE INDEX "gift_card_transactions_card_idx" ON "gift_card_transactions" USING btree ("gift_card_id","created_at");--> statement-breakpoint
CREATE INDEX "gift_card_transactions_order_idx" ON "gift_card_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "gift_cards_code_idx" ON "gift_cards" USING btree ("code");