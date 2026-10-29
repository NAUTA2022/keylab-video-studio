"""Coloca la narración nueva (voz-v4-raw.mp3) sobre la línea de tiempo del video (N),
frase por frase, para que el video ya renderizado siga sincronizado.
- tiempos viejos: transcripción de voz.mp3 (O) mapeada a N con mapa-tiempo.json
- tiempos nuevos: transcripción de la toma nueva
Cada frase arranca donde arrancaba la frase vieja; si no cabe, se acelera un poco (máx 1.18x)."""
import json, re, difflib, subprocess, sys
import numpy as np

S = sys.argv[1]  # carpeta con tr-orig.json y tr-new.json
M = 'public/media/historia-keylab/'
SR = 44100
mapa = json.load(open(M + 'mapa-tiempo.json'))['pts']
def O2N(t):
    for (a, b), (c, d) in zip(mapa, mapa[1:]):
        if a <= t <= c:
            return b + (t - a) * (d - b) / max(c - a, 1e-6)
    return mapa[-1][1] + t - mapa[-1][0]

words = lambda f: [w for w in json.load(open(f))['words'] if w['type'] == 'word']
old, new = words(S + '/tr-orig.json'), words(S + '/tr-new.json')
norm = lambda s: re.sub(r'[^\wáéíóúñ]', '', s.lower())
oldmap = {}
sm = difflib.SequenceMatcher(None, [norm(w['text']) for w in old], [norm(w['text']) for w in new], autojunk=False)
for op, i1, i2, j1, j2 in sm.get_opcodes():
    if op in ('equal', 'replace'):
        for k in range(j2 - j1):
            if i1 + k < i2:
                oldmap[j1 + k] = O2N(old[i1 + k]['start'])

# trocear en frases (puntuación + pausa)
chunks, cur = [], [0]
for j in range(1, len(new)):
    prev = new[j - 1]
    if re.search(r'[.]$', prev['text']) and new[j]['start'] - prev['end'] > 0.2:
        chunks.append(cur); cur = []
    cur.append(j)
chunks.append(cur)

ANCHOR = {'En esa empresa': 150.76}
def target(ch):
    txt = ' '.join(new[j]['text'] for j in ch[:3])
    for k, v in ANCHOR.items():
        if txt.startswith(k):
            return v
    return oldmap.get(ch[0])

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', M + 'voz-v4-raw.mp3', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
raw = np.frombuffer(raw, np.float32)

def tempo(x, r):
    if abs(r - 1) < 0.01:
        return x
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', f'atempo={r:.4f}', '-f', 'f32le', '-'], input=x.tobytes(), capture_output=True).stdout
    return np.frombuffer(p, np.float32)

TOTAL = 211.0
out = np.zeros(int(TOTAL * SR) + SR, np.float32)
tg = [target(c) for c in chunks]
# frases sin ancla: siguen a la anterior
for i, t in enumerate(tg):
    if t is None:
        tg[i] = None
log, end_prev, placed = [], 0.0, []
for i, ch in enumerate(chunks):
    a = max(0.0, new[ch[0]]['start'] - 0.04)
    if i: a = max(a, (new[chunks[i - 1][-1]]['end'] + new[ch[0]]['start']) / 2)
    b = new[ch[-1]]['end'] + 0.12
    if i + 1 < len(chunks): b = min(b, (new[ch[-1]]['end'] + new[chunks[i + 1][0]]['start']) / 2)
    seg = raw[int(a * SR):int(b * SR)]
    if len(seg) < 2000: print("VACIO", i, a, b, [new[j]["text"] for j in ch]); continue
    lead = new[ch[0]]['start'] - a
    t0 = (tg[i] if tg[i] is not None else end_prev + 0.25) - lead
    t0 = max(t0, end_prev + 0.18)
    nxt = next((tg[k] for k in range(i + 1, len(chunks)) if tg[k] is not None), None)
    win = (nxt - 0.06 - t0) if nxt is not None else 1e9
    d = len(seg) / SR
    r = 1.0
    # sin cambiar velocidad: la frase suena entera y natural
    fade = int(0.012 * SR)
    seg = seg.copy(); seg[:fade] *= np.linspace(0, 1, fade); seg[-fade:] *= np.linspace(1, 0, fade)
    s0 = int(t0 * SR)
    out[s0:s0 + len(seg)] += seg[:len(out) - s0]
    end_prev = t0 + len(seg) / SR
    off = t0 + lead - new[ch[0]]['start']
    for j in ch: placed.append({'w': new[j]['text'], 's': round(new[j]['start'] + off, 3), 'e': round(new[j]['end'] + off, 3)})
    log.append((round(t0 + lead, 2), tg[i] and round(t0 + lead - tg[i], 2), round(win - d, 2), ' '.join(new[j]['text'] for j in ch)[:60]))
for l in log:
    print(l)
pcm = (np.clip(out, -1, 1) * 32767).astype(np.int16)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-t', str(TOTAL), '-b:a', '192k', M + 'voz-v4.mp3'], input=pcm.tobytes())

json.dump(placed, open(M + 'voz-v4-palabras.json', 'w'), ensure_ascii=False)
