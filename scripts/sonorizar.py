"""
Sonorización completa de un video Key Lab a partir de su JSON.

  python scripts/sonorizar.py src/data/demo-tokenizacion.json

Lee las escenas (duraciones) y la voz, y genera public/media/banda.mp3 con:
  - Música original (120 BPM, La menor) que sigue la estructura del video:
    groove → riser → silencio real en "Ey." → drop → cierre.
  - Ducking: la música baja sola cuando habla la voz y sube en los huecos.
  - Efectos sincronizados con las animaciones de cada escena
    (whoosh en cortes, ticks del DecryptedText, golpe del sello, ticks del
    contador, swish del RotatingText, slides de tarjetas, impacto del "Ey.",
    shimmer del cierre).
  - Voz encima, mezcla masterizada a -14 LUFS (estándar de redes).
Todo se sintetiza en código: no hay licencias de por medio.
"""
import json, subprocess, sys, wave
import numpy as np

SR = 44100
FPS = 30
data_path = sys.argv[1] if len(sys.argv) > 1 else 'src/data/demo-tokenizacion.json'
out_path = sys.argv[2] if len(sys.argv) > 2 else 'public/media/banda.mp3'
D = json.load(open(data_path, encoding='utf-8'))
rng = np.random.default_rng(11)

# ---------- línea de tiempo (igual que KeyLabVideo.tsx) ----------
scenes = []
acc = 0
for s in D['scenes']:
    n = round(s['dur'] * FPS)
    scenes.append({**s, 'start': acc / FPS, 'end': (acc + n) / FPS})
    acc += n
DUR = acc / FPS
N = int(DUR * SR) + SR // 2
by = lambda t: [s for s in scenes if s['type'] == t]
ey = (by('ey') or [None])[0]
EY_START, DROP = (ey['start'], ey['end']) if ey else (DUR * 0.5, DUR * 0.5)
close = (by('close') or [None])[0]
CLOSE = close['start'] if close else DUR

# ---------- utilidades de síntesis ----------
def t_(n): return np.arange(n) / SR
def env(n, a=0.002, d=0.2):
    t = t_(n); return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def lp(x, k):  # pasabajos de un polo (k: 0..1, menor = más oscuro)
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x): acc += k * (v - acc); y[i] = acc
    return y
def lp_fast(x, k):
    from scipy.signal import lfilter
    return lfilter([k], [1, k - 1], x)
try:
    import scipy  # noqa
    lowpass = lp_fast
except Exception:
    lowpass = lp
def hp(x, k): return x - lowpass(x, k)
def noise(n): return rng.standard_normal(n)
def stereo(x, pan=0.0):
    return np.stack([x * (1 - max(0, pan)), x * (1 + min(0, pan))], axis=1)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

music = np.zeros((N, 2)); sfx = np.zeros((N, 2))
def put(buf, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i + len(sig) <= 0: return
    if sig.ndim == 1: sig = stereo(sig, pan)
    if i < 0: sig = sig[-i:]; i = 0
    sig = sig[: N - i] * gain
    buf[i:i + len(sig)] += sig

# ---------- instrumentos ----------
def kick():
    n = int(0.5 * SR); t = t_(n)
    f = 45 + 120 * np.exp(-t * 30)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.22)
    click = hp(noise(n), 0.5) * env(n, 0.0005, 0.004) * 0.4
    return np.tanh((body + click) * 1.6)
def snare_clap():
    n = int(0.3 * SR); s = hp(noise(n), 0.2)
    e = sum(env(n, 0.0005, 0.01) * (t_(n) >= k) for k in (0, 0.012, 0.024)) + env(n, 0.001, 0.11) * 0.7
    tone = np.sin(2 * np.pi * 190 * t_(n)) * env(n, 0.001, 0.05) * 0.5
    return (s * e + tone) * 0.6
def hat(open_=False):
    n = int((0.22 if open_ else 0.06) * SR)
    return hp(noise(n), 0.08) * env(n, 0.0005, 0.07 if open_ else 0.018) * 0.5
def saw(freq, n, detune=0.0):
    t = t_(n); ph = (freq * (1 + detune)) * t
    return 2 * (ph - np.floor(ph + 0.5))
