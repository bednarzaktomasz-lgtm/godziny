'use strict';

/* =======================================================
   game-state.js — Mistrz Czasu
   System profili użytkowników, zapis/odczyt postępu,
   eksport/import danych, migracja legacy.
   ======================================================= */

// ----- Stałe -----

const AVATARS = {
  'boy-1':  { emoji: '🧑‍🚀', label: 'Astronauta' },
  'boy-2':  { emoji: '🧙‍♂️', label: 'Czarodziej' },
  'boy-3':  { emoji: '🦸‍♂️', label: 'Superbohater' },
  'girl-1': { emoji: '👩‍🔬', label: 'Naukowiec' },
  'girl-2': { emoji: '🧚‍♀️', label: 'Wróżka' },
  'girl-3': { emoji: '🦸‍♀️', label: 'Superbohaterka' },
};

const SCHEMA_VERSION = 1;
const PROFILES_KEY   = 'mistrzCzasu_profiles';
const _saveKey       = id => `mistrzCzasu_save_${id}`;

// ----- ID generation -----

function _generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ----- Internal: read/write profiles root -----

function _readProfilesRoot() {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return { version: SCHEMA_VERSION, activeProfileId: null, profiles: [] };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.profiles)) parsed.profiles = [];
    return parsed;
  } catch {
    return { version: SCHEMA_VERSION, activeProfileId: null, profiles: [] };
  }
}

function _writeProfilesRoot(data) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(data));
}

// ----- 1.2: Zarządzanie profilami -----

function getProfiles() {
  return _readProfilesRoot().profiles;
}

function getActiveProfile() {
  const data = _readProfilesRoot();
  if (!data.activeProfileId) return null;
  return data.profiles.find(p => p.id === data.activeProfileId) || null;
}

function createProfile(name, avatar) {
  const trimmed = String(name).trim().slice(0, 20);
  if (!trimmed) throw new Error('Imię nie może być puste.');
  if (!AVATARS[avatar]) throw new Error('Nieprawidłowy awatar.');
  const id      = _generateId();
  const profile = { id, name: trimmed, avatar, createdAt: Date.now() };
  const data    = _readProfilesRoot();
  data.profiles.push(profile);
  data.activeProfileId = id;
  _writeProfilesRoot(data);
  const state = createDefaultState(id);
  localStorage.setItem(_saveKey(id), JSON.stringify(state));
  return profile;
}

function switchProfile(id) {
  const data = _readProfilesRoot();
  if (!data.profiles.find(p => p.id === id)) return false;
  data.activeProfileId = id;
  _writeProfilesRoot(data);
  return true;
}

function deleteProfile(id) {
  const data = _readProfilesRoot();
  data.profiles = data.profiles.filter(p => p.id !== id);
  if (data.activeProfileId === id) {
    data.activeProfileId = data.profiles.length > 0 ? data.profiles[0].id : null;
  }
  _writeProfilesRoot(data);
  localStorage.removeItem(_saveKey(id));
}

// ----- 1.1: Domyślny stan save -----

function createDefaultState(profileId) {
  const node = () => ({
    star1: { completed: false, score: 0, streak: 0 },
    star2: { completed: false, score: 0, streak: 0 },
    star3: { completed: false, score: 0, streak: 0 },
  });
  return {
    version:  SCHEMA_VERSION,
    profileId,
    lastVisit: Date.now(),
    xp:        0,
    seconds:   0,
    level:     1,
    streak:    { current: 0, best: 0, lastDate: null },
    nodes: {
      // Pętla 1 — cyfry arabskie
      'full-hours':     node(),
      'quarters':       node(),
      'half-past':      node(),
      'every-five':     node(),
      'every-minute':   node(),
      // Pętla 2 — cyfry rzymskie
      'roman-full':     node(),
      'roman-quarters': node(),
      'roman-half':     node(),
      'roman-five':     node(),
      'roman-minute':   node(),
      // Pętla 3 — bez cyfr
      'blank-full':     node(),
      'blank-quarters': node(),
      'blank-half':     node(),
      'blank-five':     node(),
      'blank-minute':   node(),
      // Pętla 4 — format 24h
      '24h-full':       node(),
      '24h-quarters':   node(),
      '24h-half':       node(),
      '24h-five':       node(),
      '24h-minute':     node(),
    },
    wardrobe: {
      unlockedBgs:       ['solid'],
      unlockedHandColors: ['white'],
      activeBg:           'solid',
      activeHandColor:    'white',
    },
    stats: {
      totalCorrect:         0,
      totalAttempts:        0,
      errorLog:             {},
      quickGameTodayCount:  0,
      quickGameLastDate:    null,
    },
    activityCalendar: {},
    achievements:     [],
  };
}

