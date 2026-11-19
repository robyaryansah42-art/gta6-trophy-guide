// Leonida Trophy Guide — tracker for the 55 GTA VI trophies.
// Progress is saved in localStorage; export/import moves it between browsers.
// Everything runs offline: the only file it loads is data/trophies.json.
const EARNED_KEY = 'gta6-trophy-guide-earned-v1';
const SPOILER_KEY = 'gta6-trophy-guide-spoiler-v1';

const params = new URLSearchParams(location.search);
const listEl = document.getElementById('list');
const listMeta = document.getElementById('listMeta');
const emptyEl = document.getElementById('empty');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressGrades = document.getElementById('progressGrades');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade');
const spoilerEl = document.getElementById('spoiler');

let trophies = [];
let earned = new Set();
let spoiler = true;
let kindFilter = 'all';
let openId = null;

function loadStored() {
  try {
    earned = new Set(JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]'));
  } catch {
    earned = new Set();
  }
  const storedSpoiler = localStorage.getItem(SPOILER_KEY);
  spoiler = storedSpoiler === null ? true : storedSpoiler === '1';
}

function save() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
  localStorage.setItem(SPOILER_KEY, spoiler ? '1' : '0');
}

function applyUrlParams() {
  // ?earned=1,2,3 seeds progress (used by the screenshot scenes).
  const seed = params.get('earned');
  if (seed) {
    for (const raw of seed.split(',')) {
      const id = Number(raw.trim());
      if (Number.isInteger(id)) earned.add(id);
    }
    save();
  }
  const sp = params.get('spoiler');
  if (sp === 'on') spoiler = true;
  if (sp === 'off') spoiler = false;
  const open = params.get('open');
  if (open && Number.isInteger(Number(open))) openId = Number(open);
  const kind = params.get('kind');
  if (kind) kindFilter = kind;
  spoilerEl.checked = spoiler;
  document.querySelectorAll('#kindChips .chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.kind === kindFilter);
  });
}

function gradeLabel(grade) {
  return grade === 'platinum' ? 'Platinum' : grade[0].toUpperCase() + grade.slice(1);
}

function kindLabel(kind) {
  const labels = {
    story: 'Story',
    collectibles: 'Collectible',
    activities: 'Activity',
    moments: 'Moment',
    platinum: 'Platinum',
    completion: '100% Completion',
  };
  return labels[kind] ?? kind;
}

function trophyVisible(t) {
  if (kindFilter === 'missable') return t.missable;
  if (kindFilter === 'online') return false;
  if (kindFilter !== 'all' && t.kind !== kindFilter) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  const q = searchEl.value.trim().toLowerCase();
  if (q) {
    const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function renderProgress() {
  const total = trophies.length;
  const done = earned.size;
  progressFill.style.width = total ? `${Math.round((done / total) * 100)}%` : '0%';
  progressText.textContent = `${done} of ${total} earned — ${total ? Math.round((done / total) * 100) : 0}% to the platinum`;
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const have = trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
    const all = trophies.filter((t) => t.grade === g).length;
    return `${gradeLabel(g)} ${have}/${all}`;
  });
  progressGrades.textContent = parts.join(' · ');
}

function renderRoadmap() {
  for (const stage of [1, 2, 3]) {
    const stageTrophies = trophies.filter((x) => x.stage === stage);
    const stageEarned = stageTrophies.filter((t) => earned.has(t.id)).length;
    const countEl = document.querySelector(`[data-stage-count="${stage}"]`);
    if (countEl) countEl.textContent = `· ${stageEarned}/${stageTrophies.length} earned`;
    const ul = document.querySelector(`.stage-trophies[data-stage="${stage}"]`);
    if (!ul) continue;
    ul.replaceChildren();
    for (const t of stageTrophies) {
      const li = document.createElement('li');
      // The spoiler setting hides story names everywhere, not just in the
      // tracker list — the roadmap must not leak them either.
      if (spoiler && t.kind === 'story' && !earned.has(t.id)) {
        li.textContent = 'Hidden story trophy';
        li.classList.add('locked-note');
        ul.append(li);
        continue;
      }
      const mark = earned.has(t.id) ? '✓ ' : '';
      const a = document.createElement('a');
      a.href = `#trophy-${t.id}`;
      a.textContent = `${mark}${t.name}`;
      if (earned.has(t.id)) a.classList.add('earned-mark');
      a.addEventListener('click', () => {
        openId = t.id;
        renderList();
      });
      li.append(a);
      ul.append(li);
    }
  }
}

function makeTag(text, cls) {
  const s = document.createElement('span');
  s.className = `tag ${cls}`;
  s.textContent = text;
  return s;
}

