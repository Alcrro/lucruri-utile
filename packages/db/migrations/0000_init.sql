CREATE TYPE "public"."attribute_scope" AS ENUM('product', 'device', 'both');--> statement-breakpoint
CREATE TYPE "public"."attribute_type" AS ENUM('enum', 'number', 'boolean', 'text');--> statement-breakpoint
CREATE TYPE "public"."compatibility_mode" AS ENUM('fitment', 'attributes', 'fitment_and_attributes', 'none');--> statement-breakpoint
CREATE TYPE "public"."image_status" AS ENUM('pending', 'stored', 'failed');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'published', 'unavailable', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."compatibility_source" AS ENUM('rule', 'fitment', 'override');--> statement-breakpoint
CREATE TYPE "public"."compatibility_status" AS ENUM('compatible', 'partial', 'near_miss');--> statement-breakpoint
CREATE TYPE "public"."override_verdict" AS ENUM('compatible', 'partial', 'incompatible');--> statement-breakpoint
CREATE TYPE "public"."rule_target_kind" AS ENUM('product_category', 'device_kind');--> statement-breakpoint
CREATE TYPE "public"."device_kind" AS ENUM('phone', 'tablet', 'laptop', 'printer', 'vacuum', 'coffee_machine', 'water_filter_jug', 'power_tool_platform');--> statement-breakpoint
CREATE TYPE "public"."fitment_source" AS ENUM('feed_parse', 'manual');--> statement-breakpoint
CREATE TYPE "public"."feed_format" AS ENUM('xml', 'csv', 'json');--> statement-breakpoint
CREATE TYPE "public"."import_run_status" AS ENUM('running', 'succeeded', 'not_modified', 'failed', 'aborted_by_breaker');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('active', 'missing');--> statement-breakpoint
CREATE TYPE "public"."review_kind" AS ENUM('attribute_value', 'fitment', 'category');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('open', 'resolved', 'ignored');--> statement-breakpoint
CREATE TABLE "attribute_definitions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"type" "attribute_type" NOT NULL,
	"unit" text,
	"is_multi" boolean DEFAULT false NOT NULL,
	"scope" "attribute_scope" DEFAULT 'both' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attribute_definitions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "attribute_options" (
	"id" uuid PRIMARY KEY NOT NULL,
	"attribute_id" uuid NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "attribute_options_attributeId_key_unique" UNIQUE("attribute_id","key")
);
--> statement-breakpoint
CREATE TABLE "attribute_value_aliases" (
	"id" uuid PRIMARY KEY NOT NULL,
	"attribute_id" uuid NOT NULL,
	"raw_value" text NOT NULL,
	"option_id" uuid,
	"value_number" double precision,
	"value_bool" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attribute_value_aliases_attributeId_rawValue_unique" UNIQUE("attribute_id","raw_value"),
	CONSTRAINT "attribute_value_aliases_one_value" CHECK (num_nonnulls("attribute_value_aliases"."option_id", "attribute_value_aliases"."value_number", "attribute_value_aliases"."value_bool") = 1)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"parent_id" uuid,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"compatibility_mode" "compatibility_mode" DEFAULT 'none' NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "category_attributes" (
	"category_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"is_filterable" boolean DEFAULT true NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "category_attributes_category_id_attribute_id_pk" PRIMARY KEY("category_id","attribute_id")
);
--> statement-breakpoint
CREATE TABLE "product_attributes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"product_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL,
	"option_id" uuid,
	"value_number" double precision,
	"value_bool" boolean,
	"value_text" text,
	CONSTRAINT "product_attributes_productId_attributeId_optionId_unique" UNIQUE NULLS NOT DISTINCT("product_id","attribute_id","option_id"),
	CONSTRAINT "product_attributes_one_value" CHECK (num_nonnulls("product_attributes"."option_id", "product_attributes"."value_number", "product_attributes"."value_bool", "product_attributes"."value_text") = 1)
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY NOT NULL,
	"product_id" uuid NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"source_url" text NOT NULL,
	"storage_key" text,
	"content_hash" text,
	"width" integer,
	"height" integer,
	"status" "image_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_images_productId_sourceUrl_unique" UNIQUE("product_id","source_url")
);
--> statement-breakpoint
CREATE TABLE "product_overrides" (
	"product_id" uuid PRIMARY KEY NOT NULL,
	"title" text,
	"description" text,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"category_id" uuid,
	"device_id" uuid,
	"ean" text,
	"brand" text,
	"title" text NOT NULL,
	"description" text,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"price_minor" integer,
	"vat_rate_bps" integer,
	"primary_offer_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_price_positive" CHECK ("products"."price_minor" is null or "products"."price_minor" > 0),
	CONSTRAINT "products_published_has_price" CHECK ("products"."status" <> 'published' or ("products"."price_minor" is not null and "products"."category_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "compatibility_overrides" (
	"id" uuid PRIMARY KEY NOT NULL,
	"product_id" uuid NOT NULL,
	"target_product_id" uuid,
	"target_device_id" uuid,
	"verdict" "override_verdict" NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compatibility_overrides_productId_targetProductId_targetDeviceId_unique" UNIQUE NULLS NOT DISTINCT("product_id","target_product_id","target_device_id"),
	CONSTRAINT "compatibility_overrides_one_target" CHECK (num_nonnulls("compatibility_overrides"."target_product_id", "compatibility_overrides"."target_device_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "compatibility_rules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subject_category_id" uuid NOT NULL,
	"target_kind" "rule_target_kind" NOT NULL,
	"target_category_id" uuid,
	"target_device_kind" "device_kind",
	"conditions" jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compatibility_rules_one_target" CHECK (("compatibility_rules"."target_kind" = 'product_category' and "compatibility_rules"."target_category_id" is not null and "compatibility_rules"."target_device_kind" is null)
       or ("compatibility_rules"."target_kind" = 'device_kind' and "compatibility_rules"."target_device_kind" is not null and "compatibility_rules"."target_category_id" is null))
);
--> statement-breakpoint
CREATE TABLE "product_compatibility" (
	"id" uuid PRIMARY KEY NOT NULL,
	"product_id" uuid NOT NULL,
	"target_product_id" uuid,
	"target_device_id" uuid,
	"status" "compatibility_status" NOT NULL,
	"source" "compatibility_source" NOT NULL,
	"reason" text,
	"rule_id" uuid,
	"rule_version" integer,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_compatibility_productId_targetProductId_targetDeviceId_unique" UNIQUE NULLS NOT DISTINCT("product_id","target_product_id","target_device_id"),
	CONSTRAINT "product_compatibility_one_target" CHECK (num_nonnulls("product_compatibility"."target_product_id", "product_compatibility"."target_device_id") = 1),
	CONSTRAINT "product_compatibility_reason_when_not_compatible" CHECK ("product_compatibility"."status" = 'compatible' or "product_compatibility"."reason" is not null)
);
--> statement-breakpoint
CREATE TABLE "device_aliases" (
	"id" uuid PRIMARY KEY NOT NULL,
	"device_id" uuid NOT NULL,
	"alias" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "device_aliases_alias_unique" UNIQUE("alias")
);
--> statement-breakpoint
CREATE TABLE "device_attributes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"device_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL,
	"option_id" uuid,
	"value_number" double precision,
	"value_bool" boolean,
	"value_text" text,
	CONSTRAINT "device_attributes_deviceId_attributeId_optionId_unique" UNIQUE NULLS NOT DISTINCT("device_id","attribute_id","option_id"),
	CONSTRAINT "device_attributes_one_value" CHECK (num_nonnulls("device_attributes"."option_id", "device_attributes"."value_number", "device_attributes"."value_bool", "device_attributes"."value_text") = 1)
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"kind" "device_kind" NOT NULL,
	"brand" text NOT NULL,
	"series" text,
	"model" text NOT NULL,
	"variant" text,
	"release_year" smallint,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "devices_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_fitments" (
	"product_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"source" "fitment_source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_fitments_product_id_device_id_pk" PRIMARY KEY("product_id","device_id")
);
--> statement-breakpoint
CREATE TABLE "import_errors" (
	"id" uuid PRIMARY KEY NOT NULL,
	"import_run_id" uuid NOT NULL,
	"supplier_sku" text,
	"message" text NOT NULL,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"supplier_id" uuid NOT NULL,
	"status" "import_run_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"items_total" integer DEFAULT 0 NOT NULL,
	"items_invalid" integer DEFAULT 0 NOT NULL,
	"items_changed" integer DEFAULT 0 NOT NULL,
	"items_missing" integer DEFAULT 0 NOT NULL,
	"breaker_reason" text,
	"raw_storage_key" text,
	"etag" text,
	"last_modified" text
);
--> statement-breakpoint
CREATE TABLE "review_queue" (
	"id" uuid PRIMARY KEY NOT NULL,
	"kind" "review_kind" NOT NULL,
	"status" "review_status" DEFAULT 'open' NOT NULL,
	"dedupe_key" text NOT NULL,
	"supplier_id" uuid,
	"product_id" uuid,
	"attribute_id" uuid,
	"raw_value" text NOT NULL,
	"context" jsonb,
	"occurrences" integer DEFAULT 1 NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_category_map" (
	"supplier_id" uuid NOT NULL,
	"supplier_category_path" text NOT NULL,
	"category_id" uuid,
	"is_ignored" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_category_map_supplier_id_supplier_category_path_pk" PRIMARY KEY("supplier_id","supplier_category_path")
);
--> statement-breakpoint
CREATE TABLE "supplier_offers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"supplier_id" uuid NOT NULL,
	"supplier_sku" text NOT NULL,
	"product_id" uuid,
	"ean" text,
	"cost_price_minor" integer NOT NULL,
	"cost_includes_vat" boolean NOT NULL,
	"stock" integer,
	"supplier_category_path" text,
	"raw" jsonb NOT NULL,
	"content_hash" text NOT NULL,
	"status" "offer_status" DEFAULT 'active' NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_offers_supplierId_supplierSku_unique" UNIQUE("supplier_id","supplier_sku"),
	CONSTRAINT "supplier_offers_cost_positive" CHECK ("supplier_offers"."cost_price_minor" > 0)
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"feed_url" text NOT NULL,
	"feed_format" "feed_format" NOT NULL,
	"mapping" jsonb NOT NULL,
	"breaker_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"import_schedule" text DEFAULT '0 */6 * * *' NOT NULL,
	"stock_buffer" smallint DEFAULT 3 NOT NULL,
	"order_email" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "attribute_options" ADD CONSTRAINT "attribute_options_attribute_id_attribute_definitions_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attribute_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attribute_value_aliases" ADD CONSTRAINT "attribute_value_aliases_attribute_id_attribute_definitions_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attribute_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attribute_value_aliases" ADD CONSTRAINT "attribute_value_aliases_option_id_attribute_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."attribute_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_attribute_id_attribute_definitions_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attribute_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_attribute_id_attribute_definitions_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attribute_definitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_option_id_attribute_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."attribute_options"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_overrides" ADD CONSTRAINT "product_overrides_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_primary_offer_id_supplier_offers_id_fk" FOREIGN KEY ("primary_offer_id") REFERENCES "public"."supplier_offers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compatibility_overrides" ADD CONSTRAINT "compatibility_overrides_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compatibility_overrides" ADD CONSTRAINT "compatibility_overrides_target_product_id_products_id_fk" FOREIGN KEY ("target_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compatibility_overrides" ADD CONSTRAINT "compatibility_overrides_target_device_id_devices_id_fk" FOREIGN KEY ("target_device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compatibility_rules" ADD CONSTRAINT "compatibility_rules_subject_category_id_categories_id_fk" FOREIGN KEY ("subject_category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compatibility_rules" ADD CONSTRAINT "compatibility_rules_target_category_id_categories_id_fk" FOREIGN KEY ("target_category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_compatibility" ADD CONSTRAINT "product_compatibility_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_compatibility" ADD CONSTRAINT "product_compatibility_target_product_id_products_id_fk" FOREIGN KEY ("target_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_compatibility" ADD CONSTRAINT "product_compatibility_target_device_id_devices_id_fk" FOREIGN KEY ("target_device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_compatibility" ADD CONSTRAINT "product_compatibility_rule_id_compatibility_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."compatibility_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_aliases" ADD CONSTRAINT "device_aliases_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_attributes" ADD CONSTRAINT "device_attributes_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_attributes" ADD CONSTRAINT "device_attributes_attribute_id_attribute_definitions_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attribute_definitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_attributes" ADD CONSTRAINT "device_attributes_option_id_attribute_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."attribute_options"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_fitments" ADD CONSTRAINT "product_fitments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_fitments" ADD CONSTRAINT "product_fitments_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_errors" ADD CONSTRAINT "import_errors_import_run_id_import_runs_id_fk" FOREIGN KEY ("import_run_id") REFERENCES "public"."import_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_runs" ADD CONSTRAINT "import_runs_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_queue" ADD CONSTRAINT "review_queue_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_queue" ADD CONSTRAINT "review_queue_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_queue" ADD CONSTRAINT "review_queue_attribute_id_attribute_definitions_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attribute_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_category_map" ADD CONSTRAINT "supplier_category_map_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_category_map" ADD CONSTRAINT "supplier_category_map_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_offers" ADD CONSTRAINT "supplier_offers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_offers" ADD CONSTRAINT "supplier_offers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_parent_id_index" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "product_attributes_attr_option_idx" ON "product_attributes" USING btree ("attribute_id","option_id");--> statement-breakpoint
CREATE INDEX "product_attributes_attr_number_idx" ON "product_attributes" USING btree ("attribute_id","value_number");--> statement-breakpoint
CREATE INDEX "product_images_status_index" ON "product_images" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "products_ean_unique" ON "products" USING btree ("ean") WHERE "products"."ean" is not null;--> statement-breakpoint
CREATE INDEX "products_category_id_status_index" ON "products" USING btree ("category_id","status");--> statement-breakpoint
CREATE INDEX "compatibility_rules_subject_category_id_index" ON "compatibility_rules" USING btree ("subject_category_id");--> statement-breakpoint
CREATE INDEX "product_compatibility_target_device_id_status_index" ON "product_compatibility" USING btree ("target_device_id","status");--> statement-breakpoint
CREATE INDEX "product_compatibility_target_product_id_status_index" ON "product_compatibility" USING btree ("target_product_id","status");--> statement-breakpoint
CREATE INDEX "device_attributes_attr_option_idx" ON "device_attributes" USING btree ("attribute_id","option_id");--> statement-breakpoint
CREATE INDEX "device_attributes_attr_number_idx" ON "device_attributes" USING btree ("attribute_id","value_number");--> statement-breakpoint
CREATE INDEX "product_fitments_device_id_index" ON "product_fitments" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "import_errors_import_run_id_index" ON "import_errors" USING btree ("import_run_id");--> statement-breakpoint
CREATE INDEX "import_runs_supplier_id_started_at_index" ON "import_runs" USING btree ("supplier_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "review_queue_open_dedupe" ON "review_queue" USING btree ("dedupe_key") WHERE "review_queue"."status" = 'open';--> statement-breakpoint
CREATE INDEX "review_queue_kind_status_index" ON "review_queue" USING btree ("kind","status");--> statement-breakpoint
CREATE INDEX "supplier_offers_product_id_index" ON "supplier_offers" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "supplier_offers_ean_index" ON "supplier_offers" USING btree ("ean");