# Música sintetizada en código (sin licencias): 120 BPM, La menor.
# Groove hasta el "Ey.", silencio real en el "Ey.", drop en "si se puede con eso", cierre.
import numpy as np, subprocess, sys, wave
SR = 44100
DUR, EY_START, DROP, CLOSE = [float(x) for x in sys.argv[1:5]] if len(sys.argv) > 4 else (27.5, 14.1, 14.9, 23.8)
out = sys.argv[5] if len(sys.argv) > 5 else 'public/media/musica.mp3'
BEAT = 0.5
N = int(DUR * SR)
mix = np.zeros((N, 2))
rng = np.random.default_rng(7)

def add(sig, t, pan=0.0, gain=1.0):
    i = int(t * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    mix[i:i + len(sig), 0] += sig * (1 - max(0, pan))
    mix[i:i + len(sig), 1] += sig * (1 + min(0, pan))

def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)

def kick():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 50 + 110 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.16)

def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    s = rng.standard_normal(n); s = np.diff(np.concatenate([[0], s]))
    return s * env(n, 0.001, 0.06 if open_ else 0.015) * 0.35

def clap():
    n = int(0.25 * SR); s = rng.standard_normal(n)
    e = sum(env(n, 0.001, 0.012) * (np.arange(n) >= int(k * SR)) for k in (0, 0.01, 0.02)) + env(n, 0.001, 0.09) * 0.6
    return s * e * 0.45

def note(freq, length, kind='saw', d=0.25):
    n = int(length * SR); t = np.arange(n) / SR
    if kind == 'saw':
        s = sum(np.sin(2 * np.pi * freq * k * t) / k for k in range(1, 9))
    elif kind == 'sq':
        s = sum(np.sin(2 * np.pi * freq * k * t) / k for k in range(1, 9, 2))
    else:
        s = np.sin(2 * np.pi * freq * t)
    return s * env(n, 0.004, d)

def pad(freqs, length):
    n = int(length * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * 0.3 * t)) + 0.4 * np.sin(2 * np.pi * f * 2.003 * t) for f in freqs)
    e = np.minimum(1, t / 0.6) * np.minimum(1, (length - t) / 0.4)
    return s * e / len(freqs)

hz = lambda m: 440 * 2 ** ((m - 69) / 12)
prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G
bass = [45, 41, 36, 43]

t = 0.0; bar = 0
while t < DUR - 0.01:
    in_ey = EY_START <= t < DROP
    drop = t >= DROP and t < CLOSE
    outro = t >= CLOSE
    chord = prog[bar % 4]; root = bass[bar % 4]
    if not in_ey:
        add(pad([hz(m) for m in chord], min(2.0, DUR - t)), t, gain=0.10 if not drop else 0.13)
    for b in range(4):
        bt = t + b * BEAT
        if bt >= DUR or EY_START <= bt < DROP: continue
        if not outro or bt < DUR - 2: add(kick(), bt, gain=0.9 if drop else (0.6 if outro else 0.7))
        if drop and b in (1, 3): add(clap(), bt, gain=0.8)
        add(hat(open_=drop), bt + BEAT / 2, pan=0.3, gain=0.6 if drop else 0.4)
        if drop: add(hat(), bt + BEAT / 4, pan=-0.3, gain=0.3); add(hat(), bt + 3 * BEAT / 4, pan=-0.3, gain=0.3)
        if not outro:
            for k in (0, 0.75, 1.5) if drop else (0, 1.0):
                if k < BEAT * 2 and b % 2 == 0: add(note(hz(root), 0.22, 'sq', 0.12), bt + k * BEAT, gain=0.22)
        if drop or outro:
            arp = chord + [chord[0] + 12]
            for s in range(4):
                add(note(hz(arp[(b * 4 + s) % 4] + 12), 0.12, 'saw', 0.07), bt + s * BEAT / 4, pan=(-0.4 if s % 2 else 0.4), gain=0.07)
    t += 4 * BEAT; bar += 1

# riser antes del drop y golpe en el drop
n = int((EY_START - (EY_START - 1.2)) * SR); tt = np.arange(n) / SR
riser = rng.standard_normal(n) * (tt / tt[-1]) ** 2 * 0.25
add(riser, EY_START - 1.2)
boom = kick() * 1.3
add(boom, DROP)
add(note(hz(81), 1.5, 'saw', 0.5), DROP, gain=0.12)
# silencio real en el "Ey." (con micro-fundidos para que no haga clic)
a, b = int(EY_START * SR), int(DROP * SR); f = int(0.01 * SR)
mix[a:a + f] *= np.linspace(1, 0, f)[:, None]; mix[a + f:b] = 0
# fade final
fade = int(1.2 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix /= np.max(np.abs(mix)) * 1.12
pcm = (mix * 32767).astype(np.int16)
with wave.open('/tmp/musica.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', '/tmp/musica.wav', '-b:a', '192k', out], check=True)
print('ok', out)
