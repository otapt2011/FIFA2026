-- =====================================================
-- 1. TABLES
-- =====================================================

CREATE TABLE tournaments (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    year INTEGER NOT NULL,
    host_country TEXT,
    start_date TEXT,
    end_date TEXT
);

CREATE TABLE stages (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL
);

CREATE TABLE cities (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    tournamentId INTEGER,
    CONSTRAINT fk_cities_tournamentId_tournaments_id_fk
        FOREIGN KEY (tournamentId) REFERENCES tournaments(id)
);

CREATE TABLE stadiums (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    cityId INTEGER NOT NULL,
    tournamentId INTEGER,
    CONSTRAINT fk_stadiums_cityId_cities_id_fk
        FOREIGN KEY (cityId) REFERENCES cities(id),
    CONSTRAINT fk_stadiums_tournamentId_tournaments_id_fk
        FOREIGN KEY (tournamentId) REFERENCES tournaments(id)
);

CREATE TABLE groups (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    tournamentId INTEGER,
    CONSTRAINT fk_groups_tournamentId_tournaments_id_fk
        FOREIGN KEY (tournamentId) REFERENCES tournaments(id)
);

CREATE TABLE teams (
    id INTEGER PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    flag TEXT NOT NULL,
    emoji TEXT,
    homeColor TEXT,
    awayColor TEXT,
    tournamentId INTEGER,
    CONSTRAINT fk_teams_tournamentId_tournaments_id_fk
        FOREIGN KEY (tournamentId) REFERENCES tournaments(id)
);

CREATE TABLE matches (
    id INTEGER PRIMARY KEY,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    isodate TEXT NOT NULL,
    homeTeamId INTEGER,
    awayTeamId INTEGER,
    groupId INTEGER,
    stageId INTEGER NOT NULL,
    stadiumId INTEGER NOT NULL,
    cityId INTEGER NOT NULL,
    tournamentId INTEGER,
    CONSTRAINT fk_matches_cityId_cities_id_fk
        FOREIGN KEY (cityId) REFERENCES cities(id),
    CONSTRAINT fk_matches_stadiumId_stadiums_id_fk
        FOREIGN KEY (stadiumId) REFERENCES stadiums(id),
    CONSTRAINT fk_matches_stageId_stages_id_fk
        FOREIGN KEY (stageId) REFERENCES stages(id),
    CONSTRAINT fk_matches_groupId_groups_id_fk
        FOREIGN KEY (groupId) REFERENCES groups(id),
    CONSTRAINT fk_matches_awayTeamId_teams_id_fk
        FOREIGN KEY (awayTeamId) REFERENCES teams(id),
    CONSTRAINT fk_matches_homeTeamId_teams_id_fk
        FOREIGN KEY (homeTeamId) REFERENCES teams(id),
    CONSTRAINT fk_matches_tournamentId_tournaments_id_fk
        FOREIGN KEY (tournamentId) REFERENCES tournaments(id)
);

CREATE TABLE bracket_rules (
    matchNumber INTEGER PRIMARY KEY,
    stageId INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    isodate TEXT NOT NULL,
    stadiumId INTEGER NOT NULL,
    cityId INTEGER NOT NULL,
    homeRule TEXT NOT NULL,
    awayRule TEXT NOT NULL,
    tournamentId INTEGER,
    CONSTRAINT fk_bracket_rules_cityId_cities_id_fk
        FOREIGN KEY (cityId) REFERENCES cities(id),
    CONSTRAINT fk_bracket_rules_stadiumId_stadiums_id_fk
        FOREIGN KEY (stadiumId) REFERENCES stadiums(id),
    CONSTRAINT fk_bracket_rules_stageId_stages_id_fk
        FOREIGN KEY (stageId) REFERENCES stages(id),
    CONSTRAINT fk_bracket_rules_tournamentId_tournaments_id_fk
        FOREIGN KEY (tournamentId) REFERENCES tournaments(id)
);

