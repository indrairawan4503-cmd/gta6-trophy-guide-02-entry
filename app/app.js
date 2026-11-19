// Leonida Trophy Guide — guide-first tracker for GTA VI's 55 PS5 trophies.
// All data comes from app/data/trophies.json (official names/descriptions/grades
// plus our own guides with cited sources). Progress lives only in localStorage.
const KEY = 'gta6-trophy-guide-02-progress';
const SPOILER_KEY = 'gta6-trophy-guide-02-spoiler';

const STAGE_LABELS = {
  ch1: 'Chapter 1', ch2: 'Chapter 2', ch3: 'Chapter 3', ch4: 'Chapter 4',
  story: 'During the story', finale: 'Final mission', cleanup: 'Post-story cleanup',
  anytime: 'Anytime', platinum: 'Platinum',
};
const KIND_LABELS = {
  story: 'Story', missable: 'Missable', collectibles: 'Collectibles',
  activities: 'Activities', platinum: 'Platinum',
};

// Chapter-ordered road to the platinum, built from the official descriptions.
const ROADMAP = [
  { title: '1 · Before you start', text: 'Turn cheats off (they switch trophies and saving off). Make a manual save at the start of every chapter and one before the final mission — there is no mission replay or New Game Plus.', chips: ['Vice Got a Price!', 'A Long Road'], miss: false },
  { title: '2 · Chapter 1 — first steps', text: 'Play Gone Fishing, then finish the chapter. MEDITATE at Lucia’s balcony spot before the chapter ends — it is the only missable trophy in the game.', chips: ['Just Like Paradise', 'Paradise Lost', 'Positive Mental Attitude'], miss: true },
  { title: '3 · Chapter 2 — Vice City opens up', text: 'Finish the chapter. While you are here, play a frame at the Kolt & Associates bowling alley (Kingpin Bowling).', chips: ['T**s Ass Drug Money', 'Let’s Go Bowling'], miss: false },
  { title: '4 · Chapter 3 — the city', text: 'Finish the chapter. Do the Race Against Yago (hourglass icon) when it appears — it is time-sensitive.', chips: ['Vice City, Baby!'], miss: false },
  { title: '5 · Chapter 4 — endgame unlocks', text: 'Finish the chapter. Near the end, the strand “That’s Where The Money Is” unlocks the bank vaults — take it, bring your partner, and rob vaults for Maximum Withdrawal. Clear the stranger strands (Andy, Kenton, Billy, Randy, Tyrone, Bret).', chips: ['Top Of The World, Ma', 'Maximum Withdrawal', 'Strangers & Freaks'], miss: false },
  { title: '6 · Final mission', text: 'Save manually, then play the final mission. After the credits, free roam continues and the 100% checklist appears under Progress → Stats → 100% Completion.', chips: ['You Gotta Know When to Get Off'], miss: false },
  { title: '7 · Post-story cleanup — 100%', text: 'The long grind: 300 stunts, gold in all 42 Shooting Range challenges, 3 card sets, 100 WAiNK It spots, 200 of 277 vehicles, 39 illegal operations, 8 garages (~$160,000), 70 of 80 Challenges, 14 drone race wins. Finish it and A Long Road and the platinum pop together.', chips: ['A Long Road', 'Cunning Stunts', 'The Shootist', 'Don’t Touch My Deck'], miss: false },
];

const params = new URLSearchParams(location.search);
const listEl = document.getElementById('trophyList');
const detailEl = document.getElementById('detail');

let doc;
let earned = new Set();
try { earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]')); } catch { earned = new Set(); }
if (![...earned].every((n) => typeof n === 'string')) earned = new Set();

let state = {
  kind: params.get('kind') || 'all',
  grade: params.get('grade') || 'all',
  query: params.get('q') || '',
  spoiler: params.get('spoiler') ? params.get('spoiler') !== 'off' : (localStorage.getItem(SPOILER_KEY) ?? 'on') !== 'off',
  earnedOnly: false,
  selectedId: Number(params.get('trophy') || 28),
};

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
  localStorage.setItem(SPOILER_KEY, state.spoiler ? 'on' : 'off');
}

function isHidden(t) { return state.spoiler && t.hidden && !earned.has(t.name); }
function displayName(t) { return isHidden(t) ? 'Hidden trophy' : t.name; }
function displayDesc(t) { return isHidden(t) ? 'Story trophy — its name and description stay hidden until you earn it.' : t.description; }

