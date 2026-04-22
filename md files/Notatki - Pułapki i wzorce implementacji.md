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
