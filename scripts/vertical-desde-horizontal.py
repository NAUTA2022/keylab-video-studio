"""Versión vertical 1080x1920 de la Historia sin volver a renderizar:
recorta zonas del video horizontal ya renderizado, las reacomoda en columna,
les da un zoom lento y agrega subtítulos palabra a palabra.
uso: python3 scripts/vertical-desde-horizontal.py entrada.mp4 salida.mp4 carpeta_fuentes"""
import json, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter

SRC, OUT, FONTS = sys.argv[1:4]
W, H, FPS = 1080, 1920, 30
M = 'public/media/historia-keylab/'
TMP = '/tmp/claude-0/-home-claude/e60466a9-d91c-589d-b9ac-34ce88f68d29/scratchpad/vert'
import os; os.makedirs(TMP, exist_ok=True)

# escena: (inicio, fin, [(x0, y0, x1, y1, top, maxW, maxH)], subtitulos)
S = [
    (0.0, 5.3, [(760, 300, 1160, 640, 400, 1040, 460), (170, 640, 1750, 880, 900, 1060, 400)], True),
    (5.3, 19.1, [(340, 90, 1600, 990, 380, 1060, 1100)], True),
    (19.1, 25.8, [(100, 270, 1140, 700, 300, 1060, 460), (1140, 400, 1620, 900, 800, 900, 680)], True),
    (25.8, 36.4, [(330, 80, 1600, 990, 380, 1060, 1100)], True),
    (36.4, 41.45, [(180, 440, 1740, 610, 820, 1060, 300)], True),
    (41.45, 52.6, [(390, 120, 1530, 1060, 300, 1060, 1250)], True),
    (52.6, 77.2, [(760, 150, 1780, 660, 190, 1040, 560), (150, 330, 810, 1010, 760, 1040, 900)], True),
    (77.2, 90.0, [(100, 150, 1290, 720, 190, 1060, 560), (1100, 330, 1780, 1010, 740, 1040, 900)], True),
    (90.0, 107.5, [(260, 90, 1660, 1040, 380, 1060, 1100)], True),
    (107.5, 125.0, [(180, 110, 1740, 420, 340, 1060, 300), (480, 330, 1440, 1000, 660, 1040, 900)], True),
    (125.0, 140.1, [(100, 140, 1400, 1000, 400, 1060, 1100)], True),
    (140.1, 154.8, [(330, 190, 1590, 340, 300, 1060, 200)]
        + [(x - 280, 560, x + 280, 830, 480 + i * 380, 1040, 370) for i, x in enumerate((420, 960, 1500))]
        + [(260, 850, 1660, 980, 1620, 1060, 140)], False),
    (154.8, 159.0, [(240, 440, 1660, 610, 820, 1060, 300)], True),
    (159.0, 180.5, [(100, 150, 1020, 560, 150, 1040, 400), (1090, 190, 1890, 900, 560, 1050, 920), (100, 640, 1020, 970, 1490, 1040, 340)], False),
    (180.5, 191.1, [(380, 80, 1540, 1000, 380, 1080, 1150)], True),
    (191.1, 200.1, [(180, 320, 1740, 620, 740, 1060, 400)], True),
    (200.1, 203.8, [(240, 210, 1760, 920, 540, 1060, 860)], True),
    (203.8, 205.85, [(130, 360, 1790, 690, 780, 1060, 420)], True),
    (205.85, 211.0, [(660, 200, 1260, 860, 480, 900, 880)], False),
]
ZOOM = 0.045  # crecimiento del zoom a lo largo de cada escena
FEATHER = 22

# fondo: negro con la misma rejilla de puntos del video
bg = Image.new('RGB', (W, H), (5, 5, 7)); d = ImageDraw.Draw(bg)
for yy in range(0, H, 48):
    for xx in range(0, W, 48):
        d.ellipse((xx - 1.2, yy - 1.2, xx + 1.2, yy + 1.2), fill=(17, 17, 19))
bg.save(f'{TMP}/fondo.png')

