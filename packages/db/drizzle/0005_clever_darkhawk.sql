CREATE TABLE "deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"sales_order_id" uuid NOT NULL,
	"vehicle_id" uuid,
	"driver_id" uuid,
	"delivery_date" date NOT NULL,
	"delivery_address" text,
	"delivery_contact_name" varchar(255),
	"delivery_contact_phone" varchar(50),
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"shipping_fee" bigint DEFAULT 0 NOT NULL,
	"driver_cost" bigint DEFAULT 0 NOT NULL,
	"notes" text,
	"dispatched_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deliveries_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "delivery_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_id" uuid NOT NULL,
	"sales_order_item_id" uuid,
	"product_variant_id" uuid NOT NULL,
	"quantity" numeric(18, 6) NOT NULL,
	"unit_id" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_delivery_id_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_sales_order_item_id_sales_order_items_id_fk" FOREIGN KEY ("sales_order_item_id") REFERENCES "public"."sales_order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_product_variant_id_product_variants_id_fk" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_deliveries_order" ON "deliveries" USING btree ("sales_order_id");--> statement-breakpoint
CREATE INDEX "idx_deliveries_vehicle" ON "deliveries" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "idx_deliveries_driver" ON "deliveries" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_deliveries_status" ON "deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_deliveries_date" ON "deliveries" USING btree ("delivery_date");--> statement-breakpoint
CREATE INDEX "idx_del_items_delivery" ON "delivery_items" USING btree ("delivery_id");--> statement-breakpoint
CREATE INDEX "idx_del_items_variant" ON "delivery_items" USING btree ("product_variant_id");