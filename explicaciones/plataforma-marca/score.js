// PLATAFORMA CON TU MARCA (9:16, 4,65 s): video Señor C — segmento "explicación" del video de Key Lab.
// Se inserta en la escena `solution` de keylab-video-studio. Los tiempos son los
// mismos `cues` del JSON del video (segundos desde el inicio de la escena).
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const FPS = 30;
  const FORMAT = '9:16';
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const clock = MU.makeClock({ bpm: 120, offset: 0 });
  const { T, BEAT, BAR } = clock;
  const DURATION = 4.65;
  // momentos clave (= cues de la escena en src/data/*.json)
  const ev = {
    title: 0.05, // "TU PLATAFORMA · TU MARCA"
    sketch: 0.2, // el wireframe se dibuja a mano
    materialize: 1.5, // "plataforma": el boceto se vuelve interfaz real
    phone: 1.85, // entra el celular del inversionista
    tap: 2.25, // toca "Invertir"
    brand: 2.6, // "con tu marca": marca 1
    brand2: 3.4, // "a la medida": marca 2
    brand3: 4.0, // "de tu negocio": marca 3
  };
  const markers = { materialize: { t: ev.materialize, sync: 'v' }, tap: { t: ev.tap, sync: 'v' }, brand: { t: ev.brand, sync: 'v' } };
  const SCORE = { FPS, FORMAT, W, H, SAFE, DURATION, clock, T, BEAT, BAR, ev, markers, S: {}, subtitles: [] };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
