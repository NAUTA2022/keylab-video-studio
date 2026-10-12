// DEMO DE PLATAFORMA TOKENIZADORA WHITE LABEL (9:16, 4,3 s) — animation-studio
// Boceto a mano (líneas que "hierven") → interfaz real → celular del inversionista → cambio de marca.
// Deja libre la franja del logo (arriba) y la de subtítulos (abajo): Remotion las pinta encima.
(function () {
  const U = globalThis.U, G = globalThis.G, UI = globalThis.UI, S = globalThis.SCORE, Studio = globalThis.Studio;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H;

  // Marca Key Lab y la marca "del cliente" a la que se cambia en "con tu marca"
  const K = { bone: '#F1EFEA', ink: '#141519', cobalt: '#2D52FF', gray: '#8F8B83', line: '#DEDAD1', soft: '#8CA0FF' };
  const CLIENT = { accent: '#FF6B2C', name: 'TU MARCA' };
  UI.setTheme({ accent: K.cobalt, accent2: K.cobalt, ok: '#1FA971', ink: K.ink, muted: K.gray, app: '#FFFFFF', card: '#FFFFFF', line: K.line, font: 'Figtree' });

  const mixHex = (a, b, k) => {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], k)).toString(16).padStart(2, '0')).join('');
  };
  const brandK = (t) => ease.inOutCubic(clamp((t - ev.brand) / 0.35));
  const accent = (t) => mixHex(K.cobalt, CLIENT.accent, brandK(t));

  // ---------- el tablero (navegador) ----------
  const BX = 90, BY = 470, BW = 900, BH = 640; // marco del navegador en el cuadro

  // trazo a mano que se dibuja: progreso p (0..1) recorta el rectángulo de izquierda a derecha
  function sketchBox(ctx, x, y, w, h, r, p, seed) {
    if (p <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x - 10, y - 10, (w + 20) * p, h + 20); ctx.clip();
    G.rrect(ctx, x, y, w, h, r, { fill: 'transparent', lw: 3.2, color: K.ink, seed });
    ctx.restore();
  }
  function sketchLine(ctx, x, y, w, p, seed) {
    if (p <= 0) return;
    G.line(ctx, [[x, y], [x + w * p, y]], { lw: 3, color: K.gray, seed });
  }

  function dashboard(ctx, t) {
    const sk = (k) => clamp((t - ev.sketch - k * 0.07) / 0.45); // cada pieza del boceto con stagger
    const mat = ease.outCubic(clamp((t - ev.materialize) / 0.4)); // el boceto se vuelve interfaz
    const acc = accent(t);

    // entra el marco con un pequeño "zoom punch"
    const enter = ease.outBack(clamp((t - ev.sketch + 0.1) / 0.35), 1.3);
    ctx.save(); ctx.translate(BX + BW / 2, BY + BH / 2); ctx.scale(0.9 + 0.1 * enter, 0.9 + 0.1 * enter); ctx.translate(-(BX + BW / 2), -(BY + BH / 2));
    ctx.globalAlpha = clamp(enter * 1.5);

    // ---- capa 1: la interfaz real (aparece con mat) ----
    if (mat > 0) {
      ctx.save(); ctx.globalAlpha *= mat;
      UI.card(ctx, BX, BY, BW, BH, 26, { fill: '#FFFFFF' });
      // barra del navegador
      ctx.fillStyle = '#ECE9E2'; ctx.beginPath(); ctx.roundRect(BX, BY, BW, 56, [26, 26, 0, 0]); ctx.fill();
      ['#E5484D', '#F5B83D', '#30A46C'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(BX + 34 + i * 26, BY + 28, 8, 0, 7); ctx.fill(); });
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(BX + 130, BY + 13, 420, 30, 15); ctx.fill();
      UI.text(ctx, brandK(t) > 0.5 ? 'invierte.tumarca.com' : 'plataforma.keylab.tech', BX + 150, BY + 34, { size: 17, weight: 600, color: K.gray });
      // barra lateral con la marca
      ctx.fillStyle = mixHex('#141519', '#1E1410', brandK(t)); ctx.beginPath(); ctx.roundRect(BX, BY + 56, 210, BH - 56, [0, 0, 0, 26]); ctx.fill();
      ctx.fillStyle = acc; ctx.beginPath(); ctx.roundRect(BX + 24, BY + 82, 44, 44, 12); ctx.fill();
      UI.text(ctx, brandK(t) > 0.5 ? CLIENT.name : 'TU MARCA', BX + 80, BY + 112, { size: 20, weight: 900, color: '#FFFFFF' });
      ['Proyectos', 'Inversionistas', 'Tokens', 'Reportes'].forEach((n, i) => {
        if (i === 0) { ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.beginPath(); ctx.roundRect(BX + 14, BY + 160 + i * 56 - 30, 182, 44, 12); ctx.fill(); }
        UI.text(ctx, n, BX + 34, BY + 160 + i * 56, { size: 19, weight: i === 0 ? 800 : 600, color: i === 0 ? '#FFFFFF' : '#A9A6A0' });
      });
      // tarjeta del proyecto
      const cx = BX + 236, cy = BY + 80;
      UI.text(ctx, 'Torre Laureles', cx, cy + 30, { size: 32, weight: 900 });
      UI.text(ctx, 'Medellín · 120 tokens de 1.000 USD', cx, cy + 62, { size: 17, weight: 600, color: K.gray });
      // edificio dibujado (bloques)
      ctx.fillStyle = '#F4F2EE'; ctx.beginPath(); ctx.roundRect(cx, cy + 86, 300, 230, 18); ctx.fill();
      for (let i = 0; i < 4; i++) {
        const bh = 90 + i * 28 + (i === 2 ? 40 : 0);
        ctx.fillStyle = i === 2 ? acc : mixHex(K.ink, '#3A3D48', i / 4);
        ctx.fillRect(cx + 34 + i * 62, cy + 296 - bh, 46, bh);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        for (let r = 0; r * 26 + 30 < bh; r++) { ctx.fillRect(cx + 42 + i * 62, cy + 310 - bh + r * 26, 10, 12); ctx.fillRect(cx + 60 + i * 62, cy + 310 - bh + r * 26, 10, 12); }
      }
      // anillo de financiación
      const funded = 0.68 * ease.outCubic(clamp((t - ev.materialize - 0.15) / 0.9));
      UI.ring(ctx, cx + 470, cy + 190, 92, funded, { color: acc, track: K.line, lw: 20 });
      UI.text(ctx, `${Math.round(funded * 100)}%`, cx + 470, cy + 202, { size: 40, weight: 900, align: 'center' });
      UI.text(ctx, 'financiado', cx + 470, cy + 312, { size: 17, weight: 700, color: K.gray, align: 'center' });
      // inversionistas
      const names = [['Ana R.', '3 tokens'], ['Carlos M.', '1 token'], ['Lucía P.', '5 tokens']];
      names.forEach(([n, q], i) => {
        const a = UI.pop(t, ev.materialize + 0.25 + i * 0.12, 0.25, 2);
        if (a <= 0) return;
        const y = cy + 350 + i * 64;
        ctx.save(); ctx.globalAlpha *= clamp(a); ctx.translate((1 - clamp(a)) * 40, 0);
        ctx.fillStyle = '#F7F5F1'; ctx.beginPath(); ctx.roundRect(cx, y, 610, 54, 14); ctx.fill();
        ctx.fillStyle = [acc, '#30A46C', '#F5B83D'][i]; ctx.beginPath(); ctx.arc(cx + 30, y + 27, 15, 0, 7); ctx.fill();
        UI.text(ctx, n, cx + 56, y + 34, { size: 19, weight: 700 });
        UI.text(ctx, q, cx + 330, y + 34, { size: 18, weight: 600, color: K.gray });
        UI.pill(ctx, cx + 500, y + 12, 'KYC ✓', { bg: '#E3F6EC', fg: '#1F8A57', size: 14, h: 30 });
        ctx.restore();
      });
      ctx.restore();
    }

    // ---- capa 2: el boceto a mano (se desvanece cuando aparece la interfaz) ----
    if (mat < 1) {
      ctx.save(); ctx.globalAlpha *= 1 - mat;
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.roundRect(BX, BY, BW, BH, 26); ctx.fill();
      sketchBox(ctx, BX, BY, BW, BH, 26, sk(0), 1);
      sketchLine(ctx, BX + 10, BY + 56, BW - 20, sk(1), 2);
      sketchBox(ctx, BX + 14, BY + 70, 182, BH - 84, 16, sk(1.5), 3);
      for (let i = 0; i < 4; i++) sketchLine(ctx, BX + 34, BY + 160 + i * 56, 130, sk(2 + i * 0.3), 10 + i);
      sketchBox(ctx, BX + 236, BY + 166, 300, 230, 18, sk(3), 4);
      // edificio esbozado
      if (sk(3.5) > 0) for (let i = 0; i < 4; i++) { const bh = 90 + i * 28 + (i === 2 ? 40 : 0); sketchBox(ctx, BX + 270 + i * 62, BY + 376 - bh, 46, bh, 4, sk(3.5 + i * 0.3), 20 + i); }
      if (sk(4) > 0) { ctx.save(); ctx.beginPath(); ctx.rect(BX + 590, BY + 160, 240 * sk(4), 240); ctx.clip(); G.ellipse(ctx, BX + 706, BY + 270, 92, 92, { fill: 'transparent', lw: 3.2, color: K.ink, seed: 30 }); ctx.restore(); }
      for (let i = 0; i < 3; i++) sketchBox(ctx, BX + 236, BY + 430 + i * 64, 610, 54, 14, sk(4.5 + i * 0.4), 40 + i);
      // anotaciones a mano en cobalto
      const note = UI.fadeIn(t, ev.sketch + 0.55, 0.2);
      if (note > 0) {
        G.text(ctx, 'tu proyecto', BX + 560, BY + 150, { size: 34, color: K.cobalt, alpha: note, fam: 'Caveat' });
        G.text(ctx, 'inversionistas', BX + 620, BY + 650, { size: 34, color: K.cobalt, alpha: note, fam: 'Caveat' });
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- celular del inversionista ----------
  function investorScreen(ctx, w, h, t) {
    const acc = accent(t);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = acc; ctx.beginPath(); ctx.roundRect(20, 70, 44, 44, 12); ctx.fill();
    UI.text(ctx, brandK(t) > 0.5 ? CLIENT.name : 'TU MARCA', 76, 100, { size: 18, weight: 900 });
    UI.text(ctx, 'Torre Laureles', 20, 168, { size: 30, weight: 900 });
    UI.text(ctx, 'Tokens disponibles: 38', 20, 198, { size: 15, weight: 600, color: K.gray });
    ctx.fillStyle = '#F4F2EE'; ctx.beginPath(); ctx.roundRect(20, 220, w - 40, 260, 20); ctx.fill();
    for (let i = 0; i < 4; i++) { const bh = 100 + i * 26 + (i === 2 ? 40 : 0); ctx.fillStyle = i === 2 ? acc : '#2A2D38'; ctx.fillRect(54 + i * 84, 460 - bh, 60, bh); }
    UI.text(ctx, 'Desde 100 USD', 20, 530, { size: 26, weight: 900 });
    const bought = t >= ev.tap + 0.15;
    UI.button(ctx, w / 2, h - 150, w - 60, 76, bought ? '✓ Invertido' : 'Invertir 100 USD', t, { tTap: ev.tap, done: bought, bg: acc, doneBg: '#1FA971' });
    UI.tap(ctx, w / 2 + 40, h - 150, t, ev.tap, { color: 'rgba(255,255,255,0.9)', size: 90 });
    UI.text(ctx, '*Ejemplo ilustrativo', w / 2, h - 70, { size: 13, weight: 600, color: K.gray, align: 'center' });
  }

  Studio.film({
    async init() {
      await Studio.loadFont('Figtree', 'fonts/figtree-latin-600-normal.woff2', '600');
      await Studio.loadFont('Figtree', 'fonts/figtree-latin-700-normal.woff2', '700');
      await Studio.loadFont('Figtree', 'fonts/figtree-latin-800-normal.woff2', '800');
      await Studio.loadFont('Figtree', 'fonts/figtree-latin-900-normal.woff2', '900');
      await Studio.loadFont('Anton', 'fonts/anton-latin-400-normal.woff2', '400');
    },
    draw(ctx, t) {
      ctx.fillStyle = K.bone; ctx.fillRect(0, 0, W, H);
      // título
      const tp = UI.pop(t, ev.title, 0.3, 2);
      if (tp > 0) {
        ctx.save(); ctx.translate(140, 410); ctx.scale(0.9 + 0.1 * clamp(tp), 0.9 + 0.1 * clamp(tp));
        UI.text(ctx, 'TE LA CONSTRUIMOS', 0, 0, { size: 104, weight: 400, font: 'Anton', color: K.ink, alpha: clamp(tp) });
        ctx.restore();
      }
      dashboard(ctx, t);
      // celular que entra por la derecha y se apoya sobre el tablero
      const pin = ease.outBack(clamp((t - ev.phone) / 0.45), 1.2);
      if (pin > 0) UI.phone(ctx, lerp(W + 260, 820, pin), 985, 560, investorScreen, t, { rot: lerp(0.25, -0.06, pin) });
      // cambio de marca: barrido de "pintura" + sello
      const b = clamp((t - ev.brand) / 0.35);
      if (b > 0 && b < 1) { ctx.save(); ctx.fillStyle = CLIENT.accent; ctx.globalAlpha = 0.85 * (1 - b); ctx.fillRect(-200 + b * (W + 400) - 120, 440, 120, 960); ctx.restore(); }
      const sp = UI.pop(t, ev.brand + 0.2, 0.3, 2.4);
      if (sp > 0) {
        ctx.save(); ctx.translate(330, 1235); ctx.rotate(-0.06); ctx.scale(sp, sp);
        const pw = UI.measure(ctx, 'CON TU MARCA', 40, 900) + 60;
        UI.pill(ctx, -pw / 2, -36, 'CON TU MARCA', { bg: CLIENT.accent, size: 40, h: 72, weight: 900 });
        ctx.restore();
      }
    },
    post: { paper: 0, grain: 0, vignette: 0 },
    fadeOut: 0,
  });
})();