// ----- 1.3: Zapis / odczyt -----

function saveGame(state) {
  if (!state || !state.profileId) return;
  state.lastVisit = Date.now();
  localStorage.setItem(_saveKey(state.profileId), JSON.stringify(state));
}

function loadGame() {
  const data = _readProfilesRoot();
  const id   = data.activeProfileId;
  if (!id) return null;
  try {
    const raw = localStorage.getItem(_saveKey(id));
    if (!raw) {
      const fresh = createDefaultState(id);
      saveGame(fresh);
      return fresh;
    }
    return _mergeWithDefault(JSON.parse(raw), id);
  } catch {
    const fresh = createDefaultState(id);
    saveGame(fresh);
    return fresh;
  }
}

function resetGame() {
  const data = _readProfilesRoot();
  const id   = data.activeProfileId;
  if (!id) return;
  const fresh = createDefaultState(id);
  localStorage.setItem(_saveKey(id), JSON.stringify(fresh));
}

// Deep merge — zapewnia obecność wszystkich kluczy po zmianie schematu
function _mergeWithDefault(state, profileId) {
  const def = createDefaultState(profileId);
  for (const key of Object.keys(def)) {
    if (!(key in state)) state[key] = def[key];
  }
  for (const [nodeId, nodeDef] of Object.entries(def.nodes)) {
    if (!state.nodes[nodeId]) {
      state.nodes[nodeId] = nodeDef;
    } else {
      for (const [starId, starDef] of Object.entries(nodeDef)) {
        if (!state.nodes[nodeId][starId]) state.nodes[nodeId][starId] = starDef;
      }
    }
  }
  if (!state.wardrobe) {
    state.wardrobe = def.wardrobe;
  } else {
    for (const key of Object.keys(def.wardrobe)) {
      if (!(key in state.wardrobe)) state.wardrobe[key] = def.wardrobe[key];
    }
  }
  if (!state.stats) state.stats = def.stats;
  return state;
}

// ----- 1.4: Eksport / import -----

function exportProfile(id) {
  const data    = _readProfilesRoot();
  const profile = data.profiles.find(p => p.id === id);
  if (!profile) return;
  let save;
  try {
    const raw = localStorage.getItem(_saveKey(id));
    save = raw ? JSON.parse(raw) : createDefaultState(id);
  } catch {
    save = createDefaultState(id);
  }
  const blob = new Blob(
    [JSON.stringify({ version: SCHEMA_VERSION, profile, save }, null, 2)],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = `MistrzCzasu_${profile.name}_${new Date().toISOString().slice(0, 10)}.json`;
  a.style.position = 'fixed';
  a.style.opacity  = '0';
  a.style.pointerEvents = 'none';
  document.body.appendChild(a);
  a.dispatchEvent(new MouseEvent('click', { bubbles: false }));
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 100);
}

