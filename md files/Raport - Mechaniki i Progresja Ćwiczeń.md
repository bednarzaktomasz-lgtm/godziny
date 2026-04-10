# Raport: Mechaniki i Progresja Ćwiczeń
*Podstawa do samodzielnego ułożenia planu połączeń ćwiczeń*

---

## 1. Ścieżka Progressu — Wyprawa (20 węzłów)

### Zasady odblokowania

- Węzeł **0** (`full-hours`) jest zawsze dostępny.
- Każdy kolejny węzeł odblokuje się, gdy poprzedni ma **minimum 1 gwiazdkę**.
- Węzeł **ukończony** = wszystkie 3 gwiazdki zdobyte.

### Warunek zdobycia gwiazdki (tryb Wyprawa)

```
8 poprawnych odpowiedzi ORAZ seria 6 pod rząd (bestStreak ≥ 6)
```

- Błąd zeruje bieżącą serię, ale nie resetuje licznika poprawnych (`total`).
- Każda gwiazdka to osobna sesja w innym trybie gry:
  - **⭐ Gwiazdka 1** → `godziny.html` (gra wyboru: 4 przyciski)
  - **⭐⭐ Gwiazdka 2** → `wpisz.html` (gra klawiatury: wpisz godzinę)
  - **⭐⭐⭐ Gwiazdka 3** → `ustaw.html` (gra ustawienia: obróć wskazówki)

### 20 węzłów — pełna lista

#### Pętla 1 — Cyfry Arabskie (tarcza z cyframi 1–12)

| # | ID węzła | Nazwa wyspy | Minuty w sesji (exclusiveMinutes) |
|---|----------|-------------|-----------------------------------|
| 0 | `full-hours` | 🏝️ Wyspa Pełnych Godzin | :00 |
| 1 | `quarters` | 🌊 Zatoka Kwadransów | :15, :45 |
| 2 | `half-past` | 🏔️ Góry „Wpół do" | :30 |
| 3 | `every-five` | 🌿 Dolina Co Pięć Minut | :05 :10 :20 :25 :35 :40 :50 :55 |
| 4 | `every-minute` | 🌀 Morze Każdej Minuty | minuty nie będące wielokrotnościami 5 (np. :01 :02 :03…) |

> **Uwaga:** `exclusiveMinutes` to minuty **charakterystyczne dla węzła** — pomijające te, które uczeń już zna z poprzednich węzłów. Np. węzeł `every-five` pyta tylko o :05 :10 :20…, nie o :00 :15 :30 :45 (bo te były wcześniej).

#### Pętla 2 — Cyfry Rzymskie (tarcza z I–XII)

| # | ID węzła | Nazwa wyspy | Minuty w sesji |
|---|----------|-------------|----------------|
| 5 | `roman-full` | 🏛️ Wyspa Cyfr Rzymskich | :00 |
| 6 | `roman-quarters` | 🗿 Forum Kwadransów | :15, :45 |
| 7 | `roman-half` | ⚔️ Koloseum Wpół do | :30 |
| 8 | `roman-five` | 🌁 Akwedukt Minut | :05 :10 :20 :25 :35 :40 :50 :55 |
| 9 | `roman-minute` | 🔱 Labirynt Caesara | minuty nie będące wielokrotnościami 5 |

#### Pętla 3 — Pusta Tarcza (bez cyfr)

| # | ID węzła | Nazwa wyspy | Minuty w sesji |
|---|----------|-------------|----------------|
| 10 | `blank-full` | 🌑 Wyspa Ciszy | :00 |
| 11 | `blank-quarters` | 🌫️ Mglisty Przylądek | :15, :45 |
| 12 | `blank-half` | 🌒 Dolina Cienia | :30 |
| 13 | `blank-five` | 🏜️ Pustynia Bez Znaków | :05 :10 :20 :25 :35 :40 :50 :55 |
| 14 | `blank-minute` | 🌑 Mroczne Bezdroża | minuty nie będące wielokrotnościami 5 |

#### Pętla 4 — Format 24h (godziny 13–24)

| # | ID węzła | Nazwa wyspy | Minuty w sesji |
|---|----------|-------------|----------------|
| 15 | `24h-full` | 🌃 Brama Południa | :00 |
| 16 | `24h-quarters` | 🗼 Wieża Zegarowa | :15, :45 |
| 17 | `24h-half` | 🌉 Kanał Wpół do | :30 |
| 18 | `24h-five` | 🚇 Metro Nocne | :05 :10 :20 :25 :35 :40 :50 :55 |
| 19 | `24h-minute` | 🌐 Labirynt 24h | minuty nie będące wielokrotnościami 5 |

---

## 2. demo-match — Wszystkie Kombinacje Ćwiczeń

### Parametry i ich wartości

