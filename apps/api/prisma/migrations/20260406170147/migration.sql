ALTER TABLE "Game" ADD CONSTRAINT "Game_normalizedClass_nn" 
  CHECK ("normalizedClass" IS NOT NULL) NOT VALID;

ALTER TABLE "Game" VALIDATE CONSTRAINT "Game_normalizedClass_nn";

ALTER TABLE "Game" ALTER COLUMN "normalizedClass" SET NOT NULL;

ALTER TABLE "Game" DROP CONSTRAINT "Game_normalizedClass_nn";
