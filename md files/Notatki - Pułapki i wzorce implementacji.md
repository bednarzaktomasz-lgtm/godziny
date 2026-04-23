# Notatki — Pułapki i wzorce implementacji

Plik do zbierania wniosków z naprawionych błędów i sprawdzonych rozwiązań.

---

## 1. Blokowanie interakcji przy opóźnionym feedbacku (setTimeout)

**Kontekst:** Ćwiczenie parowania kart (`roman-pairs.html`) — po wyborze dwóch kart
następuje 1000ms opóźnienie przed sprawdzeniem pary.

**Problem:** `locked = true` było ustawione dopiero **wewnątrz** callbacka `checkPair()`.
Przez cały czas opóźnienia gracz mógł kliknąć trzecią kartę, co powodowało błędny stan
i trwałe zablokowanie gry (żaden element nie reagował).

**Poprawny wzorzec:**
```javascript
if (selectedArabic && selectedRoman) {
  locked = true;               // ← ZAWSZE przed setTimeout
  setTimeout(checkPair, 1000);
}
```

**Zasada ogólna:** Wszędzie gdzie jest `setTimeout` przed sprawdzeniem odpowiedzi —
`locked = true` musi wyprzedzać `setTimeout`, nie być wewnątrz callbacka.

---

## 2. Efekt hover przyklejający się na urządzeniach dotykowych

**Kontekst:** Przyciski odpowiedzi w `godziny.html` — na tablecie po tapnięciu przycisku
stan `:hover` pozostawał widoczny w kolejnym pytaniu, sugerując dziecku poprawną odpowiedź.

**Problem:** CSS `:hover` na urządzeniach dotykowych (tablet, telefon) jest wyzwalany przez
dotknięcie i nie znika automatycznie po podniesieniu palca. Przeglądarka traktuje ostatni
dotknięty element jako "hovered" do czasu kolejnej interakcji.

**Poprawny wzorzec:**
```css
/* ŹLE — hover działa też na urządzeniach dotykowych */
.answer-btn:hover { background: #1a1a1a; border-color: #444; }

/* DOBRZE — hover tylko gdy urządzenie ma prawdziwy kursor (mysz/touchpad) */
@media (hover: hover) {
  .answer-btn:hover { background: #1a1a1a; border-color: #444; }
}
```

**Zasada ogólna:** Każdy styl `:hover` na elementach interaktywnych (przyciski, karty)
należy owijać w `@media (hover: hover)`. Dotyczy wszystkich stron, na których grają dzieci
na tabletach.

---

## 3. NODE_CONFIG musi być powielony we wszystkich plikach gier

**Kontekst:** Dodanie nowej pętli wyspy (np. pętla 4 — Godziny 13–24) do `mapa.html`.

**Problem:** `mapa.html` definiuje `NODE_CONFIG` tylko do wyświetlania mapy. Każda gra
(`godziny.html`, `wpisz.html`, `ustaw.html`) ma **własną, niezależną kopię** `NODE_CONFIG`
z parametrami pytań (`minutes`, `exclusiveMinutes`, `dialType`, `hourFormat`).
Dodanie węzłów tylko w `mapa.html` powoduje, że gry nie wiedzą jak generować pytania
dla nowych wysp — `nodeConf` jest `null` i generowane są pytania z dowolnego zakresu.

**Poprawny wzorzec:** Przy każdym dodaniu nowego węzła do mapy — zaktualizować NODE_CONFIG
we **wszystkich czterech** plikach: `mapa.html`, `godziny.html`, `wpisz.html`, `ustaw.html`.

---

## 4. Ograniczenie zakresu godzin — parametry hourMin / hourMax

**Kontekst:** Pętla 4 (Godziny 13–24) — pytania powinny dotyczyć wyłącznie godzin 13–24,
a nie losowego zakresu 1–24.

**Problem:** `question-logic.js` i funkcja `randomHour()` w grach używały stałego zakresu
`1–12` lub `1–23`, ignorując że dany węzeł może wymagać zawężonego zakresu.

**Rozwiązanie:** Dodano opcjonalne parametry `hourMin` i `hourMax` do konfiguracji węzła:
```javascript
'pm-full': { ..., hourFormat: '24', hourMin: 13 }
```
`question-logic.js` czyta je przy generowaniu pytania:
```javascript
const minHour = nodeConfig.hourMin || 1;
const maxHour = nodeConfig.hourMax || (is24h ? 23 : 12);
const hour    = Math.floor(Math.random() * (maxHour - minHour + 1)) + minHour;
```
Funkcja `randomHour()` w grach też musi respektować te parametry (używana do dystraktorów).

**Zasada ogólna:** Każdy węzeł z zawężonym zakresem godzin musi definiować `hourMin`/`hourMax`.
Tarcza AM/PM (słońce/księżyc) włącza się automatycznie gdy `hourFormat: '24'` jest ustawione.

---

## 5. Dodatkowe klucze localStorage przy eksporcie/imporcie profilu

**Kontekst:** Minigry (`roman-pairs.html`, `roman-pairs-bonus.html`) przechowują poziom postępu
w osobnych kluczach localStorage poza głównym `save` profilu:
`mistrzCzasu_romanLevel_<profileId>`, `mistrzCzasu_romanBonusLevel_<profileId>`.

**Problem:** Funkcja `importProfile()` w `game-state.js` importowała tylko `profile` i `save`,
pomijając te klucze. Po imporcie profil był bez postępu w minigrach (bonus zablokowany).

