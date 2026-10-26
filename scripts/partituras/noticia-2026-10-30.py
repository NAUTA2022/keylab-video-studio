"""
Partitura emocional · Noticia 2026-10-30 (Lena Buró: casi un tercio de sus fragmentos asignados)
Misma orquestación aprobada del 26-10, deformada por tramos al guion de Mercado Libre.
UP en "9 millones" y "30 mil pymes"; build en Photo Studio hasta "en una sola semana"; vacío; Ey.
Habilidad: partitura-emocional-reels. Instrumentos reales sampleados (MuseScore General).

MAPA DEL GUION COMO CANCIÓN (segundos absolutos del video)
  0.00  HOOK        casi nada: trémolo grave + contrabajo, crescendo; gota (sfx) en 0.5
  2.30  IMPACTO     "LOS TOKENS" golpe suave de timbal + sub
  3.20  IMPACTO     "NO TIENEN QUIÉN LOS VIGILE" timbal + sub
  5.30  CUERPO      noticia: piano lento + chelo (Re menor), curiosidad
 10.48  CURIOSO     "un token no es un valor": tic de celesta
 15.85  TENSIÓN     latido de timbal + violín agudo en trémolo
 16.85  UP          "cuatro proyectos": taiko + timbal + trompas con eco
 19.83  VACÍO CORTO "sin fecha de debate": se adelgaza, queda el tic tac (sfx)
 21.62  BURLA       redoble que acelera + cuerdas que suben + trompas → pico en "SIN ÁRBITRO" (23.37)
 24.25  VACÍO       caída exponencial con cola de reverb; 24.40–25.35 silencio real del "Ey." (sonorizar)
 25.35  ENTRADA     pasa a Re mayor: arpa + cuerdas suaves, se vuelve hermosa
 28.85  INSPIRADOR  violines con melodía, coro desde 31.4, trompas desde 33.3, redoble 34.4→36.4
 35.35  CLÍMAX      IV–V (Sol → La) con orquesta completa
 36.40  RESUELVE    I (Re) sobre el logo y se apaga hasta 41.4
"""
import os, subprocess, sys
import numpy as np
import pretty_midi as pm
from pedalboard import Pedalboard, Reverb, Delay, Compressor, Limiter, Gain
from pedalboard.io import AudioFile

OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/media/noticia-2026-10-30/partitura.wav'
SF = '/usr/share/sounds/sf3/MuseScore_General_Full.sf3'
SR = 44100
END = 41.4
TMP = os.environ.get('PARTITURA_TMP', '/tmp/partitura')
os.makedirs(TMP, exist_ok=True)

T_NEWS, T_FOUR, T_ARB, T_EY, T_CONF, T_SOL, T_CLOSE = 5.30, 15.85, 21.62, 24.40, 25.35, 28.85, 36.40
PEAK = 23.37

# Versión 2 (voz de Martin Osborne 5): la partitura se escribió sobre la línea de tiempo de la
# voz anterior y aquí se "deforma" por tramos para caer exacta sobre los tiempos nuevos.
WARP_OLD = [0, 1.45, 2.30, 3.20, 5.30, 10.48, 15.85, 16.85, 19.83, 21.62, 23.37, 24.25, 24.40, 25.35, 28.85, 35.35, 36.40, 41.4]
WARP_NEW = [0, 1.40, 4.30, 5.20, 7.85, 11.20, 15.40, 17.40, 19.60, 22.35, 25.00, 27.05, 27.20, 28.00, 29.30, 33.50, 34.30, 39.10]
def W(t):
    return float(np.interp(t, WARP_OLD, WARP_NEW))

def N(name):
    return pm.note_name_to_number(name)

stems = {}
def inst(key, program, drum=False):
    if key not in stems:
        stems[key] = pm.Instrument(program=program, is_drum=drum, name=key)
    return stems[key]

def note(key, program, pitch, t0, dur, vel=80, drum=False):
    p = N(pitch) if isinstance(pitch, str) else pitch
    a, b = W(max(0, t0)), W(t0 + dur)
    inst(key, program, drum).notes.append(pm.Note(velocity=int(np.clip(vel, 1, 127)), pitch=p, start=a, end=max(a + 0.05, b)))

def chord(key, program, pitches, t0, dur, vel=70):
    for p in pitches: note(key, program, p, t0, dur, vel)

def ramp(key, program, t0, t1, v0, v1, cc=11, steps=24, drum=False):
    i = inst(key, program, drum)
    for k in range(steps + 1):
        t = t0 + (t1 - t0) * k / steps
        i.control_changes.append(pm.ControlChange(number=cc, value=int(np.clip(v0 + (v1 - v0) * k / steps, 0, 127)), time=W(t)))