| Parametr | Wartości | Opis |
|----------|----------|------|
| **Tryb cyfrowy** | `arabic` / `roman` / `minutes` / `24h` | Co uzupełniamy na tarczy |
| **Tryb odpowiedzi** | `choice` / `keyboard` / `tap` | Jak odpowiadamy |
| **Trudność** | `easy` / `hard` | Czy cyfry zostają (`easy`) czy znikają po 2 s (`hard`) |

**Mechanika:** Na tarczy jest 12 pozycji. Każda pozycja jest pytana jeden raz za rundę. Ćwiczenie kończy się po uzupełnieniu wszystkich 12 (lub wybranego zestawu).

### Co wyświetla każdy tryb cyfrowy

| Tryb | Pozycja → Wartość | Zakres |
|------|-------------------|--------|
| `arabic` | 1→1, 2→2 … 12→12 | 1–12 |
| `roman` | 1→I, 2→II … 12→XII | I, II, III, IV, V, VI, VII, VIII, IX, X, XI, XII |
| `minutes` | 1→5, 2→10 … 11→55, 12→0 | 0, 5, 10, 15…55 |
| `24h` | 1→13, 2→14 … 11→23, 12→24 | 13–24 |

### Jak działa tryb odpowiedzi

**`choice` (Wybór):**
- Wyświetla 4 przyciski (2×2): 1 poprawna + 3 dystraktory z puli 1–12
- Odpowiedź jednym kliknięciem

**`keyboard` (Klawiatura):**
- Wyświetla numeryczną klawiaturę ekranową (0–9, delete, OK)
- Wymaga wpisania pełnej wartości (np. "55" dla minut lub "17" dla 24h)
- Wyświetla digitalny display z bieżącym wpisem

**`tap` (Zaznacz):**
- Pytanie wyświetlone na karcie: „Gdzie jest [wartość]?"
- Uczeń klika strefę na tarczy odpowiadającą tej pozycji
- Tarcza jest **bez cyfr** — trzeba znać rozmieszczenie

### Trudność

**`easy`:** Po poprawnej odpowiedzi cyfra pojawia się na tarczy i **zostaje** przez całą rundę. Kompletowanie tworzy wizualny wzorzec.

**`hard`:** Po poprawnej odpowiedzi cyfra pojawia się i **zanika po 2 sekundach**. Trzeba zapamiętać całe rozmieszczenie.

---

### Pełna lista kombinacji z poziomem trudności

*Uporządkowane od najłatwiejszej do najtrudniejszej — 3 wymiary trudności:*
**(1) Typ cyfr** (arabskie → minuty → 24h → rzymskie) × **(2) Odpowiedź** (wybór → klawiatura → zaznacz) × **(3) Zanikanie** (łatwe → trudne)*

#### Blok A — Cyfry Arabskie (1–12) — znane symbole, nauka pozycji

| Lp. | Tryb cyfrowy | Odpowiedź | Trudność | Opis |
|-----|-------------|-----------|----------|------|
| A1 | arabic | choice | easy | Wybierz spośród 4 opcji, cyfry zostają. Najbardziej wspomagane ćwiczenie. |
| A2 | arabic | choice | hard | Wybierz spośród 4, cyfry znikają — musisz zapamiętać poprzednie. |
| A3 | arabic | keyboard | easy | Wpisz cyfrę z klawiatury, cyfry zostają — aktywny recall bez presji czasu. |
| A4 | arabic | keyboard | hard | Wpisz + zanikanie — recall i pamięć robocza jednocześnie. |
| A5 | arabic | tap | easy | Kliknij pozycję na tarczy — odwrócony kierunek (wartość→pozycja), cyfry zostają. |
| A6 | arabic | tap | hard | Kliknij pozycję + zanikanie — pełna internalizacja mapy arabskiej. |

#### Blok B — Minuty (0, 5, 10…55) — nowe znaczenie znanych pozycji

