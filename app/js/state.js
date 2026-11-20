// state.js — the tracker's saved state: earned trophies, counters, notes,
// the spoiler setting and the theme. One JSON blob in localStorage, plus
// export/import and the ?earned= / ?open= / ?kind= / ?spoiler= URL seeds
// the screenshot scenes use.

const STORAGE_KEY = 'leonida-trophy-guide-v2';

export function freshState() {
  return {
    earned: new Set(),
    counters: {},
    notes: {},
    spoiler: true,
    theme: 'night',
    kind: 'all',
    grade: 'all',
    sort: 'roadmap',
    query: '',
    selected: null,
  };
}

export function loadState() {
  const state = freshState();
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (raw && typeof raw === 'object') {
      if (Array.isArray(raw.earned)) state.earned = new Set(raw.earned.filter(Number.isInteger));
      if (raw.counters && typeof raw.counters === 'object') state.counters = raw.counters;
      if (raw.notes && typeof raw.notes === 'object') state.notes = raw.notes;
      if (typeof raw.spoiler === 'boolean') state.spoiler = raw.spoiler;
      if (raw.theme === 'light' || raw.theme === 'night') state.theme = raw.theme;
    }
  } catch {
    // A corrupt blob just means a fresh start.
  }
  return state;
}

export function persistState(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      earned: [...state.earned].sort((a, b) => a - b),
      counters: state.counters,
      notes: state.notes,
      spoiler: state.spoiler,
      theme: state.theme,
    }),
  );
}

/** Apply the URL seeds (?earned=1,2&open=28&kind=story&spoiler=off). */
export function applyUrlSeeds(state, trophies) {
  const params = new URLSearchParams(location.search);
  const validIds = new Set(trophies.map((t) => t.id));
  const seed = params.get('earned');
  if (seed) {
    for (const piece of seed.split(',')) {
      const id = Number(piece.trim());
      if (validIds.has(id)) state.earned.add(id);
    }
    persistState(state);
  }
  const spoiler = params.get('spoiler');
  if (spoiler === 'on') state.spoiler = true;
  if (spoiler === 'off') state.spoiler = false;
  const open = Number(params.get('open'));
  if (validIds.has(open)) state.selected = open;
  const kind = params.get('kind');
  if (kind) state.kind = kind;
}

/** Wipe earned trophies, counters and notes (the Clear all button). */
export function clearProgress(state) {
  state.earned = new Set();
  state.counters = {};
  state.notes = {};
  persistState(state);
}

/** Serialise the progress for the export download. */
export function exportPayload(state) {
  return JSON.stringify(
    {
      app: 'leonida-trophy-guide',
      game: 'Grand Theft Auto VI',
      exportedAt: new Date().toISOString(),
      earned: [...state.earned].sort((a, b) => a - b),
      counters: state.counters,
      notes: state.notes,
    },
    null,
    2,
  );
}

/**
 * Parse an imported file into a state patch. Accepts this guide's own
 * export, a bare array of trophy ids, or { earned: [...] } with ids or
 * exact trophy names. Returns null when nothing usable is in the file.
 */
export function parseImport(text, trophies) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  const ids = Array.isArray(data) ? data : data?.earned;
  if (!Array.isArray(ids)) return null;
  const byName = new Map(trophies.map((t) => [t.name, t.id]));
  const byId = new Set(trophies.map((t) => t.id));
  const earned = new Set();
  for (const item of ids) {
    if (Number.isInteger(item) && byId.has(item)) earned.add(item);
    else if (typeof item === 'string' && byName.has(item)) earned.add(byName.get(item));
  }
  const counters = {};
  if (data && typeof data === 'object' && data.counters && typeof data.counters === 'object') {
    for (const [key, value] of Object.entries(data.counters)) {
      const id = Number(key);
      if (byId.has(id) && Number.isFinite(value)) counters[id] = value;
    }
  }
  const notes = {};
  if (data && typeof data === 'object' && data.notes && typeof data.notes === 'object') {
    for (const [key, value] of Object.entries(data.notes)) {
      const id = Number(key);
      if (byId.has(id) && typeof value === 'string') notes[id] = value;
    }
  }
  return { earned, counters, notes };
}