def sub_bass(freq, length):
    n = int(length * SR); t = t_(n)
    s = np.sin(2 * np.pi * freq * t) + 0.35 * np.tanh(3 * np.sin(2 * np.pi * freq * t))
    return s * np.minimum(1, t / 0.005) * np.exp(-t / (length * 0.9))
def supersaw_chord(freqs, length, cutoff=0.06):
    n = int(length * SR); t = t_(n)
    s = sum(saw(f, n, d) for f in freqs for d in (-0.008, 0, 0.008)) / (len(freqs) * 3)
    s = lowpass(s, cutoff)
    return s * np.minimum(1, t / 0.02) * np.minimum(1, (length - t) / 0.05)
def pluck(freq, length=0.18):
    n = int(length * SR)
    return lowpass(saw(freq, n), 0.25) * env(n, 0.002, 0.08)
def pad(freqs, length):
    n = int(length * SR); t = t_(n)
    s = sum(np.sin(2 * np.pi * f * t + 0.8 * np.sin(2 * np.pi * f * 0.5 * t)) for f in freqs) / len(freqs)
    return s * np.minimum(1, t / 0.5) * np.minimum(1, (length - t) / 0.4)

# ---------- música ----------
BEAT = 0.5; BAR = 4 * BEAT
prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G
roots = [33, 29, 36, 31]
pump = np.ones(N)  # sidechain del kick
t = 0.0; bar = 0
while t < DUR:
    ch = prog[bar % 4]; r = roots[bar % 4]
    for b in range(4):
        bt = t + b * BEAT
        if bt >= DUR or EY_START - 0.02 <= bt < DROP: continue
        part = 'intro' if bt < EY_START else ('drop' if bt < CLOSE else 'outro')
        last_bar_before_ey = EY_START - BAR <= bt < EY_START
        # batería
        if part != 'outro' or bt < DUR - 1.5:
            put(music, kick(), bt, 0.95 if part == 'drop' else 0.8)
            i = int(bt * SR); k = int(0.22 * SR)
            if i + k < N: pump[i:i + k] = np.minimum(pump[i:i + k], 0.35 + 0.65 * (t_(k) / 0.22) ** 0.6)
        if part == 'drop' and b in (1, 3): put(music, snare_clap(), bt, 0.9)
        if part == 'intro' and b == 3 and bar % 2 == 1: put(music, snare_clap(), bt, 0.5)
        put(music, hat(open_=(part == 'drop')), bt + BEAT / 2, 0.55, 0.25)
        if part == 'drop' or last_bar_before_ey:
            for q in (0.25, 0.75): put(music, hat(), bt + q * BEAT, 0.35, -0.25)
        # bajo
        if part != 'outro':
            pattern = (0, 0.75, 1.5) if part == 'drop' else (0, 1.0)
            if b % 2 == 0:
                for q in pattern: put(music, sub_bass(hz(r), 0.3), bt + q * BEAT, 0.5)
        # arpegio pluck
        arp = ch + [ch[0] + 12]
        steps = 4 if part == 'drop' else 2
        for s_ in range(steps):
            note = arp[(b * steps + s_) % 4] + 12
            put(music, pluck(hz(note)), bt + s_ * BEAT / steps, 0.16 if part == 'drop' else 0.11, 0.35 if s_ % 2 else -0.35)
    # acordes
    if not (EY_START <= t < DROP):
        L = min(BAR, DUR - t)
        if t < EY_START: L = min(L, EY_START - t)
        if t < EY_START or t >= DROP:
            if t >= DROP and t < CLOSE:
                put(music, supersaw_chord([hz(m) for m in ch], L, 0.09), t, 0.32)
            else:
                put(music, pad([hz(m) for m in ch], L), t, 0.22)
    t += BAR; bar += 1
# si el drop no cae en compás, re-dispara el acorde en el drop
put(music, supersaw_chord([hz(m) for m in prog[0]], min(BAR, CLOSE - DROP), 0.09), DROP, 0.32)
music[:, 0] *= pump; music[:, 1] *= pump

# riser hacia el "Ey." y silencio real
rn = int(1.6 * SR); rt = t_(rn)
riser = hp(noise(rn), 0.05) * (rt / rt[-1]) ** 2.2
sweep = np.sin(2 * np.pi * np.cumsum(200 + 1800 * (rt / rt[-1]) ** 2) / SR) * (rt / rt[-1]) ** 2 * 0.3
put(music, riser * 0.35 + sweep * 0.25, EY_START - 1.6)
a, b = int(EY_START * SR), int(DROP * SR); f = int(0.008 * SR)
music[a:a + f] *= np.linspace(1, 0, f)[:, None]; music[a + f:b] = 0

