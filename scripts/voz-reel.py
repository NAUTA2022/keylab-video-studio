"""Voz para reels de Key Lab: acorta pausas, deja hueco para el Ey tras el hook y aplica tempo. Guarda mapa de palabras.
Uso: python3 scripts/voz-reel.py public/media/<carpeta>/ <segundo donde termina el hook> [tempo]"""
import json, subprocess, re, sys, numpy as np
D = sys.argv[1] if len(sys.argv) > 1 else 'public/media/frutos/'
RAW = D + 'voz-raw.mp3'
TEMPO = float(sys.argv[3]) if len(sys.argv) > 3 else 1.2
r = subprocess.run(['ffmpeg', '-i', RAW, '-af', 'silencedetect=n=-38dB:d=0.16', '-f', 'null', '-'], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r)]; en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r)]
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', RAW], capture_output=True, text=True).stdout)
gaps = [(a, b) for a, b in zip(st, en) if a > 0.05 and b < dur - 0.05]
EY_AFTER = float(sys.argv[2]) if len(sys.argv) > 2 else 5.3   # fin del hook → hueco para el Ey
keep = []               # (inicio, fin) de los tramos con voz, y pausa nueva tras cada uno
t0 = 0.0
for a, b in gaps:
    keep.append((t0, a + 0.06)); t0 = b - 0.06
keep.append((t0, dur))
pauses = []
for (a, b), nxt in zip(keep, keep[1:] + [None]):
    if nxt is None: pauses.append(0.0); continue
    g = nxt[0] - b
    pauses.append(1.0 if a < EY_AFTER <= nxt[0] + 0.1 and b < EY_AFTER + 0.3 else min(g, 0.14 if g < 0.5 else 0.22))
# mapa tiempo original → nuevo
segs = []; cur = 0.0
for (a, b), p in zip(keep, pauses):
    segs.append((a, b, cur)); cur += (b - a) + p
total = cur / TEMPO
def M(t):
    for a, b, c in segs:
        if t <= b: return (c + max(0, t - a)) / TEMPO
    return total
words = json.load(open(D + 'palabras-raw.json'))
json.dump([[w, round(M(s), 3), round(M(e), 3)] for w, s, e in words], open(D + 'palabras.json', 'w'), ensure_ascii=False)
# audio: concatena tramos con silencios y aplica tempo
fc, ins = '', []
for i, ((a, b), p) in enumerate(zip(keep, pauses)):
    fc += f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st={max(0,b-a-0.012)}:d=0.012[s{i}];"
    if p > 0: fc += f"anullsrc=r=44100:cl=mono,atrim=0:{p}[z{i}];"; ins += [f'[s{i}]', f'[z{i}]']
    else: ins += [f'[s{i}]']
fc += ''.join(ins) + f"concat=n={len(ins)}:v=0:a=1,atempo={TEMPO}[o]"
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', RAW, '-filter_complex', fc, '-map', '[o]', '-ac', '1', '-ar', '44100', '-b:a', '256k', D + 'voz.mp3'], check=True)
ey = M(EY_AFTER + 0.05)
print(f'tramos {len(keep)} · duración {total:.2f} s · Ey en {ey:.2f}')
json.dump({'ey': round(ey, 3), 'dur': round(total, 3)}, open(D + 'meta.json', 'w'))
