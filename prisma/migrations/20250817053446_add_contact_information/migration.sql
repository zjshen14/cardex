-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "password" TEXT,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactDiscord" TEXT,
    "contactTelegram" TEXT,
    "preferredContactMethod" TEXT,
    "contactNote" TEXT,
    "showEmail" BOOLEAN NOT NULL DEFAULT false,
    "showPhone" BOOLEAN NOT NULL DEFAULT false,
    "showDiscord" BOOLEAN NOT NULL DEFAULT false,
    "showTelegram" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_users" ("createdAt", "email", "id", "image", "name", "password", "updatedAt", "username") SELECT "createdAt", "email", "id", "image", "name", "password", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
