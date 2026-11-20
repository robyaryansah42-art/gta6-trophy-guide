// views.js — everything the page shows: the scoreboard, the Next up
// planner, the roadmap stages, the checklist and the detail pane.
// Each renderer takes the trophy list, the state and small callbacks.

import {
  GRADE_LABELS,
  KIND_LABELS,
  gradeTallies,
  isVeiled,
  nextUpPicks,
  passesFilters,
  sortTrophies,
  stageTallies,
} from './catalog.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function badge(text, className) {
  return el('span', `badge ${className}`, text);
}

function formatCount(n) {
  return n.toLocaleString('en-US');
}

/** The header scoreboard: big earned count, percentage, per-grade bars. */
export function renderScoreboard(trophies, state) {
  const total = trophies.length;
  const done = state.earned.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('earnedCount').textContent = String(done);
  document.getElementById('pctText').textContent =
    `${pct}% of the way to the platinum · ${total - done} to go`;
  const bars = document.getElementById('gradeBars');
  bars.replaceChildren();
  for (const { grade, have, all } of gradeTallies(trophies, state)) {
    const row = el('div', 'grade-row');
    row.append(el('span', '', GRADE_LABELS[grade]));
    const bar = el('div', 'bar');
    const fill = el('i', '');
    fill.style.width = all ? `${Math.round((have / all) * 100)}%` : '0%';
    bar.append(fill);
    row.append(bar);
    row.append(el('span', 'count', `${have}/${all}`));
    bars.append(row);
  }
}

/** The Next up planner: the earliest unearned trophies in roadmap order. */
export function renderNextUp(trophies, state, onPick) {
  const list = document.getElementById('nextUp');
  list.replaceChildren();
  const picks = nextUpPicks(trophies, state, 5);
  if (picks.length === 0) {
    const li = el('li', '', 'Everything is earned — the platinum should be yours. Enjoy Leonida.');
    list.append(li);
    return;
  }
  for (const trophy of picks) {
    const li = document.createElement('li');
    const name = isVeiled(trophy, state) ? 'Hidden story trophy' : trophy.name;
    li.append(document.createTextNode(name + ' '));
    li.append(el('span', 'next-grade', `— ${GRADE_LABELS[trophy.grade]} · Stage ${trophy.stage}`));
    li.addEventListener('click', () => onPick(trophy.id));
    list.append(li);
  }
}

/** The three roadmap stages, each with its trophies and earned count. */
export function renderRoadmap(trophies, state, onPick) {
  for (const { stage, members, have } of stageTallies(trophies, state)) {
    const progress = document.querySelector(`[data-stage-progress="${stage}"]`);
    if (progress) progress.textContent = `${have} of ${members.length} earned`;
    const ul = document.querySelector(`[data-stage-list="${stage}"]`);
    if (!ul) continue;
    ul.replaceChildren();
    for (const trophy of members) {
      const li = document.createElement('li');
      if (isVeiled(trophy, state)) {
        li.append(el('span', 'veiled', 'Hidden story trophy'));
        ul.append(li);
        continue;
      }
      const link = document.createElement('a');
      link.href = `#trophy-${trophy.id}`;
      link.textContent = `${state.earned.has(trophy.id) ? '✓ ' : ''}${trophy.name}`;
      if (state.earned.has(trophy.id)) link.classList.add('done');
      link.addEventListener('click', () => onPick(trophy.id));
      li.append(link);
      ul.append(li);
    }
  }
}

