-- Drop unused views
DROP VIEW IF EXISTS current_matchday;
DROP VIEW IF EXISTS finished_matches;
DROP VIEW IF EXISTS group_standings;
DROP VIEW IF EXISTS group_standings_simple;
DROP VIEW IF EXISTS knockout_bracket;
DROP VIEW IF EXISTS knockout_matches_resolved_simple;
DROP VIEW IF EXISTS match_events_details;
DROP VIEW IF EXISTS match_timeline;
DROP VIEW IF EXISTS team_form;
DROP VIEW IF EXISTS team_group_summary;
DROP VIEW IF EXISTS upcoming_matches;

-- Drop unused tables
DROP TABLE IF EXISTS match_timezones;
DROP TABLE IF EXISTS sync_metadata;
-- (keep tournaments if you plan to use it later)