CREATE TABLE match_scores (
    id INTEGER PRIMARY KEY,
    matchId INTEGER NOT NULL UNIQUE,
    homeScoreFullTime INTEGER DEFAULT 0,
    awayScoreFullTime INTEGER DEFAULT 0,
    homeScoreHalfTime INTEGER,
    awayScoreHalfTime INTEGER,
    homeScoreExtraTime INTEGER,
    awayScoreExtraTime INTEGER,
    homeScorePenalties INTEGER,
    awayScorePenalties INTEGER,
    status TEXT DEFAULT 'scheduled',
    lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_match_scores_matchId_matches_id_fk
        FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE
);

CREATE TABLE match_events (
    id INTEGER PRIMARY KEY,
    matchId INTEGER NOT NULL,
    teamId INTEGER NOT NULL,
    playerName TEXT NOT NULL,
    eventType TEXT NOT NULL,
    eventMinute INTEGER NOT NULL,
    eventMinuteExtra INTEGER DEFAULT 0,
    additionalInfo TEXT,
    CONSTRAINT fk_match_events_teamId_teams_id_fk
        FOREIGN KEY (teamId) REFERENCES teams(id),
    CONSTRAINT fk_match_events_matchId_matches_id_fk
        FOREIGN KEY (matchId) REFERENCES matches(id) ON DELETE CASCADE
);

-- =====================================================
-- 2. INDEXES
-- =====================================================

CREATE INDEX idx_bracket_rules_stage ON bracket_rules (stageId);
CREATE INDEX idx_bracket_rules_isodate ON bracket_rules (isodate);
CREATE INDEX idx_bracket_rules_date ON bracket_rules (date);
CREATE INDEX idx_match_events_type ON match_events (eventType);
CREATE INDEX idx_match_events_team ON match_events (teamId);
CREATE INDEX idx_match_events_match ON match_events (matchId);
CREATE INDEX idx_match_scores_match ON match_scores (matchId);
CREATE INDEX idx_matches_stage ON matches (stageId);
CREATE INDEX idx_matches_stadium ON matches (stadiumId);
CREATE INDEX idx_matches_isodate ON matches (isodate);
CREATE INDEX idx_matches_homeTeam ON matches (homeTeamId);
CREATE INDEX idx_matches_group ON matches (groupId);
CREATE INDEX idx_matches_city ON matches (cityId);
CREATE INDEX idx_matches_awayTeam ON matches (awayTeamId);
CREATE INDEX idx_stadiums_city ON stadiums (cityId);

-- =====================================================
-- 3. VIEWS
-- =====================================================

CREATE VIEW group_standings_raw AS
SELECT
    m.groupId,
    t.id AS teamId,
    m.tournamentId,
    COUNT(*) AS played,
    SUM(CASE WHEN ms.homeScoreFullTime > ms.awayScoreFullTime AND m.homeTeamId = t.id THEN 1
             WHEN ms.awayScoreFullTime > ms.homeScoreFullTime AND m.awayTeamId = t.id THEN 1 ELSE 0 END) AS wins,
    SUM(CASE WHEN ms.homeScoreFullTime = ms.awayScoreFullTime AND ms.homeScoreFullTime IS NOT NULL THEN 1 ELSE 0 END) AS draws,
    SUM(CASE WHEN ms.homeScoreFullTime < ms.awayScoreFullTime AND m.homeTeamId = t.id THEN 1
             WHEN ms.awayScoreFullTime < ms.homeScoreFullTime AND m.awayTeamId = t.id THEN 1 ELSE 0 END) AS losses,
    SUM(CASE WHEN m.homeTeamId = t.id THEN COALESCE(ms.homeScoreFullTime, 0) ELSE COALESCE(ms.awayScoreFullTime, 0) END) AS goalsFor,
    SUM(CASE WHEN m.homeTeamId = t.id THEN COALESCE(ms.awayScoreFullTime, 0) ELSE COALESCE(ms.homeScoreFullTime, 0) END) AS goalsAgainst,
    SUM(CASE WHEN m.homeTeamId = t.id THEN COALESCE(ms.homeScoreFullTime, 0) - COALESCE(ms.awayScoreFullTime, 0)
             ELSE COALESCE(ms.awayScoreFullTime, 0) - COALESCE(ms.homeScoreFullTime, 0) END) AS goalDifference,
    SUM(CASE WHEN ms.homeScoreFullTime > ms.awayScoreFullTime AND m.homeTeamId = t.id THEN 3
             WHEN ms.awayScoreFullTime > ms.homeScoreFullTime AND m.awayTeamId = t.id THEN 3
             WHEN ms.homeScoreFullTime = ms.awayScoreFullTime THEN 1 ELSE 0 END) AS points
