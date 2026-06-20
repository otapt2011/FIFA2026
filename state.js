// state.js – shared state container (mutable)
export const state = {
  db: null,
  currentTab: 'groups',
  filter: { group: null, team: null },
  DOM: {}
};

export const setCurrentTab = (tab) => { state.currentTab = tab; };
export const setFilter = (newFilter) => { state.filter = { ...state.filter, ...newFilter }; };

export const saveDatabase = async () => {
  // No-op – all data is persisted remotely via Turso
};

export const showStatus = (msg, isErr = false) => {
  let div = document.getElementById('statusMsg');
  if (!div) {
    div = document.createElement('div');
    div.id = 'statusMsg';
    div.className = 'fixed bottom-20 left-4 right-4 bg-white border-l-4 border-indigo-500 shadow-lg rounded p-2 text-sm z-50';
    document.body.appendChild(div);
  }
  div.innerHTML = `${isErr ? '<i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>' : '<i class="fas fa-check-circle text-green-500 mr-2"></i>'}${msg}`;
  div.classList.remove('hidden');
  setTimeout(() => div.classList.add('hidden'), 3000);
};

// Helpers

export const html = (strings, ...values) => {
  return strings.reduce((result, str, i) => {
    let val = values[i - 1];
    if (val && typeof val === 'object' && val.__raw === true) {
      return result + val.value + str;
    }
    if (typeof val === 'string') {
      return result + escapeHtml(val) + str;
    }
    if (val !== null && val !== undefined) {
      return result + String(val) + str;
    }
    return result + str;
  });
};

export const escapeHtml = (str) => {
  if (!str) return '';
  return String(str).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' } [m]));
};

export const formatDate = (iso) => {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${weekdays[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
};

export const rawHTML = (str) => ({ __raw: true, value: String(str) });

export const showConfirmDialog = (title, message) => {
  return new Promise((resolve) => {
    const overlay = document.getElementById('customDialogOverlay');
    const titleEl = document.getElementById('customDialogTitle');
    const messageEl = document.getElementById('customDialogMessage');
    const buttonsContainer = document.getElementById('customDialogButtons');

    titleEl.textContent = title;
    messageEl.textContent = message;

    buttonsContainer.innerHTML = '';

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Confirm';
    confirmBtn.className = 'bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm';

    buttonsContainer.appendChild(cancelBtn);
    buttonsContainer.appendChild(confirmBtn);

    overlay.classList.remove('hidden');

    const cleanup = () => {
      overlay.classList.add('hidden');
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
    };

    confirmBtn.onclick = () => { cleanup(); resolve(true); };
    cancelBtn.onclick = () => { cleanup(); resolve(false); };
  });
};