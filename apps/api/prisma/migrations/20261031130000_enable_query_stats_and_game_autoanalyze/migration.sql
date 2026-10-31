CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Refresh planner statistics more frequently
ALTER TABLE public."Game" SET (
    autovacuum_analyze_scale_factor = 0.001,
    autovacuum_analyze_threshold = 1000
);