# ---------------- HOOK (0–5.3): trémolo grave + contrabajo, crescendo ----------------
chord('trem', 44, ['D2', 'A2', 'D3'], 0.0, T_NEWS - 0.1, 90)
ramp('trem', 44, 0.0, 5.0, 18, 96)
note('bass', 43, 'D1', 0.0, T_NEWS, 95)
ramp('bass', 43, 0.0, 5.0, 30, 100)
for t, p in ((2.30, 'D2'), (3.20, 'A1')):
    note('timp', 47, p, t, 1.2, 110)
note('timp', 47, 'D2', 4.75, 0.6, 70)  # anacrusa hacia la noticia

# ---------------- CUERPO (5.3–15.85): piano lento + chelo, Re menor ----------------
prog_min = [(['D3', 'A3'], ['D4', 'F4', 'A4']), (['A#2', 'F3'], ['D4', 'F4', 'A#4']), (['G2', 'D3'], ['D4', 'G4', 'A#4']), (['A2', 'E3'], ['C#4', 'E4', 'A4'])]
beat = 0.66
t = T_NEWS; k = 0
while t < T_FOUR - 0.3:
    low, high = prog_min[k % 4]
    span = min(2.64, T_FOUR - t)
    note('cello', 42, low[0], t, span, 72)
    for j, p in enumerate(high + [high[1]]):
        if t + j * beat < T_FOUR - 0.2:
            note('piano', 0, p, t + j * beat, beat * 1.6, 58 + (j == 0) * 10)
    t += 2.64; k += 1
ramp('cello', 42, T_NEWS, T_NEWS + 1.5, 40, 85)
for j, p in enumerate(['A6', 'E6', 'A6']):  # curioso: "un token no es un valor"
    note('celesta', 8, p, 10.48 + j * 0.22, 0.5, 75)

# ---------------- TENSIÓN (15.85–21.62) ----------------
t = T_FOUR
while t < T_ARB - 0.2:  # latido lub-dub
    note('timp', 47, 'D2', t, 0.25, 62); note('timp', 47, 'D2', t + 0.2, 0.25, 48)
    t += 0.8
note('violin', 40, 'A5', 17.4, T_ARB - 17.4, 70)
note('trem', 44, 'A5', 17.4, T_ARB - 17.4, 70)
ramp('trem', 44, 17.4, 21.5, 20, 80)
note('bass', 43, 'D1', T_FOUR, T_ARB - T_FOUR, 80)
# UP en "cuatro"
note('taiko', 116, 'C3', 16.85, 1.5, 120)
note('timp', 47, 'D2', 16.85, 1.5, 120)
chord('horns', 60, ['D3', 'A3', 'D4', 'F4'], 16.85, 1.1, 100)
# se adelgaza en "sin fecha de debate" (quedan latido + tic tac del sfx)
ramp('violin', 40, 19.6, 20.1, 90, 40)

# ---------------- BURLA (21.62–24.25): redoble + cuerdas que suben → pico ----------------
roll_t = 21.9
while roll_t < 24.2:
    gap = 0.16 - 0.11 * (roll_t - 21.9) / 2.3
    vel = 45 + 75 * (roll_t - 21.9) / 2.3
    note('drums', 0, 38, roll_t, 0.08, vel, drum=True)
    roll_t += max(0.045, gap)
for j, p in enumerate(['D4', 'E4', 'F4', 'G4', 'A4', 'A#4', 'C#5', 'D5']):
    note('strings', 49, p, 21.75 + j * 0.2, 0.25, 70 + j * 5)
chord('horns', 60, ['A#2', 'F3', 'A#3', 'D4'], 21.7, 1.6, 70)
ramp('horns', 60, 21.7, PEAK, 40, 120)
chord('horns', 60, ['A2', 'E3', 'A3', 'C#4'], PEAK, 24.25 - PEAK, 115)
chord('strings', 49, ['A3', 'C#4', 'E4', 'A4', 'C#5', 'E5'], PEAK, 24.25 - PEAK, 110)
chord('choir', 52, ['A3', 'E4', 'A4', 'C#5'], PEAK, 24.25 - PEAK, 100)
note('taiko', 116, 'C3', PEAK, 1.2, 127)
note('timp', 47, 'A1', PEAK, 1.0, 127)
note('bass', 43, 'A1', 21.62, 24.25 - 21.62, 100)