# ---------- efectos (sonorización) ----------
def whoosh(length=0.35, up=True):
    n = int(length * SR); t = t_(n); x = t / t[-1]
    shape = np.sin(np.pi * x) ** 2
    s = noise(n)
    cut = (0.02 + 0.25 * (x if up else 1 - x))
    out = np.empty(n); acc = 0.0
    for i in range(n): acc += cut[i] * (s[i] - acc); out[i] = acc
    return out * shape * 1.8
def impact(boom=1.0):
    n = int(1.2 * SR); t = t_(n)
    sub = np.sin(2 * np.pi * np.cumsum(30 + 90 * np.exp(-t * 18)) / SR) * env(n, 0.001, 0.45)
    crack = hp(noise(n), 0.3) * env(n, 0.0005, 0.03)
    return np.tanh((sub * boom + crack * 0.6) * 1.4)
def tick(freq=3200, length=0.025):
    n = int(length * SR); return np.sin(2 * np.pi * freq * t_(n)) * env(n, 0.0005, 0.006)
def blip(freq=1400, length=0.06):
    n = int(length * SR); return np.sign(np.sin(2 * np.pi * freq * t_(n))) * env(n, 0.001, 0.015) * 0.3
def thud():
    n = int(0.35 * SR); t = t_(n)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(70 + 80 * np.exp(-t * 40)) / SR) * env(n, 0.001, 0.09) * 2) + lowpass(noise(n), 0.15) * env(n, 0.001, 0.03)
def swish():
    return whoosh(0.18, up=True) * 0.8
def shimmer(length=1.6):
    n = int(length * SR); t = t_(n)
    notes = [hz(m) for m in (81, 84, 88, 93, 96)]
    s = sum(np.sin(2 * np.pi * f * t) * env(n, 0.002 + i * 0.05, 0.5) * (t >= i * 0.06) for i, f in enumerate(notes))
    return s / len(notes)

def coin_ring(freq=2600):
    n = int(0.5 * SR); t = t_(n)
    s = (np.sin(2 * np.pi * freq * t) + 0.6 * np.sin(2 * np.pi * freq * 2.76 * t) + 0.3 * np.sin(2 * np.pi * freq * 5.4 * t))
    return s * env(n, 0.0008, 0.12) * 0.5
def pop(freq=900):
    n = int(0.09 * SR); t = t_(n)
    return np.sin(2 * np.pi * np.cumsum(freq + 900 * np.exp(-t * 60)) / SR) * env(n, 0.001, 0.03)
def ding():
    n = int(0.6 * SR); t = t_(n)
    return (np.sin(2 * np.pi * 1318 * t) * env(n, 0.002, 0.18) + np.sin(2 * np.pi * 1760 * t) * env(n, 0.002, 0.25) * (t > 0.08)) * 0.5
def cha_ching():
    out = np.zeros(int(0.9 * SR))
    for k, (f0, dt) in enumerate([(2200, 0), (2900, 0.07), (3500, 0.14), (2600, 0.22)]):
        c = coin_ring(f0); i = int(dt * SR); out[i:i + len(c)] += c[: len(out) - i]
    return out
def draw_scratch(length=0.5):
    n = int(length * SR); x = t_(n) / length
    return hp(noise(n), 0.3) * np.sin(np.pi * x) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * x)) * 0.25

def cue(s, name, default):
    return s['start'] + (s.get('cues') or {}).get(name, default)