function renderList() {
  renderProgress();
  renderRoadmap();
  const shown = trophies.filter(trophyVisible);
  listEl.replaceChildren();
  emptyEl.hidden = shown.length > 0;
  if (kindFilter === 'online') {
    emptyEl.hidden = false;
    emptyEl.textContent = 'No online trophies — all 55 are single-player (PowerPyx).';
  } else if (shown.length === 0) {
    emptyEl.textContent = 'No trophies match these filters.';
  }
  listMeta.textContent = `Showing ${shown.length} of ${trophies.length} trophies · ${earned.size} earned`;

  for (const t of shown) {
    const isEarned = earned.has(t.id);
    const isStoryHidden = spoiler && t.kind === 'story' && !isEarned;
    const card = document.createElement('article');
    card.className = `trophy${isEarned ? ' earned' : ''}`;
    card.id = `trophy-${t.id}`;

    const top = document.createElement('div');
    top.className = 'trophy-top';

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned;
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id);
      else earned.delete(t.id);
      save();
      renderList();
    });
    top.append(box);

    const head = document.createElement('div');
    head.className = 'trophy-head';
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = isStoryHidden ? 'Hidden story trophy' : t.name;
    head.append(name);
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = isStoryHidden
      ? 'Earn this story trophy in the game to reveal its name and description.'
      : t.description;
    head.append(desc);

    const tags = document.createElement('div');
    tags.className = 'trophy-tags';
    tags.append(makeTag(gradeLabel(t.grade), t.grade));
    tags.append(makeTag(kindLabel(t.kind), 'kind'));
    if (t.hidden) tags.append(makeTag('Hidden', 'hidden'));
    if (t.missable) tags.append(makeTag('Missable', 'missable'));
    if (typeof t.count === 'number') tags.append(makeTag(`Count: ${t.count.toLocaleString('en-US')}`, ''));
    head.append(tags);
    top.append(head);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'guide-toggle';
    toggle.textContent = openId === t.id ? 'Hide guide' : 'Guide';
    toggle.addEventListener('click', () => {
      openId = openId === t.id ? null : t.id;
      renderList();
    });
    top.append(toggle);

    card.append(top);

    if (openId === t.id) {
      const detail = document.createElement('div');
      detail.className = 'guide-detail';
      if (isStoryHidden) {
        const locked = document.createElement('p');
        locked.className = 'locked-note';
        locked.textContent = 'This is a story trophy. Turn off “Hide story trophies until earned” above, or earn it in the game and tick it here, to read its guide.';
        detail.append(locked);
      } else {
        const guide = document.createElement('p');
        guide.textContent = t.guide;
        detail.append(guide);
        const meta = document.createElement('p');
        meta.className = 'guide-meta';
        meta.textContent = `Roadmap: Stage ${t.stage} · ${t.kind === 'story' ? 'Story trophy' : `${kindLabel(t.kind)} trophy`}${t.missable ? ' · Missable — do it before it is gone' : ''}`;
        detail.append(meta);
      }
      const src = document.createElement('p');
      src.className = 'guide-source';
      src.textContent = `Source: ${t.source}. Full links in Sources below.`;
      detail.append(src);
      card.append(detail);
    }

    listEl.append(card);
  }
}

document.querySelectorAll('#kindChips .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    kindFilter = chip.dataset.kind;
    document.querySelectorAll('#kindChips .chip').forEach((c) => c.classList.toggle('active', c === chip));
    renderList();
  });
});
gradeEl.addEventListener('change', renderList);
searchEl.addEventListener('input', renderList);
spoilerEl.addEventListener('change', () => {
  spoiler = spoilerEl.checked;
  save();
  renderList();
});

document.getElementById('export').addEventListener('click', () => {
  const payload = JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort((a, b) => a - b) }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) throw new Error('not a progress file');
    const next = new Set();
    const byName = new Map(trophies.map((t) => [t.name, t.id]));
    for (const item of ids) {
      if (Number.isInteger(item) && trophies.some((t) => t.id === item)) next.add(item);
      else if (typeof item === 'string' && byName.has(item)) next.add(byName.get(item));
    }
    earned = next;
    save();
    renderList();
  } catch {
    alert('That file is not a trophy progress export from this guide.');
  }
  event.target.value = '';
});
document.getElementById('reset').addEventListener('click', () => {
  if (window.confirm('Clear all earned trophies?')) {
    earned = new Set();
    save();
    renderList();
  }
});

const doc = await (await fetch('data/trophies.json')).json();
trophies = doc.trophies;
loadStored();
applyUrlParams();
renderList();
window.__shotReady = true;