# ---------------- ENTRADA (25.35–28.85): Re mayor, arpa + cuerdas suaves ----------------
maj = [('D', ['D3', 'A3', 'F#4']), ('G', ['G2', 'D3', 'B3']), ('D/F#', ['F#2', 'D3', 'A3']), ('A', ['A2', 'E3', 'C#4'])]
arps = {'D': ['D4', 'F#4', 'A4', 'D5'], 'G': ['G4', 'B4', 'D5', 'G5'], 'D/F#': ['F#4', 'A4', 'D5', 'F#5'], 'A': ['A4', 'C#5', 'E5', 'A5']}
t = T_CONF; k = 0
while t < T_SOL - 0.1:
    name, pad = maj[k % 4]
    span = min(0.875 * 2, T_SOL - t)
    chord('pad', 49, pad, t, span, 62)
    for j, p in enumerate(arps[name] * 2):
        tt = t + j * (span / 8)
        if tt < T_SOL: note('harp', 46, p, tt, 0.9, 64)
    t += span; k += 1
ramp('pad', 49, T_CONF, T_CONF + 2.0, 30, 80)
note('celesta', 8, 'D7', 25.8, 0.8, 70)  # brillo de la gota
note('bass', 43, 'D2', T_CONF, T_SOL - T_CONF, 70)

# ---------------- INSPIRADOR (28.85–36.40) ----------------
sol = [(28.85, 'G', ['G2', 'D3', 'B3', 'G4'], ['G4', 'B4', 'D5', 'G5']),
       (30.20, 'D', ['D2', 'A2', 'F#3', 'D4'], ['D4', 'F#4', 'A4', 'D5']),
       (31.55, 'A', ['A1', 'E2', 'C#3', 'A3'], ['A4', 'C#5', 'E5', 'A5']),
       (32.90, 'Bm', ['B1', 'F#2', 'D3', 'B3'], ['B4', 'D5', 'F#5', 'B5']),
       (34.25, 'G', ['G1', 'D2', 'B2', 'G3'], ['G4', 'B4', 'D5', 'G5']),
       (35.35, 'A', ['A1', 'E2', 'C#3', 'A3'], ['A4', 'C#5', 'E5', 'A5'])]
for i, (t0, name, low, arp) in enumerate(sol):
    t1 = sol[i + 1][0] if i + 1 < len(sol) else T_CLOSE
    chord('strings', 49, low[1:], t0, t1 - t0, 72 + i * 7)
    note('bass', 43, low[0], t0, t1 - t0, 85 + i * 5)
    for j in range(int((t1 - t0) / 0.3375)):
        note('harp', 46, arp[j % 4], t0 + j * 0.3375, 0.7, 58 + i * 4)
    note('piano', 0, arp[0], t0, 1.2, 70)
    if t0 >= 31.4: chord('choir', 52, [p for p in low[2:]] + [arp[1]], t0, t1 - t0, 70 + i * 6)
    if t0 >= 32.9: chord('horns', 60, low[1:3], t0, t1 - t0, 80 + i * 6)
ramp('strings', 49, T_SOL, T_CLOSE, 55, 120)
mel = [(29.15, 'B4', 0.6), (29.8, 'D5', 0.6), (30.45, 'F#5', 1.1), (31.6, 'E5', 0.6), (32.2, 'A5', 0.7),
       (32.95, 'F#5', 0.6), (33.6, 'B5', 0.6), (34.3, 'G5', 0.55), (34.85, 'A5', 0.5), (35.4, 'C#6', 0.95)]
for t0, p, d in mel:
    note('violin', 40, p, t0, d, 92)
ramp('violin', 40, 29.0, 36.3, 60, 120)
# redoble de incremento 2 s antes del clímax
roll_t = 34.4
while roll_t < 36.35:
    note('drums', 0, 38, roll_t, 0.06, 40 + 70 * (roll_t - 34.4) / 1.95, drum=True)
    roll_t += max(0.05, 0.14 - 0.09 * (roll_t - 34.4) / 1.95)
note('timp', 47, 'A1', 35.35, 1.0, 110)

# ---------------- RESUELVE (36.40–41.4): I sobre el logo y se apaga ----------------
R = T_CLOSE
chord('strings', 49, ['D3', 'A3', 'D4', 'F#4', 'A4', 'D5'], R, END - R, 118)
chord('choir', 52, ['D4', 'F#4', 'A4', 'D5'], R, END - R - 0.4, 105)
chord('horns', 60, ['D3', 'A3', 'D4', 'F#4'], R, 3.2, 112)
note('bass', 43, 'D1', R, END - R, 110)
note('timp', 47, 'D2', R, 1.6, 127); note('taiko', 116, 'C3', R, 1.6, 120)
note('piano', 0, 'D3', R, 3.0, 95); note('piano', 0, 'D5', R, 3.0, 85)
for j, p in enumerate(['D5', 'F#5', 'A5', 'D6', 'F#6', 'A6']):
    note('harp', 46, p, R + 0.05 + j * 0.07, 2.4, 80)
for key, prog in (('strings', 49), ('choir', 52), ('horns', 60), ('bass', 43)):
    ramp(key, prog, R + 0.6, END - 0.2, 120, 0)

