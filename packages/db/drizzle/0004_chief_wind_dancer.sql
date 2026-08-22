CREATE TABLE "cash_flow_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"account_type" varchar(50) NOT NULL,
	"direction" varchar(50) NOT NULL,
	"amount" bigint NOT NULL,
	"balance_after" bigint NOT NULL,
	"transaction_date" date NOT NULL,
	"category" varchar(100) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_debts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"project_id" uuid,
	"transaction_type" varchar(50) NOT NULL,
	"reference_type" varchar(50) NOT NULL,
	"reference_id" uuid,
	"amount" bigint NOT NULL,
	"balance_after" bigint NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"payment_type" varchar(50) NOT NULL,
	"payment_method" varchar(50) DEFAULT 'CASH' NOT NULL,
	"customer_id" uuid,
	"project_id" uuid,
	"supplier_id" uuid,
	"sales_order_id" uuid,
	"purchase_id" uuid,
	"amount" bigint NOT NULL,
	"payment_date" date NOT NULL,
	"payer_receiver_name" varchar(255),
	"notes" text,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "supplier_debts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"reference_type" varchar(50) NOT NULL,
	"reference_id" uuid,
	"amount" bigint NOT NULL,
	"balance_after" bigint NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cash_flow_entries" ADD CONSTRAINT "cash_flow_entries_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_debts" ADD CONSTRAINT "customer_debts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_debts" ADD CONSTRAINT "customer_debts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_debts" ADD CONSTRAINT "supplier_debts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cash_flow_account" ON "cash_flow_entries" USING btree ("account_type");--> statement-breakpoint
CREATE INDEX "idx_cash_flow_direction" ON "cash_flow_entries" USING btree ("direction");--> statement-breakpoint
CREATE INDEX "idx_cash_flow_date" ON "cash_flow_entries" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "idx_cust_debt_customer" ON "customer_debts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_cust_debt_project" ON "customer_debts" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_cust_debt_type" ON "customer_debts" USING btree ("transaction_type");--> statement-breakpoint
CREATE INDEX "idx_cust_debt_created" ON "customer_debts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_cust_debt_ref" ON "customer_debts" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "idx_payments_type" ON "payments" USING btree ("payment_type");--> statement-breakpoint
CREATE INDEX "idx_payments_method" ON "payments" USING btree ("payment_method");--> statement-breakpoint
CREATE INDEX "idx_payments_customer" ON "payments" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_payments_supplier" ON "payments" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_payments_date" ON "payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "idx_sup_debt_supplier" ON "supplier_debts" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_sup_debt_type" ON "supplier_debts" USING btree ("transaction_type");--> statement-breakpoint
CREATE INDEX "idx_sup_debt_created" ON "supplier_debts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_sup_debt_ref" ON "supplier_debts" USING btree ("reference_type","reference_id");