FROM matches m
JOIN teams t ON (t.id = m.homeTeamId OR t.id = m.awayTeamId)
LEFT JOIN match_scores ms ON m.id = ms.matchId
WHERE m.stageId = 1 AND m.groupId IS NOT NULL AND ms.status = 'finished'
GROUP BY m.groupId, t.id, m.tournamentId;

CREATE VIEW group_standings_full AS
WITH group_teams AS (
    SELECT DISTINCT m.groupId, t.id AS teamId, m.tournamentId
    FROM matches m
    JOIN teams t ON t.id = m.homeTeamId OR t.id = m.awayTeamId
    WHERE m.groupId IS NOT NULL
)
SELECT
    g.id AS groupId,
    g.name AS groupName,
    gt.teamId,
    t.name AS teamName,
    t.code AS teamCode,
    t.flag AS teamFlag,
    COALESCE(r.played, 0) AS played,
    COALESCE(r.wins, 0) AS wins,
    COALESCE(r.draws, 0) AS draws,
    COALESCE(r.losses, 0) AS losses,
    COALESCE(r.goalsFor, 0) AS goalsFor,
    COALESCE(r.goalsAgainst, 0) AS goalsAgainst,
    COALESCE(r.goalDifference, 0) AS goalDifference,
    COALESCE(r.points, 0) AS points,
    ROW_NUMBER() OVER (PARTITION BY g.id ORDER BY COALESCE(r.points, 0) DESC, COALESCE(r.goalDifference, 0) DESC, COALESCE(r.goalsFor, 0) DESC, t.name ASC) AS rank,
    gt.tournamentId
FROM groups g
JOIN group_teams gt ON g.id = gt.groupId
JOIN teams t ON gt.teamId = t.id
LEFT JOIN group_standings_raw r ON r.groupId = g.id AND r.teamId = t.id AND r.tournamentId = gt.tournamentId;

CREATE VIEW best_third_placed AS
SELECT
    groupId,
    groupName,
    teamId,
    teamName,
    points,
    goalDifference,
    goalsFor,
    tournamentId,
    RANK() OVER (PARTITION BY tournamentId ORDER BY points DESC, goalDifference DESC, goalsFor DESC) AS third_rank
FROM group_standings_full
WHERE rank = 3
ORDER BY tournamentId, points DESC, goalDifference DESC, goalsFor DESC
LIMIT 4;

CREATE VIEW card_summary AS
SELECT
    t.id AS teamId,
    t.name AS teamName,
    t.tournamentId,
    SUM(CASE WHEN me.eventType = 'yellow_card' THEN 1 ELSE 0 END) AS yellowCards,
    SUM(CASE WHEN me.eventType = 'red_card' THEN 1 ELSE 0 END) AS redCards
FROM match_events me
JOIN teams t ON me.teamId = t.id
WHERE me.eventType IN ('yellow_card', 'red_card')
GROUP BY me.teamId, t.tournamentId;

CREATE VIEW head_to_head AS
SELECT
    t1.name AS team1,
    t2.name AS team2,
    m.isodate AS date,
    m.stageName,
    CASE WHEN m.homeTeam = t1.name AND m.awayTeam = t2.name THEN 'home'
         WHEN m.homeTeam = t2.name AND m.awayTeam = t1.name THEN 'away' END AS venue,
    m.homeScoreFullTime,
    m.awayScoreFullTime,
    CASE WHEN (m.homeTeam = t1.name AND m.homeScoreFullTime > m.awayScoreFullTime) OR
              (m.awayTeam = t1.name AND m.awayScoreFullTime > m.homeScoreFullTime) THEN t1.name
         WHEN (m.homeTeam = t2.name AND m.homeScoreFullTime > m.awayScoreFullTime) OR
              (m.awayTeam = t2.name AND m.awayScoreFullTime > m.homeScoreFullTime) THEN t2.name
         ELSE 'Draw' END AS winner,
    m.tournamentId