# ---------------- render por stem ----------------
def render(key):
    m = pm.PrettyMIDI(initial_tempo=90)
    m.instruments.append(stems[key])
    mid = f'{TMP}/{key}.mid'; wav = f'{TMP}/{key}.wav'
    m.write(mid)
    subprocess.run(['fluidsynth', '-ni', '-g', '0.7', '-r', str(SR), '-F', wav, SF, mid], check=True, capture_output=True)
    with AudioFile(wav) as f:
        a = f.read(f.frames)
    if a.shape[0] == 1: a = np.vstack([a, a])
    n = int(W(END) * SR) + SR
    out = np.zeros((2, n), dtype=np.float32); L = min(n, a.shape[1]); out[:, :L] = a[:2, :L]
    return out

hall = Pedalboard([Reverb(room_size=0.88, damping=0.35, wet_level=0.32, dry_level=0.78, width=1.0)])
room = Pedalboard([Reverb(room_size=0.6, damping=0.5, wet_level=0.18, dry_level=0.9)])
echo = Pedalboard([Delay(delay_seconds=0.66 * 0.75, feedback=0.35, mix=0.28), Reverb(room_size=0.8, wet_level=0.25, dry_level=0.85)])
fx = {'trem': hall, 'strings': hall, 'pad': hall, 'choir': hall, 'violin': hall, 'cello': hall, 'harp': hall, 'celesta': echo,
      'piano': Pedalboard([Delay(delay_seconds=0.495, feedback=0.25, mix=0.15), Reverb(room_size=0.85, wet_level=0.3, dry_level=0.8)]),
      'horns': hall, 'timp': echo, 'taiko': echo, 'drums': room, 'bass': room}
gains = {'trem': 0.9, 'strings': 0.9, 'pad': 0.75, 'choir': 0.65, 'violin': 0.8, 'cello': 0.85, 'harp': 0.7, 'celesta': 0.55,
         'piano': 0.8, 'horns': 0.75, 'timp': 0.95, 'taiko': 0.9, 'drums': 0.45, 'bass': 0.9}
mix = None
for key in stems:
    a = render(key)
    a = fx[key](a, SR) * gains[key]
    mix = a if mix is None else mix + a

# sub con glide en las entradas e impactos (debajo de la fundamental)
t = np.arange(mix.shape[1]) / SR
sub = np.zeros_like(t)
for t0, f0, f1, d in ((2.30, 55, 37, 1.0), (3.20, 55, 37, 1.0), (16.85, 60, 37, 1.3), (PEAK, 66, 55, 0.9), (T_CONF, 49, 37, 1.6), (R, 60, 37, 2.6)):
    i0 = int(W(t0) * SR); n = int(d * SR); tt = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-tt / 0.12)
    sub[i0:i0 + n] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / (d * 0.45)) * 0.5
mix += np.vstack([sub, sub]).astype(np.float32)

# a partir de aquí todo va en la línea de tiempo nueva
T_EY, T_CONF, END = W(T_EY), W(T_CONF), W(END)
# VACÍO antes del "Ey.": caída exponencial de 60 ms con cola de reverb corta
i0 = int(W(24.25) * SR); fall = int(0.06 * SR)
env = np.ones(mix.shape[1], dtype=np.float32)
env[i0:i0 + fall] = np.exp(-np.linspace(0, 6, fall))
env[i0 + fall:int(T_EY * SR)] = np.exp(-6) * np.exp(-np.linspace(0, 4, int(T_EY * SR) - i0 - fall))
env[int(T_EY * SR):int(T_CONF * SR)] = 0  # silencio real del Ey (también lo fuerza sonorizar)
# entrada suave tras el Ey
k = int(0.12 * SR); env[int(T_CONF * SR):int(T_CONF * SR) + k] = np.linspace(0, 1, k)
# se apaga al final
fo = int(1.2 * SR); e = int(END * SR); env[e - fo:e] *= np.linspace(1, 0, fo); env[e:] = 0
mix *= env

master = Pedalboard([Compressor(threshold_db=-18, ratio=2.0, attack_ms=20, release_ms=250), Gain(gain_db=2.0), Limiter(threshold_db=-1.0)])
mix = master(mix, SR)[:, : int(END * SR)]
with AudioFile(OUT, 'w', SR, 2) as f:
    f.write(mix)

rms = [float(np.sqrt(np.mean(mix[:, int(s * SR):int((s + 1) * SR)] ** 2))) for s in range(int(END))]
print('Partitura lista:', OUT, f'{END}s')
print('Energía RMS por segundo:', ' '.join(f'{s}:{20*np.log10(r+1e-9):.0f}' for s, r in enumerate(rms)))