FIXED = []  # sonidos de los momentos fijos (Ey y cierre)
clamp = lambda v, lo, hi: max(lo, min(hi, v))
for i, s in enumerate(scenes):
    st = s['start']; typ = s['type']
    # corte: whoosh antes de cada escena y flash
    if i > 0:
        put(sfx, whoosh(0.32), st - 0.26, 0.55, 0.0)
    if typ == 'hook':
        kicker_len = len(s.get('kicker', ''))
        t0 = cue(s, 'title', 0.0)  # el texto entra en este momento
        for k in range(int(kicker_len * 1.2 + 10) // 2):  # DecryptedText: ticks cada 2 cuadros
            put(sfx, tick(2600 + rng.integers(0, 1600)), t0 + (k * 2) / FPS, 0.12, rng.uniform(-0.5, 0.5))
        put(sfx, whoosh(0.4), t0 + 6 / FPS - 0.1, 0.35)          # SplitText del título
        if s.get('asset') == 'taxi-leech':
            put(sfx, swish(), cue(s, 'turn', 0.1), 0.35, 0.2)               # gira la cabeza a cámara
            for q in s.get('quotes', []):                                    # frase de meme que salta
                put(sfx, thud(), st + q['at'], 0.35)
            put(sfx, whoosh(0.5), t0 - 0.15, 0.4)                            # la cámara se abre
            pg = cue(s, 'pega', 4.4)
            put(sfx, pop(260), pg, 0.7); put(sfx, pop(180), pg + 0.07, 0.5)  # ventosa: se pega
            FIXED.append(('sfx/boing.mp3', pg + 0.02, 0.55, False))          # rebote del aplastón
            put(sfx, whoosh(1.4), pg + 0.15, 0.45, -0.4)                     # el carro arranca
        tok = cue(s, 'tokens', 0.73)
        if s.get('highlight'): put(sfx, thud(), tok + 0.12, 0.5)  # bloque cobalto
        if s.get('asset') == 'city-car3d':
            put(sfx, whoosh(1.2), cue(s, 'drive', 0.0), 0.5, -0.5)  # el carro entra
            FIXED.append(('sfx/explosion.mp3', cue(s, 'boom', 1.44) - 0.03, 1.0, False))  # explosión meme
        if s.get('asset') == 'building3d':
            b0 = cue(s, 'building', 0.1)
            for fl in range(11):  # cada piso que aparece
                put(sfx, pop(500 + fl * 60), b0 + (fl * 1.6) / FPS, 0.18, rng.uniform(-0.3, 0.3))
            put(sfx, impact(0.5), tok, 0.45)  # se desarma
            for k in range(14):  # lluvia de tokens
                put(sfx, coin_ring(2000 + rng.integers(0, 1800)), tok + 0.05 + k * 0.045 + rng.uniform(0, 0.03), 0.16, rng.uniform(-0.7, 0.7))
    elif typ == 'roast':
        gap = round(0.7 * FPS)
        for k in range(len(s['lines'])): put(sfx, swish(), cue(s, f'line{k}', k * gap / FPS), 0.3, -0.2 if k % 2 else 0.2)
        if s.get('punch'): put(sfx, thud(), cue(s, 'punch', (len(s['lines']) * gap + 4) / FPS) + 6 / FPS, 0.9)  # sello
        if s.get('asset') == 'excel-chat':
            put(sfx, whoosh(0.25), cue(s, 'excel', 1.6) - 0.1, 0.35, -0.3)
            for k in range(8): put(sfx, tick(1500 + k * 90, 0.02), cue(s, 'excel', 1.6) + (8 + k * 3) / FPS, 0.1, -0.3)  # celdas
            for k, dt in enumerate((0, 7, 14)): put(sfx, pop(1100 + 200 * k), cue(s, 'chat', 2.2) + dt / FPS, 0.45, 0.35)
            put(sfx, ding(), cue(s, 'chat', 2.2), 0.3, 0.35)
            put(sfx, blip(660, 0.1), cue(s, 'night', 2.9), 0.25, 0.5)
    elif typ == 'stat':
        # CountUp con easing exponencial: ticks que se espacian
        d0, dur = 4, 36
        last = -1
        for fr in range(dur + 1):
            prog_ = 1 - 2 ** (-10 * fr / dur)
            step = int(prog_ * 24)
            if step != last: put(sfx, tick(1800 + step * 40, 0.02), st + (d0 + fr) / FPS, 0.16); last = step
        put(sfx, blip(2200, 0.12), st + (d0 + dur) / FPS, 0.25)
        if s.get('asset') == 'phone3d':
            put(sfx, whoosh(0.4), st, 0.4)
            inv = cue(s, 'invest', 3.2)
            put(sfx, whoosh(0.5, up=False), inv - 0.55, 0.3)  # token cayendo
            put(sfx, pop(700), inv, 0.5)  # botón
            put(sfx, cha_ching(), inv + 0.12, 0.55)
    elif typ == 'mg':
        # motion graphics sobre foto: un sonido por capa en su momento exacto
        for l in s.get('layers', []):
            t0 = st + l['at']; k = l['k']
            if k == 'text':
                if l.get('anim') == 'slam': put(sfx, impact(0.6), t0, 0.55); put(sfx, thud(), t0, 0.6)
                else: put(sfx, swish(), t0, 0.32, rng.uniform(-0.3, 0.3))
            elif k == 'count':
                d = l.get('dur', 1.1); last = -1
                for fr in range(int(d * FPS) + 1):
                    step = int((1 - 2 ** (-10 * fr / (d * FPS))) * 22)
                    if step != last: put(sfx, tick(1800 + step * 45, 0.02), t0 + fr / FPS, 0.15); last = step
                put(sfx, impact(0.4), t0 + d, 0.35)
            elif k == 'donut': put(sfx, whoosh(0.9), t0, 0.35, -0.2)
            elif k == 'bar': put(sfx, whoosh(0.6), t0 + 0.05, 0.25, 0.2)
            elif k in ('chip', 'pin'): put(sfx, pop(900), t0, 0.4, rng.uniform(-0.4, 0.4))
            elif k == 'emoji': put(sfx, pop(1300), t0, 0.35, rng.uniform(-0.5, 0.5))
            elif k == 'bubble': put(sfx, pop(1100), t0, 0.45, 0.35); put(sfx, ding(), t0, 0.18, 0.35)
            elif k == 'coins':
                for j in range(12): put(sfx, coin_ring(2000 + rng.integers(0, 1800)), t0 + j * 0.05 + rng.uniform(0, 0.03), 0.15, rng.uniform(-0.7, 0.7))
            elif k == 'excel':
                put(sfx, whoosh(0.3), t0 - 0.1, 0.35, -0.3)
                for j in range(8): put(sfx, tick(1500 + j * 90, 0.02), t0 + (8 + j * 3) / FPS, 0.1, -0.3)
            elif k == 'don': put(sfx, whoosh(0.5), t0, 0.4, -0.4)
            elif k == 'meme': put(sfx, thud(), t0, 0.5)
            elif k == 'dancer': put(sfx, whoosh(0.4), t0 - 0.1, 0.4); put(sfx, pop(1500), t0 + 0.05, 0.35)
        for sh in s.get('shake', []): put(sfx, impact(0.5), st + sh, 0.4)
    elif typ == 'ey':
        put(sfx, impact(1.2), st, 0.5)
        FIXED.append(('sfx/boom.mp3', st, 1.0, False))  # asset fijo: zorro de la ceja + vine boom
    elif typ == 'pivot':
        put(sfx, impact(0.8), st, 0.7)
        words = s['words']; every = max(14, int(((s['dur'] - 0.6) * FPS) // len(words)))
        at = s.get('wordsAt') or [(10 + k * every) / FPS for k in range(len(words))]
        for k in range(len(words)): put(sfx, swish(), st + at[k] - 0.04, 0.45, 0.3 if k % 2 else -0.3)
        if s.get('icons'):
            starts = ([cue(s, 'edificio', 1.2)] if (s.get('cues') or {}).get('edificio') is not None else []) + [st + a for a in at]
            for t0 in starts: put(sfx, draw_scratch(0.5), t0, 0.5, 0.2)
    elif typ == 'story':
        c = lambda k, d: cue(s, k, d)
        put(sfx, pop(600), c('senor', 0.2), 0.45); put(sfx, whoosh(0.3), c('senor', 0.2) - 0.1, 0.3)
        put(sfx, pop(800), c('car', 2.9), 0.5)
        put(sfx, thud(), c('plata', 4.6) + 0.1, 0.6)  # billete tachado
        put(sfx, whoosh(0.35), c('split', 5.55) - 0.1, 0.4); put(sfx, impact(0.4), c('split', 5.55) + 0.4, 0.35)
        for k in range(12): put(sfx, coin_ring(2000 + rng.integers(0, 1600)), c('split', 5.55) + 0.45 + k * 0.05, 0.12, rng.uniform(-0.6, 0.6))
        for k in range(6): put(sfx, pop(700 + k * 80), c('people', 7.5) + k * 4 / FPS, 0.3, -0.4 + k * 0.16)
        for k in range(6): put(sfx, coin_ring(2400 + k * 120), c('dolar', 9.0) + (k * 2 + 12) / FPS, 0.2, -0.4 + k * 0.16)
        put(sfx, whoosh(1.4), c('drive', 9.8), 0.45, -0.3)
        for k in range(3): put(sfx, blip(1200 + k * 200, 0.07), c('drive', 9.8) + (6 + k * 8) / FPS, 0.25)
        put(sfx, cha_ching(), c('monthly', 11.6) + 0.2, 0.45)
        for m in range(6): put(sfx, tick(1500 + m * 100, 0.03), c('monthly', 11.6) + m * 0.45, 0.2)
        put(sfx, whoosh(0.3), c('tired', 14.3) - 0.1, 0.35)
        put(sfx, pop(500), c('vende', 15.9), 0.5, -0.3); put(sfx, pop(900), c('sigue', 16.42), 0.5, 0.3)
        n0, n1 = c('count', 18.2), c('ocho', 19.72)
        for k in range(8): put(sfx, pop(500 + k * 90), n0 + (n1 - n0) * k / 7, 0.4, -0.5 + k / 7)
        put(sfx, ding(), n1 + 0.05, 0.45)
    elif typ == 'clip':
        cs = s.get('cues') or {}
        if 'title' in cs: put(sfx, thud(), st + cs['title'] + 0.05, 0.5)
        if 'phone' in cs: put(sfx, whoosh(0.4), st + cs['phone'], 0.4, 0.3)
        if 'idea' in cs:
            for k in range(14): put(sfx, tick(2200 + rng.integers(0, 600), 0.02), st + cs['idea'] + k / 18, 0.15)
        if 'lista' in cs:
            for k, dt in enumerate((0, 0.22, 0.4, 0.55)): put(sfx, pop(900 + 120 * k), st + cs['lista'] + dt, 0.35)
        if 'rip' in cs: put(sfx, draw_scratch(0.35), st + cs['rip'], 0.5, 0.4)
        if 'sketch' in cs: put(sfx, draw_scratch(1.0), st + cs['sketch'], 0.5, -0.2)
        if 'materialize' in cs: put(sfx, whoosh(0.3), st + cs['materialize'] - 0.15, 0.45); put(sfx, pop(900), st + cs['materialize'], 0.4)
        if 'tap' in cs: put(sfx, pop(700), st + cs['tap'], 0.45); put(sfx, coin_ring(2600), st + cs['tap'] + 0.12, 0.3)
        for k in ('brand', 'brand2', 'brand3'):
            if k in cs: put(sfx, whoosh(0.35), st + cs[k] - 0.05, 0.45); put(sfx, ding(), st + cs[k] + 0.15, 0.3)
        # trazabilidad y bóveda por hitos (explicaciones/boveda-hitos)
        if 'trace' in cs: put(sfx, draw_scratch(0.6), st + cs['trace'], 0.35, 0.2)
        if 'coins' in cs:
            for k in range(12): put(sfx, coin_ring(2000 + rng.integers(0, 1400)), st + cs['coins'] + 0.6 + k * 0.08, 0.14, rng.uniform(-0.5, 0.5))
        if 'gps' in cs:
            for k in range(3): put(sfx, pop(1000 + 150 * k), st + cs['gps'] + k * 0.1, 0.35, 0.4)
        if 'receipt' in cs: put(sfx, pop(700), st + cs['receipt'], 0.45); put(sfx, ding(), st + cs['receipt'] + 0.15, 0.3)
        if 'cumple' in cs: put(sfx, pop(900), st + cs['cumple'], 0.45); put(sfx, ding(), st + cs['cumple'] + 0.05, 0.35)
        if 'cobra' in cs: put(sfx, cha_ching(), st + cs['cobra'] + 0.1, 0.55)
        if 'atrasa' in cs:
            for k in range(3): put(sfx, blip(520, 0.12), st + cs['atrasa'] + k * 0.16, 0.4)
        if 'votan' in cs:
            for k in range(9): put(sfx, pop(800 + 60 * k), st + cs['votan'] + k * 0.04, 0.25, -0.5 + k / 8)
        if 'congelan' in cs: put(sfx, impact(0.9), st + cs['congelan'], 0.6); put(sfx, shimmer(1.2), st + cs['congelan'] + 0.05, 0.4)
        if 'termine' in cs: put(sfx, pop(1200), st + cs['termine'], 0.4)
    elif typ == 'boveda-hook':
        put(sfx, shimmer(1.0), cue(s, 'hilux', 2.9), 0.45, 0.2)  # brillo de la camioneta
        put(sfx, thud(), cue(s, 'gono', 3.65), 0.5)
        put(sfx, whoosh(0.6), cue(s, 'lot', 4.85) - 0.05, 0.45)
        FIXED.append(('sfx/trombon.mp3', cue(s, 'lote', 5.6) + 0.2, 0.55, False))  # lote con maleza
    elif typ == 'boveda-story':
        c = lambda k, d: cue(s, k, d)
        put(sfx, whoosh(0.3), c('don', 0.13) - 0.1, 0.35); put(sfx, pop(600), c('don', 0.13) + 0.1, 0.4)
        for k in range(20): put(sfx, pop(600 + (k % 5) * 90), c('plata', 1.97) + k * 1.2 / FPS, 0.18, -0.4 + (k % 4) * 0.25)
        for k in range(16): put(sfx, coin_ring(2200 + rng.integers(0, 1200)), c('plata', 1.97) + 1.0 + k * 0.05, 0.12, rng.uniform(-0.6, 0.2))
        put(sfx, draw_scratch(0.4), c('edificio', 4.21), 0.4, 0.3)
        for k in ('a1', 'a2', 'a3'): put(sfx, thud(), c(k, 0) + 0.05, 0.45)
        for k in ('ex1', 'ex2', 'ex3'): put(sfx, swish(), c(k, 0), 0.4, -0.2); put(sfx, tick(900, 0.05), c(k, 0) + 0.2, 0.3)
        put(sfx, pop(400), c('ex3', 11.31) + 16 / FPS, 0.4)  # excusómetro revienta (pop suave, sin explosión)
        put(sfx, whoosh(0.4), c('evidencia', 12.19), 0.35, 0.4)
        FIXED.append(('sfx/scratch.mp3', c('render', 13.87), 0.9, False))  # "¿me estás jodiendo?"
        put(sfx, impact(0.6), c('rabia', 14.7), 0.5)
    elif typ == 'boveda-vault':
        if s.get('mode') == 'store':
            for k in range(14): put(sfx, coin_ring(2000 + rng.integers(0, 1600)), st + 0.3 + k * 0.05, 0.14, rng.uniform(-0.6, 0.6))
            sl = cue(s, 'slam', 1.06)
            put(sfx, impact(1.4), sl, 0.95); put(sfx, coin_ring(800), sl + 0.02, 0.4)  # CLANK
            put(sfx, tick(700, 0.06), sl + 0.15, 0.4); put(sfx, tick(500, 0.06), sl + 0.35, 0.4)  # la rueda traba
            put(sfx, ding(), cue(s, 'release', 2.12), 0.4); put(sfx, cha_ching(), cue(s, 'release', 2.12) + 0.1, 0.4)
        else:
            put(sfx, whoosh(1.2), cue(s, 'run', 1.0), 0.45, -0.4)  # sale corriendo
            for k in range(10): put(sfx, tick(300 + (k % 2) * 80, 0.04), cue(s, 'run', 1.0) + 0.2 + k * 0.2, 0.25, -0.3)  # pasos
            sl = cue(s, 'slam', 3.16)
            put(sfx, impact(1.4), sl, 0.9)
            FIXED.append(('sfx/boing.mp3', sl + 2 / FPS, 0.8, False))
            FIXED.append(('sfx/trombon.mp3', sl + 0.5, 0.45, False))
    elif typ == 'statement':
        for ln in s.get('lines', []):
            put(sfx, whoosh(0.3), st + ln['at'] - 0.12, 0.35)
            put(sfx, impact(0.9 if ln.get('big') else 0.4), st + ln['at'], 0.7 if ln.get('big') else 0.35)
    elif typ == 'solution' and s.get('clip'):
        # demo de plataforma (animation-studio): mismos cues que el clip
        put(sfx, draw_scratch(1.0), cue(s, 'sketch', 0.25), 0.55, -0.2)
        put(sfx, whoosh(0.3), cue(s, 'materialize', 1.4) - 0.15, 0.45); put(sfx, pop(900), cue(s, 'materialize', 1.4), 0.4)
        put(sfx, whoosh(0.4), cue(s, 'phone', 1.75), 0.4, 0.5)
        put(sfx, pop(700), cue(s, 'tap', 2.3), 0.5); put(sfx, coin_ring(2600), cue(s, 'tap', 2.3) + 0.12, 0.3)
        put(sfx, whoosh(0.35), cue(s, 'brand', 2.95) - 0.05, 0.5); put(sfx, ding(), cue(s, 'brand', 2.95) + 0.2, 0.35)
    elif typ == 'solution':
        step = round(0.55 * FPS)
        for k in range(len(s['items'])):
            put(sfx, whoosh(0.22), st + (10 + k * step) / FPS - 0.05, 0.4, 0.4)
            put(sfx, blip(1200 + 300 * k, 0.05), st + (10 + k * step + 8) / FPS, 0.3)
    elif typ == 'close':
        FIXED.append(('sfx/muejeje-corto.mp3', s['end'] - 2.05, 1.0, True))  # asset fijo: zorro muejeje
        put(sfx, impact(0.6), st, 0.55)
        put(sfx, shimmer(), st + 0.2, 0.35)
        put(sfx, blip(1760, 0.08), st + 18 / FPS, 0.2)

# ---------- memes del zorro: sonidos de YouTube (public/sfx) ----------
def load_audio(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 's16le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.int16).reshape(-1, 2) / 32768
gag_voice = np.zeros((N, 2))  # risas/frases: van con la voz para que la música baje
# Regla de humor: memes de contenido separados al menos 4 s entre sí y de los momentos fijos
moments = sorted([g['at'] for g in (D.get('gags') or [])] + [t for _, t, _, _ in FIXED])
for a_, b_ in zip(moments, moments[1:]):
    if b_ - a_ < 4: print(f'AVISO: memes muy juntos ({a_:.1f}s y {b_:.1f}s). Sepáralos al menos 4 s.')
for path, t0, gain, duck in FIXED:
    clip = load_audio('public/' + path); clip = clip / (np.max(np.abs(clip)) + 1e-9) * 0.9
    put(gag_voice if duck else sfx, clip, t0, gain)
for g in D.get('gags') or []:
    if not g.get('sfx'): continue
    try:
        clip = load_audio('public/' + g['sfx'])
    except Exception as e:
        print('No se pudo leer', g['sfx'], e); continue
    clip = clip / (np.max(np.abs(clip)) + 1e-9) * 0.9
    put(gag_voice if g.get('duck') else sfx, clip, g['at'], g.get('sfxGain', 0.8))

# ---------- voz + ducking ----------
voice = np.zeros((N, 2))
if D.get('voice'):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'public/' + D['voice'], '-f', 's16le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True).stdout
    v = np.frombuffer(raw, dtype=np.int16).reshape(-1, 2) / 32768
    voice[: min(N, len(v))] = v[:N]
voice = voice + gag_voice * 0.85
mono = np.abs(voice).mean(axis=1)
win = int(0.08 * SR)
envv = np.convolve(mono, np.ones(win) / win, mode='same')
active = np.clip(envv / (np.percentile(envv[envv > 1e-4], 60) + 1e-9), 0, 1) if envv.max() > 0 else envv
att = int(0.03 * SR); rel = int(0.25 * SR)
duck = np.empty(N); cur = 0.0
for i in range(N):
    target = active[i]
    cur += (target - cur) * (1 / att if target > cur else 1 / rel)
    duck[i] = cur
music_gain = 1.0 - 0.55 * duck  # -7 dB aprox. bajo la voz
music *= music_gain[:, None]

# ---------- mezcla y master ----------
def norm(x, peak=1.0):
    m = np.max(np.abs(x)); return x / m * peak if m > 0 else x
mix = voice * 1.0 + norm(music, 0.55) + norm(sfx, 0.45)
fade = int(0.8 * SR); end = int(DUR * SR)
mix[end - fade:end] *= np.linspace(1, 0, fade)[:, None]; mix[end:] = 0
mix = np.tanh(mix * 1.1) / np.tanh(1.1)  # limitador suave
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)[:end]
tmp = '/tmp/banda_raw.wav'
with wave.open(tmp, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1:LRA=9', '-ar', '44100', '-b:a', '256k', out_path], check=True)
print('Banda sonora lista:', out_path, f'{DUR:.2f}s', '| Ey', EY_START, '| drop', DROP, '| cierre', CLOSE)
