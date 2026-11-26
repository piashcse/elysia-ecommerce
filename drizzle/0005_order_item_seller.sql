ALTER TABLE "order_items" ADD COLUMN "seller_id" uuid;--> statement-breakpoint
UPDATE "order_items" oi SET "seller_id" = p."seller_id" FROM "products" p WHERE oi."product_id" = p."id" AND oi."seller_id" IS NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_items_seller_idx" ON "order_items" USING btree ("seller_id");