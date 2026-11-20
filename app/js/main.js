// main.js — boot for the Leonida Trophy Guide.
// Loads app/data/trophies.json, restores saved progress, wires the toolbar,
// then renders. The page fetches nothing else, ever: it works offline.

import { applyUrlSeeds, clearProgress, exportPayload, loadState, parseImport, persistState } from './state.js';
import { renderAll } from './views.js';

const DATA_URL = 'data/trophies.json';

async function loadCatalog() {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error(`could not load ${DATA_URL}: ${response.status}`);
  const doc = await response.json();
  if (!Array.isArray(doc.trophies) || doc.trophies.length === 0) {
    throw new Error('trophies.json holds no trophies');
  }
  return doc.trophies;
}

function applyTheme(state) {
  document.documentElement.dataset.theme = state.theme;
  document.getElementById('themeBtn').textContent =
    state.theme === 'night' ? 'Light theme' : 'Dark theme';
}

function syncToolbar(state) {
  document.getElementById('spoilerBox').checked = state.spoiler;
  document.getElementById('gradePick').value = state.grade;
  document.getElementById('sortPick').value = state.sort;
  document.querySelectorAll('#kindRow .kind-btn').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.kind === state.kind);
  });
}

function download(filename, text) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function boot() {
  const trophies = await loadCatalog();
  const state = loadState();
  applyUrlSeeds(state, trophies);

  const handlers = {
    pick(id) {
      state.selected = id;
      renderAll(trophies, state, handlers);
    },
    toggle(id, earned) {
      if (earned) state.earned.add(id);
      else state.earned.delete(id);
      persistState(state);
      renderAll(trophies, state, handlers);
    },
    counter(id, value) {
      const trophy = trophies.find((t) => t.id === id);
      const target = trophy?.count ?? 0;
      const clamped = Number.isFinite(value) ? Math.max(0, Math.min(target, Math.floor(value))) : 0;
      state.counters[id] = clamped;
      persistState(state);
      renderAll(trophies, state, handlers);
    },
    note(id, text) {
      // Notes save on every keystroke without a re-render, so the
      // textarea never loses focus while typing.
      if (text) state.notes[id] = text;
      else delete state.notes[id];
      persistState(state);
    },
  };

  document.getElementById('searchBox').addEventListener('input', (event) => {
    state.query = event.target.value;
    renderAll(trophies, state, handlers);
  });
  document.querySelectorAll('#kindRow .kind-btn').forEach((button) => {
    button.addEventListener('click', () => {
      state.kind = button.dataset.kind;
      syncToolbar(state);
      renderAll(trophies, state, handlers);
    });
  });
  document.getElementById('gradePick').addEventListener('change', (event) => {
    state.grade = event.target.value;
    renderAll(trophies, state, handlers);
  });
  document.getElementById('sortPick').addEventListener('change', (event) => {
    state.sort = event.target.value;
    renderAll(trophies, state, handlers);
  });
  document.getElementById('spoilerBox').addEventListener('change', (event) => {
    state.spoiler = event.target.checked;
    persistState(state);
    renderAll(trophies, state, handlers);
  });
  document.getElementById('themeBtn').addEventListener('click', () => {
    state.theme = state.theme === 'night' ? 'light' : 'night';
    persistState(state);
    applyTheme(state);
  });
  document.getElementById('exportBtn').addEventListener('click', () => {
    download('leonida-trophy-progress.json', exportPayload(state));
  });
  document.getElementById('importFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const parsed = parseImport(await file.text(), trophies);
    if (!parsed) {
      window.alert('That file is not a trophy progress export from this guide.');
    } else {
      state.earned = parsed.earned;
      state.counters = parsed.counters;
      state.notes = parsed.notes;
      persistState(state);
      renderAll(trophies, state, handlers);
    }
    event.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (window.confirm('Clear all earned trophies, counters and notes?')) {
      clearProgress(state);
      renderAll(trophies, state, handlers);
    }
  });

  applyTheme(state);
  syncToolbar(state);
  renderAll(trophies, state, handlers);
  window.__shotReady = true;
}

boot().catch((error) => {
  console.error(error);
  document.getElementById('detailBody').textContent =
    'The trophy list could not be loaded. Serve app/ with a static server (node serve.ts) and reload.';
});