function filtered() {
  const q = state.query.trim().toLowerCase();
  return doc.trophies.filter((t) => {
    if (state.kind === 'missable' && !t.missable) return false;
    if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.earnedOnly && !earned.has(t.name)) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
}

function gradeBadge(t) {
  return `<span class="grade-badge grade-${t.grade}">${t.grade}</span>`;
}

function renderRoadmap() {
  const ol = document.getElementById('roadmapSteps');
  ol.replaceChildren(...ROADMAP.map((s) => {
    const li = document.createElement('li');
    if (s.miss) li.className = 'miss';
    const strong = document.createElement('strong');
    strong.textContent = s.title;
    const span = document.createElement('span');
    span.textContent = s.text;
    const chips = document.createElement('div');
    chips.className = 'chips';
    for (const c of s.chips) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = c;
      chip.addEventListener('click', () => selectByName(c));
      chips.append(chip);
    }
    li.append(strong, span, chips);
    return li;
  }));
}

function renderProgress() {
  const total = doc.trophies.length;
  const n = earned.size;
  const pct = Math.round((n / total) * 100);
  document.getElementById('earnedCount').textContent = `${n} of ${total}`;
  document.getElementById('ringText').textContent = `${pct}%`;
  document.getElementById('ring').style.background =
    `conic-gradient(var(--accent2) ${pct * 3.6}deg, #3a2f5e 0deg)`;
  document.getElementById('barFill').style.width = `${pct}%`;
  const plat = earned.has('Vice Got a Price!');
  document.getElementById('platinumLine').textContent =
    plat ? 'Platinum: Vice Got a Price! — earned!' : 'Platinum: Vice Got a Price! — not yet';
}

