// app.js – entry point, builds UI, connects to remote database, sets up tabs
import { state, saveDatabase, showStatus } from './state.js';
import { render } from './render.js';
import { events } from './events.js';
import { data } from './data.js';

// Build the static header, tabs, and filter bar

function buildUI() {
  const appDiv = document.getElementById('app');
  appDiv.innerHTML = `
    <header class="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 border-b-2 border-white/20 shadow-lg">
      <div class="px-4 py-2 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <i class="fas fa-futbol text-white text-lg"></i>
          </div>
          <div class="flex flex-col">
            <span class="text-white font-bold text-sm tracking-widest">FIFA WORLD CUP</span>
            <span class="text-white/80 text-[11px] tracking-wide">2026</span>
          </div>
        </div>
        <button id="refreshBtn" class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">
          <i class="fas fa-sync-alt text-xs"></i>
        </button>
      </div>
    </header>
    <div class="bg-gray-900/95 backdrop-blur-md border-b border-white/10 overflow-x-auto whitespace-nowrap">
      <div class="flex px-2">
        <button id="tabGroups" class="tab-btn px-3 py-2 text-sm font-medium text-white/50 border-b-2 border-transparent active">Groups</button>
        <button id="tabFixtures" class="tab-btn px-3 py-2 text-sm font-medium text-white/50 border-b-2 border-transparent">Fixtures</button>
        <button id="tabLive" class="tab-btn px-3 py-2 text-sm font-medium text-white/50 border-b-2 border-transparent">Live</button>
        <button id="tabUpcoming" class="tab-btn px-3 py-2 text-sm font-medium text-white/50 border-b-2 border-transparent">Upcoming</button>
        <button id="tabKnockout" class="tab-btn px-3 py-2 text-sm font-medium text-white/50 border-b-2 border-transparent">Bracket</button>
        <button id="tabStats" class="tab-btn px-3 py-2 text-sm font-medium text-white/50 border-b-2 border-transparent">Stats</button>
        <button id="tabDiscipline" class="tab-btn px-3 py-2 text-sm font-medium text-white/50 border-b-2 border-transparent">Discipline</button>
        <button id="tabPlayers" class="tab-btn px-3 py-2 text-sm font-medium text-white/50 border-b-2 border-transparent">Players</button>
      </div>
    </div>
    <div id="filterBar" class="px-3 py-2 bg-gray-900/80 border-b border-white/10 flex items-center gap-2 hidden">
      <span class="text-xs text-gray-400">Filter:</span>
      <select id="filterGroup" class="flex-1 bg-gray-800 border border-white/10 rounded px-2 py-1 text-xs text-white/80">
        <option value="">All Groups</option>
      </select>
      <select id="filterTeam" class="flex-1 bg-gray-800 border border-white/10 rounded px-2 py-1 text-xs text-white/80">
        <option value="">All Teams</option>
      </select>
      <button id="clearFilterBtn" class="text-xs text-gray-400 hover:text-white">Clear</button>
    </div>
  `;
  
  state.DOM.mainDiv = document.getElementById('mainContent');
  if (!state.DOM.mainDiv) {
    const main = document.createElement('main');
    main.id = 'mainContent';
    main.className = 'flex-1 min-h-0 overflow-hidden px-3 pt-0 pb-[50px]';
    appDiv.appendChild(main);
    state.DOM.mainDiv = main;
  }
  
  state.DOM.mainDiv.innerHTML = `
    <div class="space-y-4 animate-pulse">
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="bg-gray-300 h-10 w-full"></div>
        <div class="p-4 space-y-2">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          <div class="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="bg-gray-300 h-10 w-full"></div>
        <div class="p-4 space-y-2">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          <div class="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="bg-gray-300 h-10 w-full"></div>
      <div class="p-4 space-y-2">
      <div class="h-4 bg-gray-200 rounded w-3/4"></div>
      <div class="h-4 bg-gray-200 rounded w-1/2"></div>
      <div class="h-4 bg-gray-200 rounded w-1/2"></div>
      <div class="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
      </div>
    </div>
  `;
  
  state.DOM.filterBar = document.getElementById('filterBar');
  state.DOM.filterGroup = document.getElementById('filterGroup');
  state.DOM.filterTeam = document.getElementById('filterTeam');
  state.DOM.clearFilterBtn = document.getElementById('clearFilterBtn');
  state.DOM.tabGroups = document.getElementById('tabGroups');
  state.DOM.tabFixtures = document.getElementById('tabFixtures');
  state.DOM.tabLive = document.getElementById('tabLive');
  state.DOM.tabUpcoming = document.getElementById('tabUpcoming');
  state.DOM.tabKnockout = document.getElementById('tabKnockout');
  state.DOM.tabStats = document.getElementById('tabStats');
  state.DOM.tabDiscipline = document.getElementById('tabDiscipline');
  state.DOM.tabPlayers = document.getElementById('tabPlayers');
  state.DOM.refreshBtn = document.getElementById('refreshBtn');
  state.DOM.compareTeamsBtn = document.getElementById('compareTeamsBtn');
  state.DOM.fifaExportBtn = document.getElementById('fifaExportBtn');
  state.DOM.fifaImportBtn = document.getElementById('fifaImportBtn');
  state.DOM.resetStorageBtn = document.getElementById('resetStorageBtn');
  state.DOM.team1Select = document.getElementById('team1Select');
  state.DOM.team2Select = document.getElementById('team2Select');
  state.DOM.h2hResult = document.getElementById('h2hResult');
  state.DOM.compareBtn = document.getElementById('compareBtn');
  state.DOM.teamModal = document.getElementById('teamModal');
  state.DOM.teamModalTitle = document.getElementById('teamModalTitle');
  state.DOM.teamModalBody = document.getElementById('teamModalBody');
  state.DOM.matchModal = document.getElementById('matchModal');
  state.DOM.matchModalTitle = document.getElementById('matchModalTitle');
  state.DOM.matchModalBody = document.getElementById('matchModalBody');
  state.DOM.h2hModal = document.getElementById('h2hModal');
  state.DOM.fifaExportModal = document.getElementById('fifaExportModal');
  state.DOM.fifaExportModalBody = document.getElementById('fifaExportModalBody');
  state.DOM.fifaImportModal = document.getElementById('fifaImportModal');
  state.DOM.fifaImportModalBody = document.getElementById('fifaImportModalBody');
}
// Populate filter dropdowns after DB loads
async function populateFilters() {
  const escapeAttr = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const groups = await data.getGroupsList();
  const teams = await data.getTeamsList();
  
  // Build options for groups
  const groupOptions = groups.map(g => `<option value="${escapeAttr(g)}">${g}</option>`);
  state.DOM.filterGroup.innerHTML = groupOptions.join('');
  
  // Build options for teams similarly
  const teamOptions = teams.map(t => `<option value="${escapeAttr(t)}">${t}</option>`);
  state.DOM.filterTeam.innerHTML = teamOptions.join('');
}