function importProfile(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 1_048_576) {
      reject(new Error('Plik jest za duży (maksimum 1 MB).'));
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.version || !parsed.profile || !parsed.save) {
          reject(new Error('Nieprawidłowy format pliku.'));
          return;
        }
        if (!parsed.profile.name || !parsed.profile.avatar || !parsed.save.nodes) {
          reject(new Error('Brakujące dane profilu.'));
          return;
        }
        const data  = _readProfilesRoot();
        let  newId  = parsed.profile.id;
        if (data.profiles.find(p => p.id === newId)) {
          newId = _generateId();
        }
        const newProfile = { ...parsed.profile, id: newId };
        const newSave    = { ...parsed.save,    profileId: newId };
        data.profiles.push(newProfile);
        _writeProfilesRoot(data);
        localStorage.setItem(_saveKey(newId), JSON.stringify(newSave));
        resolve(newProfile);
      } catch {
        reject(new Error('Nie można odczytać pliku JSON.'));
      }
    };
    reader.onerror = () => reject(new Error('Błąd odczytu pliku.'));
    reader.readAsText(file);
  });
}

// ----- 1.5: Migracja legacy -----

function migrateFromLegacy() {
  const data = _readProfilesRoot();
  if (data.profiles.length > 0) return; // już zmigrowano

  const legacyBg    = localStorage.getItem('zegar_clockBg');
  const legacyColor = localStorage.getItem('zegar_handColor');
  if (!legacyBg && !legacyColor) return; // brak danych do migracji

  const id      = _generateId();
  const profile = { id, name: 'Gracz', avatar: 'boy-1', createdAt: Date.now() };
  const state   = createDefaultState(id);

  const validBgs    = ['solid', 'spiral', 'grid', 'tech'];
  const validColors = ['white', 'blue', 'red'];

  if (legacyBg && validBgs.includes(legacyBg)) {
    state.wardrobe.activeBg = legacyBg;
    if (!state.wardrobe.unlockedBgs.includes(legacyBg)) {
      state.wardrobe.unlockedBgs.push(legacyBg);
    }
  }
  if (legacyColor && validColors.includes(legacyColor)) {
    state.wardrobe.activeHandColor = legacyColor;
    if (!state.wardrobe.unlockedHandColors.includes(legacyColor)) {
      state.wardrobe.unlockedHandColors.push(legacyColor);
    }
  }

  data.profiles.push(profile);
  data.activeProfileId = id;
  _writeProfilesRoot(data);
  localStorage.setItem(_saveKey(id), JSON.stringify(state));
}

// ----- 3.3 / 3.3b: Raportowanie wyników -----

/**
 * Raportuje wynik jednej odpowiedzi w trybie Wyprawy.
 * Wyprawa: +10 XP, +5 Sekund za poprawną.
 * Aktualizuje score węzła, stats, errorLog, activityCalendar.
 * @returns {{ newAchievements: Achievement[] }}
 */
function reportResult(nodeId, starNum, isCorrect) {
  const state = loadGame();
  if (!state) return { newAchievements: [] };
  const today = new Date().toISOString().slice(0, 10);

  if (isCorrect) {
    if (nodeId) {
      state.xp += 10;
      state.seconds += 5;
      const starKey = 'star' + starNum;
      if (state.nodes[nodeId] && state.nodes[nodeId][starKey]) {
        state.nodes[nodeId][starKey].score++;
      }
    }
    state.stats.totalCorrect++;
    state.level = Math.max(1, Math.floor(state.xp / 500) + 1);
    if (!state.activityCalendar[today]) state.activityCalendar[today] = 0;
    state.activityCalendar[today]++;
  } else {
    if (nodeId) {
      state.stats.errorLog[nodeId] = (state.stats.errorLog[nodeId] || 0) + 1;
    }
  }
  state.stats.totalAttempts++;
  const newAchievements = _checkAchievementsInPlace(state);
  saveGame(state);
  return { newAchievements };
}

/**
 * Oznacza gwiazdkę jako zdobytą i przyznaje +50 Sekund.
 * Zapisuje bestStreak sesji w state.nodes[nodeId][starKey].streak.
 * @returns {{ newAchievements: Achievement[] }}
 */
