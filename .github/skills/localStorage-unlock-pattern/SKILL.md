---
name: localStorage-unlock-pattern
description: "Wzorzec odblokowania funkcji przez klucz localStorage. Użyj gdy: implementujesz minigry z poziomami, które odblokowują kafelki/tryby w innej części aplikacji; tworzysz przycisk 'Graj od nowa' lub 'Restart'; eksportujesz/importujesz profil użytkownika zawierający postęp minigilr."
---

# Wzorzec: Odblokowanie przez klucz localStorage (localStorage-unlock-pattern)

## Kiedy stosować

- Minigrą ma poziomy przechowywane w osobnym kluczu localStorage (np. `app_romanLevel_<profileId>`)
- Inny ekran/kafelek sprawdza wartość tego klucza i blokuje/odblokowuje dostęp (`value >= N`)
- Implementujesz przycisk restartu ("Graj od nowa", "Od początku")
- Eksportujesz lub importujesz profil użytkownika

---

## Zasady implementacji

### 1. Klucz localStorage przechowuje MAKSIMUM osiągniętego poziomu, nie bieżący poziom sesji

```javascript
function onRoundComplete() {
  const prevLevel  = currentLevel;
  currentLevel     = Math.min(currentLevel + 1, LEVELS.length - 1);

  // ✅ DOBRZE — zapisuj tylko gdy nowy poziom jest wyższy
  const stored = parseInt(localStorage.getItem(getLevelKey()) || '0', 10);
  if (currentLevel > stored) {
    localStorage.setItem(getLevelKey(), currentLevel);
  }

  // ❌ ŹLE — bezwarunkowy setItem po restarcie może nadpisać max wartość niższą
  // localStorage.setItem(getLevelKey(), currentLevel);
}
```

### 2. Restart NIE kasuje localStorage, gdy klucz warunkuje unlock w innym miejscu

```javascript
document.getElementById('playAgainBtn').addEventListener('click', () => {
  currentLevel = 0;  // zeruje tylko zmienną w pamięci — sesja startuje od 1

  // ✅ DOBRZE — NIE pisz localStorage.setItem tutaj
  // ❌ ŹLE: localStorage.setItem(getLevelKey(), 0);  ← niszczy rekord

  finishOverlay.classList.remove('open');
  buildGrid();
});
```

**Wyjątek:** jeśli minigrą NIE warunkuje żadnego unlocka, reset w restarcie jest OK
(gracze przy kolejnej wizycie startują od poziomu 1, a nie ostatniego osiągniętego).

### 3. Ekran sprawdzający unlock czyta klucz po załadowaniu strony

```javascript
(function checkUnlock() {
  const profile = (typeof getActiveProfile === 'function') ? getActiveProfile() : null;
  const key     = profile
    ? `app_romanLevel_${profile.id}`
    : 'app_romanLevel_guest';

  if (parseInt(localStorage.getItem(key) || '0', 10) >= 9) {
    const btn = document.getElementById('bonusBtn');
    if (btn) {
      btn.classList.remove('locked');
      btn.querySelector('.lock-icon')?.remove();
    }
  }
})();
```

### 4. Eksport profilu MUSI zawierać wszystkie klucze per-profil

```javascript
function exportProfile(id) {
  // ... odczyt save ...

  // Zbierz klucze minigilr
  const extraKeys = [
    `app_romanLevel_${id}`,
    `app_romanBonusLevel_${id}`,
    // dodaj kolejne klucze przy rozbudowie
  ];
  const localStorageExtras = {};
  for (const key of extraKeys) {
    const val = localStorage.getItem(key);
    if (val !== null) localStorageExtras[key] = val;
  }

  // Dołącz jako pole TOP-LEVEL w JSON (nie zagnieżdżaj wewnątrz save!)
  const blob = new Blob(
    [JSON.stringify({ version, profile, save, localStorageExtras }, null, 2)],
    { type: 'application/json' }
  );
}
```

### 5. Import musi zamieniać stare ID profilu na nowe

```javascript
if (parsed.localStorageExtras && typeof parsed.localStorageExtras === 'object') {
  for (const [rawKey, value] of Object.entries(parsed.localStorageExtras)) {
    const key = rawKey.replace(parsed.profile.id, newId);  // zamień placeholder
    localStorage.setItem(key, String(value));
  }
}
```

### 6. Struktura pliku JSON eksportu — `localStorageExtras` na poziomie głównym

```json
{
  "version": 1,
  "profile": { "id": "abc123", "name": "Zuzia", ... },
  "save": { ... },
  "localStorageExtras": {
    "app_romanLevel_abc123": "9",
    "app_romanBonusLevel_abc123": "13"
  }
}
```

> ❌ BŁĄD: `localStorageExtras` zagnieżdżone wewnątrz `save` — `importProfile` nigdy go nie znajdzie.

---

## Checklist przy implementacji nowej minigry z poziomami

- [ ] Klucz localStorage per profil: `app_<gra>Level_<profileId>`
- [ ] `getLevelKey()` zwraca klucz per profil (lub `_guest` jeśli brak profilu)
- [ ] `onRoundComplete` zapisuje do localStorage tylko gdy `newLevel > stored`
- [ ] `playAgainBtn` NIE wywołuje `localStorage.setItem` (jeśli klucz warunkuje unlock)
- [ ] Ekran z unlockowanym kafelkiem wywołuje `checkUnlock()` przy starcie
- [ ] `exportProfile()` zawiera klucz w tablicy `extraKeys`
- [ ] `importProfile()` obsługuje `localStorageExtras` z zamianą ID
- [ ] Ręcznie tworzony JSON testowy ma `localStorageExtras` na poziomie głównym

---

## Przykład zastosowania (projekt Mistrz Czasu)

| Minigrą | Klucz | Próg unlocka | Co odblokowuje |
|---------|-------|-------------|----------------|
| `roman-pairs.html` | `mistrzCzasu_romanLevel_<id>` | `>= 9` | kafelek "Wielkie Liczby" w `szybka-gra.html` |
| `roman-pairs-bonus.html` | `mistrzCzasu_romanBonusLevel_<id>` | `>= 13` | odznaka "Wielki Mistrz Liczb" |
| `kalendarz-dni.html` | `mistrzCzasu_kalDniLevel_<id>` | `>= 5` | odznaka "Pan Tygodnia" |
| `kalendarz-miesiace.html` | `mistrzCzasu_kalMiesLevel_<id>` | `>= 11` | odznaka "Mistrz Kalendarza" |
