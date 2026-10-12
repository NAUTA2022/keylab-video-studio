// TRAZABILIDAD + BÓVEDA POR HITOS (9:16, 15 s): video "La bóveda" de Key Lab.
// Parte A (0–9,2 s): la plataforma con trazabilidad, cada peso con GPS.
// Parte B (9,2–15 s): hitos, desembolso, atraso, votación y congelamiento.
// Los tiempos son los cues de las escenas `clip` del JSON (B = 9,2 s + cue).
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
  const DURATION = 15.0;
  const B = 9.2;
  const ev = {
    title: 0.05, // "TRAZABILIDAD"
    sketch: 0.7, // "construimos": se dibuja el panel
    materialize: 1.38, // "plataforma"
    trace: 2.78, // "trazabilidad": aparece el mapa de la plata
    coins: 4.02, // "cada peso": monedas viajan por los caminos
    gps: 5.2, // "GPS": pines con monto y factura
    phone: 6.96, // "todos ven": celular del inversionista
    receipt: 8.42, // "en qué se gastó": toca "ver factura"
    hitos: B + 0.0, // cambia a la vista de hitos
    cumple: B + 0.2, // "si cumple el hito": ✓ en H2
    cobra: B + 1.2, // "cobra": se libera el tramo
    atrasa: B + 1.96, // "si se atrasa": H3 vencido
    votan: B + 3.78, // "votan": barra de votos
    congelan: B + 4.26, // "congelan": hielo + sello
    termine: B + 5.12, // "hasta que termine"
  };
  const markers = {};
  const SCORE = { FPS, FORMAT, W, H, SAFE, DURATION, clock, T, BEAT, BAR, ev, markers, S: {}, subtitles: [] };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