ONLY = set(int(x) for x in os.environ.get('SOLO', '').split(',') if x)  # rehacer solo algunas escenas
segs, k = [], 0
for si, (a, b, regs, _) in enumerate(S):
    dur = b - a
    out = f'{TMP}/seg{si:02d}.mp4'; segs.append(out)
    if ONLY and si not in ONLY and os.path.exists(out):
        k += len(regs); continue
    inputs = ['-loop', '1', '-framerate', str(FPS), '-t', f'{dur}', '-i', f'{TMP}/fondo.png', '-ss', f'{a}', '-t', f'{dur}', '-i', SRC]
    fc = [f'[1:v]split={len(regs)}' + ''.join(f'[s{i}]' for i in range(len(regs)))]
    last = '[0:v]'
    for ri, (x0, y0, x1, y1, top, mw, mh) in enumerate(regs):
        cw, ch = x1 - x0, y1 - y0
        sc = min(mw / cw, mh / ch, 1.35)
        bh = ch * sc
        # máscara con bordes suaves para que el recorte se funda con el fondo
        m = Image.new('L', (cw, ch), 0); ImageDraw.Draw(m).rectangle((FEATHER, FEATHER, cw - FEATHER, ch - FEATHER), fill=255)
        m = m.filter(ImageFilter.GaussianBlur(FEATHER / 2)); m.save(f'{TMP}/m{k}.png')
        inputs += ['-loop', '1', '-framerate', str(FPS), '-t', f'{dur}', '-i', f'{TMP}/m{k}.png']
        z = f"{sc}*(1+{ZOOM}*t/{dur})"
        fc.append(f'[s{ri}]crop={cw}:{ch}:{x0}:{y0},format=yuva420p[c{ri}]')
        fc.append(f'[{2 + ri}:v]format=gray[mk{ri}]')
        fc.append(f"[c{ri}][mk{ri}]alphamerge,scale=w='trunc({cw}*{z}/2)*2':h='trunc({ch}*{z}/2)*2':eval=frame[r{ri}]")
        fc.append(f"{last}[r{ri}]overlay=x='(W-w)/2':y='{top}+({bh:.1f}-h)/2':eval=frame:shortest=1[o{ri}]")
        last = f'[o{ri}]'; k += 1
    fc[-1] = fc[-1][:fc[-1].rindex('[')] + '[v]'
    nfr = round(b * FPS) - round(a * FPS)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(fc), '-map', '[v]', '-frames:v', str(nfr),
                    '-c:v', 'libx264', '-crf', '17', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', str(FPS), out], check=True)
    print('escena', si, 'lista', nfr, flush=True)

# subtítulos palabra a palabra (ASS), en grupos cortos; la palabra activa en azul
pal = json.load(open(M + 'voz-v4-palabras.json'))
sub_on = lambda t: any(a <= t < b and sub for a, b, _, sub in S)
def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f'{h}:{m:02d}:{s:05.2f}'
groups, cur = [], []
for w in pal:
    cur.append(w)
    if len(cur) >= 3 or w['w'][-1] in '.,:;' :
        groups.append(cur); cur = []
if cur: groups.append(cur)
ass = ['[Script Info]', 'ScriptType: v4.00+', f'PlayResX: {W}', f'PlayResY: {H}', '', '[V4+ Styles]',
       'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
       'Style: Sub,Figtree Light Black,70,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,0,3,2,60,60,150,1',
       '', '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text']
for gi, g in enumerate(groups):
    st = g[0]['s']; en = g[-1]['e'] + 0.15
    if gi + 1 < len(groups): en = min(en, groups[gi + 1][0]['s'])
    if not sub_on(st): continue
    for wi, w in enumerate(g):
        ws = w['s']; we = g[wi + 1]['s'] if wi + 1 < len(g) else en
        if we <= ws: continue
        txt = ' '.join(('{\\c&HFFA08C&}' + x['w'] + '{\\c&HFFFFFF&}') if xi == wi else x['w'] for xi, x in enumerate(g))
        pop = '{\\fscx104\\fscy104\\t(0,120,\\fscx100\\fscy100)}' if wi == 0 else ''
        ass.append(f'Dialogue: 0,{ts(ws)},{ts(we)},Sub,,0,0,0,,{pop}{txt}')
open(f'{TMP}/subs.ass', 'w').write('\n'.join(ass))
open(f'{TMP}/lista.txt', 'w').write(''.join(f"file '{x}'\n" for x in segs))
cmd = ['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', f'{TMP}/lista.txt', '-i', SRC,
       '-vf', f'subtitles={TMP}/subs.ass:fontsdir={FONTS}', '-map', '0:v', '-map', '1:a', '-t', '211',
       '-c:v', 'libx264', '-crf', '19', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', OUT]
subprocess.run(cmd, check=True)
print('listo', OUT)
