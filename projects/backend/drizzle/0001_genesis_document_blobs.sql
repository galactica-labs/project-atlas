ALTER TABLE "import_item_documents"
ADD COLUMN "file_name" text;
--> statement-breakpoint
ALTER TABLE "import_item_documents"
ADD COLUMN "content_type" text;
--> statement-breakpoint
ALTER TABLE "import_item_documents"
ADD COLUMN "size_bytes" integer;
--> statement-breakpoint
ALTER TABLE "import_item_documents"
ADD COLUMN "blob" bytea;
--> statement-breakpoint
UPDATE "import_item_documents"
SET
  "file_name" = CASE
    WHEN right("title", 4) = '.pdf' THEN "title"
    ELSE "title" || '.pdf'
  END,
  "content_type" = 'application/pdf',
  "size_bytes" = 0,
  "blob" = decode('', 'hex')
WHERE "file_name" IS NULL;
--> statement-breakpoint
ALTER TABLE "import_item_documents"
ALTER COLUMN "file_name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "import_item_documents"
ALTER COLUMN "content_type" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "import_item_documents"
ALTER COLUMN "size_bytes" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "import_item_documents"
ALTER COLUMN "blob" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "import_item_documents"
DROP COLUMN "url";
