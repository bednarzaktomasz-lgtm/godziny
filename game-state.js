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
 */
function reportResult(nodeId, starNum, isCorrect) {
  const state = loadGame();
  if (!state) return;
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
  saveGame(state);
}

/**
 * Oznacza gwiazdkę jako zdobytą i przyznaje +50 Sekund.
 * Zapisuje bestStreak sesji w state.nodes[nodeId][starKey].streak.
 */
function markStarCompleted(nodeId, starNum, bestStreak) {
  const state = loadGame();
  if (!state) return;
  const starKey = 'star' + starNum;
  if (!state.nodes[nodeId] || !state.nodes[nodeId][starKey]) return;
  if (!state.nodes[nodeId][starKey].completed) {
    state.nodes[nodeId][starKey].completed = true;
    state.nodes[nodeId][starKey].streak = bestStreak || 0;
    state.seconds += 50;
  }
  saveGame(state);
}

/**
 * Raportuje wynik w trybie Szybkiej Gry.
 * Brak XP; +5 Sekund za poprawną odpowiedź, limit 20 dziennie.
 */
function reportQuickGameResult(isCorrect) {
  const state = loadGame();
  if (!state) return;
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
  saveGame(state);
}

// ----- XP / Level helper -----

function getXpProgress(state) {
  const xpPerLevel = 500;
  const xp         = (state && state.xp) || 0;
  const level      = Math.max(1, Math.floor(xp / xpPerLevel) + 1);
  const levelStart = (level - 1) * xpPerLevel;
  const levelXp    = xp - levelStart;
  const pct        = Math.min(100, Math.round((levelXp / xpPerLevel) * 100));
  return { level, levelXp, xpPerLevel, pct };
}
