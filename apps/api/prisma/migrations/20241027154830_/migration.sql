-- One time operation to reparse all logfiles and add new fields
UPDATE "Logfile" SET "bytesRead" = 0;