/** The checklist: one row per trophy that passes the filters. */
export function renderList(trophies, state, onPick, onToggle) {
  const shown = sortTrophies(trophies.filter((t) => passesFilters(t, state)), state);
  const list = document.getElementById('trophyList');
  const empty = document.getElementById('emptyNote');
  const meta = document.getElementById('resultMeta');
  list.replaceChildren();
  if (state.kind === 'online') {
    empty.hidden = false;
    empty.textContent = 'No online trophies — all 55 are single-player (PowerPyx).';
  } else {
    empty.hidden = shown.length > 0;
    empty.textContent = 'No trophies match these filters.';
  }
  meta.textContent =
    `Showing ${shown.length} of ${trophies.length} trophies · ${state.earned.size} earned`;

  for (const trophy of shown) {
    const earned = state.earned.has(trophy.id);
    const veiled = isVeiled(trophy, state);
    const row = el('article', `trophy-row${earned ? ' is-earned' : ''}${state.selected === trophy.id ? ' is-selected' : ''}`);
    row.id = `trophy-${trophy.id}`;

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned;
    box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => onToggle(trophy.id, box.checked));
    row.append(box);

    const main = el('div', 'trophy-main');
    main.append(el('div', 'trophy-title', veiled ? 'Hidden story trophy' : trophy.name));
    main.append(
      el(
        'div',
        'trophy-blurb',
        veiled
          ? 'Earn this story trophy in the game to reveal its name and description.'
          : trophy.description,
      ),
    );
    const badges = el('div', 'trophy-badges');
    badges.append(badge(GRADE_LABELS[trophy.grade], trophy.grade));
    badges.append(badge(KIND_LABELS[trophy.kind] ?? trophy.kind, 'kind'));
    if (trophy.hidden) badges.append(badge('Hidden', 'hidden'));
    if (trophy.missable) badges.append(badge('Missable', 'missable'));
    if (typeof trophy.count === 'number') {
      badges.append(badge(`Target: ${formatCount(trophy.count)}`, ''));
    }
    badges.append(badge(`Stage ${trophy.stage}`, ''));
    main.append(badges);
    row.append(main);

    row.addEventListener('click', () => onPick(trophy.id));
    list.append(row);
  }
}

/** The sticky detail pane: the selected trophy's full guide and sources. */
export function renderDetail(trophies, state, onCounter, onNote) {
  const pane = document.getElementById('detailBody');
  pane.replaceChildren();
  const trophy = trophies.find((t) => t.id === state.selected);
  if (!trophy) {
    pane.append(el('h3', '', 'Pick a trophy'));
    pane.append(
      el(
        'p',
        'detail-hint',
        'Click any trophy in the list — or in the roadmap or Next up — and its full guide, sources and counter appear here.',
      ),
    );
    return;
  }
  if (isVeiled(trophy, state)) {
    pane.append(el('h3', '', 'Hidden story trophy'));
    pane.append(
      el(
        'p',
        'detail-hint',
        'This is a story trophy. Switch off “Hide story trophies until earned” above, or earn it in the game and tick it here, to read its guide.',
      ),
    );
    return;
  }

  pane.append(el('h3', '', trophy.name));
  pane.append(el('p', 'detail-desc', trophy.description));
  pane.append(el('p', 'detail-guide', trophy.guide));

  const facts = el('dl', 'detail-facts');
  const addFact = (term, value) => {
    facts.append(el('dt', '', term));
    facts.append(el('dd', '', value));
  };
  addFact('Grade', GRADE_LABELS[trophy.grade]);
  addFact('Kind', KIND_LABELS[trophy.kind] ?? trophy.kind);
  addFact('Roadmap', `Stage ${trophy.stage}`);
  if (typeof trophy.count === 'number') addFact('Target', formatCount(trophy.count));
  if (trophy.missable) addFact('Warning', 'Missable — do it before it is gone');
  if (trophy.hidden) addFact('Visibility', 'Hidden on PlayStation until earned');
  pane.append(facts);

  pane.append(el('p', 'detail-source', `Source: ${trophy.source}. Full links in Sources below.`));

  if (typeof trophy.count === 'number') {
    const counter = el('div', 'counter-box');
    counter.append(el('label', '', 'Your count:'));
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = String(trophy.count);
    input.value = String(state.counters[trophy.id] ?? 0);
    input.setAttribute('aria-label', `Your progress toward ${trophy.count}`);
    input.addEventListener('change', () => onCounter(trophy.id, input.valueAsNumber));
    counter.append(input);
    counter.append(el('span', 'counter-of', `/ ${formatCount(trophy.count)}`));
    pane.append(counter);
  }

  const notes = el('div', 'notes-box');
  notes.append(el('label', '', 'Your notes (saved in this browser)'));
  const area = document.createElement('textarea');
  area.value = state.notes[trophy.id] ?? '';
  area.placeholder = 'Where you found it, what worked, what to try next…';
  area.addEventListener('input', () => onNote(trophy.id, area.value));
  notes.append(area);
  pane.append(notes);
}

/** Re-render every view after the state changes. */
export function renderAll(trophies, state, handlers) {
  renderScoreboard(trophies, state);
  renderNextUp(trophies, state, handlers.pick);
  renderRoadmap(trophies, state, handlers.pick);
  renderList(trophies, state, handlers.pick, handlers.toggle);
  renderDetail(trophies, state, handlers.counter, handlers.note);
}
