'use strict';

/* =====================================================
   question-logic.js — Mistrz Czasu
   Generowanie pytań dla trybów gry.

   Faza 3: prosta implementacja (losowy z puli, bez powtórek
   ostatnich 3 pytań, aby uniknąć monotonii).

   Faza 7: wymiana wnętrzności na system spaced-repetition
   bez zmian interfejsu zewnętrznego funkcji generateQuestion().
   ===================================================== */

/**
 * Generuje pytanie (godzina + minuta) dla danego węzła.
 *
 * @param {Object} nodeConfig         - Konfiguracja węzła z NODE_CONFIG:
 *                                       { minutes: number[], hourFormat?: '12'|'24' }
 * @param {Array}  [attemptHistory=[]] - Tablica ostatnich pytań: [{hour, minute}, ...]
 *                                       Używana do unikania powtórek ostatnich 3 pytań.
 * @returns {{ hour: number, minute: number }}
 */
function generateQuestion(nodeConfig, attemptHistory) {
  const minutes = nodeConfig.exclusiveMinutes || nodeConfig.minutes || [0];
  const is24h   = nodeConfig.hourFormat === '24';
  const maxHour = is24h ? 23 : 12;
  const recent  = (attemptHistory || []).slice(-3);

  // Próbuj do 50 razy znaleźć pytanie nie będące powtórką
  for (let tries = 0; tries < 50; tries++) {
    const hour   = Math.floor(Math.random() * maxHour) + 1;
    const minute = minutes[Math.floor(Math.random() * minutes.length)];

    const isDuplicate = recent.some(a => a.hour === hour && a.minute === minute);
    if (!isDuplicate) {
      return { hour, minute };
    }
  }

  // Fallback — ignoruj historię (zdarza się gdy pula pytań jest bardzo mała)
  const hour   = Math.floor(Math.random() * maxHour) + 1;
  const minute = minutes[Math.floor(Math.random() * minutes.length)];
  return { hour, minute };
}
