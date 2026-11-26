ALTER TYPE "public"."order_status" ADD VALUE 'refunded';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'payment_refunded' BEFORE 'low_stock';--> statement-breakpoint
CREATE TABLE "review_helpful" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_helpful_review_user_unique" UNIQUE("review_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_seller_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "carts" DROP CONSTRAINT "carts_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_cart_id_carts_id_fk";
--> statement-breakpoint
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "wishlists" DROP CONSTRAINT "wishlists_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "wishlists" DROP CONSTRAINT "wishlists_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "seller_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "shipping_address" SET DATA TYPE jsonb USING "shipping_address"::jsonb;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "billing_address" SET DATA TYPE jsonb USING "billing_address"::jsonb;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "product_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "order_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_token" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_expires" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_token" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_expires" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "token_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "image_url" varchar(500);--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight_grams" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_email" varchar(255);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_name" varchar(255);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_sku" varchar(100);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_image_url" varchar(500);--> statement-breakpoint
UPDATE "order_items" oi SET "product_name" = p."name", "product_sku" = p."sku", "product_image_url" = p."image_url" FROM "products" p WHERE oi."product_id" = p."id";--> statement-breakpoint
UPDATE "order_items" SET "product_name" = 'Deleted product' WHERE "product_name" IS NULL;--> statement-breakpoint
UPDATE "order_items" SET "product_sku" = 'UNKNOWN' WHERE "product_sku" IS NULL;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "product_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "product_sku" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "refunded_amount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "per_user_limit" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "review_helpful" ADD CONSTRAINT "review_helpful_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_helpful" ADD CONSTRAINT "review_helpful_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_helpful_review_idx" ON "review_helpful" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "review_helpful_user_idx" ON "review_helpful" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_method_id_shipping_methods_id_fk" FOREIGN KEY ("shipping_method_id") REFERENCES "public"."shipping_methods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_name_idx" ON "categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "categories_active_idx" ON "categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_seller_idx" ON "products" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "products_active_idx" ON "products" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "carts_user_idx" ON "carts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cart_items_cart_idx" ON "cart_items" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "cart_items_product_idx" ON "cart_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "wishlists_user_idx" ON "wishlists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wishlists_product_idx" ON "wishlists" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_method_idx" ON "payments" USING btree ("method");--> statement-breakpoint
CREATE INDEX "reviews_product_idx" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "reviews_user_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_rating_idx" ON "reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "reviews_approved_idx" ON "reviews" USING btree ("is_approved");--> statement-breakpoint
CREATE INDEX "coupon_usage_coupon_idx" ON "coupon_usage" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_usage_user_idx" ON "coupon_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coupon_usage_order_idx" ON "coupon_usage" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "coupons_code_idx" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "coupons_active_idx" ON "coupons" USING btree ("is_active","start_date","end_date");--> statement-breakpoint
CREATE INDEX "addresses_user_idx" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "addresses_user_default_idx" ON "addresses" USING btree ("user_id","is_default");--> statement-breakpoint
CREATE UNIQUE INDEX "addresses_user_type_default_unique" ON "addresses" USING btree ("user_id","type") WHERE "addresses"."is_default" = true;--> statement-breakpoint
CREATE INDEX "shipping_methods_name_idx" ON "shipping_methods" USING btree ("name");--> statement-breakpoint
CREATE INDEX "shipping_methods_active_idx" ON "shipping_methods" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "product_images_product_idx" ON "product_images" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_images_primary_idx" ON "product_images" USING btree ("product_id","is_primary");--> statement-breakpoint
CREATE INDEX "product_variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_variants_sku_idx" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "product_variants_active_idx" ON "product_variants" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "variant_attributes_variant_idx" ON "variant_attributes" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "variant_attributes_name_idx" ON "variant_attributes" USING btree ("attribute_name");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
-- Clean up legacy data that would violate the new constraints.
UPDATE "orders" o SET "customer_email" = u."email" FROM "users" u WHERE o."user_id" = u."id" AND o."customer_email" IS NULL;--> statement-breakpoint
UPDATE "products" SET "stock_quantity" = 0 WHERE "stock_quantity" < 0;--> statement-breakpoint
UPDATE "products" SET "price" = 0 WHERE "price" < 0;--> statement-breakpoint
UPDATE "products" SET "weight_grams" = 0 WHERE "weight_grams" < 0;--> statement-breakpoint
UPDATE "order_items" SET "quantity" = 1 WHERE "quantity" < 1;--> statement-breakpoint
UPDATE "order_items" SET "price" = 0 WHERE "price" < 0;--> statement-breakpoint
UPDATE "payments" SET "amount" = 0.01 WHERE "amount" <= 0;--> statement-breakpoint
UPDATE "payments" SET "refunded_amount" = 0 WHERE "refunded_amount" < 0;--> statement-breakpoint
UPDATE "payments" SET "refunded_amount" = "amount" WHERE "refunded_amount" > "amount";--> statement-breakpoint
UPDATE "reviews" SET "rating" = 1 WHERE "rating" < 1;--> statement-breakpoint
UPDATE "reviews" SET "rating" = 5 WHERE "rating" > 5;--> statement-breakpoint
UPDATE "reviews" SET "helpful_count" = 0 WHERE "helpful_count" < 0;--> statement-breakpoint
UPDATE "coupons" SET "discount_value" = 100 WHERE "discount_type" = 'percentage' AND "discount_value" > 100;--> statement-breakpoint
UPDATE "coupons" SET "discount_value" = 0.01 WHERE "discount_value" <= 0;--> statement-breakpoint
UPDATE "coupons" SET "end_date" = "start_date" + interval '1 day' WHERE "start_date" >= "end_date";--> statement-breakpoint
UPDATE "coupons" SET "used_count" = 0 WHERE "used_count" < 0;--> statement-breakpoint
UPDATE "users" SET "token_version" = 0 WHERE "token_version" < 0;--> statement-breakpoint
UPDATE "shipping_methods" SET "base_cost" = 0 WHERE "base_cost" < 0;--> statement-breakpoint
UPDATE "shipping_methods" SET "cost_per_kg" = 0 WHERE "cost_per_kg" < 0;--> statement-breakpoint
UPDATE "shipping_methods" SET "estimated_days_min" = 0 WHERE "estimated_days_min" < 0;--> statement-breakpoint
UPDATE "shipping_methods" SET "estimated_days_max" = "estimated_days_min" WHERE "estimated_days_max" < "estimated_days_min";--> statement-breakpoint
WITH ranked AS (
  SELECT "id", row_number() OVER (PARTITION BY "user_id", "type" ORDER BY "created_at" DESC) AS rn
  FROM "addresses" WHERE "is_default" = true
)
UPDATE "addresses" SET "is_default" = false WHERE "id" IN (SELECT "id" FROM ranked WHERE "rn" > 1);--> statement-breakpoint
WITH ranked AS (
  SELECT "id", row_number() OVER (PARTITION BY "user_id" ORDER BY "created_at" ASC) AS rn
  FROM "carts"
)
DELETE FROM "carts" WHERE "id" IN (SELECT "id" FROM ranked WHERE "rn" > 1);--> statement-breakpoint
WITH grouped AS (
  SELECT "cart_id", "product_id", sum("quantity") AS "quantity", (array_agg("id" ORDER BY "created_at"))[1] AS "keep_id"
  FROM "cart_items" GROUP BY "cart_id", "product_id"
)
DELETE FROM "cart_items" WHERE "id" NOT IN (SELECT "keep_id" FROM grouped);--> statement-breakpoint
WITH grouped AS (
  SELECT "cart_id", "product_id", sum("quantity") AS "quantity", (array_agg("id" ORDER BY "created_at"))[1] AS "keep_id"
  FROM "cart_items" GROUP BY "cart_id", "product_id"
)
UPDATE "cart_items" ci SET "quantity" = g."quantity" FROM grouped g WHERE ci."id" = g."keep_id";--> statement-breakpoint
WITH ranked AS (
  SELECT "id", row_number() OVER (PARTITION BY "user_id", "product_id" ORDER BY "created_at" ASC) AS rn
  FROM "wishlists"
)
DELETE FROM "wishlists" WHERE "id" IN (SELECT "id" FROM ranked WHERE "rn" > 1);--> statement-breakpoint
WITH ranked AS (
  SELECT "id", row_number() OVER (PARTITION BY "product_id", "user_id" ORDER BY "created_at" DESC) AS rn
  FROM "reviews"
)
DELETE FROM "reviews" WHERE "id" IN (SELECT "id" FROM ranked WHERE "rn" > 1);--> statement-breakpoint
WITH ranked AS (
  SELECT "id", row_number() OVER (PARTITION BY "coupon_id", "order_id" ORDER BY "used_at" ASC) AS rn
  FROM "coupon_usage"
)
DELETE FROM "coupon_usage" WHERE "id" IN (SELECT "id" FROM ranked WHERE "rn" > 1);--> statement-breakpoint
WITH ranked AS (
  SELECT "id", row_number() OVER (PARTITION BY "order_id" ORDER BY "created_at" DESC) AS rn
  FROM "payments" WHERE "order_id" IS NOT NULL
)
DELETE FROM "payments" WHERE "id" IN (SELECT "id" FROM ranked WHERE "rn" > 1);--> statement-breakpoint
WITH ranked AS (
  SELECT "id", row_number() OVER (PARTITION BY "name" ORDER BY "created_at" ASC) AS rn
  FROM "shipping_methods"
)
UPDATE "shipping_methods" SET "name" = "name" || '-' || substring("id"::text, 1, 8) WHERE "id" IN (SELECT "id" FROM ranked WHERE "rn" > 1);--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_unique" UNIQUE("user_id");--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_product_unique" UNIQUE("cart_id","product_id");--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_product_unique" UNIQUE("user_id","product_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_unique" UNIQUE("order_id");--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_user_unique" UNIQUE("product_id","user_id");--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_coupon_order_unique" UNIQUE("coupon_id","order_id");--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD CONSTRAINT "shipping_methods_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_token_version_non_negative" CHECK ("users"."token_version" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_price_non_negative" CHECK ("products"."price" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_stock_non_negative" CHECK ("products"."stock_quantity" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_weight_non_negative" CHECK ("products"."weight_grams" >= 0);--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_quantity_positive" CHECK ("cart_items"."quantity" > 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_amounts_non_negative" CHECK ("orders"."total_amount" >= 0 AND "orders"."subtotal" >= 0 AND "orders"."shipping_cost" >= 0 AND "orders"."tax_amount" >= 0 AND "orders"."discount_amount" >= 0);--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0);--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_price_non_negative" CHECK ("order_items"."price" >= 0);--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_positive" CHECK ("payments"."amount" > 0);--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_refunded_valid" CHECK ("payments"."refunded_amount" >= 0 AND "payments"."refunded_amount" <= "payments"."amount");--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_range" CHECK ("reviews"."rating" >= 1 AND "reviews"."rating" <= 5);--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_helpful_non_negative" CHECK ("reviews"."helpful_count" >= 0);--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_discount_positive" CHECK ("coupons"."discount_value" > 0);--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_percentage_max" CHECK ("coupons"."discount_type" <> 'percentage' OR "coupons"."discount_value" <= 100);--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_used_count_non_negative" CHECK ("coupons"."used_count" >= 0);--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_date_range" CHECK ("coupons"."start_date" < "coupons"."end_date");--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD CONSTRAINT "shipping_methods_cost_non_negative" CHECK ("shipping_methods"."base_cost" >= 0 AND ("shipping_methods"."cost_per_kg" IS NULL OR "shipping_methods"."cost_per_kg" >= 0));--> statement-breakpoint
ALTER TABLE "shipping_methods" ADD CONSTRAINT "shipping_methods_days_range" CHECK ("shipping_methods"."estimated_days_min" >= 0 AND "shipping_methods"."estimated_days_max" >= "shipping_methods"."estimated_days_min");