# Wiedza: Generowanie pytań z progresją trudności

## Problem

W aplikacji "Mistrz Czasu" tryb Wyprawa opiera się na progresywnie ułożonych wyspach:

| Wyspa | Minuty (zamierzony zakres) |
|-------|--------------------------|
| Wyspa Pełnych Godzin | :00 |
| Zatoka Kwadransów | :15, :45 |
| Góry Wpół do | :30 |
| Dolina Co Pięć Minut | :05, :10, :20, :25, :35, :40, :50, :55 |
| Morze Każdej Minuty | :01–:04, :06–:09, :11–:14... (nie-wielokrotności 5) |

Każda wyspa miała uczyć **nowego materiału** — kwadranse, potem "wpół do" itd.

W praktyce jednak na wyspie "Zatoka Kwadransów" pojawiały się pytania takie jak `08:30` (typowe dla "Gór Wpół do") albo `07:00` (pełna godzina z pierwszej wyspy). Gracz był egzaminowany z czegoś, czego jeszcze oficjalnie nie przerobił — lub czego już nie ćwiczy.

---

## Przyczyna — dwa niezależne błędy, które się nałożyły

### Błąd 1 — kumulatywna definicja `minutes` w NODE_CONFIG

`NODE_CONFIG` definiował pole `minutes` jako **narastającą pulę** (każdy kolejny poziom zawierał wszystkie poprzednie):

```javascript
'quarters': { minutes: [0, 15, 30, 45] }  // 0 i 30 to inne wyspy!
'half-past': { minutes: [0, 30] }          // 0 to inna wyspa!
```

Taka definicja ma sens dla **trybu sandbox** (Szybka Gra), gdzie gracz sam wybiera zakres i dobrze, że losuje z całego dotychczasowego materiału. Ale w trybie Wyprawa, gdzie wyspa ma testować konkretny nowy materiał, jest błędem.

### Błąd 2 — `generateQuestion()` ignorowała pole `exclusiveMinutes`

Po dodaniu pola `exclusiveMinutes` (z wyłącznie unikalnymi minutami danej wyspy) do `NODE_CONFIG`, centralny generator pytań `question-logic.js` nadal czytał stare pole `minutes`:

```javascript
// question-logic.js — przed poprawką
function generateQuestion(nodeConfig, attemptHistory) {
  const minutes = nodeConfig.minutes || [0];  // exclusiveMinutes zignorowane!
  ...
}
```

Efekt: nowe pole istniało w danych, ale nigdy nie było używane.

---

## Rozwiązanie

### 1. Rozdzielenie puli na dwa pola w NODE_CONFIG

```javascript
'quarters': {
  minutes:          [0, 15, 30, 45],   // pełna pula — dla sandbox/szybkiej gry
  exclusiveMinutes: [15, 45],          // tylko nowy materiał — dla trybu Wyprawa
  ...
}
```

Zasada przypisywania `exclusiveMinutes`:
- Wyspa X dostaje tylko minuty, które **nie wystąpiły na żadnej wcześniejszej wyspie**
- `every-five` → wyklucza 0, 15, 30, 45 (już na poprzednich wyspach)
- `every-minute` → wyklucza wszystkie wielokrotności 5 (już opanowane wcześniej)

### 2. Priorytet `exclusiveMinutes` w `generateQuestion()`

```javascript
// question-logic.js — po poprawce
function generateQuestion(nodeConfig, attemptHistory) {
  const minutes = nodeConfig.exclusiveMinutes || nodeConfig.minutes || [0];
  ...
}
```

Fallback na `minutes` zapewnia wsteczną kompatybilność gdy `exclusiveMinutes` nie jest zdefiniowane.

---

## Zasady ogólne — do stosowania w przyszłości

### Przy projektowaniu progresji trudności w quizach/grach edukacyjnych:

1. **Rozróżniaj "pula do ćwiczenia" od "pula do testowania nowego materiału".**  
   Są to dwie różne potrzeby — trzymaj je w osobnych polach nawet jeśli początkowo wydają się zbędne.

2. **Każdy poziom trudności powinien mieć zdefiniowany swój *unikalny* zakres materiału.**  
   Kumulatywna pula (`minutes`) ma sens jako "ucząco-ćwiczącą", ale do testu konkretnej wyspy używaj tylko jej wyłącznych elementów.

3. **Gdy generator pytań i konfiguracja wysp są w osobnych plikach — upewnij się, że generator czyta odpowiednie pole.**  
   Łatwo przeoczysz, że plik logiki i plik konfiguracji nie są zsynchronizowane po dodaniu nowego pola.

4. **Testuj każdą wyspę izolowanie** — uruchom 10–20 pytań i sprawdź czy pojawiają się elementy z poprzednich etapów. Błąd tego rodzaju nie generuje żadnego komunikatu w konsoli.

5. **Nazwa pola powinna jednoznacznie sugerować przeznaczenie** — `exclusiveMinutes` vs `minutes` to dobry wzorzec; `minutes` vs `minutesForSandbox` też by działało. Unikaj jednego wielofunkcyjnego pola, które "czasem" robi jedno, "czasem" drugie.

---

## Pliki których dotyczył błąd

- `question-logic.js` — centralny generator pytań (główna naprawa)
- `godziny.html`, `wpisz.html`, `ustaw.html` — każdy zawiera własną kopię `NODE_CONFIG` z polami `minutes`; do każdego dodano `exclusiveMinutes`
