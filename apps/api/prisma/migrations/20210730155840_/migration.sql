-- CreateTable
CREATE TABLE "Server" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "morgueUrl" TEXT,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Logfile" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "lastFetched" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bytesRead" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "isWin" BOOLEAN NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "version" TEXT NOT NULL,
    "versionShort" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "xl" INTEGER NOT NULL,
    "race" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "normalizedRace" TEXT NOT NULL,
    "raceAbbr" TEXT NOT NULL,
    "classAbbr" TEXT NOT NULL,
    "char" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "endMessage" TEXT NOT NULL,
    "turns" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "uniqueRunes" INTEGER NOT NULL,
    "runes" INTEGER NOT NULL,
    "branch" TEXT NOT NULL,
    "lvl" INTEGER NOT NULL,
    "god" TEXT,
    "piety" INTEGER,
    "playerId" TEXT NOT NULL,
    "logfileId" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuplicateGame" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "logfileId" TEXT NOT NULL,
    "logLine" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvalidGame" (
    "id" TEXT NOT NULL,
    "logfileId" TEXT NOT NULL,
    "logLine" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Race" (
    "name" TEXT NOT NULL,
    "abbr" CHAR(2) NOT NULL
);

-- CreateTable
CREATE TABLE "Class" (
    "name" TEXT NOT NULL,
    "abbr" CHAR(2) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Server.name_unique" ON "Server"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Server.abbreviation_unique" ON "Server"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "Server.url_unique" ON "Server"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Logfile.serverId_path_unique" ON "Logfile"("serverId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "Player.name_unique" ON "Player"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Race.name_unique" ON "Race"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Race.abbr_unique" ON "Race"("abbr");

-- CreateIndex
CREATE UNIQUE INDEX "Class.name_unique" ON "Class"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Class.abbr_unique" ON "Class"("abbr");

-- AddForeignKey
ALTER TABLE "Logfile" ADD FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD FOREIGN KEY ("logfileId") REFERENCES "Logfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateGame" ADD FOREIGN KEY ("logfileId") REFERENCES "Logfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvalidGame" ADD FOREIGN KEY ("logfileId") REFERENCES "Logfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
