// templates.js – all HTML generation using the `html` tag where rawHTML is used
import { html, rawHTML, escapeHtml, formatDate } from './state.js';

export const templates = {
  // Helper for status badge (returns raw HTML string)
statusBadge: (status, isLive = false) => {
  if (isLive) {
    return '<span class="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded-full ml-1">Playing</span>';
  }
  if (status === 'finished') {
    return '<span class="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full ml-1">FT</span>';
  }
  return '<span class="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded-full ml-1">Upcoming</span>';
},

  // Match card – must use html`` because it contains rawHTML(timerSpan) and rawHTML(badge)
  matchCard: (m, isLive = false) => {
  const displayDate = formatDate(m.date);
  // Only show score if match is finished and scores exist
  const score = (m.matchStatus === 'finished' && m.homeScoreFullTime !== null && m.awayScoreFullTime !== null) ?
    `${m.homeScoreFullTime}–${m.awayScoreFullTime}` :
    'vs';
  const bgClass = isLive ? 'bg-red-50' : (m.matchStatus === 'finished' ? 'bg-green-50' : 'bg-white');
  const badge = templates.statusBadge(m.matchStatus, isLive);
  let timerSpan = '';
  if (isLive) {
    timerSpan = `<span class="live-timer text-red-600 font-bold text-xs ml-1" data-start="${m.date}">0'</span>`;
  }
  return html`
    <div class="match-card-clickable ${bgClass} rounded-lg shadow-sm p-3 border border-gray-200 hover:shadow-md transition" data-match-id="${m.id}">
      <div class="flex justify-between text-xs text-gray-500 mb-1">
        <span><i class="far fa-calendar-alt mr-1"></i>${displayDate}</span>
        <span><i class="fas fa-map-marker-alt mr-1"></i>${m.city || ''}</span>
      </div>
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1 flex-1 justify-end min-w-0">
          <span class="font-semibold text-right truncate">${escapeHtml(m.homeTeam)}</span>
          <img src="${escapeHtml(m.homeFlag)}" class="w-5 h-4 flex-shrink-0 object-contain" onerror="this.style.display='none'">
        </div>
        <div class="text-lg font-bold ${m.matchStatus === 'finished' ? 'text-indigo-700' : 'text-gray-500'} px-2 flex-shrink-0">${score}</div>
        <div class="flex items-center gap-1 flex-1 min-w-0">
          <img src="${escapeHtml(m.awayFlag)}" class="w-5 h-4 flex-shrink-0 object-contain" onerror="this.style.display='none'">
          <span class="font-semibold truncate">${escapeHtml(m.awayTeam)}</span>
        </div>
      </div>
      <div class="text-xs text-gray-400 mt-1 flex justify-between">
        <span>${m.stageName || ''} ${m.groupName ? '· ' + escapeHtml(m.groupName) : ''}</span>
        <span>${rawHTML(timerSpan)}${rawHTML(badge)}</span>
      </div>
    </div>
  `;
},
  matchCards: (m, isLive = false) => {
    const displayDate = formatDate(m.date);
    const score = (m.homeScoreFullTime !== null && m.awayScoreFullTime !== null)
      ? `${m.homeScoreFullTime}–${m.awayScoreFullTime}`
      : 'vs';
    const bgClass = isLive ? 'bg-red-50' : (m.matchStatus === 'finished' ? 'bg-green-50' : 'bg-white');
    const badge = templates.statusBadge(m.matchStatus, isLive);
    let timerSpan = '';
    if (isLive) {
      timerSpan = `<span class="live-timer text-red-600 font-bold text-xs ml-1" data-start="${m.date}">0'</span>`;
    }
    // html tag here
    return html`
      <div class="match-card-clickable ${bgClass} rounded-lg shadow-sm p-3 border border-gray-200 hover:shadow-md transition" data-match-id="${m.id}">
        <div class="flex justify-between text-xs text-gray-500 mb-1">
          <span><i class="far fa-calendar-alt mr-1"></i>${displayDate}</span>
          <span><i class="fas fa-map-marker-alt mr-1"></i>${m.city || ''}</span>
        </div>
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1 flex-1 justify-end min-w-0">
            <span class="font-semibold text-right truncate">${escapeHtml(m.homeTeam)}</span>
            <img src="${escapeHtml(m.homeFlag)}" class="w-5 h-4 flex-shrink-0 object-contain" onerror="this.style.display='none'">
          </div>
          <div class="text-lg font-bold ${m.matchStatus === 'finished' ? 'text-indigo-700' : 'text-gray-500'} px-2 flex-shrink-0">${score}</div>
          <div class="flex items-center gap-1 flex-1 min-w-0">
            <img src="${escapeHtml(m.awayFlag)}" class="w-5 h-4 flex-shrink-0 object-contain" onerror="this.style.display='none'">
            <span class="font-semibold truncate">${escapeHtml(m.awayTeam)}</span>
          </div>
        </div>
        <div class="text-xs text-gray-400 mt-1 flex justify-between">
          <span>${m.stageName || ''} ${m.groupName ? '· ' + escapeHtml(m.groupName) : ''}</span>
          <span>${rawHTML(timerSpan)}${rawHTML(badge)}</span>
        </div>
      </div>
    `;
  },

  // Groups table – no rawHTML, so safe to return plain string
  groups: (map) => {
    let out = '<div class="space-y-4 h-full overflow-y-auto">';
    for (const [gName, teams] of map) {
      out += `<div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="bg-indigo-700 text-white px-3 py-2 text-base font-bold">${escapeHtml(gName)}</div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-xs">
            <thead class="bg-gray-100">
              <tr>
                <th class="p-2 text-left">#</th>
                <th class="p-2 pl-0 text-left">Team</th>
                <th class="p-2 text-center">P</th>
                <th class="p-2 text-center">W</th>
                <th class="p-2 text-center">D</th>
                <th class="p-2 text-center">L</th>
                <th class="p-2 text-center">GF</th>
                <th class="p-2 text-center">GA</th>
                <th class="p-2 text-center">GD</th>
                <th class="p-2 text-center">Pts</th>
              </tr>
            </thead>
            <tbody>`;
      teams.forEach(team => {
        const rowClass = team.rank <= 2 ? 'bg-green-50' : (team.rank === 3 ? 'bg-yellow-50' : '');
        const gdClass = team.goalDifference >= 0 ? 'text-green-600' : 'text-red-600';
        out += `<tr class="border-b border-gray-100 ${rowClass}">
          <td class="p-2 font-bold text-center">${team.rank}</td>
          <td class="p-2 pl-0">
            <div class="flex items-center gap-2">
              <img src="${escapeHtml(team.teamFlag)}" class="team-logo w-5 h-4 object-contain" onerror="this.src='https://placehold.co/20x15?text=?'">
              <span class="font-medium team-name-clickable truncate w-[70px] max-w-[72px]" data-team-name="${escapeHtml(team.teamName)}" data-team-id="${team.teamId}">${escapeHtml(team.teamName)}</span>
            </div>
          </td>
          <td class="p-2 text-center">${team.played}</td>
          <td class="p-2 text-center">${team.wins}</td>
          <td class="p-2 text-center">${team.draws}</td>
          <td class="p-2 text-center">${team.losses}</td>
          <td class="p-2 text-center">${team.goalsFor}</td>
          <td class="p-2 text-center">${team.goalsAgainst}</td>
          <td class="p-2 text-center ${gdClass}">${team.goalDifference}</td>
          <td class="p-2 text-center font-bold">${team.points}</td>
        </tr>`;
      });
      out += `</tbody></table></div></div>`;
    }
    out += '</div>';
    return out;
  },

  // Fixtures – just uses matchCard (which already uses html)
  fixtures: (matches) => {
    let htmlStr = '<div class="space-y-3 h-full overflow-y-auto">';
    matches.forEach(m => htmlStr += templates.matchCard(m));
    htmlStr += '</div>';
    return htmlStr;
  },

  upcoming: (matches) => {
    let htmlStr = '<div class="space-y-3 h-full overflow-y-auto">';
    matches.forEach(m => htmlStr += templates.matchCard(m));
    htmlStr += '</div>';
    return htmlStr;
  },

  // Knockout – no rawHTML, safe
  knockout: (knockouts) => {
    const rounds = new Map();
    knockouts.forEach(m => { if (!rounds.has(m.stageName)) rounds.set(m.stageName, []); rounds.get(m.stageName).push(m); });
    let htmlStr = '<div class="flex gap-6 overflow-x-auto pb-2">';
    for (const [roundName, matches] of rounds) {
      htmlStr += `<div class="flex-shrink-0 w-48">
        <h3 class="text-sm font-bold border-l-4 border-indigo-500 pl-2 mb-2">${escapeHtml(roundName)}</h3>
        <div class="space-y-2">`;
      matches.forEach(m => {
        const home = m.homeTeamName || m.homeRule || 'TBD';
        const away = m.awayTeamName || m.awayRule || 'TBD';
        htmlStr += `<div class="bg-white rounded-lg shadow-sm p-2 border border-gray-200 text-xs">
          <div class="flex justify-between items-center text-gray-500 mb-1">
            <span><i class="far fa-calendar-alt mr-1"></i>${formatDate(m.date)}</span>
          </div>
          <div class="flex items-center justify-between gap-1">
            <div class="flex items-center gap-1 flex-1 justify-end min-w-0">
              <span class="font-semibold text-right truncate">${escapeHtml(home)}</span>
              <img src="${escapeHtml(m.homeFlag)}" class="w-4 h-3 flex-shrink-0 object-contain" onerror="this.src='https://placehold.co/20x15?text=?'">
            </div>
            <div class="font-bold text-gray-500 mx-1 flex-shrink-0">vs</div>
            <div class="flex items-center gap-1 flex-1 min-w-0">
              <img src="${escapeHtml(m.awayFlag)}" class="w-4 h-3 flex-shrink-0 object-contain" onerror="this.src='https://placehold.co/20x15?text=?'">
              <span class="font-semibold truncate">${escapeHtml(away)}</span>
            </div>
          </div>
        </div>`;
      });
      htmlStr += `</div></div>`;
    }
    htmlStr += '</div>';
    return htmlStr;
  },

  // stats – no rawHTML
  stats: (stats, bestThird, topScorers) => {
    let htmlStr = `<div class="space-y-4 h-full overflow-y-auto">
      <div class="bg-gray-900 border border-white/10 rounded-xl p-4">
        <h3 class="font-bold text-indigo-400 mb-3">Progress</h3>
        <div class="space-y-3 text-sm text-white/80">
          <div><div class="flex justify-between mb-1"><span>Group matches</span><span>${stats.finished_group_matches}/${stats.total_group_matches}</span></div><div class="w-full bg-white/10 rounded-full h-2"><div class="bg-indigo-500 h-2 rounded-full" style="width:${(stats.finished_group_matches/stats.total_group_matches*100).toFixed(1)}%"></div></div></div>
          <div><div class="flex justify-between mb-1"><span>Knockout matches</span><span>${stats.finished_knockout_matches}/${stats.total_knockout_matches}</span></div><div class="w-full bg-white/10 rounded-full h-2"><div class="bg-indigo-500 h-2 rounded-full" style="width:${(stats.finished_knockout_matches/stats.total_knockout_matches*100).toFixed(1)}%"></div></div></div>
          <div class="flex justify-between pt-1 border-t border-white/5"><span>Total goals</span><span class="font-bold">${stats.total_goals}</span></div>
          <div class="flex justify-between"><span>Total cards</span><span class="font-bold">${stats.total_cards}</span></div>
        </div>
      </div>
      <div class="bg-gray-900 border border-white/10 rounded-xl p-4">
        <h3 class="font-bold text-indigo-400 mb-3">Best 3rd‑placed</h3>
        <div class="grid grid-cols-2 gap-2 text-sm">`;
    bestThird.forEach(t => {
      htmlStr += `<div class="bg-white/5 border border-white/5 p-2.5 rounded-lg">
        <div class="flex items-center gap-2 font-medium text-white/90"><img src="${escapeHtml(t.teamFlag)}" class="w-4 h-3 object-contain" onerror="this.style.display='none'"><span>${escapeHtml(t.teamName)}</span></div>
        <div class="text-xs text-gray-400 mt-1">${t.groupName} · ${t.points} pts, GD ${t.goalDifference}</div>
      </div>`;
    });
    htmlStr += `</div></div>
      <div class="bg-gray-900 border border-white/10 rounded-xl p-4">
        <h3 class="font-bold text-indigo-400 mb-3">Top Scorers</h3>
        <div class="overflow-x-auto"><table class="w-full text-sm"><tbody class="divide-y divide-white/5">`;
    topScorers.forEach(s => {
      htmlStr += `<tr class="hover:bg-white/5"><td class="py-2 pr-2 whitespace-nowrap"><span class="flex items-center gap-2 text-white/80"><img src="${escapeHtml(s.teamFlag)}" class="w-4 h-3 object-contain" onerror="this.style.display='none'"><span>${escapeHtml(s.playerName)}</span></span></td><td class="py-2 text-right pr-3 font-mono font-bold text-white">${s.goals}</td><td class="py-2 text-right text-xs text-gray-400">${escapeHtml(s.teamName)}</td></tr>`;
    });
    htmlStr += `</tbody></table></div></div></div>`;
    return htmlStr;
  },

  // discipline – no rawHTML
  discipline: (cards, ownGoals) => {
  let htmlStr = `
    <div class="space-y-5 h-full overflow-y-auto">
      <!-- Card Summary -->
      <div class="bg-gray-900 border border-white/20 rounded-xl overflow-hidden shadow-lg">
        <div class="px-5 py-4 border-b border-white/20 flex items-center gap-3 bg-gray-800/50">
          <span class="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
            <i class="fas fa-square text-sm"></i>
          </span>
          <h3 class="font-bold text-white">Card Summary</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="bg-gray-800 text-gray-300 text-xs uppercase tracking-wider border-b border-white/20">
                <th class="text-left py-3 px-4 font-semibold">Team</th>
                <th class="text-center py-3 px-4 font-semibold">
                  <i class="fas fa-square text-yellow-400 mr-1"></i> Yellow
                </th>
                <th class="text-center py-3 px-4 font-semibold">
                  <i class="fas fa-square text-red-500 mr-1"></i> Red
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10">`;
  
  cards.forEach(c => {
    htmlStr += `
      <tr class="hover:bg-white/5 transition-colors duration-150">
        <td class="py-3 px-4 font-medium text-white">
          <div class="flex items-center gap-2">
            <img src="${escapeHtml(c.teamFlag)}" class="w-5 h-4 object-contain" onerror="this.style.display='none'">
            <span>${escapeHtml(c.teamName)}</span>
          </div>
        </td>
        <td class="py-3 px-4 text-center">
          <span class="inline-flex items-center gap-1.5 font-bold text-yellow-400">
            <span class="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
            ${c.yellowCards}
          </span>
        </td>
        <td class="py-3 px-4 text-center">
          <span class="inline-flex items-center gap-1.5 font-bold text-red-500">
            <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            ${c.redCards}
          </span>
        </td>
      </tr>`;
  });
  
  htmlStr += `
          </tbody>
        </table>
      </div>
    </div>`;
  
  // Own Goals section (unchanged, but also improved borders)
  htmlStr += `
    <div class="bg-gray-900 border border-white/20 rounded-xl overflow-hidden shadow-lg">
      <div class="px-5 py-4 border-b border-white/20 flex items-center gap-3 bg-gray-800/50">
        <span class="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center">
          <i class="fas fa-futbol text-sm"></i>
        </span>
        <h3 class="font-bold text-white">Own Goals</h3>
      </div>
      <div class="px-5 py-3">`;
  
  if (ownGoals.length) {
    htmlStr += `<ul class="divide-y divide-white/10">`;
    ownGoals.forEach(og => {
      htmlStr += `
        <li class="flex items-center justify-between py-3 text-sm">
          <div class="flex items-center gap-3">
            <span class="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold">OG</span>
            <div class="flex items-center gap-2">
              <img src="${escapeHtml(og.teamFlag)}" class="w-5 h-4 object-contain" onerror="this.style.display='none'">
              <span class="font-medium text-white/90">${escapeHtml(og.playerName)}</span>
            </div>
          </div>
          <span class="text-xs text-gray-400 bg-white/10 px-3 py-1 rounded-full">
            ${escapeHtml(og.teamName)} · ${og.ownGoals} own goal${og.ownGoals !== 1 ? 's' : ''}
          </span>
        </li>`;
    });
    htmlStr += `</ul>`;
  } else {
    htmlStr += `<div class="text-gray-400 text-sm py-4 text-center">No own goals recorded.</div>`;
  }
  
  htmlStr += `
      </div>
    </div>
  </div>`;
  
  return htmlStr;
},

  // playerStats – no rawHTML
  playerStats: (players) => {
    let htmlStr = `<div class="space-y-4 h-full overflow-y-auto"><div class="bg-gray-900 border border-white/10 rounded-xl overflow-hidden"><div class="px-5 py-4 border-b border-white/10 flex items-center gap-3"><span class="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center"><i class="fas fa-user text-sm"></i></span><h3 class="font-semibold text-white/90">Player Statistics</h3></div><div class="overflow-x-auto"><table class="min-w-full text-sm"><thead><tr class="bg-white/5 text-gray-400 text-xs border-b border-white/10"><th class="text-left py-2 px-2">Player</th><th class="text-left py-2 px-2">Team</th><th class="text-center py-2 px-2">⚽ Goals</th><th class="text-center py-2 px-2">🟨 Yellow</th><th class="text-center py-2 px-2">🟥 Red</th><th class="text-center py-2 px-2">🥅 Own G.</th></tr></thead><tbody class="divide-y divide-white/5">`;
    players.forEach(p => {
      htmlStr += `<tr class="hover:bg-white/5"><td class="py-1 px-2 font-medium text-white/90">${escapeHtml(p.playerName)}</td><td class="py-1 px-2"><span class="flex items-center gap-2 text-white/70"><img src="${escapeHtml(p.teamFlag)}" class="w-4 h-3 object-contain" onerror="this.style.display='none'">${escapeHtml(p.teamName)}</span></td><td class="py-1 px-2 text-center font-mono text-white/90">${p.goals}</td><td class="py-1 px-2 text-center font-mono text-yellow-400">${p.yellowCards}</td><td class="py-1 px-2 text-center font-mono text-red-400">${p.redCards}</td><td class="py-1 px-2 text-center font-mono text-red-300">${p.ownGoals}</td></tr>`;
    });
    htmlStr += `</tbody></table></div></div></div>`;
    return htmlStr;
  },

  // liveTab – uses matchCard (already fixed)
  liveTab: (sections) => {
    let htmlStr = '<div class="space-y-6 h-full overflow-y-auto">';
    if (sections.liveMatches.length) {
      htmlStr += `<div><h3 class="text-md font-bold border-l-4 border-red-500 pl-2 mb-2 flex items-center gap-1"><span class="relative flex h-3 w-3"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span> Live Now</h3><div class="space-y-2">`;
      sections.liveMatches.forEach(m => htmlStr += templates.matchCard(m, true));
      htmlStr += '</div></div>';
    }
    if (sections.todayMatches.length) {
      htmlStr += `<div><h3 class="text-md font-bold border-l-4 border-blue-500 pl-2 mb-2">Today</h3><div class="space-y-2">`;
      sections.todayMatches.forEach(m => htmlStr += templates.matchCard(m));
      htmlStr += '</div></div>';
    }
    if (sections.weekMatches.length) {
      htmlStr += `<div><h3 class="text-md font-bold border-l-4 border-indigo-500 pl-2 mb-2">This Week</h3><div class="space-y-2">`;
      sections.weekMatches.forEach(m => htmlStr += templates.matchCard(m));
      htmlStr += '</div></div>';
    }
    if (!sections.weekMatches.length && !sections.todayMatches.length && !sections.liveMatches.length) {
      htmlStr += '<div class="bg-white p-5 rounded text-center text-gray-500">No scheduled matches found for this period.</div>';
    }
    htmlStr += '</div>';
    return htmlStr;
  },

  // teamModal – no rawHTML
  teamModal: (teamName, history, cards, ownGoals) => {
    let htmlStr = `<div class="space-y-4">`;
    if (history.length) {
      htmlStr += `<h4 class="font-bold text-indigo-400">Match History</h4><div class="overflow-x-auto rounded-lg border border-white/10"><table class="min-w-full text-xs"><thead class="bg-white/5 text-gray-300"><tr><th class="p-2">Date</th><th>Opponent</th><th>Stage</th><th>Score</th><th>Result</th><th>Venue</th></tr></thead><tbody>`;
      history.forEach(m => {
        const score = (m.teamScore !== null && m.opponentScore !== null) ? `${m.teamScore}–${m.opponentScore}` : '?';
        const resultClass = { W: 'text-green-400', L: 'text-red-400', D: 'text-yellow-400' }[m.result] || 'text-gray-400';
        htmlStr += `<tr class="border-b border-white/10"><td class="p-2 text-gray-300">${formatDate(m.date)}</td><td class="p-2 text-white/80">${escapeHtml(m.opponent)}</td><td class="p-2 text-white/80">${escapeHtml(m.stage)}</td><td class="p-2 font-mono text-white/90">${score}</td><td class="p-2 ${resultClass}">${m.result || '-'}</td><td class="p-2 text-white/60 text-xs">${escapeHtml(m.stadium)} ${m.city ? ', '+escapeHtml(m.city) : ''}</td></tr>`;
      });
      htmlStr += `</tbody></table></div>`;
    } else htmlStr += `<div class="text-white/50">No matches played yet.</div>`;
    if (cards && (cards.yellowCards > 0 || cards.redCards > 0)) {
      htmlStr += `<div class="mt-3"><h4 class="font-bold text-indigo-400">Discipline</h4><div class="flex gap-4 text-sm text-white/80 mt-1"><span><i class="fas fa-square text-yellow-500"></i> Yellow: ${cards.yellowCards}</span><span><i class="fas fa-square text-red-500"></i> Red: ${cards.redCards}</span></div></div>`;
    }
    if (ownGoals.length) {
      htmlStr += `<div class="mt-3"><h4 class="font-bold text-indigo-400">Own Goals</h4><ul class="space-y-1.5 text-sm text-white/80 mt-1">`;
      ownGoals.forEach(og => {
        htmlStr += `<li class="flex items-center gap-2"><img src="${escapeHtml(og.teamFlag)}" class="w-4 h-3 object-contain" onerror="this.style.display='none'"><span>${escapeHtml(og.playerName)} – ${og.ownGoals} own goal${og.ownGoals !== 1 ? 's' : ''}</span></li>`;
      });
      htmlStr += `</ul></div>`;
    }
    htmlStr += `</div>`;
    return htmlStr;
  },

  // matchModal – no rawHTML (all HTML is built as strings, no raw markers needed)
  matchModal: (match, eventsList, matchId) => {
  const isKnockout = match.stageId >= 2;
  const scoreText = (match.homeScoreFullTime !== null && match.awayScoreFullTime !== null) ? `${match.homeScoreFullTime}–${match.awayScoreFullTime}` : 'vs';
  let htmlStr = `<div class="space-y-4 h-full overflow-hidden flex flex-col"><div class="bg-white/5 p-3 rounded-lg text-center border border-white/10"><div class="font-bold text-lg flex items-center justify-center gap-2 flex-wrap text-white/90"><img src="${escapeHtml(match.homeFlag)}" class="w-6 h-5 object-contain" onerror="this.style.display='none'"> ${escapeHtml(match.homeTeam)} <span class="mx-1">${scoreText}</span> ${escapeHtml(match.awayTeam)} <img src="${escapeHtml(match.awayFlag)}" class="w-6 h-5 object-contain" onerror="this.style.display='none'"></div><div class="text-sm text-white/60 mt-1 hidden">${formatDate(match.date)} · ${escapeHtml(match.stadium)} ${match.city ? ', '+escapeHtml(match.city) : ''}</div><div class="text-xs text-white/40 hidden">${match.stageName} ${match.groupName ? '· '+match.groupName : ''}</div></div>
    <div class="border-t border-white/10 pt-3"><h4 class="font-bold text-indigo-400 mb-2">Edit Score</h4><div class="grid grid-cols-2 gap-3"><div><label class="block text-xs font-medium text-white/60">Home FT</label><input type="number" id="editHomeScore" value="${match.homeScoreFullTime ?? 0}" class="w-full bg-gray-800 border border-white/10 rounded p-1 text-center text-white/90"></div><div><label class="block text-xs font-medium text-white/60">Away FT</label><input type="number" id="editAwayScore" value="${match.awayScoreFullTime ?? 0}" class="w-full bg-gray-800 border border-white/10 rounded p-1 text-center text-white/90"></div></div>`;
  if (isKnockout) {
    htmlStr += `<div class="grid grid-cols-2 gap-3 mt-2"><div><label class="block text-xs font-medium text-white/60">Home Pen</label><input type="number" id="editHomePen" value="${match.homeScorePenalties ?? ''}" class="w-full bg-gray-800 border border-white/10 rounded p-1 text-center text-white/90" placeholder="—"></div><div><label class="block text-xs font-medium text-white/60">Away Pen</label><input type="number" id="editAwayPen" value="${match.awayScorePenalties ?? ''}" class="w-full bg-gray-800 border border-white/10 rounded p-1 text-center text-white/90" placeholder="—"></div></div>`;
  }
  htmlStr += `<div class="w-full overflow-hidden flex flex-nowrap items-center"><div class="flex-1 min-w-0 mt-2 overflow-hidden flex flex-col"><label class="block text-xs font-medium text-white/60">Status</label><select id="editStatus" class="w-full bg-gray-800 border border-white/10 rounded p-1 text-white/90"><option value="scheduled" ${match.matchStatus === 'scheduled' ? 'selected' : ''}>Scheduled</option><option value="finished" ${match.matchStatus === 'finished' ? 'selected' : ''}>Finished</option></select></div>
    <button id="saveChangesBtn" data-match-id="${matchId}" class="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm">Save All Changes</button></div></div>
    <div class="border-t border-white/10 pt-3 mt-2 flex-1 min-h-0 flex flex-col overflow-hidden"><h4 class="font-bold text-indigo-400 mb-2">Match Events</h4>
    <div id="eventsContainer" class="flex-1 overflow-hidden">`;
  
  // Render events inside eventsContainer
  if (eventsList.length) {
    const homeEvents = eventsList.filter(e => e.team === match.homeTeam);
    const awayEvents = eventsList.filter(e => e.team === match.awayTeam);
    const iconMap = { goal: '<i class="fas fa-futbol text-green-400"></i>', penalty_goal: '<i class="fas fa-futbol text-green-100"></i>', yellow_card: '<i class="fas fa-square text-yellow-400"></i>', red_card: '<i class="fas fa-square text-red-400"></i>', own_goal: '<i class="fas fa-futbol text-red-400"></i>' };
    htmlStr += `<div class="h-full border border-white/10 rounded bg-white/5 p-2"><div class="h-full grid grid-cols-2 gap-0"><div class="pr-3 border-r border-white/10"><div class="text-xs font-semibold text-indigo-400 mb-2 text-center">${escapeHtml(match.homeTeam)} (Home)</div>`;
    homeEvents.forEach(e => {
      let minute = e.eventMinute;
      if (e.eventMinuteExtra > 0) minute += `+${e.eventMinuteExtra}`;
      htmlStr += `<div class="flex items-center justify-end gap-1 py-0.5 text-xs group overflow-y-auto"><span class="font-mono text-white/50">${minute}'</span> <span>${iconMap[e.eventType] || e.eventType}</span> <span class="truncate text-white/80">${escapeHtml(e.playerName)}</span> <button class="delete-event-btn text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity text-xs" data-event-id="${e.id}"><i class="fas fa-trash-alt"></i></button></div>`;
    });
    htmlStr += `</div><div class="pl-3"><div class="text-xs font-semibold text-indigo-400 mb-2 text-center">${escapeHtml(match.awayTeam)} (Away)</div>`;
    awayEvents.forEach(e => {
      let minute = e.eventMinute;
      if (e.eventMinuteExtra > 0) minute += `+${e.eventMinuteExtra}`;
      htmlStr += `<div class="flex items-center gap-1 py-0.5 text-xs group"><button class="delete-event-btn text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity text-xs" data-event-id="${e.id}"><i class="fas fa-trash-alt"></i></button> <span class="truncate text-white/80">${escapeHtml(e.playerName)}</span> <span>${iconMap[e.eventType] || e.eventType}</span> <span class="font-mono text-white/50">${minute}'</span></div>`;
    });
    htmlStr += `</div></div></div>`;
  } else htmlStr += `<div class="text-white/50 text-sm py-2">No events recorded yet.</div>`;
  
  htmlStr += `</div>`;
  
  htmlStr += `<div class="bg-white/5 border border-white/10 p-3 rounded mt-3"><h5 class="font-semibold text-sm mb-2 text-white/80">Add Event</h5><div class="grid grid-cols-2 gap-2"><select id="eventTeam" class="bg-gray-800 border border-white/10 rounded p-1 text-sm text-white/90"><option value="${escapeHtml(match.homeTeam)}">${escapeHtml(match.homeTeam)}</option><option value="${escapeHtml(match.awayTeam)}">${escapeHtml(match.awayTeam)}</option></select><input type="text" id="eventPlayer" placeholder="Player name" class="bg-gray-800 border border-white/10 rounded p-1 text-sm text-white/90 placeholder-white/40"><select id="eventType" class="bg-gray-800 border border-white/10 rounded p-1 text-sm text-white/90"><option value="goal">⚽ Goal</option><option value="penalty_goal">⚽ Penalty Goal</option><option value="own_goal">⚽ Own Goal</option><option value="yellow_card">🟨 Yellow Card</option><option value="red_card">🟥 Red Card</option></select><div class="flex gap-1"><input type="number" id="eventMinute" placeholder="Minute" class="bg-gray-800 border border-white/10 rounded p-1 text-sm w-20 text-white/90 placeholder-white/40"><input type="number" id="eventExtra" placeholder="+" value="0" class="bg-gray-800 border border-white/10 rounded p-1 text-sm w-16 text-white/90 placeholder-white/40"></div></div><button id="addEventLocalBtn" class="mt-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm w-full">Add Event (temporary)</button></div></div>`;
  return htmlStr;
},

  headToHeadResult: (team1, team2, rows) => {
    let htmlStr = `<h4 class="font-bold text-indigo-400 mb-2">${escapeHtml(team1)} vs ${escapeHtml(team2)}</h4>`;
    if (rows.length) {
      htmlStr += `<div class="overflow-x-auto rounded-lg border border-white/10"><table class="min-w-full text-sm"><thead class="bg-white/5 text-gray-300"><tr><th class="p-2">Date</th><th>Stage</th><th>Score</th><th>Winner</th></tr></thead><tbody>`;
      rows.forEach(r => {
        htmlStr += `<tr class="border-b border-white/10"><td class="p-2 text-gray-300">${formatDate(r.date)}</td><td class="p-2 text-white/80">${escapeHtml(r.stageName)}</td><td class="p-2 font-mono text-white/90">${r.homeScoreFullTime}–${r.awayScoreFullTime}</td><td class="p-2 font-medium ${r.winner === 'Draw' ? 'text-gray-400' : 'text-indigo-400'}">${r.winner}</td></tr>`;
      });
      htmlStr += `</tbody></table></div>`;
    } else htmlStr += `<div class="text-white/50 mt-2">No previous encounters.</div>`;
    return htmlStr;
  },

  exportModal: () => `
    <div class="space-y-6"><div class="text-center"><button id="downloadDbBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-lg w-full sm:w-auto"><i class="fas fa-database mr-2"></i>Download Full Database</button><p class="text-xs text-white/50 mt-1">FIFA-WC2026.db</p></div>
    <div><h4 class="font-bold text-indigo-400 mb-2">match_scores</h4><div class="relative"><pre class="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto max-h-60 border border-white/10"><code id="matchScoresJson"></code></pre><div class="absolute top-2 right-2 flex gap-1"><button id="copyMatchScoresBtn" class="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"><i class="far fa-copy"></i> Copy</button><button id="downloadMatchScoresBtn" class="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"><i class="fas fa-download"></i> JSON</button></div></div></div>
    <div><h4 class="font-bold text-indigo-400 mb-2">match_events</h4><div class="relative"><pre class="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto max-h-60 border border-white/10"><code id="matchEventsJson"></code></pre><div class="absolute top-2 right-2 flex gap-1"><button id="copyMatchEventsBtn" class="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"><i class="far fa-copy"></i> Copy</button><button id="downloadMatchEventsBtn" class="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"><i class="fas fa-download"></i> JSON</button></div></div></div></div>
  `,

  importModal: () => `
    <div class="space-y-5"><div><h4 class="font-bold text-indigo-400 mb-2">match_scores.json</h4><input type="file" id="importMatchScoresFile" accept=".json" class="block w-full text-sm text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"><div id="matchScoresPreview" class="mt-2 max-h-24 overflow-auto bg-gray-800 p-2 rounded text-xs text-white/50 italic border border-white/10">No file chosen</div></div>
    <div><h4 class="font-bold text-indigo-400 mb-2">match_events.json</h4><input type="file" id="importMatchEventsFile" accept=".json" class="block w-full text-sm text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"><div id="matchEventsPreview" class="mt-2 max-h-24 overflow-auto bg-gray-800 p-2 rounded text-xs text-white/50 italic border border-white/10">No file chosen</div></div>
    <div class="text-center pt-2"><button id="applyImportBtn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg w-full sm:w-auto"><i class="fas fa-check-circle mr-2"></i>Apply Import</button><p class="text-xs text-white/50 mt-1">Scores merged; events replaced per match.</p></div></div>
  `
};