function renderList() {
  const rows = filtered();
  document.getElementById('listMeta').textContent =
    `Showing ${rows.length} of ${doc.trophies.length} trophies · ${earned.size} earned · ${doc.trophies.filter((t) => t.missable).length} missable`;
  listEl.replaceChildren();
  if (!rows.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'No trophies match these filters.';
    listEl.append(p);
    return;
  }
  for (const t of rows) {
    const li = document.createElement('li');
    if (t.id === state.selectedId) li.classList.add('selected');
    if (earned.has(t.name)) li.classList.add('earned');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Mark ${displayName(t)} as earned`);
    box.addEventListener('change', (e) => {
      e.stopPropagation();
      toggleEarned(t);
    });
    const mid = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = displayName(t);
    if (isHidden(t)) {
      const tag = document.createElement('span');
      tag.className = 'hidden-tag';
      tag.textContent = ' · hidden story trophy';
      name.append(tag);
    }
    const desc = document.createElement('div');
    desc.className = 'desc';
    desc.textContent = displayDesc(t);
    const tags = document.createElement('div');
    tags.className = 'tags';
    const kindTag = document.createElement('span');
    kindTag.className = 'tag';
    kindTag.textContent = KIND_LABELS[t.kind] || t.kind;
    tags.append(kindTag);
    if (t.missable) {
      const m = document.createElement('span');
      m.className = 'tag missable';
      m.textContent = '⚠ MISSABLE';
      tags.append(m);
    }
    if (t.hidden) {
      const h = document.createElement('span');
      h.className = 'tag story';
      h.textContent = 'Hidden on PS5';
      tags.append(h);
    }
    if (t.count) {
      const c = document.createElement('span');
      c.className = 'tag';
      c.textContent = `Count: ${t.count.toLocaleString()}`;
      tags.append(c);
    }
    mid.append(name, desc, tags);
    const badge = document.createElement('span');
    badge.innerHTML = gradeBadge(t);
    li.append(box, mid, badge);
    li.addEventListener('click', (e) => {
      if (e.target === box) return;
      state.selectedId = t.id;
      renderList();
      renderDetail();
    });
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.setAttribute('aria-label', `${displayName(t)} — open guide`);
    li.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      state.selectedId = t.id;
      renderList();
      renderDetail();
    });
    listEl.append(li);
  }
}

function toggleEarned(t) {
  if (earned.has(t.name)) earned.delete(t.name);
  else earned.add(t.name);
  save();
  renderProgress();
  renderList();
  renderDetail();
}

function selectByName(name) {
  const t = doc.trophies.find((x) => x.name === name);
  if (!t) return;
  state.selectedId = t.id;
  state.kind = 'all';
  state.grade = 'all';
  state.query = '';
  document.getElementById('search').value = '';
  syncFilterButtons();
  renderList();
  renderDetail();
  document.getElementById('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderDetail() {
  const t = doc.trophies.find((x) => x.id === state.selectedId) || doc.trophies[0];
  state.selectedId = t.id;
  detailEl.replaceChildren();
  const h2 = document.createElement('h2');
  h2.textContent = displayName(t);
  const meta = document.createElement('div');
  meta.className = 'meta-row';
  const badge = document.createElement('span');
  badge.innerHTML = gradeBadge(t);
  meta.append(badge);
  const stage = document.createElement('span');
  stage.className = 'tag';
  stage.textContent = STAGE_LABELS[t.stage] || t.stage;
  meta.append(stage);
  const kind = document.createElement('span');
  kind.className = 'tag';
  kind.textContent = KIND_LABELS[t.kind] || t.kind;
  meta.append(kind);
  if (t.missable) {
    const m = document.createElement('span');
    m.className = 'tag missable';
    m.textContent = '⚠ MISSABLE';
    meta.append(m);
  }
  detailEl.append(h2, meta);

  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = `Official description: “${displayDesc(t)}”`;
  detailEl.append(official);

  if (isHidden(t)) {
    const box = document.createElement('div');
    box.className = 'spoiler-box';
    box.textContent = 'Spoiler protection is on: this story trophy’s name, description and guide stay hidden until you mark it earned. Turn “Hide story spoilers” off above to reveal it, or tick the box in the list once you have earned it.';
    detailEl.append(box);
  } else {
    if (t.missable) {
      const warn = document.createElement('div');
      warn.className = 'warn-box';
      warn.textContent = '⚠ MISSABLE — this is the only missable trophy in the game. Handle it in Chapter 1 (see the guide below) and keep a manual save from the start of Chapter 1.';
      detailEl.append(warn);
    }
    const h3 = document.createElement('h3');
    h3.textContent = 'Guide';
    const guide = document.createElement('p');
    guide.className = 'guide';
    guide.textContent = t.guide;
    const h3s = document.createElement('h3');
    h3s.textContent = 'Sources';
    const ul = document.createElement('ul');
    ul.className = 'sources';
    for (const s of t.sources || []) {
      const li = document.createElement('li');
      li.textContent = s;
      ul.append(li);
    }
    detailEl.append(h3, guide, h3s, ul);
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'earn-btn' + (earned.has(t.name) ? ' earned' : '');
  btn.textContent = earned.has(t.name) ? '✓ Earned — click to unmark' : 'Mark as earned';
  btn.addEventListener('click', () => toggleEarned(t));
  detailEl.append(btn);

  const nav = document.createElement('div');
  nav.className = 'nav';
  const idx = doc.trophies.findIndex((x) => x.id === t.id);
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.textContent = '← Previous trophy';
  prev.addEventListener('click', () => {
    state.selectedId = doc.trophies[(idx - 1 + doc.trophies.length) % doc.trophies.length].id;
    renderList();
    renderDetail();
  });
  const next = document.createElement('button');
  next.type = 'button';
  next.textContent = 'Next trophy →';
  next.addEventListener('click', () => {
    state.selectedId = doc.trophies[(idx + 1) % doc.trophies.length].id;
    renderList();
    renderDetail();
  });
  nav.append(prev, next);
  detailEl.append(nav);
}

function syncFilterButtons() {
  document.querySelectorAll('#kindFilters button').forEach((b) => {
    b.classList.toggle('active', b.dataset.kind === state.kind);
  });
  document.getElementById('grade').value = state.grade;
  document.getElementById('spoiler').checked = state.spoiler;
  document.getElementById('earnedOnly').checked = state.earnedOnly;
}

function bindControls() {
  document.getElementById('search').value = state.query;
  document.getElementById('search').addEventListener('input', (e) => {
    state.query = e.target.value;
    renderList();
  });
  document.querySelectorAll('#kindFilters button').forEach((b) => {
    b.addEventListener('click', () => {
      state.kind = b.dataset.kind;
      syncFilterButtons();
      renderList();
    });
  });
  document.getElementById('grade').addEventListener('change', (e) => {
    state.grade = e.target.value;
    renderList();
  });
  document.getElementById('spoiler').addEventListener('change', (e) => {
    state.spoiler = e.target.checked;
    save();
    renderList();
    renderDetail();
  });
  document.getElementById('earnedOnly').addEventListener('change', (e) => {
    state.earnedOnly = e.target.checked;
    renderList();
  });
  document.getElementById('exportBtn').addEventListener('click', () => {
    const payload = { game: 'Grand Theft Auto VI', platform: 'PlayStation 5', earned: [...earned] };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    a.download = 'gta6-trophy-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const names = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(names)) throw new Error('bad file');
      const known = new Set(doc.trophies.map((t) => t.name));
      earned = new Set(names.filter((n) => known.has(n)));
      save();
      renderProgress();
      renderList();
      renderDetail();
    } catch {
      alert('That file is not a valid trophy-progress export.');
    }
    e.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all earned trophies?')) return;
    earned = new Set();
    save();
    renderProgress();
    renderList();
    renderDetail();
  });
}

doc = await (await fetch('data/trophies.json')).json();
renderRoadmap();
bindControls();
syncFilterButtons();
renderProgress();
renderList();
renderDetail();
