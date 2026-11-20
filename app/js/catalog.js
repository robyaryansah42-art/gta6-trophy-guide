// catalog.js — pure helpers over the trophy list: labels, filtering,
// sorting, roadmap grouping and the "next up" planner. No DOM, no storage.

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export const GRADE_LABELS = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

export const KIND_LABELS = {
  platinum: 'Platinum',
  completion: '100% Completion',
  story: 'Story',
  activities: 'Activity',
  collectibles: 'Collectible',
  moments: 'Moment',
};

/** A story trophy stays veiled while the spoiler setting is on and it is unearned. */
export function isVeiled(trophy, state) {
  return state.spoiler && trophy.kind === 'story' && !state.earned.has(trophy.id);
}

/** Does this trophy pass the current kind / grade / search filters? */
export function passesFilters(trophy, state) {
  if (state.kind === 'missable') {
    if (!trophy.missable) return false;
  } else if (state.kind === 'online') {
    return false; // there are no online trophies: all 55 are single-player
  } else if (state.kind !== 'all' && trophy.kind !== state.kind) {
    return false;
  }
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  const query = state.query.trim().toLowerCase();
  if (query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}

function byRoadmap(a, b) {
  return a.stage - b.stage || a.id - b.id;
}

/** Order a filtered list by the toolbar's sort choice. */
export function sortTrophies(list, state) {
  const ordered = [...list];
  if (state.sort === 'grade') {
    ordered.sort(
      (a, b) =>
        GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade) || byRoadmap(a, b),
    );
  } else if (state.sort === 'name') {
    ordered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (state.sort === 'earned') {
    ordered.sort(
      (a, b) =>
        Number(state.earned.has(a.id)) - Number(state.earned.has(b.id)) || byRoadmap(a, b),
    );
  } else {
    ordered.sort(byRoadmap);
  }
  return ordered;
}

/** Group trophies by roadmap stage (1, 2, 3), in roadmap order. */
export function groupByStage(trophies) {
  const stages = { 1: [], 2: [], 3: [] };
  for (const trophy of [...trophies].sort(byRoadmap)) {
    stages[trophy.stage].push(trophy);
  }
  return stages;
}

/** The next few unearned trophies, in roadmap order — the planner's picks. */
export function nextUpPicks(trophies, state, limit = 5) {
  return [...trophies]
    .sort(byRoadmap)
    .filter((t) => !state.earned.has(t.id))
    .slice(0, limit);
}

/** Earned/total counts per roadmap stage, for the stage cards. */
export function stageTallies(trophies, state) {
  const stages = groupByStage(trophies);
  return [1, 2, 3].map((stage) => ({
    stage,
    members: stages[stage],
    have: stages[stage].filter((t) => state.earned.has(t.id)).length,
  }));
}

/** Earned/total counts per grade, for the scoreboard bars. */
export function gradeTallies(trophies, state) {
  return GRADE_ORDER.map((grade) => {
    const all = trophies.filter((t) => t.grade === grade).length;
    const have = trophies.filter((t) => t.grade === grade && state.earned.has(t.id)).length;
    return { grade, have, all };
  });
}