| Lp. | Tryb cyfrowy | Odpowiedź | Trudność | Opis |
|-----|-------------|-----------|----------|------|
| B1 | minutes | choice | easy | Wybierz wartość minutową spośród 4 opcji, wartości zostają. |
| B2 | minutes | choice | hard | Wybierz minuty + zanikanie — buduj tabliczkę ×5 z pamięci. |
| B3 | minutes | keyboard | easy | Wpisz minuty (np. "35") z klawiatury, wartości zostają. |
| B4 | minutes | keyboard | hard | Wpisz minuty + zanikanie — pełny recall przeliczenia pozycja→minuty. |
| B5 | minutes | tap | easy | Kliknij pozycję dla podanej liczby minut (np. „Gdzie jest :40?"), wartości zostają. |
| B6 | minutes | tap | hard | Kliknij pozycję minut + zanikanie — szczyt trudności dla minut. |

#### Blok C — Format 24h (13–24) — nowe symbole na znanych pozycjach

| Lp. | Tryb cyfrowy | Odpowiedź | Trudność | Opis |
|-----|-------------|-----------|----------|------|
| C1 | 24h | choice | easy | Wybierz godzinę 24h (13–24) spośród 4 opcji, wartości zostają. |
| C2 | 24h | choice | hard | Wybierz 24h + zanikanie — zapamiętaj rozmieszczenie 13–24. |
| C3 | 24h | keyboard | easy | Wpisz godzinę 24h (np. "17"), wartości zostają. |
| C4 | 24h | keyboard | hard | Wpisz 24h + zanikanie — maksymalny recall formatu popołudniowego. |
| C5 | 24h | tap | easy | Kliknij pozycję dla podanej godziny 24h, wartości zostają. |
| C6 | 24h | tap | hard | Kliknij pozycję 24h + zanikanie — szczyt trudności bloku 24h. |

#### Blok D — Cyfry Rzymskie (I–XII) — nowy system symboliczny

| Lp. | Tryb cyfrowy | Odpowiedź | Trudność | Opis |
|-----|-------------|-----------|----------|------|
| D1 | roman | choice | easy | Wybierz symbol rzymski spośród 4 opcji, symbole zostają. Nauka rozmieszczenia. |
| D2 | roman | choice | hard | Wybierz roman + zanikanie — zapamiętaj cały alfabet ze zegara. |
| D3 | roman | keyboard | easy | **Wyświetla tarcze z I–XII → wpisz odpowiednik arabski.** Kierunek: roman→arabic. |
| D4 | roman | keyboard | hard | Roman→arabic wpisz + zanikanie — trudny kierunek odwrotny. |
| D5 | roman | tap | easy | Kliknij pozycję dla podanego symbolu rzymskiego, symbole zostają. |
| D6 | roman | tap | hard | Kliknij pozycję roman + zanikanie — pełna internalizacja systemu. |

> **Uwaga do D3/D4:** W trybie `keyboard + roman` ekran pokazuje tarcze z cyframi **RZYMSKIMI**, a uczeń wpisuje arabski odpowiednik. Jest to kierunek odwrotny i trudniejszy niż D1/D2.

---

### Oś trudności skumulowana

```
Najłatwiej                                                                     Najtrudniej
     │                                                                               │
  A1  →  A2  →  B1  →  C1  →  D1  →  A3  →  B3  →  C3  →  D3  →  A5  →  A4  →  ...
(arabskie, wybór, łatwy) → (minuty) → (24h) → (roman) → (klawiatura, łatwy) → (tap)
     │                         │                    │                    │
  wybór+łatwy            wybór+trudny          klawiatura+łatwy    klawiatura+trudny
                                                                              │
                                                                         B6, C6, D6
                                                                      (tap+trudny = szczyt)
```

---

## 3. demo-roman — 10 Etapów Progresji

### Mechanika gry

- **Format:** Dwie kolumny — lewa: cyfry arabskie (posortowane rosnąco), prawa: symbole rzymskie (potasowane).
- **Zadanie:** Połącz każdą parę (arabska ↔ rzymska). Kliknij jedną, potem drugą.
- **Warunek awansu:** Perfekcyjna runda — wszystkie pary połączone **bez żadnego błędu**.
- **Błąd:** Każde złe dopasowanie = `perfectRound = false` → trzeba powtórzyć poziom od nowa.
- **Postęp:** Zapisany w `localStorage` — można kontynuować między sesjami.

### Wskaźniki w grze

- **Dopasowane:** `matchedCount / pool.length` (postęp w bieżącej rundzie)
- **Dokładność:** `(matchedCount / attempts) × 100 %` (ile pierwszych prób było poprawnych)

---

### Etap 1 — Podstawa
**Pool:** 1, 2, 3 (symbole: I, II, III)

Pierwsze zetknięcie z cyfrowymi liniami. Zasada: każda kreska to jedna jednostka. Tylko addycja powtarzalnych kresek.

*Brak wskazówki — uczeń odkrywa wzorzec sam.*

---

### Etap 2 — Nowy Symbol
**Pool:** 1, 2, 3, 5 (symbole: I, II, III, V)

Wprowadzenie symbolu **V = 5**. Symbol nie jest kreskami — to zupełnie nowa forma.

*Wskazówka po ukończeniu:* „Poznałeś nowy symbol: V = 5."

---

### Etap 3 — Zasada Dodawania
**Pool:** 1, 2, 3, 5, 6, 7, 8 (symbole: I, II, III, V, VI, VII, VIII)

Odkrycie reguły addytywnej: symbol po **prawej stronie V dodaje się**.
- VI = V+I = 6
- VII = V+II = 7
- VIII = V+III = 8

*Wskazówka po ukończeniu:* „Zauważyłeś? Symbol po prawej stronie V dodaje się."

---

### Etap 4 — Dziesiątka
**Pool:** 1, 2, 3, 10 (symbole: I, II, III, X)

Wprowadzenie symbolu **X = 10**. Zupełnie nowa wartość — nie wynika z dotychczasowych reguł. Kontrast z poprzednimi (I, II, III to małe wartości, X to skok do 10).

*Wskazówka po ukończeniu:* „Nowy symbol: X = 10. Zupełnie nowa wartość!"

---

### Etap 5 — Dodawanie do X
**Pool:** 1, 2, 3, 10, 11, 12 (symbole: I, II, III, X, XI, XII)

Ta sama zasada addytywna, tym razem dla X:
- XI = X+I = 11
- XII = X+II = 12

*Wskazówka po ukończeniu:* „Ta sama zasada: XI = 11, XII = 12 — symbol po prawej dodaje się do X."

---

### Etap 6 — Pełna Baza
**Pool:** 1, 2, 3, 5, 6, 7, 8, 10, 11, 12 (wszystkie addytywne)

Bez symboli IV i IX (bez subtrakcji). Cały dotychczasowy materiał w jednej rundzie.

*Brak wskazówki — konsolidacja bez nowych informacji.*

> **10 par** — największa runda do tej pory. Test pamięci dla wszystkich addytywnych wzorców.

---

### Etap 7 — Odkrycie IV
**Pool:** 1, 2, 3, 4, 5 (symbole: I, II, III, IV, V)

**Przełomowy moment:** Wprowadzenie reguły **odejmowania**.
- IV = 5−1 = 4 (mała kreska **przed** V → odejmuj)

Celowy kontrast z VI (mała kreska po V → dodawaj):
- IV = 4 (I przed V)
- VI = 6 (I po V)

*Wskazówka po ukończeniu:* „💡 Zauważyłeś? Kiedy mała kreska stoi PRZED większą — ODEJMUJEMY ją! IV = 5 − 1 = 4."

---

### Etap 8 — Analogia IX
**Pool:** 1, 2, 3, 9, 10 (symbole: I, II, III, IX, X)

Ta sama reguła subtrakcji, tym razem dla X:
- IX = 10−1 = 9 (I przed X)

Kontrast z XI (I po X = 11).

*Wskazówka po ukończeniu:* „To samo co IV, ale dla dziesiątki: IX = 10 − 1 = 9."

---

### Etap 9 — Kontrast
**Pool:** 1, 2, 3, 4, 5, 9, 10 (symbole: I, II, III, IV, V, IX, X)

Celowe zestawienie obu reguł w jednej rundzie:
- Addytywne: I, II, III, V, X
- Subtraktywne: IV (= 5−1), IX (= 10−1)

Uczeń musi aktywnie rozróżniać kierunek (przed czy po).

*Brak wskazówki — test rozróżnienia.*

---

### Etap 10 — Mistrz
**Pool:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 (I–XII, wszystkie 12 par)

Pełny alfabet zegara. Wszystkie wzorce naraz:
- Proste: I, II, III
- Addytywne od V: VI, VII, VIII
- Addytywne od X: XI, XII
- Subtraktywne: IV, IX
- Samodzielne: V, X

*Po perfekcyjnej rundzie:* Ekran końcowy „Mistrz Cyfr Rzymskich! 🏆"

---

## Podsumowanie Parametrów dla Planowania

### demo-match — wymiary kombinacji

```
tryb cyfrowy:   arabic | minutes | 24h | roman         (4 opcje)
tryb odpowiedzi: choice | keyboard | tap               (3 opcje)
trudność:        easy | hard                           (2 opcje)
─────────────────────────────────────────────────────
Łącznie:  4 × 3 × 2 = 24 możliwe unikalne konfiguracje
```

### demo-roman — wymiary trudności

```
Poziom 1–3:  reguła addytywna (kreseczki + V)          mały pool (3–7 par)
Poziom 4–5:  nowy symbol X + addycja do X              mały pool (3–6 par)
Poziom 6:    konsolidacja całej addycji                duży pool (10 par)
Poziom 7–8:  reguła subtrakcji (IV, IX)                mały pool (5 par)
Poziom 9:    kontrast addycja vs. subtrakcja           średni pool (7 par)
Poziom 10:   pełny alfabet I–XII                       pełny pool (12 par)
```

### Wyprawa — wymiary węzłów

```
pętla:    arabic | roman | blank | 24h                 (4 pętle)
węzeł:    full | quarters | half | five | minute       (5 węzłów/pętlę)
gwiazdka: ⭐ godziny.html | ⭐⭐ wpisz.html | ⭐⭐⭐ ustaw.html  (3 tryby gry)
─────────────────────────────────────────────────────
Łącznie:  4 × 5 × 3 = 60 sesji gry do pełnego ukończenia
```
