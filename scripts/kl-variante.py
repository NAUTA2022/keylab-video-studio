"""Variante de voz del video institucional Key Lab.
Uso: python3 scripts/kl-variante.py <nombre>   (necesita public/media/kl/<nombre>/voz-raw.mp3 y palabras-raw.json)
1) limpia pausas y deja hueco para el Ey (voz-reel.py), 2) inserta la pausa del muro de servicios tras "Te mostramos todo",
3) alinea la voz nueva con la del guion original y guarda src/historia/kl-var-<nombre>.json (anclas de tiempo, palabras, muro)."""
import json, re, subprocess, sys, unicodedata, difflib
V = sys.argv[1]; D = f'public/media/kl/{V}/'
HOLD = 3.5
raw = json.load(open(D + 'palabras-raw.json'))
norm = lambda w: re.sub(r'[^a-z0-9ñ]', '', unicodedata.normalize('NFD', w.lower()).encode('ascii', 'ignore').decode()) or w
# fin del gancho = palabra "real"
hook = next(e for w, s, e in raw if norm(w) == 'real')
subprocess.run(['python3', 'scripts/voz-reel.py', D, f'{hook + 0.05:.3f}', '1.0'], check=True)
W = json.load(open(D + 'palabras.json')); meta = json.load(open(D + 'meta.json'))
# pausa del muro: después de "todo" que sigue a "mostramos"
i = next(k for k in range(1, len(W)) if norm(W[k][0]) == 'todo' and norm(W[k - 1][0]) == 'mostramos')
cut = W[i][2] + 0.25
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', D + 'voz.mp3', '-filter_complex',
                f'[0:a]atrim=0:{cut},asetpts=PTS-STARTPTS[a];anullsrc=r=44100:cl=mono,atrim=0:{HOLD}[z];[0:a]atrim={cut},asetpts=PTS-STARTPTS[b];[a][z][b]concat=n=3:v=0:a=1[o]',
                '-map', '[o]', '-ac', '1', '-ar', '44100', '-b:a', '256k', D + 'voz-hold.mp3'], check=True)
subprocess.run(['mv', D + 'voz-hold.mp3', D + 'voz.mp3'], check=True)
W = [[w, s + (HOLD if s > cut else 0), e + (HOLD if s > cut else 0)] for w, s, e in W]
json.dump(W, open(D + 'palabras.json', 'w'), ensure_ascii=False)
nT = W[i][2]; nE = W[i + 1][1]
# alineación con el guion original
O = json.load(open('src/historia/kl-palabras.json'))
sm = difflib.SequenceMatcher(None, [norm(w) for w, _, _ in O], [norm(w) for w, _, _ in W], autojunk=False)
A = []
for a, b, n in sm.get_matching_blocks():
    for k in range(n): A.append((O[a + k][1], W[b + k][1]))
ey = meta['ey']
A = [p for p in A if not (2.9 < p[0] < 4.5) and not (35.9 < p[0] < 37.0)]
A += [(3.38, ey), (4.38, ey + 1.0), (36.10, nT), (36.70, nE - 0.12), (36.81, nE)]
A.sort(); mono = []
for o, n in A:
    if not mono or (o > mono[-1][0] + 0.02 and n > mono[-1][1] + 0.02): mono.append((o, n))
last_o, last_n = O[-1][2], W[-1][2]
dur = round(last_n + (184.0 - last_o), 2)
mono.append((184.0, dur)); mono.insert(0, (0.0, 0.0)) if mono[0][0] > 0 else None
json.dump({'anchors': [[round(o, 3), round(n, 3)] for o, n in mono], 'dur': dur, 'words': W, 'muro': [round(nT, 3), round(nE, 3)]},
          open(f'src/historia/kl-var-{V}.json', 'w'), ensure_ascii=False)
print(V, 'anclas', len(mono), 'de', len(O), 'palabras · dur', dur, '· Ey', ey, '· muro', round(nT, 2), round(nE, 2))
