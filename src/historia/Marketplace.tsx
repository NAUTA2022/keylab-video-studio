import React from 'react';
import { Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { PiBell, PiCar, PiHouse, PiMagnifyingGlass, PiPlant, PiSun, PiCheckCircleFill } from 'react-icons/pi';

// Celular con una tokenizadora white label: marketplace de casas, autos, campos y energía.
// Todo por tiempos absolutos (segundos del video) para sincronizar con la voz.

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const ACCENT = '#2D52FF';
const BODY = 'Figtree';

type Asset = { img: string; title: string; place: string; sold: number; price: string };
const CATS: { key: string; label: string; Icon: React.ComponentType<{ size?: number; color?: string }>; items: Asset[] }[] = [
  { key: 'casas', label: 'Casas', Icon: PiHouse, items: [
    { img: 'casa1', title: 'Casa Llanogrande', place: 'Rionegro, Antioquia', sold: 0.68, price: 'US$ 50' },
    { img: 'apto', title: 'Edificio Laureles', place: 'Medellín', sold: 0.42, price: 'US$ 25' },
  ] },
  { key: 'autos', label: 'Autos', Icon: PiCar, items: [
    { img: 'auto2', title: 'Deportivo 2024', place: 'Bogotá', sold: 0.81, price: 'US$ 20' },
    { img: 'auto3', title: 'Clásico de colección', place: 'Cali', sold: 0.37, price: 'US$ 15' },
  ] },
  { key: 'campos', label: 'Campos', Icon: PiPlant, items: [
    { img: 'campo2', title: 'Finca El Retiro', place: 'Antioquia', sold: 0.55, price: 'US$ 30' },
    { img: 'campo3', title: 'Lotes agrícolas', place: 'Meta', sold: 0.29, price: 'US$ 10' },
  ] },
  { key: 'energia', label: 'Energía', Icon: PiSun, items: [
    { img: 'campo1', title: 'Parque solar', place: 'La Guajira', sold: 0.74, price: 'US$ 20' },
  ] },
];

const Card: React.FC<{ a: Asset; appear: number; t: number; highlight?: number }> = ({ a, appear, t, highlight = 0 }) => {
  const p = interpolate(t, [appear, appear + 0.6], [0, 1], { ...clamp, easing: ease });
  const bar = interpolate(t, [appear + 0.3, appear + 1.4], [0, a.sold], { ...clamp, easing: ease });
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px) scale(${1 + highlight * 0.03})`, background: '#14161D', borderRadius: 22, overflow: 'hidden', border: `1.5px solid ${highlight > 0 ? ACCENT : 'rgba(255,255,255,0.06)'}`, boxShadow: highlight > 0 ? `0 0 30px rgba(45,82,255,${0.5 * highlight})` : 'none' }}>
      <div style={{ height: 150, position: 'relative' }}>
        <Img src={staticFile(`media/historia-keylab/market/${a.img}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(5,5,7,0.7)', color: '#fff', fontFamily: BODY, fontWeight: 700, fontSize: 13, padding: '5px 10px', borderRadius: 999 }}>Tokenizado</div>
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 18, color: '#fff' }}>{a.title}</div>
        <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 13, color: '#8A8D99', marginTop: 2 }}>{a.place}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: BODY, fontSize: 13, color: '#C9CCD8', fontWeight: 600 }}>
          <span>Fragmento desde {a.price}</span>
          <span style={{ color: '#8CA0FF' }}>{Math.round(bar * 100)} %</span>
        </div>
        <div style={{ marginTop: 6, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
          <div style={{ width: `${bar * 100}%`, height: '100%', borderRadius: 3, background: ACCENT }} />
        </div>
      </div>
    </div>
  );
};

