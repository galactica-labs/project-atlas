CREATE TYPE "public"."import_batch_status" AS ENUM('ingested', 'matched', 'reviewed', 'committed');--> statement-breakpoint
CREATE TYPE "public"."import_source" AS ENUM('ingress-controller');--> statement-breakpoint
CREATE TYPE "public"."technician_decision" AS ENUM('pending', 'confirmed', 'edited', 'needs-doc');--> statement-breakpoint
CREATE TABLE "component_catalog_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_item_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"vendor" text NOT NULL,
	"normalized_name" text NOT NULL,
	"category" text NOT NULL,
	"confidence" integer NOT NULL,
	"technician_decision" "technician_decision" NOT NULL,
	"documentation" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "import_source" DEFAULT 'ingress-controller' NOT NULL,
	"source_label" text NOT NULL,
	"status" "import_batch_status" DEFAULT 'ingested' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_item_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_item_id" uuid NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"ingress_key" text NOT NULL,
	"sku" text NOT NULL,
	"vendor" text NOT NULL,
	"quantity" integer NOT NULL,
	"raw_payload" jsonb NOT NULL,
	"normalized_name" text,
	"category" text,
	"confidence" integer,
	"reasoning" text,
	"candidates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"technician_decision" "technician_decision" DEFAULT 'pending' NOT NULL,
	"technician_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "component_catalog_entries" ADD CONSTRAINT "component_catalog_entries_import_item_id_import_items_id_fk" FOREIGN KEY ("import_item_id") REFERENCES "public"."import_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_item_documents" ADD CONSTRAINT "import_item_documents_import_item_id_import_items_id_fk" FOREIGN KEY ("import_item_id") REFERENCES "public"."import_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_items" ADD CONSTRAINT "import_items_batch_id_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "component_catalog_entries_import_item_uidx" ON "component_catalog_entries" USING btree ("import_item_id");--> statement-breakpoint
CREATE INDEX "import_batches_status_idx" ON "import_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "import_item_documents_item_idx" ON "import_item_documents" USING btree ("import_item_id");--> statement-breakpoint
CREATE INDEX "import_items_batch_idx" ON "import_items" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "import_items_sku_idx" ON "import_items" USING btree ("sku");