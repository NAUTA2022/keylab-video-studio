// TRAZABILIDAD + BÓVEDA POR HITOS (9:16, 15 s) — animation-studio, video "La bóveda" de Key Lab.
// A: panel a mano → interfaz real → mapa de la plata con GPS por rubro → celular del inversionista.
// B: hitos con desembolso por tramos, hito vencido, votación de inversionistas y congelamiento.
// Deja libre la franja del logo (arriba) y la de subtítulos (abajo): Remotion las pinta encima.
(function () {
  const U = globalThis.U, G = globalThis.G, UI = globalThis.UI, S = globalThis.SCORE, Studio = globalThis.Studio;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H;
  const K = { bone: '#F1EFEA', ink: '#141519', cobalt: '#2D52FF', gray: '#8F8B83', line: '#DEDAD1', soft: '#8CA0FF', ok: '#1FA971', red: '#E5484D', gold: '#E8B33A', ice: '#BFE6FF' };
  UI.setTheme({ accent: K.cobalt, accent2: K.cobalt, ok: K.ok, ink: K.ink, muted: K.gray, app: '#FFFFFF', card: '#FFFFFF', line: K.line, font: 'Figtree' });

  const BX = 90, BY = 470, BW = 900, BH = 660;
  const inB = (t) => ease.inOutCubic(clamp((t - ev.hitos) / 0.3)); // 0 = vista A, 1 = vista B

  // ---------- piezas pequeñas ----------
  function coin(ctx, x, y, r = 14) {
    ctx.save();
    ctx.fillStyle = K.gold; ctx.strokeStyle = '#9A6B12'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9A6B12'; ctx.font = `900 ${r * 1.2}px Figtree`; ctx.textAlign = 'center'; ctx.fillText('$', x, y + r * 0.42);
    ctx.restore();
  }
  function pin(ctx, x, y, s, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(0, 0); ctx.bezierCurveTo(-26, -30, -26, -62, 0, -62); ctx.bezierCurveTo(26, -62, 26, -30, 0, 0); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(0, -40, 9, 0, 7); ctx.fill();
    ctx.restore();
  }
  function vaultIcon(ctx, x, y, r, t) {
    ctx.save();
    ctx.fillStyle = '#2A2E3A'; ctx.beginPath(); ctx.roundRect(x - r * 1.15, y - r * 1.15, r * 2.3, r * 2.3, 18); ctx.fill();
    ctx.strokeStyle = '#C3C9D4'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, 7); ctx.stroke();
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.6);
    ctx.strokeStyle = K.gold; ctx.lineWidth = 6;
    for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-r * 0.45, 0); ctx.lineTo(r * 0.45, 0); ctx.stroke(); }
    ctx.restore();
    ctx.restore();
  }
  // trazo a mano que se dibuja de izquierda a derecha
  function sketchBox(ctx, x, y, w, h, r, p, seed) {
    if (p <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x - 10, y - 10, (w + 20) * p, h + 20); ctx.clip();
    G.rrect(ctx, x, y, w, h, r, { fill: 'transparent', lw: 3.2, color: K.ink, seed });
    ctx.restore();
  }

  // rubros de la obra (ejemplo ilustrativo) — el % es de lo recaudado
  const RUBROS = [
    { n: 'Lote', p: 18, c: '#F5B83D' },
    { n: 'Licencias', p: 9, c: '#8B5CF6' },
    { n: 'Cimentación', p: 27, c: K.ok },
    { n: 'Estructura', p: 46, c: K.gray, vault: true },
  ];
  const VX = BX + 150, VY = BY + 400;
  const RX = BX + 600;
  const ry = (i) => BY + 190 + i * 120;
  const path = (i, u) => {
    // curva de la bóveda al rubro i
    const x0 = VX + 70, y0 = VY, x3 = RX - 30, y3 = ry(i);
    const x1 = x0 + 160, y1 = y0, x2 = x3 - 160, y2 = y3;
    const a = 1 - u;
    return [a * a * a * x0 + 3 * a * a * u * x1 + 3 * a * u * u * x2 + u * u * u * x3, a * a * a * y0 + 3 * a * a * u * y1 + 3 * a * u * u * y2 + u * u * u * y3];
  };

  // ---------- VISTA A: plataforma + mapa de la plata ----------
  function viewA(ctx, t) {
    const sk = (k) => clamp((t - ev.sketch - k * 0.06) / 0.4);
    const mat = ease.outCubic(clamp((t - ev.materialize) / 0.4));
    // boceto
    if (mat < 1) {
      ctx.save(); ctx.globalAlpha *= 1 - mat;
      sketchBox(ctx, BX, BY, BW, BH, 26, sk(0), 1);
      G.line(ctx, [[BX + 10, BY + 56], [BX + 10 + (BW - 20) * sk(1), BY + 56]], { lw: 3, color: K.gray, seed: 2 });
      sketchBox(ctx, VX - 70, VY - 70, 140, 140, 18, sk(2), 3);
      for (let i = 0; i < 4; i++) sketchBox(ctx, RX, ry(i) - 42, 260, 84, 16, sk(3 + i * 0.5), 10 + i);
      const note = UI.fadeIn(t, ev.sketch + 0.4, 0.2);
      if (note > 0) G.text(ctx, 'cada peso, a la vista', BX + 300, BY + 140, { size: 36, color: K.cobalt, alpha: note, fam: 'Caveat' });
      ctx.restore();
    }
    if (mat <= 0) return;
    ctx.save(); ctx.globalAlpha *= mat;
    UI.card(ctx, BX, BY, BW, BH, 26, { fill: '#FFFFFF' });
    ctx.fillStyle = '#ECE9E2'; ctx.beginPath(); ctx.roundRect(BX, BY, BW, 56, [26, 26, 0, 0]); ctx.fill();
    ['#E5484D', '#F5B83D', '#30A46C'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(BX + 34 + i * 26, BY + 28, 8, 0, 7); ctx.fill(); });
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(BX + 130, BY + 13, 470, 30, 15); ctx.fill();
    UI.text(ctx, 'invierte.tuconstructora.co', BX + 150, BY + 34, { size: 17, weight: 600, color: K.gray });
    UI.text(ctx, 'Torre Laureles', BX + 40, BY + 112, { size: 32, weight: 900 });
    UI.text(ctx, '200 inversionistas · trazabilidad en vivo', BX + 40, BY + 142, { size: 17, weight: 600, color: K.gray });
    // bóveda
    vaultIcon(ctx, VX, VY, 56, t);
    UI.text(ctx, 'BÓVEDA', VX, VY + 104, { size: 20, weight: 900, align: 'center' });
    // caminos y rubros
    const tr = (i) => ease.outCubic(clamp((t - ev.trace - i * 0.12) / 0.5));
    RUBROS.forEach((r, i) => {
      const p = tr(i);
      if (p <= 0) return;
      // camino punteado que se dibuja
      ctx.save(); ctx.setLineDash([10, 10]); ctx.lineWidth = 4; ctx.strokeStyle = r.vault ? K.line : r.c;
      ctx.beginPath(); const N = 30;
      for (let k = 0; k <= N * p; k++) { const [x, y] = path(i, k / N); k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke(); ctx.restore();
      // tarjeta del rubro
      const a = UI.pop(t, ev.trace + 0.2 + i * 0.12, 0.3, 2);
      if (a > 0) {
        ctx.save(); ctx.globalAlpha *= clamp(a); ctx.translate((1 - clamp(a)) * 30, 0);
        ctx.fillStyle = '#F7F5F1'; ctx.beginPath(); ctx.roundRect(RX, ry(i) - 42, 260, 84, 16); ctx.fill();
        ctx.fillStyle = r.c; ctx.beginPath(); ctx.roundRect(RX, ry(i) - 42, 10, 84, [16, 0, 0, 16]); ctx.fill();
        UI.text(ctx, r.n, RX + 28, ry(i) - 6, { size: 22, weight: 800 });
        UI.text(ctx, r.vault ? `${r.p}% · aún en bóveda` : `${r.p}% de lo recaudado`, RX + 28, ry(i) + 24, { size: 16, weight: 600, color: K.gray });
        ctx.restore();
      }
      // pin GPS + factura
      if (!r.vault) {
        const g = UI.pop(t, ev.gps + i * 0.1, 0.3, 2.4);
        if (g > 0) {
          pin(ctx, RX + 236, ry(i) - 30, clamp(g) * 0.9, r.c);
          UI.pill(ctx, RX + 30, ry(i) + 46, `Factura ✓ 0x${(0x9f3a + i * 4111).toString(16)}…`, { bg: '#E3F6EC', fg: '#1F8A57', size: 13, h: 26 });
        }
      }
    });
    // monedas viajando por los caminos (cada peso con GPS)
    for (let i = 0; i < 3; i++) for (let k = 0; k < 4; k++) {
      const u = clamp((t - ev.coins - i * 0.15 - k * 0.28) / 0.75);
      if (u <= 0 || u >= 1) continue;
      const [x, y] = path(i, ease.inOutCubic(u));
      coin(ctx, x, y, 13);
    }
    ctx.restore();
  }

  // celular del inversionista: "¿en qué se gastó mi plata?"
  function investorScreen(ctx, w, h, t) {
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h);
    UI.text(ctx, 'Mi inversión', 20, 100, { size: 18, weight: 700, color: K.gray });
    UI.text(ctx, 'Tus 100 USD', 20, 148, { size: 36, weight: 900 });
    let x = 20;
    const bw = w - 40;
    RUBROS.forEach((r, i) => {
      const grow = ease.outCubic(clamp((t - ev.phone - 0.25 - i * 0.1) / 0.4));
      ctx.fillStyle = r.vault ? '#D9D6CF' : r.c;
      ctx.beginPath(); ctx.roundRect(x, 176, (bw * r.p / 100) * grow - 3, 34, 8); ctx.fill();
      x += bw * r.p / 100;
    });
    RUBROS.forEach((r, i) => {
      const y = 260 + i * 62;
      const a = UI.fadeIn(t, ev.phone + 0.35 + i * 0.1, 0.2);
      ctx.save(); ctx.globalAlpha *= a;
      ctx.fillStyle = r.vault ? '#D9D6CF' : r.c; ctx.beginPath(); ctx.arc(32, y - 7, 9, 0, 7); ctx.fill();
      UI.text(ctx, r.vault ? 'En bóveda (fase 3)' : r.n, 52, y, { size: 19, weight: 700 });
      UI.text(ctx, `${r.p} USD`, w - 20, y, { size: 19, weight: 800, align: 'right' });
      ctx.restore();
    });
    const done = t >= ev.receipt + 0.15;
    UI.button(ctx, w / 2, h - 170, w - 60, 72, done ? '✓ 3 facturas' : 'Ver facturas', t, { tTap: ev.receipt, done, bg: K.cobalt, doneBg: K.ok });
    UI.tap(ctx, w / 2 + 40, h - 170, t, ev.receipt, { color: 'rgba(255,255,255,0.9)', size: 90 });
    UI.text(ctx, '*Ejemplo ilustrativo', w / 2, h - 80, { size: 13, weight: 600, color: K.gray, align: 'center' });
  }

  // ---------- VISTA B: hitos, votación, congelamiento ----------
  const HITOS = [
    { n: 'H1 · Cimentación', tramo: '20%' },
    { n: 'H2 · Estructura', tramo: '30%' },
    { n: 'H3 · Acabados', tramo: '30%' },
  ];
  function viewB(ctx, t) {
    UI.card(ctx, BX, BY, BW, BH, 26, { fill: '#FFFFFF' });
    UI.text(ctx, 'Hitos de la obra', BX + 40, BY + 70, { size: 30, weight: 900 });
    UI.text(ctx, 'La plata sale por tramos, solo con el hito cumplido', BX + 40, BY + 102, { size: 17, weight: 600, color: K.gray });
    const late = clamp((t - ev.atrasa) / 0.25);
    HITOS.forEach((h, i) => {
      const y = BY + 136 + i * 112;
      let shakeX = 0;
      if (i === 2 && t > ev.atrasa && t < ev.atrasa + 0.6) shakeX = Math.sin(t * 70) * 8 * (1 - (t - ev.atrasa) / 0.6);
      ctx.save(); ctx.translate(shakeX, 0);
      const red = i === 2 ? late : 0;
      ctx.fillStyle = red > 0 ? `rgba(229,72,77,${0.08 + 0.06 * red})` : '#F7F5F1';
      ctx.beginPath(); ctx.roundRect(BX + 30, y, BW - 60, 96, 18); ctx.fill();
      if (red > 0) { ctx.strokeStyle = K.red; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(BX + 30, y, BW - 60, 96, 18); ctx.stroke(); }
      UI.text(ctx, h.n, BX + 120, y + 44, { size: 24, weight: 800 });
      // estado
      const doneAt = i === 0 ? -1 : i === 1 ? ev.cumple : Infinity;
      const ck = i === 0 ? 1 : UI.pop(t, doneAt, 0.3, 2.4);
      if (i < 2) UI.check(ctx, BX + 74, y + 48, 24, ck, { color: K.ok });
      else { ctx.strokeStyle = red > 0 ? K.red : K.gray; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(BX + 74, y + 48, 24, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(BX + 74, y + 48); ctx.lineTo(BX + 74, y + 34); ctx.moveTo(BX + 74, y + 48); ctx.lineTo(BX + 86, y + 54); ctx.stroke(); }
      let label, bg, fg;
      if (i === 0) [label, bg, fg] = [`Liberado ${h.tramo}`, '#E3F6EC', '#1F8A57'];
      else if (i === 1) [label, bg, fg] = t >= ev.cobra ? [`Liberado ${h.tramo}`, '#E3F6EC', '#1F8A57'] : ['En obra', '#ECE9E2', K.gray];
      else [label, bg, fg] = red > 0 ? ['VENCIDO · 15 días', K.red, '#FFFFFF'] : ['Plazo: 30 nov', '#ECE9E2', K.gray];
      UI.text(ctx, i === 2 && red > 0 ? 'Tramo retenido' : `Tramo ${h.tramo}`, BX + 120, y + 74, { size: 16, weight: 600, color: K.gray });
      const pw = UI.measure(ctx, label, 16, 800) + 30;
      UI.pill(ctx, BX + BW - 60 - pw, y + 32, label, { bg, fg, size: 16, h: 34, weight: 800 });
      ctx.restore();
    });
    // tramo que se libera al constructor (cobra)
    for (let k = 0; k < 8; k++) {
      const u = clamp((t - ev.cobra - k * 0.06) / 0.55);
      if (u <= 0 || u >= 1) continue;
      const x0 = BX + BW - 160, y0 = BY + 136 + 112 + 48;
      const x1 = BX + BW - 120, y1 = BY + BH + 60;
      coin(ctx, lerp(x0, x1, u) + Math.sin(u * 3 + k) * 20, lerp(y0, y1, ease.inCubic(u)) - Math.sin(u * Math.PI) * 60, 14);
    }
    const wal = UI.pop(t, ev.cobra + 0.2, 0.3, 2.2) * (1 - clamp((t - ev.congelan) / 0.2));
    if (wal > 0) {
      ctx.save(); ctx.translate(BX + BW - 330, BY + BH + 40); ctx.scale(wal, wal);
      UI.pill(ctx, -10, 0, '+30% al constructor', { bg: K.ok, fg: '#FFFFFF', size: 22, h: 50, weight: 900 });
      ctx.restore();
    }
    // votación
    const vp = UI.pop(t, ev.votan - 0.15, 0.3, 2);
    if (vp > 0) {
      const y = BY + 470;
      ctx.save(); ctx.globalAlpha *= clamp(vp); ctx.translate(0, (1 - clamp(vp)) * 40);
      ctx.fillStyle = '#F2F4FF'; ctx.beginPath(); ctx.roundRect(BX + 30, y, BW - 60, 160, 18); ctx.fill();
      UI.text(ctx, '¿Congelar desembolsos hasta que termine H3?', BX + 60, y + 44, { size: 21, weight: 800, maxW: BW - 120 });
      const yes = 0.72 * ease.outCubic(clamp((t - ev.votan) / 0.5));
      const bw = BW - 120;
      ctx.fillStyle = '#E1E5F5'; ctx.beginPath(); ctx.roundRect(BX + 60, y + 66, bw, 36, 12); ctx.fill();
      ctx.fillStyle = K.cobalt; ctx.beginPath(); ctx.roundRect(BX + 60, y + 66, Math.max(1, bw * yes), 36, 12); ctx.fill();
      UI.text(ctx, `SÍ ${Math.round(yes * 100)}%`, BX + 76, y + 92, { size: 19, weight: 900, color: '#FFFFFF' });
      UI.text(ctx, `NO ${Math.round((yes > 0 ? 0.28 : 0) * 100)}%`, BX + 60 + bw - 16, y + 92, { size: 19, weight: 900, color: K.gray, align: 'right' });
      for (let k = 0; k < 9; k++) {
        const a = UI.pop(t, ev.votan + k * 0.04, 0.2, 2);
        if (a <= 0) continue;
        ctx.fillStyle = [K.cobalt, '#F5B83D', K.ok, '#8B5CF6'][k % 4];
        ctx.beginPath(); ctx.arc(BX + 80 + k * 34, y + 132, 13 * clamp(a), 0, 7); ctx.fill();
      }
      UI.text(ctx, 'Quórum 81% ✓', BX + BW - 60, y + 140, { size: 17, weight: 800, color: K.ok, align: 'right' });
      ctx.restore();
    }
  }

  // hielo sobre el panel + sello CONGELADO
  function freeze(ctx, t) {
    const f = ease.outCubic(clamp((t - ev.congelan) / 0.35));
    if (f <= 0) return;
    ctx.save();
    ctx.globalAlpha = 0.55 * f;
    ctx.fillStyle = K.ice; ctx.beginPath(); ctx.roundRect(BX, BY, BW, BH, 26); ctx.fill();
    ctx.globalAlpha = 0.9 * f;
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4;
    for (let i = 0; i < 16; i++) {
      // grietas / cristales de hielo deterministas
      const x = BX + 40 + ((i * 337) % (BW - 80)), y = BY + 60 + ((i * 211) % (BH - 120)), s = 14 + (i % 4) * 6;
      for (let k = 0; k < 3; k++) { const a = (k * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * s, y - Math.sin(a) * s); ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); ctx.stroke(); }
    }
    ctx.restore();
    const sp = UI.pop(t, ev.congelan + 0.05, 0.3, 2.6);
    if (sp > 0) {
      ctx.save(); ctx.translate(W / 2, BY + 300); ctx.rotate(-0.12); ctx.scale(sp, sp);
      ctx.lineWidth = 10; ctx.strokeStyle = '#1E6FD9'; ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath(); ctx.roundRect(-330, -70, 660, 140, 18); ctx.fill(); ctx.stroke();
      UI.text(ctx, 'CONGELADO ❄', 0, 34, { size: 96, weight: 400, font: 'Anton', color: '#1E6FD9', align: 'center' });
      ctx.restore();
    }
    const tp = UI.pop(t, ev.termine, 0.3, 2);
    if (tp > 0) {
      ctx.save(); ctx.translate(W / 2, BY + BH + 64); ctx.scale(tp, tp);
      const label = 'Se libera cuando H3 esté listo ✓';
      const pw = UI.measure(ctx, label, 26, 800) + 50;
      UI.pill(ctx, -pw / 2, -28, label, { bg: K.ink, fg: '#FFFFFF', size: 26, h: 56, weight: 800 });
      ctx.restore();
    }
  }

  Studio.film({
    async init() {
      for (const w of ['600', '700', '800', '900']) await Studio.loadFont('Figtree', `fonts/figtree-latin-${w}-normal.woff2`, w);
      await Studio.loadFont('Anton', 'fonts/anton-latin-400-normal.woff2', '400');
    },
    draw(ctx, t) {
      ctx.fillStyle = K.bone; ctx.fillRect(0, 0, W, H);
      const b = inB(t);
      // título
      const tp = UI.pop(t, ev.title, 0.3, 2);
      if (tp > 0) {
        ctx.save(); ctx.translate(140, 410); ctx.scale(0.9 + 0.1 * clamp(tp), 0.9 + 0.1 * clamp(tp));
        if (b < 1) UI.text(ctx, 'TRAZABILIDAD TOTAL', 0, 0, { size: 84, weight: 400, font: 'Anton', color: K.ink, alpha: clamp(tp) * (1 - b) });
        if (b > 0) UI.text(ctx, 'BÓVEDA POR HITOS', 0, 0, { size: 84, weight: 400, font: 'Anton', color: K.ink, alpha: b });
        ctx.restore();
      }
      if (b < 1) {
        ctx.save(); ctx.globalAlpha = 1 - b;
        const enter = ease.outBack(clamp((t - ev.sketch + 0.1) / 0.35), 1.3);
        ctx.translate(BX + BW / 2, BY + BH / 2); ctx.scale(0.9 + 0.1 * enter, 0.9 + 0.1 * enter); ctx.translate(-(BX + BW / 2), -(BY + BH / 2));
        ctx.globalAlpha *= clamp(enter * 1.5);
        viewA(ctx, t);
        ctx.restore();
        const pin = ease.outBack(clamp((t - ev.phone) / 0.45), 1.2);
        const out = ease.inCubic(clamp((t - ev.hitos + 0.25) / 0.3));
        if (pin > 0) UI.phone(ctx, lerp(W + 260, 790, pin) + out * 700, 1000, 560, investorScreen, t, { rot: lerp(0.25, -0.06, pin) });
      }
      if (b > 0) {
        ctx.save(); ctx.globalAlpha = b; ctx.translate(0, (1 - b) * 60);
        viewB(ctx, t);
        freeze(ctx, t);
        ctx.restore();
      }
    },
    post: { paper: 0, grain: 0, vignette: 0 },
    fadeOut: 0,
  });
})();