/* at: entra el teléfono; switches: tiempos en que cambia de categoría; tapAt: toque que abre el detalle */
export const MarketplacePhone: React.FC<{ at: number; until: number; x: number; y: number; switches: number[]; tapAt: number }> = ({ at, until, x, y, switches, tapAt }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  if (t < at - 0.1 || t > until + 0.1) return null;
  const inP = interpolate(t, [at, at + 1.0], [0, 1], { ...clamp, easing: ease });
  const out = interpolate(t, [until - 0.5, until], [1, 0], clamp);
  const cat = switches.filter((s) => t >= s).length; // 0..n
  const ci = Math.min(cat, CATS.length - 1);
  const catStart = cat === 0 ? at + 0.6 : switches[cat - 1];
  const items = CATS[ci].items;
  const scroll = interpolate(t, [catStart + 1.2, catStart + 3.6], [0, 60], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const tap = interpolate(t, [tapAt - 0.3, tapAt, tapAt + 0.4], [0, 1, 0], clamp);
  const sheet = interpolate(t, [tapAt + 0.2, tapAt + 0.9], [0, 1], { ...clamp, easing: ease });
  const qty = t > tapAt + 1.5 ? (t > tapAt + 2.1 ? 3 : 2) : 1;
  const done = interpolate(t, [tapAt + 3.0, tapAt + 3.4], [0, 1], clamp);
  const W = 400, H = 820;
  const sel = items[0];
  return (
    <div style={{ position: 'absolute', left: x - W / 2, top: y - H / 2, width: W, height: H, opacity: inP * out, transform: `translateY(${(1 - inP) * 80}px) rotate(${(1 - inP) * -4}deg)` }}>
      {/* marco */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 56, background: '#0B0C10', border: '2px solid rgba(255,255,255,0.18)', boxShadow: '0 40px 120px rgba(45,82,255,0.25), inset 0 0 0 8px #050507', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 12, borderRadius: 46, overflow: 'hidden', background: '#0A0B0F' }}>
          {/* status + header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 26px 0', fontFamily: BODY, fontWeight: 700, fontSize: 14, color: '#fff' }}>
            <span>9:41</span><span style={{ width: 90, height: 24, borderRadius: 12, background: '#000' }} /><span>100%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BODY, fontWeight: 900, color: '#fff', fontSize: 16 }}>TM</div>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 18, color: '#fff' }}>Tu Marca</div>
            </div>
            <PiBell size={22} color="#fff" />
          </div>
          <div style={{ margin: '4px 20px 12px', height: 42, borderRadius: 14, background: '#16181F', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', color: '#6E7282', fontFamily: BODY, fontSize: 14 }}>
            <PiMagnifyingGlass size={18} /> Buscar activos tokenizados
          </div>
          {/* categorías */}
          <div style={{ display: 'flex', gap: 8, padding: '0 20px 14px' }}>
            {CATS.map((c, i) => (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 999, background: i === ci ? ACCENT : '#16181F', color: '#fff', fontFamily: BODY, fontWeight: 700, fontSize: 13 }}>
                <c.Icon size={15} color="#fff" /> {c.label}
              </div>
            ))}
          </div>
          {/* lista */}
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14, transform: `translateY(${-scroll}px)` }}>
            {items.map((a, i) => (
              <Card key={CATS[ci].key + i} a={a} appear={catStart + i * 0.25} t={t} highlight={ci === CATS.length - 1 ? 0 : 0} />
            ))}
          </div>
          {/* toque */}
          {tap > 0 ? <div style={{ position: 'absolute', left: 190, top: 330, width: 60 + tap * 40, height: 60 + tap * 40, marginLeft: -(tap * 20), marginTop: -(tap * 20), borderRadius: '50%', background: `rgba(255,255,255,${0.25 * tap})` }} /> : null}
          {/* detalle */}
          {sheet > 0 ? (
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 560, transform: `translateY(${(1 - sheet) * 100}%)`, background: '#12141B', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, boxShadow: '0 -20px 60px rgba(0,0,0,0.6)' }}>
              <div style={{ width: 50, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.2)', margin: '0 auto 16px' }} />
              <div style={{ height: 180, borderRadius: 18, overflow: 'hidden' }}>
                <Img src={staticFile(`media/historia-keylab/market/${sel.img}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 22, color: '#fff', marginTop: 14 }}>{sel.title}</div>
              <div style={{ fontFamily: BODY, fontSize: 14, color: '#8A8D99' }}>{sel.place} · Contrato ERC-3643</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 }}>
                <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 15, color: '#C9CCD8' }}>Fragmentos</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: '#1C1F28', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontFamily: BODY }}>−</div>
                  <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 24, color: '#fff', width: 24, textAlign: 'center' }}>{qty}</div>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: ACCENT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontFamily: BODY }}>+</div>
                </div>
              </div>
              <div style={{ marginTop: 26, height: 56, borderRadius: 16, background: done > 0.5 ? '#1B8A55' : ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: BODY, fontWeight: 800, fontSize: 17, color: '#fff' }}>
                {done > 0.5 ? <><PiCheckCircleFill size={22} /> Fragmentos asignados</> : 'Adquirir fragmentos'}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

/* Capturas reales de la plataforma (Keychain) dentro de una ventana de navegador.
   Cada captura entra con un deslizamiento suave y hace un recorrido lento (zoom + paneo). */
type Shot = { img: string; label: string; at: number; zoom?: [number, number]; pan?: [[number, number], [number, number]] };
export const PlataformaReal: React.FC<{ at: number; until: number; x: number; y: number; width: number; shots: Shot[] }> = ({ at, until, x, y, width, shots }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  if (t < at - 0.1 || t > until + 0.1) return null;
  const inP = interpolate(t, [at, at + 0.9], [0, 1], { ...clamp, easing: ease });
  const out = interpolate(t, [until - 0.5, until], [1, 0], clamp);
  const BAR = 38;
  const sw = width, sh = Math.round(width * 740 / 1016);
  const H = sh + BAR;
  const cur = shots.filter((s) => t >= s.at).length - 1;
  return (
    <div style={{ position: 'absolute', left: x - sw / 2, top: y - H / 2, width: sw, height: H, opacity: inP * out, transform: `translateY(${(1 - inP) * 60}px) scale(${0.96 + 0.04 * inP})` }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 18, overflow: 'hidden', background: '#101219', border: '1.5px solid rgba(255,255,255,0.14)', boxShadow: '0 40px 120px rgba(45,82,255,0.28), 0 0 0 1px rgba(0,0,0,0.6)' }}>
        <div style={{ height: BAR, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: '#171A22' }}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />)}
          <div style={{ marginLeft: 18, flex: 1, height: 22, borderRadius: 8, background: '#0D0F15', color: '#8A8D99', fontFamily: BODY, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>app.tumarca.com</div>
        </div>
        <div style={{ position: 'absolute', left: 0, top: BAR, width: sw, height: sh, overflow: 'hidden', background: '#F4F6FA' }}>
          {shots.map((s, i) => {
            const end = i + 1 < shots.length ? shots[i + 1].at : until;
            if (t < s.at - 0.05 || t > end + 0.7) return null;
            const p = interpolate(t, [s.at, s.at + 0.7], [0, 1], { ...clamp, easing: ease });
            const life = interpolate(t, [s.at, end + 0.6], [0, 1], clamp);
            const [z0, z1] = s.zoom ?? [1.0, 1.08];
            const [[px0, py0], [px1, py1]] = s.pan ?? [[0.5, 0.5], [0.5, 0.5]];
            const z = z0 + (z1 - z0) * life;
            const ox = (px0 + (px1 - px0) * life) * 100, oy = (py0 + (py1 - py0) * life) * 100;
            return (
              <div key={s.img} style={{ position: 'absolute', inset: 0, opacity: i === 0 ? 1 : p, transform: `translateX(${i === 0 ? 0 : (1 - p) * 60}px)` }}>
                <Img src={staticFile(`media/historia-keylab/plataforma/${s.img}.png`)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`, transformOrigin: `${ox}% ${oy}%` }} />
              </div>
            );
          })}
        </div>
      </div>
      {/* etiqueta de la pantalla actual */}
      <div style={{ position: 'absolute', left: 0, top: H + 22, display: 'flex', alignItems: 'center', gap: 12 }}>
        {shots.map((s, i) => (
          <div key={s.img} style={{ height: 6, width: i === cur ? 34 : 10, borderRadius: 3, background: i === cur ? ACCENT : 'rgba(255,255,255,0.22)' }} />
        ))}
        <div style={{ marginLeft: 8, fontFamily: BODY, fontWeight: 700, fontSize: 18, color: '#E8EAF0', letterSpacing: 0.3 }}>{shots[Math.max(cur, 0)].label}</div>
        <div style={{ marginLeft: 'auto' }} />
      </div>
      <div style={{ position: 'absolute', right: 0, top: H + 22, fontFamily: BODY, fontWeight: 600, fontSize: 15, color: '#6E7282' }}>Captura real · Keychain</div>
    </div>
  );
};
