// NOTAS DEL CELULAR (9:16, 6,15 s) — "¿Y tú qué? ¿Sigues con la idea del negocio guardada en las notas
// del celular, al lado de la lista del mercado?". Tiempos = cues de la escena (segundos desde su inicio).
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const FPS = 30, FORMAT = '9:16';
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const clock = MU.makeClock({ bpm: 120, offset: 0 });
  const { T, BEAT, BAR } = clock;
  const DURATION = 6.15;
  const ev = {
    title: 0.09, // "¿y tú qué?"
    phone: 1.0, // entra el celular
    idea: 2.0, // "negocio": se escribe "negocio millonario 💡"
    notas: 3.19, // "notas del celular": zoom al celular
    lista: 4.91, // "lista del mercado": aparecen huevos y papel higiénico
    rip: 5.45, // anotación a mano
  };
  const markers = { idea: { t: ev.idea, sync: 'v' }, lista: { t: ev.lista, sync: 'v' } };
  const SCORE = { FPS, FORMAT, W, H, SAFE, DURATION, clock, T, BEAT, BAR, ev, markers, S: {}, subtitles: [] };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