**Rozwiązanie:** Dodano obsługę opcjonalnego pola `localStorageExtras` w pliku importu:
```json
"localStorageExtras": {
  "mistrzCzasu_romanLevel_hania-test-001": "9"
}
```
Przy imporcie placeholder starego ID jest zastępowany nowym ID:
```javascript
const key = rawKey.replace(parsed.profile.id, newId);
localStorage.setItem(key, String(value));
```

**Zasada ogólna:** Każda minigrowa lub globalna informacja trzymana poza `save`
musi być uwzględniona w `localStorageExtras` przy ręcznym tworzeniu pliku JSON profilu.
Wartość poziomu `>= 9` dla `romanLevel` odblokowuje bonus w `szybka-gra.html`.

---

## 6. exportProfile nie dołączał localStorageExtras do pliku JSON

**Kontekst:** Eksport profilu z `profil.html` → import na innym urządzeniu → kafelek
"Wielkie Liczby" (`roman-pairs-bonus.html`) pozostawał zablokowany mimo ukończenia
wszystkich 10 poziomów Cyfr Rzymskich.

**Problem (dwa błędy naraz):**

1. **`exportProfile()` w `game-state.js`** budowało JSON tylko z `{ version, profile, save }`.
   Klucze `mistrzCzasu_romanLevel_<id>`, `mistrzCzasu_romanBonusLevel_<id>`,
   `mistrzCzasu_kalDniLevel_<id>`, `mistrzCzasu_kalMiesLevel_<id>` były **pomijane**,
   więc po imporcie odczytywana była wartość `0` zamiast rzeczywistego poziomu.

2. **Ręcznie tworzony plik JSON** miał `localStorageExtras` zagnieżdżone **wewnątrz `save`**
   zamiast na **poziomie głównym**. `importProfile` czyta `parsed.localStorageExtras`
   (top-level), więc zagnieżdżony obiekt był niewidoczny.

**Poprawka `exportProfile` — zbieranie kluczy per profil:**
```javascript
const extraKeys = [
  `mistrzCzasu_romanLevel_${id}`,
  `mistrzCzasu_romanBonusLevel_${id}`,
  `mistrzCzasu_kalDniLevel_${id}`,
  `mistrzCzasu_kalMiesLevel_${id}`,
];
const localStorageExtras = {};
for (const key of extraKeys) {
  const val = localStorage.getItem(key);
  if (val !== null) localStorageExtras[key] = val;
}
// Blob z dołączonym localStorageExtras:
JSON.stringify({ version, profile, save, localStorageExtras }, null, 2)
```

**Poprawna struktura pliku JSON (top-level):**
```json
{
  "version": 1,
  "profile": { ... },
  "save": { ... },
  "localStorageExtras": {
    "mistrzCzasu_romanLevel_hania-test-001": "9",
    "mistrzCzasu_romanBonusLevel_hania-test-001": "13"
  }
}
```

**Zasada ogólna:** Przy dodaniu nowej minigry trzymającej poziom w osobnym kluczu
localStorage — dopisać ten klucz do listy `extraKeys` w `exportProfile()`.
`localStorageExtras` **zawsze** na poziomie głównym JSON, nigdy wewnątrz `save`.

---

## 7. Restart roman-pairs.html kasował romanLevel — tracąc odblokowanie Wielkich Liczb

**Kontekst:** `roman-pairs.html` — przycisk "Graj od nowa" po ukończeniu wszystkich 10 poziomów.

**Problem (dwa etapy):**

1. `playAgainBtn` zerował `localStorage.setItem(getRomanLevelKey(), 0)` — to usunęliśmy.
2. Po restarcie `onRoundComplete` przy każdym ukończeniu kolejnego poziomu **nadpisywał**
   localStorage nową (niższą) wartością, np. ukończenie poziomu 1 zapisywało `1`, niszcząc
   wcześniejszą wartość `9`. Kafelek blokował się po pierwszej zakończonej rundzie.

**Poprawka — `onRoundComplete` w `roman-pairs.html`:** zapisuj tylko gdy nowy poziom jest wyższy:
```javascript
const stored = parseInt(localStorage.getItem(getRomanLevelKey()) || '0', 10);
if (currentLevel > stored) {
  localStorage.setItem(getRomanLevelKey(), currentLevel);
}
```

**Restart — `playAgainBtn`:** bez `localStorage.setItem` (tylko zeruje `currentLevel` w pamięci):
```javascript
document.getElementById('playAgainBtn').addEventListener('click', () => {
  currentLevel = 0;
  // Nie nadpisuj localStorage — romanLevel >= 9 musi pozostać dla odblokowania
  finishOverlay.classList.remove('open');
  buildGrid();
});
```

**Zasada ogólna:** Jeśli klucz localStorage **warunkuje unlock** w innej stronie,
`localStorage.setItem` w `onRoundComplete` musi zapisywać tylko **max osiągniętego poziomu**,
nie bieżącą wartość po restarcie. Wzorzec: `if (newLevel > stored) setItem(newLevel)`.

Dla miniatur **bez zależności unlock** (`roman-pairs-bonus.html`, `kalendarz-dni.html`,
`kalendarz-miesiace.html`) reset w restarcie i bezwarunkowy `setItem` w `onRoundComplete`
są prawidłowe — poziom powinien śledzić bieżącą sesję, nie rekord.