function markStarCompleted(nodeId, starNum, bestStreak) {
  const state = loadGame();
  if (!state) return { newAchievements: [] };
  const starKey = 'star' + starNum;
  if (!state.nodes[nodeId] || !state.nodes[nodeId][starKey]) return { newAchievements: [] };
  if (!state.nodes[nodeId][starKey].completed) {
    state.nodes[nodeId][starKey].completed = true;
    state.nodes[nodeId][starKey].streak = bestStreak || 0;
    state.seconds += 50;
  }
  saveGame(state);
  updateStreak();
  // Load fresh state (streaka już zaktualizowana) i sprawdź odznaki
  const updated = loadGame() || state;
  const newAchievements = _checkAchievementsInPlace(updated);
  if (newAchievements.length > 0) saveGame(updated);
  return { newAchievements };
}

/**
 * Raportuje wynik w trybie Szybkiej Gry.
 * Brak XP; +5 Sekund za poprawną odpowiedź, limit 20 dziennie.
 * @returns {{ newAchievements: Achievement[] }}
 */
function reportQuickGameResult(isCorrect) {
  const state = loadGame();
  if (!state) return { newAchievements: [] };
  const today = new Date().toISOString().slice(0, 10);

  if (state.stats.quickGameLastDate !== today) {
    state.stats.quickGameTodayCount = 0;
    state.stats.quickGameLastDate = today;
  }

  if (isCorrect && state.stats.quickGameTodayCount < 20) {
    state.seconds += 5;
    state.stats.quickGameTodayCount++;
  }

  if (isCorrect) state.stats.totalCorrect++;
  state.stats.totalAttempts++;
  if (!state.activityCalendar[today]) state.activityCalendar[today] = 0;
  if (isCorrect) state.activityCalendar[today]++;
  const newAchievements = _checkAchievementsInPlace(state);
  saveGame(state);
  return { newAchievements };
}

// ----- XP / Level helper -----

function getXpProgress(state) {
  const xpPerLevel = 500;
  const xp         = (state && state.xp) || 0;
  const level      = Math.max(1, Math.floor(xp / xpPerLevel) + 1);
  const nextLevelXp = level * xpPerLevel;    // wymagane XP do następnego poziomu
  const pct         = Math.min(100, Math.round((xp / nextLevelXp) * 100));
  return { level, xp, nextLevelXp, pct };
}

// ─── Passa / Anty-rdza ───────────────────────────────────────────────────

/**
 * Aktualizuje passę gracza po ukończeniu sesji.
 * Wołana automatycznie przez markStarCompleted().
 */
function updateStreak() {
  const state = loadGame();
  if (!state) return;
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const last      = state.streak.lastDate;

  if (last === today) {
    // Już aktualizowane dzisiaj — nic nie rób
  } else if (last === yesterday) {
    // Kontynuacja passy
    state.streak.current++;
    state.streak.best = Math.max(state.streak.best, state.streak.current);
    state.streak.lastDate = today;
  } else {
    // Reset lub pierwsza sesja
    state.streak.current  = 1;
    state.streak.best     = Math.max(state.streak.best, 1);
    state.streak.lastDate = today;
  }
  saveGame(state);
}

/**
 * Sprawdza czy zegar "rdzewieje" — brak ukończonej sesji od ponad doby.
 * Używana przy ładowaniu każdej strony z ClockRenderer.
 */
function isRusty() {
  const state = loadGame();
  if (!state) return false;
  const last = state.streak.lastDate;
  if (!last) return false;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  return last < yesterday;
}

// ─── Garderoba — sklep z kosmetykami ─────────────────────────────────────────

const SHOP_ITEMS = {
  bgs:    { solid: 0,   spiral: 500, grid: 1000, tech: 2000 },
  colors: { white: 0,   blue: 300,   red: 800 },
};

/**
 * Kupuje przedmiot z garderoby za Sekundy.
 * @param {'bgs'|'colors'} category
 * @param {string} itemId
 * @returns {{ ok: boolean, reason?: string, newAchievements?: Achievement[] }}
 */
