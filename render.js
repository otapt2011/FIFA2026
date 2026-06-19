// render.js – rendering functions (FIXED: use regular function for this binding)
import { state, setCurrentTab } from './state.js';
import { data } from './data.js';
import { templates } from './templates.js';

export const render = {
  renderGroups: async () => {
    try {
      const map = await data.getGroups();
      if (map.size === 0) {
        state.DOM.mainDiv.innerHTML = '<div class="bg-white p-5 rounded shadow text-center text-gray-500">No group data.</div>';
      } else {
        state.DOM.mainDiv.innerHTML = templates.groups(map);
      }
    } catch (err) {
      state.DOM.mainDiv.innerHTML = `<div class="text-red-400">Error: ${err.message}</div>`;
    }
  },
  
  renderFixtures: async () => {
    try {
      const matches = await data.getFixtures(state.filter);
      if (!matches.length) {
        state.DOM.mainDiv.innerHTML = '<div class="bg-white p-5 rounded text-center text-gray-500">No matches found.</div>';
      } else {
        state.DOM.mainDiv.innerHTML = templates.fixtures(matches);
      }
    } catch (err) {
      state.DOM.mainDiv.innerHTML = `<div class="text-red-400">Error: ${err.message}</div>`;
    }
  },
  
  renderUpcoming: async () => {
    try {
      const matches = await data.getUpcoming(state.filter);
      if (!matches.length) {
        state.DOM.mainDiv.innerHTML = '<div class="bg-white p-5 rounded text-center text-gray-500">No upcoming matches.</div>';
      } else {
        state.DOM.mainDiv.innerHTML = templates.upcoming(matches);
      }
    } catch (err) {
      state.DOM.mainDiv.innerHTML = `<div class="text-red-400">Error: ${err.message}</div>`;
    }
  },
  
  renderKnockout: async () => {
    try {
      const knockouts = await data.getKnockout();
      if (!knockouts.length) {
        state.DOM.mainDiv.innerHTML = '<div class="bg-white p-5 rounded text-center text-gray-500">Knockout bracket not available.</div>';
      } else {
        state.DOM.mainDiv.innerHTML = templates.knockout(knockouts);
      }
    } catch (err) {
      state.DOM.mainDiv.innerHTML = `<div class="text-red-400">Error: ${err.message}</div>`;
    }
  },
  
  renderStats: async () => {
    try {
      const [stats, bestThird, topScorers] = await Promise.all([
        data.getStats(),
        data.getBestThirdPlaced(),
        data.getTopScorers()
      ]);
      state.DOM.mainDiv.innerHTML = templates.stats(stats, bestThird, topScorers);
    } catch (err) {
      state.DOM.mainDiv.innerHTML = `<div class="text-red-400">Error: ${err.message}</div>`;
    }
  },
  
  renderDiscipline: async () => {
    try {
      const [cards, ownGoals] = await Promise.all([
        data.getCardSummary(),
        data.getOwnGoals()
      ]);
      state.DOM.mainDiv.innerHTML = templates.discipline(cards, ownGoals);
    } catch (err) {
      state.DOM.mainDiv.innerHTML = `<div class="text-red-400">Error: ${err.message}</div>`;
    }
  },
  
  renderPlayers: async () => {
    try {
      const players = await data.getPlayerStats();
      if (!players.length) {
        state.DOM.mainDiv.innerHTML = '<div class="bg-white p-5 rounded text-center text-gray-500">No player stats.</div>';
      } else {
        state.DOM.mainDiv.innerHTML = templates.playerStats(players);
      }
    } catch (err) {
      state.DOM.mainDiv.innerHTML = `<div class="text-red-400">Error: ${err.message}</div>`;
    }
  },
  
  renderLive: async () => {
    try {
      const sections = await data.getLiveMatches(state.filter);
      state.DOM.mainDiv.innerHTML = templates.liveTab(sections);
    } catch (err) {
      state.DOM.mainDiv.innerHTML = `<div class="text-red-400">Error: ${err.message}</div>`;
    }
  },
  
  // FIXED: Use a regular function so `this` refers to the `render` object
loadingSkeleton() {
  return `
    <div class="space-y-4 animate-pulse">
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="bg-gray-300 h-10 w-full"></div>
        <div class="p-4 space-y-2">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          <div class="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="bg-gray-300 h-10 w-full"></div>
        <div class="p-4 space-y-2">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          <div class="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  `;
},
loadingSpinner() {
  return `
    <div class="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-10">
      <div class="loading-spinner"></div>
    </div>
  `;
},

async switchTab(tabId) {
  setCurrentTab(tabId);
  const tabsWithFilter = ['fixtures', 'upcoming', 'live'];
  if (tabsWithFilter.includes(tabId)) {
    state.DOM.filterBar.classList.remove('hidden');
  } else {
    state.DOM.filterBar.classList.add('hidden');
  }
  if (!tabsWithFilter.includes(tabId)) {
    state.filter.group = null;
    state.filter.team = null;
    if (state.DOM.filterGroup) state.DOM.filterGroup.value = '';
    if (state.DOM.filterTeam) state.DOM.filterTeam.value = '';
  }
  
  const renderMap = {
    groups: this.renderGroups,
    fixtures: this.renderFixtures,
    upcoming: this.renderUpcoming,
    knockout: this.renderKnockout,
    stats: this.renderStats,
    discipline: this.renderDiscipline,
    live: this.renderLive,
    players: this.renderPlayers
  };
  
  const renderFn = renderMap[tabId];
  if (!renderFn) return;
  
  if (this._switchTimeout) {
    clearTimeout(this._switchTimeout);
    this._switchTimeout = null;
  }
  
  const mainDiv = state.DOM.mainDiv;
  if (!mainDiv) {
    renderFn.call(this);
    return;
  }
  
  // 1. Fade out old content
  mainDiv.classList.add('fade-out');
  await new Promise(resolve => {
    this._switchTimeout = setTimeout(resolve, 350);
  });
  this._switchTimeout = null;
  
  // 2. Show loading spinner with blurred overlay
  mainDiv.innerHTML = this.loadingSpinner();
  mainDiv.classList.remove('fade-out');
  
  // 3. Load and render actual data
  try {
    await renderFn.call(this);
    // 4. Fade in the final content
    mainDiv.classList.add('fade-out');
    requestAnimationFrame(() => {
      mainDiv.classList.remove('fade-out');
    });
  } catch (err) {
    mainDiv.innerHTML = `<div class="text-red-400">Error: ${err.message}</div>`;
    mainDiv.classList.remove('fade-out');
  }
},

async switchTabs(tabId) {
  setCurrentTab(tabId);
  const tabsWithFilter = ['fixtures', 'upcoming', 'live'];
  if (tabsWithFilter.includes(tabId)) {
    state.DOM.filterBar.classList.remove('hidden');
  } else {
    state.DOM.filterBar.classList.add('hidden');
  }
  if (!tabsWithFilter.includes(tabId)) {
    state.filter.group = null;
    state.filter.team = null;
    if (state.DOM.filterGroup) state.DOM.filterGroup.value = '';
    if (state.DOM.filterTeam) state.DOM.filterTeam.value = '';
  }
  
  const renderMap = {
    groups: this.renderGroups,
    fixtures: this.renderFixtures,
    upcoming: this.renderUpcoming,
    knockout: this.renderKnockout,
    stats: this.renderStats,
    discipline: this.renderDiscipline,
    live: this.renderLive,
    players: this.renderPlayers
  };
  
  const renderFn = renderMap[tabId];
  if (!renderFn) return;
  
  // Cancel any pending animation
  if (this._switchTimeout) {
    clearTimeout(this._switchTimeout);
    this._switchTimeout = null;
  }
  
  const mainDiv = state.DOM.mainDiv;
  if (!mainDiv) {
    renderFn.call(this);
    return;
  }
  
  // Start fade-out
  mainDiv.classList.add('fade-out');
  
  // Wait for the fade-out to complete (350ms), then render and await
  await new Promise(resolve => {
    this._switchTimeout = setTimeout(resolve, 350);
  });
  this._switchTimeout = null;
  
  // Render new content (await data loading)
  try {
    await renderFn.call(this);
  } catch (err) {
    mainDiv.innerHTML = `<div class="text-red-400">Error: ${err.message}</div>`;
  }
  
  // Fade-in after data is fully rendered
  requestAnimationFrame(() => {
    mainDiv.classList.remove('fade-out');
  });
}
};