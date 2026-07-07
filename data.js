// data.js – database queries (async – all methods return Promises)
import { state } from './state.js';

export const data = {
  getGroups: async () => {
    const rows = await state.db.jaferAll(
      `SELECT groupName, teamName, teamCode, teamFlag, played, wins, draws, losses,
              goalsFor, goalsAgainst, goalDifference, points, rank, teamId
       FROM group_standings_full ORDER BY groupName, rank`
    );
    const map = new Map();
    rows.forEach(r => {
      if (!map.has(r.groupName)) map.set(r.groupName, []);
      map.get(r.groupName).push(r);
    });
    return map;
  },

  getFixtures: async (filter) => {
    let sql = `SELECT id, date, time, homeTeam, awayTeam, homeFlag, awayFlag,
                      homeScoreFullTime, awayScoreFullTime, matchStatus,
                      stadium, city, stageName, groupName
               FROM unified_matches WHERE 1=1`;
    const params = [];
    if (filter.group) {
      sql += ' AND groupName = ?';
      params.push(filter.group);
    }
    if (filter.team) {
      sql += ' AND (homeTeam = ? OR awayTeam = ?)';
      params.push(filter.team, filter.team);
    }
    if (filter.stage) {
      sql += ' AND stageName = ?';
      params.push(filter.stage);
    }
    sql += ' ORDER BY date, time';
    return await state.db.jaferAll(sql, params);
  },

  getUpcoming: async (filter) => {
    let sql = `SELECT id, date, time, homeTeam, awayTeam, homeFlag, awayFlag,
                      homeScoreFullTime, awayScoreFullTime, matchStatus,
                      stadium, city, stageName, groupName
               FROM unified_matches
               WHERE date(date) >= date('now') AND matchStatus != 'finished'`;
    const params = [];
    if (filter.group) {
      sql += ' AND groupName = ?';
      params.push(filter.group);
    }
    if (filter.team) {
      sql += ' AND (homeTeam = ? OR awayTeam = ?)';
      params.push(filter.team, filter.team);
    }
    if (filter.stage) {
      sql += ' AND stageName = ?';
      params.push(filter.stage);
    }
    sql += ' ORDER BY date, time';
    return await state.db.jaferAll(sql, params);
  },

  getKnockout: async () => await state.db.jaferAll(
    `SELECT matchNumber, stageName, date, time,
            homeTeamName, awayTeamName, homeRule, awayRule,
            homeFlag, awayFlag, stadium, city
     FROM knockout_with_flags ORDER BY stageId, matchNumber`
  ),

  getStats: async () => {
    const s = await state.db.jaferGet(
      `SELECT total_group_matches, finished_group_matches,
              total_knockout_matches, finished_knockout_matches,
              total_goals, total_goals_events, total_cards
       FROM tournament_progress`
    ) || {};
    return {
      total_group_matches: 0,
      finished_group_matches: 0,
      total_knockout_matches: 0,
      finished_knockout_matches: 0,
      total_goals: 0,
      total_cards: 0,
      ...s
    };
  },

  getBestThirdPlaced: async () => await state.db.jaferAll(
    `SELECT groupName, teamName, points, goalDifference, goalsFor,
            (SELECT flag FROM teams WHERE id = teamId) AS teamFlag
     FROM best_third_placed ORDER BY third_rank LIMIT 4`
  ),

  getTopScorers: async () => await state.db.jaferAll(
    `SELECT teamName, playerName, goals,
            (SELECT flag FROM teams WHERE id = teamId) AS teamFlag
     FROM top_scorers LIMIT 6`
  ),

  getCardSummary: async () => await state.db.jaferAll(
    `SELECT teamName, yellowCards, redCards,
            (SELECT flag FROM teams WHERE id = teamId) AS teamFlag
     FROM card_summary
     WHERE yellowCards > 0 OR redCards > 0
     ORDER BY yellowCards DESC, redCards DESC`
  ),

  getOwnGoals: async () => await state.db.jaferAll(
    `SELECT teamName, playerName, ownGoals,
            (SELECT flag FROM teams WHERE id = teamId) AS teamFlag
     FROM own_goals ORDER BY ownGoals DESC LIMIT 10`
  ),

  getTeamHistory: async (teamName) => await state.db.jaferAll(
    `SELECT date, opponent, stage, teamScore, opponentScore, result, stadium, city
     FROM team_match_history WHERE teamName = ? ORDER BY date`,
    [teamName]
  ),

  getTeamCards: async (teamName) => await state.db.jaferGet(
    `SELECT yellowCards, redCards,
            (SELECT flag FROM teams WHERE id = teamId) AS teamFlag
     FROM card_summary WHERE teamName = ?`,
    [teamName]
  ),

  getTeamOwnGoals: async (teamName) => await state.db.jaferAll(
    `SELECT playerName, ownGoals,
            (SELECT flag FROM teams WHERE id = teamId) AS teamFlag
     FROM own_goals WHERE teamName = ? ORDER BY ownGoals DESC`,
    [teamName]
  ),

  getMatchDetail: async (matchId) => {
  // Try group stage
  let match = await state.db.jaferGet(
    `SELECT * FROM match_details_with_scores WHERE id = ?`,
    [matchId]
  );
  
  // If not found, it's knockout – use the new view
  if (!match || !match.homeTeam) {
    match = await state.db.jaferGet(
      `SELECT * FROM knockout_match_details WHERE id = ?`,
      [matchId]
    );
    if (!match) return { match: null, events: [] };
  }
  
  // Events are the same for both
  const eventsList = await state.db.jaferAll(
    `SELECT * FROM match_events_with_team WHERE matchId = ? ORDER BY eventMinute, eventMinuteExtra`,
    [matchId]
  );
  
  return { match, events: eventsList };
},

  getAllTeamNames: async () => {
    const rows = await state.db.jaferAll(
      `SELECT DISTINCT teamName FROM group_standings_full ORDER BY teamName`
    );
    return rows.map(r => r.teamName);
  },

  getHeadToHead: async (t1, t2) => await state.db.jaferAll(
    `SELECT date, stageName, homeScoreFullTime, awayScoreFullTime, winner
     FROM head_to_head
     WHERE (team1 = ? AND team2 = ?) OR (team1 = ? AND team2 = ?)
     ORDER BY date`,
    [t1, t2, t2, t1]
  ),

  getLiveMatches: async (filter) => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - (now.getUTCDay() + 6) % 7
    ));
    const sunday = new Date(Date.UTC(
      monday.getUTCFullYear(),
      monday.getUTCMonth(),
      monday.getUTCDate() + 6,
      23, 59, 59, 999
    ));
    let sql = `SELECT id, date, time, homeTeam, awayTeam, homeFlag, awayFlag,
                      homeScoreFullTime, awayScoreFullTime, matchStatus,
                      stadium, city, stageName, groupName
               FROM unified_matches
               WHERE date BETWEEN ? AND ? AND matchStatus != 'finished'`;
    const params = [monday.toISOString(), sunday.toISOString()];
    if (filter.group) {
      sql += ' AND groupName = ?';
      params.push(filter.group);
    }
    if (filter.team) {
      sql += ' AND (homeTeam = ? OR awayTeam = ?)';
      params.push(filter.team, filter.team);
    }
    if (filter.stage) {
      sql += ' AND stageName = ?';
      params.push(filter.stage);
    }
    sql += ' ORDER BY date, time';
    const all = await state.db.jaferAll(sql, params);
    const live = [], today = [], week = [];
    for (const m of all) {
      const d = m.date.slice(0, 10);
      if (d === todayStr) {
        const start = new Date(m.date);
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
        if (now >= start && now <= end) live.push(m);
        else today.push(m);
      } else week.push(m);
    }
    return { liveMatches: live, todayMatches: today, weekMatches: week };
  },

  getPlayerStats: async () => await state.db.jaferAll(`
    SELECT 
        me.playerName,
        t.id AS teamId,
        t.name AS teamName,
        t.flag AS teamFlag,
        SUM(CASE WHEN me.eventType IN ('goal','penalty_goal') THEN 1 ELSE 0 END) AS goals,
        SUM(CASE WHEN me.eventType = 'yellow_card' THEN 1 ELSE 0 END) AS yellowCards,
        SUM(CASE WHEN me.eventType = 'red_card' THEN 1 ELSE 0 END) AS redCards,
        SUM(CASE WHEN me.eventType = 'own_goal' THEN 1 ELSE 0 END) AS ownGoals
    FROM match_events me
    JOIN teams t ON me.teamId = t.id
    GROUP BY me.playerName, me.teamId
    ORDER BY goals DESC, yellowCards DESC, redCards DESC
  `),

  getGroupsList: async () => {
    const rows = await state.db.jaferAll(`SELECT name FROM groups ORDER BY name`);
    return rows.map(r => r.name);
  },
  getTeamsList: async () => {
    const rows = await state.db.jaferAll(`SELECT name FROM teams ORDER BY name`);
    return rows.map(r => r.name);
  },
  getStagesList: async () => {
    const rows = await state.db.jaferAll(`SELECT name FROM stages ORDER BY "order"`);
    return rows.map(r => r.name);
  }
};