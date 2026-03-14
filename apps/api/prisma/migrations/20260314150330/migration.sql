UPDATE "Game"
SET
	"normalizedRace" = 'Gale Centaur',
	"raceAbbr" = 'GC',
	"char" = 'GC' || RIGHT("char", 2)
WHERE "normalizedRace" = 'Anemocentaur';
