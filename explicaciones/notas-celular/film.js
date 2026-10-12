// NOTAS DEL CELULAR — animation-studio. La idea millonaria vive entre los huevos y el papel higiénico.
(function () {
  const U = globalThis.U, G = globalThis.G, UI = globalThis.UI, S = globalThis.SCORE, Studio = globalThis.Studio;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H;
  const K = { bone: '#F1EFEA', ink: '#141519', cobalt: '#2D52FF', gray: '#8F8B83', line: '#DEDAD1', yellow: '#F5C842' };
  UI.setTheme({ accent: K.cobalt, ink: K.ink, muted: K.gray, app: '#FFFDF5', card: '#FFFFFF', line: K.line, font: 'Figtree' });

  const typed = (str, t, t0, cps = 22) => str.slice(0, Math.max(0, Math.floor((t - t0) * cps)));
  function notesScreen(ctx, w, h, t) {
    ctx.fillStyle = '#FFFDF5'; ctx.fillRect(0, 0, w, h);
    UI.text(ctx, '‹ Notas', 20, 104, { size: 20, weight: 700, color: '#D9A100' });
    UI.text(ctx, '11:47 p. m.', w - 20, 104, { size: 16, weight: 600, color: K.gray, align: 'right' });
    UI.text(ctx, 'Pendientes', 20, 172, { size: 40, weight: 900 });
    // la idea
    const idea = typed('negocio millonario 💡', t, ev.idea, 18);
    const caret = Math.floor(t * 3) % 2 === 0 && t >= ev.idea && t < ev.lista;
    ctx.fillStyle = '#FFF3C2'; if (idea) { ctx.beginPath(); ctx.roundRect(12, 200, w - 24, 62, 12); ctx.fill(); }
    UI.text(ctx, '•', 22, 242, { size: 30, weight: 900, color: K.ink, alpha: t >= ev.idea ? 1 : 0 });
    UI.text(ctx, idea + (caret ? '|' : ''), 44, 242, { size: 30, weight: 800 });
    // la lista del mercado
    const items = [['huevos 🥚', ev.lista], ['papel higiénico 🧻', ev.lista + 0.22], ['arroz', ev.lista + 0.4], ['cebolla', ev.lista + 0.55]];
    items.forEach(([txt, at], i) => {
      const a = UI.pop(t, at, 0.25, 2.2);
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = clamp(a); ctx.translate((1 - clamp(a)) * 30, 0);
      UI.text(ctx, '•', 22, 318 + i * 60, { size: 30, weight: 900 });
      UI.text(ctx, txt, 44, 318 + i * 60, { size: 30, weight: 600, color: '#3A3A40' });
      ctx.restore();
    });
  }

  Studio.film({
    async init() {
      for (const w of ['600', '700', '800', '900']) await Studio.loadFont('Figtree', `fonts/figtree-latin-${w}-normal.woff2`, w);
      await Studio.loadFont('Anton', 'fonts/anton-latin-400-normal.woff2', '400');
    },
    draw(ctx, t) {
      ctx.fillStyle = K.bone; ctx.fillRect(0, 0, W, H);
      // "¿Y TÚ QUÉ?"
      const tp = UI.pop(t, ev.title, 0.3, 2.2);
      if (tp > 0) {
        ctx.save(); ctx.translate(140, 420); ctx.scale(0.85 + 0.15 * clamp(tp), 0.85 + 0.15 * clamp(tp));
        UI.text(ctx, '¿Y TÚ QUÉ? 🤨', 0, 0, { size: 120, weight: 400, font: 'Anton', color: K.ink, alpha: clamp(tp) });
        ctx.restore();
      }
      // el celular: entra, y en "notas del celular" hace zoom a la nota
      const pin = ease.outBack(clamp((t - ev.phone) / 0.45), 1.2);
      const zoom = ease.inOutCubic(clamp((t - ev.notas) / 0.5));
      if (pin > 0) {
        const h = lerp(700, 760, zoom);
        UI.phone(ctx, W / 2, lerp(H + 600, 900, pin), h, notesScreen, t, { rot: lerp(0.18, -0.03, pin) + zoom * 0.03 });
      }
      // anotación a mano: flecha + "aquí murió la idea"
      const r = UI.fadeIn(t, ev.rip, 0.2);
      if (r > 0) {
        const p = clamp((t - ev.rip) / 0.25);
        const pts = [[860, 690], [830, 735], [775, 755], [705, 752]].slice(0, 1 + Math.ceil(p * 3));
        G.line(ctx, pts, { lw: 7, color: '#E5484D', seed: 3 });
        if (p >= 1) { G.line(ctx, [[705, 752], [736, 730]], { lw: 7, color: '#E5484D', seed: 4 }); G.line(ctx, [[705, 752], [738, 774]], { lw: 7, color: '#E5484D', seed: 5 }); }
        G.text(ctx, 'aquí murió', 745, 600, { size: 56, color: '#E5484D', alpha: r, fam: 'Caveat' });
        G.text(ctx, 'la idea 💀', 755, 662, { size: 56, color: '#E5484D', alpha: r, fam: 'Caveat' });
      }
    },
    post: { paper: 0, grain: 0, vignette: 0 },
    fadeOut: 0,
  });
})();
