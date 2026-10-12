"""Curva de apertura de boca (0..1) por cuadro a partir de una pista de voz.
Uso: python3 scripts/lipsync.py public/media/boveda/voz-v2.mp3 [fps]
Escribe <pista>.labios.json  →  {"fps":30,"v":[...]}  (un valor por cuadro)
"""
import json, subprocess, sys
import numpy as np

src = sys.argv[1]
fps = int(sys.argv[2]) if len(sys.argv) > 2 else 30
sr = 16000
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', str(sr), '-f', 's16le', '-'],
                     capture_output=True, check=True).stdout
x = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
# banda de voz 150–3500 Hz con un filtro simple en frecuencia
X = np.fft.rfft(x); fr = np.fft.rfftfreq(len(x), 1 / sr)
X[(fr < 150) | (fr > 3500)] = 0
x = np.fft.irfft(X, len(x))
hop = sr // fps
n = len(x) // hop
rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
db = 20 * np.log10(rms + 1e-6)
lo, hi = np.percentile(db, 20), np.percentile(db, 97)
v = np.clip((db - lo - 6) / (hi - lo - 6), 0, 1)
# suavizado: abre rápido, cierra un poco más lento
out = np.zeros_like(v)
for i in range(n):
    p = out[i - 1] if i else 0
    out[i] = v[i] if v[i] > p else p * 0.55 + v[i] * 0.45
dst = src.rsplit('.', 1)[0] + '.labios.json'
json.dump({'fps': fps, 'v': [round(float(a), 3) for a in out]}, open(dst, 'w'))
print(dst, n, 'cuadros; media', round(float(out.mean()), 3))
