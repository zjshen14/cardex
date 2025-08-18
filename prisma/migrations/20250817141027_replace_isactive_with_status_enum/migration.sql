-- AlterTable: Add status column (SQLite doesn't support enums, uses TEXT with CHECK constraint)
ALTER TABLE "cards" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- Data migration: Convert isActive to status
UPDATE "cards" SET "status" = CASE 
  WHEN "isActive" = 1 THEN 'ACTIVE'
  WHEN "isActive" = 0 THEN 'DELETED'
  ELSE 'ACTIVE'
END;

-- Create new table without isActive column
CREATE TABLE "new_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "condition" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "imageUrls" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "set" TEXT,
    "rarity" TEXT,
    "cardNumber" TEXT,
    "year" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sellerId" TEXT NOT NULL,
    CONSTRAINT "cards_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy data from old table to new table
INSERT INTO "new_cards" ("id", "title", "description", "condition", "price", "imageUrls", "category", "set", "rarity", "cardNumber", "year", "status", "createdAt", "updatedAt", "sellerId")
SELECT "id", "title", "description", "condition", "price", "imageUrls", "category", "set", "rarity", "cardNumber", "year", "status", "createdAt", "updatedAt", "sellerId" FROM "cards";

-- Drop old table and rename new table
DROP TABLE "cards";
ALTER TABLE "new_cards" RENAME TO "cards";