// Tab click handler that manages timers
function onTabClick(tabId) {
  events.stopLiveTimer();
  events.stopAutoRefresh();

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById('tab' + tabId.charAt(0).toUpperCase() + tabId.slice(1));
  if (activeBtn) activeBtn.classList.add('active');
  render.switchTab(tabId);
  if (tabId === 'live') {
    events.startLiveTimer();
    events.startAutoRefresh();
  }
}

// ── Custom login modal (promise‑based) ──────────────────
function showLoginModal() {
  return new Promise((resolve, reject) => {
    const modal = document.getElementById('loginModal');
    const input = document.getElementById('loginPasswordInput');
    const submitBtn = document.getElementById('loginSubmitBtn');
    const cancelBtn = document.getElementById('loginCancelBtn');
    const errorEl = document.getElementById('loginError');
    // const BASE_URL = 'https://turso-sqlite-server-production.up.railway.app';
    const BASE_URL = 'https://turso-db-server.vercel.app';
    
    // Reset state
    input.value = '';
    errorEl.classList.add('hidden');
    input.disabled = false;
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Login';
    modal.classList.remove('hidden');
    
    const handleSubmit = async () => {
      const password = input.value.trim();
      if (!password) {
        errorEl.textContent = 'Please enter a password.';
        errorEl.classList.remove('hidden');
        return;
      }
      
      // Disable inputs and show spinner
      input.disabled = true;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
      errorEl.classList.add('hidden');
      
      try {
        const resp = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        
        const data = await resp.json();
        
        if (!resp.ok) {
          // Show error in modal
          errorEl.textContent = data.error || 'Incorrect password. Please try again.';
          errorEl.classList.remove('hidden');
          // Re-enable inputs
          input.disabled = false;
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Login';
          input.focus();
          return;
        }
        
        // Success: store token and close modal
        localStorage.setItem('fifa_auth_token', data.token);
        modal.classList.add('hidden');
        resolve(data.token);
        
      } catch (err) {
        // Network or other error
        errorEl.textContent = 'Network error. Please check your connection and try again.';
        errorEl.classList.remove('hidden');
        input.disabled = false;
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Login';
        input.focus();
      }
    };
    
    submitBtn.onclick = handleSubmit;
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSubmit();
    });
    
    cancelBtn.onclick = () => {
      // If user cancels, reject the promise (or resolve with null)
      modal.classList.add('hidden');
      resolve(null); // or reject(new Error('Login cancelled'))
    };
    
    input.focus();
  });
}

// ── Secure login helper ──────────────────────────────────
async function login() {
  const token = await showLoginModal();
  if (!token) {
    throw new Error('Login cancelled.');
  }
  return token;
}