function purchaseItem(category, itemId) {
  const state = loadGame();
  if (!state) return { ok: false, reason: 'no-save' };

  const prices = SHOP_ITEMS[category];
  if (!prices || !(itemId in prices)) return { ok: false, reason: 'invalid-item' };

  const price      = prices[itemId];
  const unlockedKey = category === 'bgs' ? 'unlockedBgs' : 'unlockedHandColors';

  if (state.wardrobe[unlockedKey].includes(itemId)) return { ok: false, reason: 'already-owned' };
  if (state.seconds < price) return { ok: false, reason: 'not-enough-seconds' };

  state.seconds -= price;
  state.wardrobe[unlockedKey].push(itemId);
  const newAchievements = _checkAchievementsInPlace(state);
  saveGame(state);
  return { ok: true, newAchievements };
}

/**
 * Zakłada (aktywuje) przedmiot z garderoby — musi być wcześniej odblokowany.
 * @param {'bgs'|'colors'} category
 * @param {string} itemId
 * @returns {{ ok: boolean, reason?: string }}
 */
function equipItem(category, itemId) {
  const state = loadGame();
  if (!state) return { ok: false, reason: 'no-save' };

  const unlockedKey = category === 'bgs' ? 'unlockedBgs' : 'unlockedHandColors';
  const activeKey   = category === 'bgs' ? 'activeBg'    : 'activeHandColor';

  if (!state.wardrobe[unlockedKey].includes(itemId)) return { ok: false, reason: 'not-owned' };

  state.wardrobe[activeKey] = itemId;
  saveGame(state);
  return { ok: true };
}

// ─── Faza 6: Odznaki i Trofea ─────────────────────────────────────────────────

/**
 * Definicja 9 odznak aplikacji.
 * check(state) — czysta funkcja, zwraca true gdy warunek spełniony.
 */
const ACHIEVEMENTS = [
  {
    id:   'first-star',
    icon: '🥇',
    name: 'Pierwsze Kroki',
    desc: 'Zdobądź pierwszą gwiazdkę',
    check: s => Object.values(s.nodes).some(n =>
      n.star1.completed || n.star2.completed || n.star3.completed),
  },
  {
    id:   'first-island',
    icon: '🏝️',
    name: 'Wyspiarz',
    desc: 'Ukończ dowolną wyspę (3 gwiazdki na jednym węźle)',
    check: s => Object.values(s.nodes).some(n =>
      n.star1.completed && n.star2.completed && n.star3.completed),
  },
  {
    id:   'quarters-king',
    icon: '⏱️',
    name: 'Kwadransowy Król',
    desc: 'Wszystkie 3 gwiazdki na Zatoce Kwadransów',
    check: s => {
      const n = s.nodes['quarters'];
      return n && n.star1.completed && n.star2.completed && n.star3.completed;
    },
  },
  {
    id:   'roman-expert',
    icon: '🏛️',
    name: 'Rzymski Ekspert',
    desc: 'Ukończ całą pętlę cyfr rzymskich (5 wysp)',
    check: s => ['roman-full','roman-quarters','roman-half','roman-five','roman-minute']
      .every(id => {
        const n = s.nodes[id];
        return n && n.star1.completed && n.star2.completed && n.star3.completed;
      }),
  },
  {
    id:   'arabic-master',
    icon: '🌍',
    name: 'Mistrz Arabskich Cyfr',
    desc: 'Ukończ całą pętlę cyfr arabskich (5 wysp)',
    check: s => ['full-hours','quarters','half-past','every-five','every-minute']
      .every(id => {
        const n = s.nodes[id];
        return n && n.star1.completed && n.star2.completed && n.star3.completed;
      }),
  },
  {
    id:   'blank-conqueror',
    icon: '🕷️',
    name: 'Zdobywca Ciemności',
    desc: 'Ukończ całą pętlę bez cyfr (5 wysp)',
    check: s => ['blank-full','blank-quarters','blank-half','blank-five','blank-minute']
      .every(id => {
        const n = s.nodes[id];
        return n && n.star1.completed && n.star2.completed && n.star3.completed;
      }),
  },
  {
    id:   '24h-chrononaut',
    icon: '🌌',
    name: 'Chrononauta',
    desc: 'Ukończ całą pętlę 24h (5 wysp)',
    check: s => ['24h-full','24h-quarters','24h-half','24h-five','24h-minute']
      .every(id => {
        const n = s.nodes[id];
        return n && n.star1.completed && n.star2.completed && n.star3.completed;
      }),
  },
  {
    id:   'master',
    icon: '👑',
    name: 'Mistrz Czasu',
    desc: 'Wszystkie 20 wysp × 3 gwiazdki',
    check: s => Object.values(s.nodes).every(n =>
      n.star1.completed && n.star2.completed && n.star3.completed),
  },
  {
    id:   'streak-7',
    icon: '🔥',
    name: 'Seria 7',
    desc: 'Zagraj 7 dni z rzędu',
    check: s => (s.streak.current >= 7 || s.streak.best >= 7),
  },
  {
    id:   'streak-30',
    icon: '🌟',
    name: 'Seria 30',
    desc: 'Zagraj 30 dni z rzędu',
    check: s => (s.streak.current >= 30 || s.streak.best >= 30),
  },
  {
    id:   'connoisseur',
    icon: '🎨',
    name: 'Koneser',
    desc: 'Odblokuj wszystkie style tarcz i kolory wskazówek',
    check: s => ['spiral','grid','tech'].every(b => s.wardrobe.unlockedBgs.includes(b))
              && ['blue','red'].every(c => s.wardrobe.unlockedHandColors.includes(c)),
  },
  {
    id:   'century',
    icon: '💯',
    name: 'Setka',
    desc: '100 poprawnych odpowiedzi łącznie',
    check: s => s.stats.totalCorrect >= 100,
  },
  {
    id:   'tricent',
    icon: '🚀',
    name: 'Trzysta!',
    desc: '300 poprawnych odpowiedzi łącznie',
    check: s => s.stats.totalCorrect >= 300,
  },
  {
    id:   'sexcent',
    icon: '⚡',
    name: 'Sześćsetka',
    desc: '600 poprawnych odpowiedzi łącznie',
    check: s => s.stats.totalCorrect >= 600,
  },
  {
    id:   'millennium',
    icon: '👑',
    name: 'Tysiącznik',
    desc: '1000 poprawnych odpowiedzi łącznie',
    check: s => s.stats.totalCorrect >= 1000,
  },
];