FROM match_details m
CROSS JOIN (SELECT name, tournamentId FROM teams) t1
CROSS JOIN (SELECT name, tournamentId FROM teams) t2
WHERE t1.name < t2.name
  AND t1.tournamentId = t2.tournamentId
  AND ((m.homeTeam = t1.name AND m.awayTeam = t2.name) OR
       (m.homeTeam = t2.name AND m.awayTeam = t1.name));

CREATE VIEW split_letters_view AS
SELECT '3ABCDF' AS rule_str, 'A' AS letter UNION ALL
SELECT '3ABCDF', 'B' UNION ALL
SELECT '3ABCDF', 'C' UNION ALL
SELECT '3ABCDF', 'D' UNION ALL
SELECT '3ABCDF', 'F' UNION ALL
SELECT '3CDFGH', 'C' UNION ALL
SELECT '3CDFGH', 'D' UNION ALL
SELECT '3CDFGH', 'F' UNION ALL
SELECT '3CDFGH', 'G' UNION ALL
SELECT '3CDFGH', 'H' UNION ALL
SELECT '3CEFHI', 'C' UNION ALL
SELECT '3CEFHI', 'E' UNION ALL
SELECT '3CEFHI', 'F' UNION ALL
SELECT '3CEFHI', 'H' UNION ALL
SELECT '3CEFHI', 'I' UNION ALL
SELECT '3EHIJK', 'E' UNION ALL
SELECT '3EHIJK', 'H' UNION ALL
SELECT '3EHIJK', 'I' UNION ALL
SELECT '3EHIJK', 'J' UNION ALL
SELECT '3EHIJK', 'K' UNION ALL
SELECT '3BEFIJ', 'B' UNION ALL
SELECT '3BEFIJ', 'E' UNION ALL
SELECT '3BEFIJ', 'F' UNION ALL
SELECT '3BEFIJ', 'I' UNION ALL
SELECT '3BEFIJ', 'J' UNION ALL
SELECT '3AEHIJ', 'A' UNION ALL
SELECT '3AEHIJ', 'E' UNION ALL
SELECT '3AEHIJ', 'H' UNION ALL
SELECT '3AEHIJ', 'I' UNION ALL
SELECT '3AEHIJ', 'J' UNION ALL
SELECT '3EFGIJ', 'E' UNION ALL
SELECT '3EFGIJ', 'F' UNION ALL
SELECT '3EFGIJ', 'G' UNION ALL
SELECT '3EFGIJ', 'I' UNION ALL
SELECT '3EFGIJ', 'J' UNION ALL
SELECT '3DEIJL', 'D' UNION ALL
SELECT '3DEIJL', 'E' UNION ALL
SELECT '3DEIJL', 'I' UNION ALL
SELECT '3DEIJL', 'J' UNION ALL
SELECT '3DEIJL', 'L';

