// events.js – all event handlers, live timer, modals, import/export
import { state, saveDatabase, showStatus, escapeHtml, showConfirmDialog } from './state.js';
import { data } from './data.js';
import { templates } from './templates.js';
import { render } from './render.js';

export const events = {
  liveTimerInterval: null,
  autoRefreshInterval: null,

  // ---------- Live Timer ----------
  startLiveTimer() {
    if (this.liveTimerInterval) clearInterval(this.liveTimerInterval);
    this.liveTimerInterval = setInterval(() => {
      const timers = document.querySelectorAll('.live-timer');
      if (!timers.length) return;
      const now = Date.now();
      timers.forEach(el => {
        const startStr = el.getAttribute('data-start');
        if (!startStr) return;
        const start = new Date(startStr).getTime();
        let elapsed = (now - start) / 60000;
        let displayMin;
        if (elapsed <= 45) displayMin = Math.floor(elapsed);
        else if (elapsed <= 60) displayMin = 45;
        else {
          const secondHalf = elapsed - 15;
          if (secondHalf <= 90) displayMin = Math.floor(secondHalf);
          else displayMin = 90 + Math.floor(secondHalf - 90);
        }
        if (displayMin > 120) el.textContent = 'FT';
        else if (displayMin > 90) el.textContent = `90+${displayMin-90}'`;
        else el.textContent = `${displayMin}'`;
      });
    }, 1000);
  },

  stopLiveTimer() {
    if (this.liveTimerInterval) {
      clearInterval(this.liveTimerInterval);
      this.liveTimerInterval = null;
    }
  },

  startAutoRefresh() {
    this.stopAutoRefresh();
    this.autoRefreshInterval = setInterval(() => {
      if (state.currentTab === 'live') render.renderLive();
    }, 60000);
  },

  stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  },

  // ---------- Save Match Score ----------
  saveMatchScore: async (matchId, homeScore, awayScore, homePen, awayPen, status, btn) => {
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    try {
      await state.db.jaferRun(
        `INSERT INTO match_scores 
          (matchId, homeScoreFullTime, awayScoreFullTime, homeScorePenalties, awayScorePenalties, status, lastUpdated)
         VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP)
         ON CONFLICT(matchId) DO UPDATE SET
           homeScoreFullTime = excluded.homeScoreFullTime,
           awayScoreFullTime = excluded.awayScoreFullTime,
           homeScorePenalties = excluded.homeScorePenalties,
           awayScorePenalties = excluded.awayScorePenalties,
           status = excluded.status,
           lastUpdated = CURRENT_TIMESTAMP`,
        [matchId, homeScore, awayScore, homePen || null, awayPen || null, status]
      );
      showStatus('Score saved.');
      if (state.currentTab === 'fixtures') render.renderFixtures();
      else if (state.currentTab === 'upcoming') render.renderUpcoming();
      else if (state.currentTab === 'groups') render.renderGroups();
      state.DOM.matchModal.classList.add('hidden');
      setTimeout(() => this.showMatchModal(matchId), 100);
    } catch (err) {
      showStatus('Error saving score: ' + err.message, true);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  },

  // ---------- Add Match Event ----------
  addMatchEvent: async (matchId, teamName, playerName, eventType, minute, extra, btn) => {
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    try {
      const team = await state.db.jaferGet(`SELECT id FROM teams WHERE name = ?`, [teamName]);
      if (!team) throw new Error(`Team "${teamName}" not found`);
      await state.db.jaferRun(
        `INSERT INTO match_events (matchId, teamId, playerName, eventType, eventMinute, eventMinuteExtra)
         VALUES (?,?,?,?,?,?)`,
        [matchId, team.id, playerName, eventType, minute, extra]
      );
      showStatus(`Event added: ${playerName} ${eventType.replace('_', ' ')}`);
      state.DOM.matchModal.classList.add('hidden');
      setTimeout(() => this.showMatchModal(matchId), 100);
    } catch (err) {
      showStatus('Error adding event: ' + err.message, true);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  },

  // ---------- Delete Event ----------
  deleteEvent: async (eventId) => {
    if (!await confirm('Delete this event?')) return;
    try {
      await state.db.jaferRun('DELETE FROM match_events WHERE id = ?', [eventId]);
      showStatus('Event deleted');
      const modal = state.DOM.matchModal;
      const matchId = modal.getAttribute('data-match-id');
      if (matchId) {
        modal.classList.add('hidden');
        setTimeout(() => this.showMatchModal(matchId), 100);
      }
    } catch (err) {
      showStatus('Error deleting event: ' + err.message, true);
    }
  },

  // ---------- Team Modal ----------
  showTeamModal: async (teamName) => {
    state.DOM.teamModalTitle.innerText = teamName;
    state.DOM.teamModalBody.innerHTML = '<div class="flex justify-center"><div class="loading-spinner"></div></div>';
    state.DOM.teamModal.classList.remove('hidden');
    try {
      const [history, cards, ownGoals] = await Promise.all([
        data.getTeamHistory(teamName),
        data.getTeamCards(teamName),
        data.getTeamOwnGoals(teamName)
      ]);
      state.DOM.teamModalBody.innerHTML = templates.teamModal(teamName, history, cards, ownGoals);
    } catch (err) {
      state.DOM.teamModalBody.innerHTML = `<div class="text-red-400">Error: ${err.message}</div>`;
    }
  },

  // ---------- Match Modal ----------
  showMatchModal: async (matchId) => {
  state.DOM.matchModalTitle.innerText = 'Match Details';
  state.DOM.matchModalBody.innerHTML = '<div class="flex justify-center"><div class="loading-spinner"></div></div>';
  state.DOM.matchModal.classList.remove('hidden');
  state.DOM.matchModal.setAttribute('data-match-id', matchId);

  try {
    const { match, events: initialEvents } = await data.getMatchDetail(matchId);
    // Local mutable copy of events
    let localEvents = initialEvents.map(e => ({ ...e }));

    // Render modal with localEvents
    state.DOM.matchModalBody.innerHTML = templates.matchModal(match, localEvents, matchId);
    const eventsContainer = document.getElementById('eventsContainer');
    const addBtn = document.getElementById('addEventLocalBtn');
    const saveBtn = document.getElementById('saveChangesBtn');

    // Helper to re-render only the events list inside eventsContainer
    const renderEventsList = (events) => {
      const homeTeam = match.homeTeam;
      const awayTeam = match.awayTeam;
      const iconMap = { goal: '<i class="fas fa-futbol text-green-400"></i>', penalty_goal: '<i class="fas fa-futbol text-green-100"></i>', yellow_card: '<i class="fas fa-square text-yellow-400"></i>', red_card: '<i class="fas fa-square text-red-400"></i>', own_goal: '<i class="fas fa-futbol text-red-400"></i>' };

      let html = '';
      if (events.length) {
        const homeEvents = events.filter(e => e.team === homeTeam);
        const awayEvents = events.filter(e => e.team === awayTeam);
        html += `<div class="h-full border border-white/10 rounded bg-white/5 p-2"><div class="h-full grid grid-cols-2 gap-0"><div class="pr-3 border-r border-white/10"><div class="text-xs font-semibold text-indigo-400 mb-2 text-center">${escapeHtml(homeTeam)} (Home)</div>`;
        homeEvents.forEach((e, idx) => {
          let minute = e.eventMinute;
          if (e.eventMinuteExtra > 0) minute += `+${e.eventMinuteExtra}`;
          const deleteId = e.id || `temp-${idx}`;
          html += `<div class="flex items-center justify-end gap-1 py-0.5 text-xs group"><span class="font-mono text-white/50">${minute}'</span> <span>${iconMap[e.eventType] || e.eventType}</span> <span class="truncate text-white/80">${escapeHtml(e.playerName)}</span> <button class="delete-event-btn text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity text-xs" data-event-id="${deleteId}" data-index="${idx}"><i class="fas fa-trash-alt"></i></button></div>`;
        });
        html += `</div><div class="pl-3"><div class="text-xs font-semibold text-indigo-400 mb-2 text-center">${escapeHtml(awayTeam)} (Away)</div>`;
        awayEvents.forEach((e, idx) => {
          let minute = e.eventMinute;
          if (e.eventMinuteExtra > 0) minute += `+${e.eventMinuteExtra}`;
          const deleteId = e.id || `temp-${idx}`;
          html += `<div class="flex items-center gap-1 py-0.5 text-xs group"><button class="delete-event-btn text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity text-xs" data-event-id="${deleteId}" data-index="${idx}"><i class="fas fa-trash-alt"></i></button> <span class="truncate text-white/80">${escapeHtml(e.playerName)}</span> <span>${iconMap[e.eventType] || e.eventType}</span> <span class="font-mono text-white/50">${minute}'</span></div>`;
        });
        html += `</div></div></div>`;
      } else {
        html = `<div class="text-white/50 text-sm py-2">No events recorded yet.</div>`;
      }
      eventsContainer.innerHTML = html;

      // Re-attach delete handlers with custom confirm dialog
      eventsContainer.querySelectorAll('.delete-event-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.index, 10);
          if (!isNaN(idx) && idx >= 0 && idx < localEvents.length) {
            showConfirmDialog('Delete Event', 'Are you sure you want to delete this event?').then((confirmed) => {
              if (confirmed) {
                localEvents.splice(idx, 1);
                renderEventsList(localEvents);
                showStatus('Event removed (not saved yet)');
              }
            });
          }
        };
      });
    };

    // Initial render
    renderEventsList(localEvents);

    // Add event handler (temporary)
    addBtn.onclick = () => {
      const teamName = document.getElementById('eventTeam').value;
      const playerName = document.getElementById('eventPlayer').value.trim();
      const eventType = document.getElementById('eventType').value;
      const minute = parseInt(document.getElementById('eventMinute').value, 10);
      const extra = parseInt(document.getElementById('eventExtra').value, 10) || 0;
      if (!playerName) { showStatus('Player name required', true); return; }
      if (isNaN(minute) || minute < 0 || minute > 120) { showStatus('Minute must be 0–120', true); return; }

      const newEvent = {
        team: teamName,
        playerName,
        eventType,
        eventMinute: minute,
        eventMinuteExtra: extra,
      };
      localEvents.push(newEvent);
      renderEventsList(localEvents);
      document.getElementById('eventPlayer').value = '';
      document.getElementById('eventMinute').value = '';
      document.getElementById('eventExtra').value = '0';
      showStatus(`Added: ${playerName} ${eventType.replace('_', ' ')} (not saved yet)`);
    };

    // Save all changes
    saveBtn.onclick = async () => {
      const homeScore = parseInt(document.getElementById('editHomeScore').value, 10) || 0;
      const awayScore = parseInt(document.getElementById('editAwayScore').value, 10) || 0;
      const status = document.getElementById('editStatus').value;
      let homePen = null, awayPen = null;
      const homePenInput = document.getElementById('editHomePen');
      if (homePenInput) {
        const hp = homePenInput.value;
        const ap = document.getElementById('editAwayPen').value;
        if (hp !== '') homePen = parseInt(hp, 10);
        if (ap !== '') awayPen = parseInt(ap, 10);
      }

      const originalText = saveBtn.innerText;
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

      try {
        // Update score
        await state.db.jaferRun(
          `INSERT INTO match_scores 
            (matchId, homeScoreFullTime, awayScoreFullTime, homeScorePenalties, awayScorePenalties, status, lastUpdated)
           VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP)
           ON CONFLICT(matchId) DO UPDATE SET
             homeScoreFullTime = excluded.homeScoreFullTime,
             awayScoreFullTime = excluded.awayScoreFullTime,
             homeScorePenalties = excluded.homeScorePenalties,
             awayScorePenalties = excluded.awayScorePenalties,
             status = excluded.status,
             lastUpdated = CURRENT_TIMESTAMP`,
          [parseInt(matchId, 10), homeScore, awayScore, homePen, awayPen, status]
        );

        // Delete all existing events for this match
        await state.db.jaferRun('DELETE FROM match_events WHERE matchId = ?', [parseInt(matchId, 10)]);

        // Insert all local events
        for (const ev of localEvents) {
          const team = await state.db.jaferGet(`SELECT id FROM teams WHERE name = ?`, [ev.team]);
          if (!team) throw new Error(`Team "${ev.team}" not found`);
          await state.db.jaferRun(
            `INSERT INTO match_events (matchId, teamId, playerName, eventType, eventMinute, eventMinuteExtra)
             VALUES (?,?,?,?,?,?)`,
            [parseInt(matchId, 10), team.id, ev.playerName, ev.eventType, ev.eventMinute, ev.eventMinuteExtra]
          );
        }

        showStatus('All changes saved successfully.');
        state.DOM.matchModal.classList.add('hidden');
        // Refresh current tab
        if (state.currentTab === 'fixtures') render.renderFixtures();
        else if (state.currentTab === 'upcoming') render.renderUpcoming();
        else if (state.currentTab === 'groups') render.renderGroups();
      } catch (err) {
        showStatus('Error saving: ' + err.message, true);
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
      }
    };
  } catch (err) {
    state.DOM.matchModalBody.innerHTML = `<div class="text-red-400">Error: ${err.message}</div>`;
  }
},
  showMatchModals: async (matchId) => {
    state.DOM.matchModalTitle.innerText = 'Match Scores and Events';
    state.DOM.matchModalBody.innerHTML = '<div class="flex justify-center"><div class="loading-spinner"></div></div>';
    state.DOM.matchModal.classList.remove('hidden');
    state.DOM.matchModal.setAttribute('data-match-id', matchId);
    try {
      const { match, events: eventsList } = await data.getMatchDetail(matchId);
      state.DOM.matchModalBody.innerHTML = templates.matchModal(match, eventsList, matchId);
      // Attach button handlers
      const saveBtn = document.getElementById('saveScoreLocalBtn');
      if (saveBtn) {
        saveBtn.onclick = () => {
          const homeScore = parseInt(document.getElementById('editHomeScore').value, 10) || 0;
          const awayScore = parseInt(document.getElementById('editAwayScore').value, 10) || 0;
          const status = document.getElementById('editStatus').value;
          let homePen = null, awayPen = null;
          const homePenInput = document.getElementById('editHomePen');
          if (homePenInput) {
            const hp = homePenInput.value;
            const ap = document.getElementById('editAwayPen').value;
            if (hp !== '') homePen = parseInt(hp, 10);
            if (ap !== '') awayPen = parseInt(ap, 10);
          }
          events.saveMatchScore(parseInt(matchId, 10), homeScore, awayScore, homePen, awayPen, status, saveBtn);
        };
      }
      const addBtn = document.getElementById('addEventBtn');
      if (addBtn) {
        addBtn.onclick = () => {
          const teamName = document.getElementById('eventTeam').value;
          const playerName = document.getElementById('eventPlayer').value.trim();
          const eventType = document.getElementById('eventType').value;
          const minute = parseInt(document.getElementById('eventMinute').value, 10);
          const extra = parseInt(document.getElementById('eventExtra').value, 10) || 0;
          if (!playerName) { showStatus('Player name required', true); return; }
          if (isNaN(minute) || minute < 0 || minute > 120) { showStatus('Minute must be 0–120', true); return; }
          events.addMatchEvent(parseInt(matchId, 10), teamName, playerName, eventType, minute, extra, addBtn);
        };
      }
      document.querySelectorAll('.delete-event-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const eventId = parseInt(btn.dataset.eventId, 10);
          if (!isNaN(eventId)) events.deleteEvent(eventId);
        };
      });
    } catch (err) {
      state.DOM.matchModalBody.innerHTML = `<div class="text-red-400">Error: ${err.message}</div>`;
    }
  },

  // ---------- Head‑to‑Head ----------
  showHeadToHead: async () => {
    const teams = await data.getAllTeamNames();
    const opts = teams.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
    state.DOM.team1Select.innerHTML = opts;
    state.DOM.team2Select.innerHTML = opts;
    state.DOM.h2hResult.innerHTML = '';
    state.DOM.h2hModal.classList.remove('hidden');
    state.DOM.compareBtn.onclick = async () => {
      const t1 = state.DOM.team1Select.value;
      const t2 = state.DOM.team2Select.value;
      if (!t1 || !t2 || t1 === t2) {
        state.DOM.h2hResult.innerHTML = '<div class="text-red-400">Select two different teams.</div>';
        return;
      }
      const rows = await data.getHeadToHead(t1, t2);
      state.DOM.h2hResult.innerHTML = templates.headToHeadResult(t1, t2, rows);
    };
  },

  // ---------- Export Data ----------
  exportData: async () => {
    state.DOM.fifaExportModalBody.innerHTML = templates.exportModal();
    state.DOM.fifaExportModal.classList.remove('hidden');
    const [scoresData, eventsData] = await Promise.all([
      state.db.jaferAll(`SELECT * FROM match_scores WHERE status = 'finished' ORDER BY id`),
      state.db.jaferAll(`SELECT * FROM match_events ORDER BY id`)
    ]);
    document.getElementById('matchScoresJson').innerText = JSON.stringify(scoresData, null, 2);
    document.getElementById('matchEventsJson').innerText = JSON.stringify(eventsData, null, 2);
    // Binary DB download removed – not supported over HTTP
    const dbBtn = document.getElementById('downloadDbBtn');
    if (dbBtn) dbBtn.style.display = 'none';
    document.getElementById('copyMatchScoresBtn').onclick = async () => {
      await navigator.clipboard.writeText(JSON.stringify(scoresData, null, 2));
      showStatus('match_scores JSON copied');
    };
    document.getElementById('downloadMatchScoresBtn').onclick = () => {
      const blob = new Blob([JSON.stringify(scoresData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'match_scores.json';
      a.click();
      URL.revokeObjectURL(url);
    };
    document.getElementById('copyMatchEventsBtn').onclick = async () => {
      await navigator.clipboard.writeText(JSON.stringify(eventsData, null, 2));
      showStatus('match_events JSON copied');
    };
    document.getElementById('downloadMatchEventsBtn').onclick = () => {
      const blob = new Blob([JSON.stringify(eventsData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'match_events.json';
      a.click();
      URL.revokeObjectURL(url);
    };
  },

  // ---------- Import Data ----------
  importData: () => {
    state.DOM.fifaImportModalBody.innerHTML = templates.importModal();
    state.DOM.fifaImportModal.classList.remove('hidden');
    let scoresData = null, eventsData = null;

    const readFile = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            resolve(JSON.parse(reader.result));
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });

    document.getElementById('importMatchScoresFile').onchange = async (e) => {
      try {
        scoresData = await readFile(e.target.files[0]);
        document.getElementById('matchScoresPreview').innerText = `${scoresData.length} rows loaded.`;
      } catch (err) {
        scoresData = null;
        document.getElementById('matchScoresPreview').innerText = 'Error: ' + err.message;
      }
    };
    document.getElementById('importMatchEventsFile').onchange = async (e) => {
      try {
        eventsData = await readFile(e.target.files[0]);
        document.getElementById('matchEventsPreview').innerText = `${eventsData.length} rows loaded.`;
      } catch (err) {
        eventsData = null;
        document.getElementById('matchEventsPreview').innerText = 'Error: ' + err.message;
      }
    };
    document.getElementById('applyImportBtn').onclick = async () => {
      if (!scoresData && !eventsData) {
        showStatus('Please select at least one file', true);
        return;
      }
      try {
        if (scoresData) {
          for (const row of scoresData) {
            await state.db.jaferRun(
              `INSERT OR REPLACE INTO match_scores 
                (matchId, homeScoreFullTime, awayScoreFullTime, homeScorePenalties, awayScorePenalties, status, lastUpdated)
               VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP)`,
              [row.matchId, row.homeScoreFullTime, row.awayScoreFullTime, row.homeScorePenalties, row.awayScorePenalties, row.status || 'finished']
            );
          }
        }
        if (eventsData) {
          const matchIds = [...new Set(eventsData.map(e => e.matchId))];
          for (const mid of matchIds) {
            await state.db.jaferRun('DELETE FROM match_events WHERE matchId = ?', [mid]);
          }
          for (const row of eventsData) {
            await state.db.jaferRun(
              `INSERT INTO match_events (matchId, teamId, playerName, eventType, eventMinute, eventMinuteExtra)
               VALUES (?,?,?,?,?,?)`,
              [row.matchId, row.teamId, row.playerName, row.eventType, row.eventMinute, row.eventMinuteExtra]
            );
          }
        }
        showStatus('Import applied successfully.');
        state.DOM.fifaImportModal.classList.add('hidden');
        render.switchTab(state.currentTab);
      } catch (err) {
        showStatus('Import error: ' + err.message, true);
      }
    };
  },

  // ---------- Reset Storage ----------
  resetStorage: async () => {
    if (await confirm('This will reload the page and reconnect to Turso. All data remains safe.')) {
      location.reload();
    }
  },

  // ---------- Global Delegation ----------
  setupGlobalDelegation: () => {
    state.DOM.mainDiv.addEventListener('click', (e) => {
      const card = e.target.closest('.match-card-clickable');
      if (card) {
        const matchId = card.dataset.matchId;
        if (matchId) events.showMatchModal(matchId);
        return;
      }
      const teamEl = e.target.closest('.team-name-clickable');
      if (teamEl) {
        const teamName = teamEl.dataset.teamName;
        if (teamName) events.showTeamModal(teamName);
      }
    });

    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
      btn.onclick = () => {
        const modal = btn.closest('[id$=Modal]');
        if (modal) modal.classList.add('hidden');
      };
    });

    // Filter bar events
    if (state.DOM.filterGroup) {
      state.DOM.filterGroup.onchange = () => {
        state.filter.group = state.DOM.filterGroup.value || null;
        if (['fixtures', 'upcoming', 'live'].includes(state.currentTab)) render.switchTab(state.currentTab);
      };
    }
    if (state.DOM.filterTeam) {
      state.DOM.filterTeam.onchange = () => {
        state.filter.team = state.DOM.filterTeam.value || null;
        if (['fixtures', 'upcoming', 'live'].includes(state.currentTab)) render.switchTab(state.currentTab);
      };
    }
    if (state.DOM.clearFilterBtn) {
      state.DOM.clearFilterBtn.onclick = () => {
        if (state.DOM.filterGroup) state.DOM.filterGroup.value = '';
        if (state.DOM.filterTeam) state.DOM.filterTeam.value = '';
        state.filter.group = null;
        state.filter.team = null;
        if (['fixtures', 'upcoming', 'live'].includes(state.currentTab)) render.switchTab(state.currentTab);
      };
    }
  }
};