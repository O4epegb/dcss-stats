-- CreateTable
CREATE TABLE "God" (
    "name" TEXT NOT NULL,
    "trunk" BOOLEAN NOT NULL DEFAULT true
);

-- CreateIndex
CREATE UNIQUE INDEX "God.name_unique" ON "God"("name");