CREATE VIEW match_results_view AS
SELECT
    m.id AS matchId,
    m.tournamentId,
    CASE
        WHEN COALESCE(ms.homeScoreExtraTime, ms.homeScoreFullTime) > COALESCE(ms.awayScoreExtraTime, ms.awayScoreFullTime)
             OR (COALESCE(ms.homeScoreExtraTime, ms.homeScoreFullTime) = COALESCE(ms.awayScoreExtraTime, ms.awayScoreFullTime)
                 AND ms.homeScorePenalties > ms.awayScorePenalties) THEN m.homeTeamId
        WHEN COALESCE(ms.awayScoreExtraTime, ms.awayScoreFullTime) > COALESCE(ms.homeScoreExtraTime, ms.homeScoreFullTime)
             OR (COALESCE(ms.awayScoreExtraTime, ms.awayScoreFullTime) = COALESCE(ms.homeScoreExtraTime, ms.homeScoreFullTime)
                 AND ms.awayScorePenalties > ms.homeScorePenalties) THEN m.awayTeamId
        ELSE NULL
    END AS winnerId,
    CASE
        WHEN COALESCE(ms.homeScoreExtraTime, ms.homeScoreFullTime) > COALESCE(ms.awayScoreExtraTime, ms.awayScoreFullTime)
             OR (COALESCE(ms.homeScoreExtraTime, ms.homeScoreFullTime) = COALESCE(ms.awayScoreExtraTime, ms.awayScoreFullTime)
                 AND ms.homeScorePenalties > ms.awayScorePenalties) THEN m.awayTeamId
        WHEN COALESCE(ms.awayScoreExtraTime, ms.awayScoreFullTime) > COALESCE(ms.homeScoreExtraTime, ms.homeScoreFullTime)
             OR (COALESCE(ms.awayScoreExtraTime, ms.awayScoreFullTime) = COALESCE(ms.homeScoreExtraTime, ms.homeScoreFullTime)
                 AND ms.awayScorePenalties > ms.homeScorePenalties) THEN m.homeTeamId
        ELSE NULL
    END AS loserId
FROM matches m
INNER JOIN match_scores ms ON m.id = ms.matchId
WHERE ms.status = 'finished' AND m.stageId >= 2;

CREATE VIEW resolved_home_view AS
SELECT
    br.matchNumber,
    br.tournamentId,
    CASE
        WHEN br.homeRule GLOB '1[A-Z]' THEN (SELECT gs.teamId FROM group_standings_full gs WHERE gs.groupName = 'Group ' || substr(br.homeRule,2) AND gs.rank = 1 AND gs.tournamentId = br.tournamentId LIMIT 1)
        WHEN br.homeRule GLOB '2[A-Z]' THEN (SELECT gs.teamId FROM group_standings_full gs WHERE gs.groupName = 'Group ' || substr(br.homeRule,2) AND gs.rank = 2 AND gs.tournamentId = br.tournamentId LIMIT 1)
        WHEN br.homeRule GLOB 'W[0-9]*' THEN (SELECT winnerId FROM match_results_view WHERE matchId = CAST(substr(br.homeRule,2) AS INTEGER) AND tournamentId = br.tournamentId)
        WHEN br.homeRule GLOB 'RU[0-9]*' THEN (SELECT loserId FROM match_results_view WHERE matchId = CAST(substr(br.homeRule,3) AS INTEGER) AND tournamentId = br.tournamentId)
        WHEN br.homeRule GLOB '3[A-Z]*' THEN (SELECT teamId FROM group_standings_full gs WHERE gs.rank = 3 AND gs.groupName IN (SELECT 'Group ' || letter FROM split_letters_view WHERE rule_str = br.homeRule) AND gs.tournamentId = br.tournamentId ORDER BY gs.points DESC, gs.goalDifference DESC, gs.goalsFor DESC LIMIT 1)
        ELSE NULL
    END AS homeTeamId
FROM bracket_rules br;

CREATE VIEW resolved_away_view AS
SELECT
    br.matchNumber,
    br.tournamentId,
    CASE
        WHEN br.awayRule GLOB '1[A-Z]' THEN (SELECT gs.teamId FROM group_standings_full gs WHERE gs.groupName = 'Group ' || substr(br.awayRule,2) AND gs.rank = 1 AND gs.tournamentId = br.tournamentId LIMIT 1)
        WHEN br.awayRule GLOB '2[A-Z]' THEN (SELECT gs.teamId FROM group_standings_full gs WHERE gs.groupName = 'Group ' || substr(br.awayRule,2) AND gs.rank = 2 AND gs.tournamentId = br.tournamentId LIMIT 1)
        WHEN br.awayRule GLOB 'W[0-9]*' THEN (SELECT winnerId FROM match_results_view WHERE matchId = CAST(substr(br.awayRule,2) AS INTEGER) AND tournamentId = br.tournamentId)
        WHEN br.awayRule GLOB 'RU[0-9]*' THEN (SELECT loserId FROM match_results_view WHERE matchId = CAST(substr(br.awayRule,3) AS INTEGER) AND tournamentId = br.tournamentId)
        WHEN br.awayRule GLOB '3[A-Z]*' THEN (SELECT teamId FROM group_standings_full gs WHERE gs.rank = 3 AND gs.groupName IN (SELECT 'Group ' || letter FROM split_letters_view WHERE rule_str = br.awayRule) AND gs.tournamentId = br.tournamentId ORDER BY gs.points DESC, gs.goalDifference DESC, gs.goalsFor DESC LIMIT 1)
        ELSE NULL
    END AS awayTeamId