/**
 * Sprawdza niezdobyte jeszcze odznaki dla podanego stanu gry.
 * Mutuje state.achievements — dodaje nowo zdobyte.
 * NIE wywołuje saveGame — wywołujący jest za to odpowiedzialny.
 * @param {object} state
 * @returns {Array} nowo zdobyte odznaki (obiekty z ACHIEVEMENTS)
 */
function _checkAchievementsInPlace(state) {
  if (!state) return [];
  if (!Array.isArray(state.achievements)) state.achievements = [];
  const now         = new Date().toISOString().slice(0, 10);
  const alreadyEarned = new Set(state.achievements.map(a => a.id));
  const newlyEarned   = [];
  for (const ach of ACHIEVEMENTS) {
    if (!alreadyEarned.has(ach.id) && ach.check(state)) {
      state.achievements.push({ id: ach.id, earnedAt: now });
      newlyEarned.push(ach);
    }
  }
  return newlyEarned;
}

/**
 * Publiczna wersja checkAchievements — ładuje stan i sprawdza odznaki.
 * Używana przez trofea.html i inne strony, które nie mają dostępu do stanu.
 * @returns {{ earned: string[], details: object[] }}  — id + data zdobycia
 */
function getAchievements() {
  const state = loadGame();
  if (!state) return { earned: [], details: [] };
  if (!Array.isArray(state.achievements)) return { earned: [], details: [] };
  const earned = state.achievements.map(a => a.id);
  const details = ACHIEVEMENTS.map(ach => {
    const record = state.achievements.find(a => a.id === ach.id);
    return { ...ach, earnedAt: record ? record.earnedAt : null };
  });
  return { earned, details };
}

