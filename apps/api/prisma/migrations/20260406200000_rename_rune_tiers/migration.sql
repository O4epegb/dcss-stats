-- Rename existing enum
ALTER TYPE "HighscoreRuneTier" RENAME TO "HighscoreRuneTier_old";

-- Create new enum with generic values
CREATE TYPE "HighscoreRuneTier" AS ENUM ('ALL', 'TIER_1', 'TIER_2');

-- Migrate column: ALL stays ALL, THREE_RUNES -> TIER_1, FOUR_PLUS_RUNES -> TIER_2
ALTER TABLE "Highscore"
  ALTER COLUMN "runeTier" TYPE "HighscoreRuneTier"
  USING (CASE "runeTier"::text
    WHEN 'ALL' THEN 'ALL'::"HighscoreRuneTier"
    WHEN 'THREE_RUNES' THEN 'TIER_1'::"HighscoreRuneTier"
    WHEN 'FOUR_PLUS_RUNES' THEN 'TIER_2'::"HighscoreRuneTier"
    ELSE 'ALL'::"HighscoreRuneTier"
  END);

-- Drop old enum
DROP TYPE "HighscoreRuneTier_old";