FROM bracket_rules br;

CREATE VIEW knockout_matches_resolved AS
SELECT
    br.matchNumber,
    br.stageId,
    s.name AS stageName,
    br.date,
    br.time,
    br.isodate,
    br.stadiumId,
    br.cityId,
    st.name AS stadium,
    c.name AS city,
    br.homeRule,
    br.awayRule,
    rh.homeTeamId,
    ra.awayTeamId,
    br.tournamentId,
    (SELECT name FROM teams WHERE id = rh.homeTeamId AND tournamentId = br.tournamentId) AS homeTeamName,
    (SELECT name FROM teams WHERE id = ra.awayTeamId AND tournamentId = br.tournamentId) AS awayTeamName
FROM bracket_rules br
LEFT JOIN stages s ON br.stageId = s.id
LEFT JOIN stadiums st ON br.stadiumId = st.id
LEFT JOIN cities c ON br.cityId = c.id
LEFT JOIN resolved_home_view rh ON br.matchNumber = rh.matchNumber AND br.tournamentId = rh.tournamentId
LEFT JOIN resolved_away_view ra ON br.matchNumber = ra.matchNumber AND br.tournamentId = ra.tournamentId;

CREATE VIEW knockout_with_flags AS
SELECT
    kmr.*,
    ht.flag AS homeFlag,
    at.flag AS awayFlag,
    ht.code AS homeTeamCode,
    at.code AS awayTeamCode
FROM knockout_matches_resolved kmr
LEFT JOIN teams ht ON kmr.homeTeamId = ht.id AND kmr.tournamentId = ht.tournamentId
LEFT JOIN teams at ON kmr.awayTeamId = at.id AND kmr.tournamentId = at.tournamentId;

CREATE VIEW match_details AS
SELECT
    m.id,
    m.date,
    m.time,
    m.isodate,
    homeTeam.name AS homeTeam,
    awayTeam.name AS awayTeam,
    homeTeam.code AS homeTeamCode,
    awayTeam.code AS awayTeamCode,
    g.name AS groupName,
    s.name AS stageName,
    st.name AS stadium,
    c.name AS city,
    ms.homeScoreFullTime,
    ms.awayScoreFullTime,
    ms.homeScoreHalfTime,
    ms.awayScoreHalfTime,
    ms.homeScoreExtraTime,
    ms.awayScoreExtraTime,
    ms.homeScorePenalties,
    ms.awayScorePenalties,
    ms.status AS matchStatus,
    m.stageId,
    m.tournamentId
FROM matches m
LEFT JOIN teams homeTeam ON m.homeTeamId = homeTeam.id AND m.tournamentId = homeTeam.tournamentId
LEFT JOIN teams awayTeam ON m.awayTeamId = awayTeam.id AND m.tournamentId = awayTeam.tournamentId
LEFT JOIN groups g ON m.groupId = g.id AND m.tournamentId = g.tournamentId
LEFT JOIN stages s ON m.stageId = s.id
LEFT JOIN stadiums st ON m.stadiumId = st.id AND m.tournamentId = st.tournamentId
LEFT JOIN cities c ON m.cityId = c.id AND m.tournamentId = c.tournamentId
LEFT JOIN match_scores ms ON m.id = ms.matchId;

CREATE VIEW match_details_sorted AS
SELECT
    md.*,
    home.flag AS homeFlag,
    away.flag AS awayFlag,
    md.isodate AS sort_date,
    md.isodate AS date_iso