async function loadDatabase() {
  try {
    // const BASE_URL = 'https://turso-sqlite-server-production.up.railway.app';
    const BASE_URL = 'https://turso-db-server.vercel.app';
    const token = await login();
    JaferRemoteSQL.configure({
      writeEndpoint: '/exec',
      apiKey: token
    });
    
    state.db = await JaferRemoteSQL.jaferInit(BASE_URL, 'fifa2026');
    
    const test = await state.db.jaferGet("SELECT 1 AS ok");
    if (!test || Number(test.ok) !== 1) throw new Error('Connection test failed');
    
    document.getElementById('dbStatusSpan').innerText = 'Turso Ready';
    document.getElementById('dbStatusIcon').className = 'fas fa-cloud-check';
    await populateFilters();
    render.switchTab('groups', true);
  } catch (err) {
    console.error(err);
    // If token expired, clear and retry once
    if (err.message.includes('Unauthorized')) {
      localStorage.removeItem('fifa_auth_token');
      if (!window._loginRetry) {
        window._loginRetry = true;
        return loadDatabase();
      } else {
        window._loginRetry = false;
        err = new Error('Login failed – please reload the page and try again.');
      }
    }
    document.getElementById('dbStatusSpan').innerText = 'Offline';
    document.getElementById('dbStatusIcon').className = 'fas fa-exclamation-triangle';
    state.DOM.mainDiv.innerHTML = `<div class="bg-red-100 border-l-4 border-red-500 p-4 rounded"><p class="font-bold">Error connecting to database</p><p class="text-sm">${err.message}</p></div>`;
  }
}

async function logins() {
  // const BASE_URL = 'https://turso-sqlite-server-production.up.railway.app';
  const BASE_URL = 'https://turso-db-server.vercel.app';
  
  // Try to reuse a stored token first
  let token = localStorage.getItem('fifa_auth_token');
  if (token) return token; // server will reject if expired, we'll handle it later
  
  // Show the custom modal and wait for the password
  const password = await showLoginModal();
  if (!password) throw new Error('Password is required to access the server.');
  
  const resp = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error || 'Login failed');
  }
  
  // Store the token for future visits
  localStorage.setItem('fifa_auth_token', data.token);
  return data.token;
}

// Load database from Turso via Railway server
async function loadDatabases() {
  try {
    // const BASE_URL = 'https://turso-sqlite-server-production.up.railway.app';
    const BASE_URL = 'https://turso-db-server.vercel.app';
    
    // ── Authenticate and get token ──
    const token = await login();
    JaferRemoteSQL.configure({
      writeEndpoint: '/exec',
      apiKey: token // token sent as x-api-key header
    });
    
    state.db = await JaferRemoteSQL.jaferInit(BASE_URL, 'fifa2026');
    
    const test = await state.db.jaferGet("SELECT 1 AS ok");
    if (!test || Number(test.ok) !== 1) throw new Error('Connection test failed');
    
    document.getElementById('dbStatusSpan').innerText = 'Turso Ready';
    document.getElementById('dbStatusIcon').className = 'fas fa-cloud-check';
    await populateFilters();
    render.switchTab('groups');
  } catch (err) {
    console.error(err);
    // If the token was invalid/expired, clear it and try again
    if (err.message.includes('Unauthorized')) {
      localStorage.removeItem('fifa_auth_token');
      if (!window._loginRetry) {
        window._loginRetry = true;
        return loadDatabase();
      } else {
        window._loginRetry = false;
        err = new Error('Login failed – please reload the page and try again.');
      }
    }
    document.getElementById('dbStatusSpan').innerText = 'Offline';
    document.getElementById('dbStatusIcon').className = 'fas fa-exclamation-triangle';
    state.DOM.mainDiv.innerHTML = `<div class="bg-red-100 border-l-4 border-red-500 p-4 rounded"><p class="font-bold">Error connecting to database</p><p class="text-sm">${err.message}</p></div>`;
  }
}

// Initialisation
function init() {
  buildUI();
  // Attach tab click handlers
  state.DOM.tabGroups.onclick = () => onTabClick('groups');
  state.DOM.tabFixtures.onclick = () => onTabClick('fixtures');
  state.DOM.tabLive.onclick = () => onTabClick('live');
  state.DOM.tabUpcoming.onclick = () => onTabClick('upcoming');
  state.DOM.tabKnockout.onclick = () => onTabClick('knockout');
  state.DOM.tabStats.onclick = () => onTabClick('stats');
  state.DOM.tabDiscipline.onclick = () => onTabClick('discipline');
  state.DOM.tabPlayers.onclick = () => onTabClick('players');
  state.DOM.refreshBtn.onclick = () => { render.switchTab(state.currentTab); };
  state.DOM.compareTeamsBtn.onclick = () => events.showHeadToHead();
  state.DOM.fifaExportBtn.onclick = () => events.exportData();
  state.DOM.fifaImportBtn.onclick = () => events.importData();
  state.DOM.resetStorageBtn.onclick = () => events.resetStorage();
  
  events.setupGlobalDelegation();
  loadDatabase();
}

// Start the app
init();