FROM match_details md
LEFT JOIN teams home ON home.id = md.homeTeamId AND md.tournamentId = home.tournamentId
LEFT JOIN teams away ON away.id = md.awayTeamId AND md.tournamentId = away.tournamentId;

CREATE VIEW match_details_with_scores AS
SELECT
    m.id,
    m.date,
    m.time,
    m.stageId,
    homeTeam.name AS homeTeam,
    awayTeam.name AS awayTeam,
    homeTeam.flag AS homeFlag,
    awayTeam.flag AS awayFlag,
    s.name AS stageName,
    g.name AS groupName,
    st.name AS stadium,
    c.name AS city,
    ms.homeScoreFullTime,
    ms.awayScoreFullTime,
    ms.homeScorePenalties,
    ms.awayScorePenalties,
    ms.status AS matchStatus,
    m.tournamentId
FROM matches m
LEFT JOIN teams homeTeam ON m.homeTeamId = homeTeam.id AND m.tournamentId = homeTeam.tournamentId
LEFT JOIN teams awayTeam ON m.awayTeamId = awayTeam.id AND m.tournamentId = awayTeam.tournamentId
LEFT JOIN stages s ON m.stageId = s.id
LEFT JOIN groups g ON m.groupId = g.id AND m.tournamentId = g.tournamentId
LEFT JOIN stadiums st ON m.stadiumId = st.id AND m.tournamentId = st.tournamentId
LEFT JOIN cities c ON m.cityId = c.id AND m.tournamentId = c.tournamentId
LEFT JOIN match_scores ms ON m.id = ms.matchId;

CREATE VIEW match_events_with_team AS
SELECT
    me.id,
    me.matchId,
    me.eventType,
    me.playerName,
    t.name AS team,
    me.eventMinute,
    me.eventMinuteExtra
FROM match_events me
JOIN teams t ON me.teamId = t.id;

CREATE VIEW own_goals AS
SELECT
    t.id AS teamId,
    t.name AS teamName,
    t.tournamentId,
    me.playerName,
    COUNT(*) AS ownGoals
FROM match_events me
JOIN teams t ON me.teamId = t.id
WHERE me.eventType = 'own_goal'
GROUP BY me.teamId, me.playerName, t.tournamentId
ORDER BY ownGoals DESC;

CREATE VIEW team_match_history AS
SELECT
    t.id AS teamId,
    t.name AS teamName,
    t.tournamentId,
    m.id AS matchId,
    m.isodate AS date,
    m.time,
    CASE WHEN m.homeTeamId = t.id THEN 'home' ELSE 'away' END AS venue,
    CASE WHEN m.homeTeamId = t.id THEN awayTeam.name ELSE homeTeam.name END AS opponent,
    s.name AS stage,
    st.name AS stadium,
    c.name AS city,
    CASE WHEN m.homeTeamId = t.id THEN ms.homeScoreFullTime ELSE ms.awayScoreFullTime END AS teamScore,
    CASE WHEN m.homeTeamId = t.id THEN ms.awayScoreFullTime ELSE ms.homeScoreFullTime END AS opponentScore,
    CASE WHEN (m.homeTeamId = t.id AND ms.homeScoreFullTime > ms.awayScoreFullTime) OR
              (m.awayTeamId = t.id AND ms.awayScoreFullTime > ms.homeScoreFullTime) THEN 'W'
         WHEN (m.homeTeamId = t.id AND ms.homeScoreFullTime < ms.awayScoreFullTime) OR
              (m.awayTeamId = t.id AND ms.awayScoreFullTime < ms.homeScoreFullTime) THEN 'L'
         WHEN ms.homeScoreFullTime = ms.awayScoreFullTime THEN 'D'
         ELSE '-' END AS result,
    ms.status
FROM teams t
JOIN matches m ON t.id = m.homeTeamId OR t.id = m.awayTeamId
LEFT JOIN teams homeTeam ON m.homeTeamId = homeTeam.id AND m.tournamentId = homeTeam.tournamentId
LEFT JOIN teams awayTeam ON m.awayTeamId = awayTeam.id AND m.tournamentId = awayTeam.tournamentId
LEFT JOIN stages s ON m.stageId = s.id
LEFT JOIN stadiums st ON m.stadiumId = st.id AND m.tournamentId = st.tournamentId
LEFT JOIN cities c ON m.cityId = c.id AND m.tournamentId = c.tournamentId
LEFT JOIN match_scores ms ON m.id = ms.matchId
ORDER BY t.id, m.isodate;

CREATE VIEW top_scorers AS
SELECT
    t.id AS teamId,
    t.name AS teamName,
    t.code AS teamCode,
    t.tournamentId,
    me.playerName,
    COUNT(*) AS goals
FROM match_events me
JOIN teams t ON me.teamId = t.id
WHERE me.eventType IN ('goal', 'penalty_goal')
GROUP BY me.teamId, me.playerName, t.tournamentId
ORDER BY goals DESC, playerName;

CREATE VIEW tournament_progress AS
SELECT
    m.tournamentId,
    (SELECT COUNT(*) FROM matches WHERE stageId = 1 AND tournamentId = m.tournamentId) AS total_group_matches,
    (SELECT COUNT(*) FROM match_scores WHERE status = 'finished' AND matchId IN (SELECT id FROM matches WHERE stageId = 1 AND tournamentId = m.tournamentId)) AS finished_group_matches,
    (SELECT COUNT(*) FROM matches WHERE stageId >= 2 AND tournamentId = m.tournamentId) AS total_knockout_matches,
    (SELECT COUNT(*) FROM match_scores WHERE status = 'finished' AND matchId IN (SELECT id FROM matches WHERE stageId >= 2 AND tournamentId = m.tournamentId)) AS finished_knockout_matches,
    (SELECT SUM(homeScoreFullTime + awayScoreFullTime) FROM match_scores WHERE status = 'finished' AND matchId IN (SELECT id FROM matches WHERE tournamentId = m.tournamentId)) AS total_goals,
    (SELECT COUNT(*) FROM match_events WHERE eventType IN ('goal','penalty_goal') AND matchId IN (SELECT id FROM matches WHERE tournamentId = m.tournamentId)) AS total_goals_events,
    (SELECT COUNT(*) FROM match_events WHERE eventType IN ('yellow_card','red_card') AND matchId IN (SELECT id FROM matches WHERE tournamentId = m.tournamentId)) AS total_cards
FROM matches m
GROUP BY m.tournamentId;

CREATE VIEW unified_matches AS
SELECT
    id,
    isodate AS date,
    time,
    homeTeam,
    awayTeam,
    homeTeamCode,
    awayTeamCode,
    homeFlag,
    awayFlag,
    homeScoreFullTime,
    awayScoreFullTime,
    matchStatus,
    stadium,
    city,
    groupName,
    stageName,
    isodate AS sort_date,
    NULL AS homeTeamId,
    NULL AS awayTeamId,
    NULL AS homeRule,
    NULL AS awayRule,
    tournamentId
FROM match_details_sorted
WHERE stageId = 1

UNION ALL

SELECT
    kmr.matchNumber AS id,
    kmr.isodate AS date,
    kmr.time,
    COALESCE(kmr.homeTeamName, kmr.homeRule) AS homeTeam,
    COALESCE(kmr.awayTeamName, kmr.awayRule) AS awayTeam,
    kmr.homeTeamCode,
    kmr.awayTeamCode,
    kmr.homeFlag,
    kmr.awayFlag,
    NULL AS homeScoreFullTime,
    NULL AS awayScoreFullTime,
    'scheduled' AS matchStatus,
    kmr.stadium,
    kmr.city,
    NULL AS groupName,
    kmr.stageName,
    kmr.isodate AS sort_date,
    kmr.homeTeamId,
    kmr.awayTeamId,
    kmr.homeRule,
    kmr.awayRule,
    kmr.tournamentId
FROM knockout_with_flags kmr
WHERE kmr.stageId >= 2;