"""Versión con música v2 (pedido del senador: menos tiempo con él sentado en el Senado, más fotos, audio completo) · Video sencillo (solo ffmpeg, sin Remotion): Senador Josué Alirio Barrera · Casanare Bendice a Israel.
Horizontal 1920x1080, subtítulos en inglés. Uso: python3 scripts/senador-israel-simple.py"""
import os, subprocess

A = '/mnt/user-data/attachments/e60466a9-d91c-589d-b9ac-34ce88f68d29'
S = '/tmp/claude-0/-home-claude/e60466a9-d91c-589d-b9ac-34ce88f68d29/scratchpad/isr-m3'
FONTS = '/tmp/claude-0/-home-claude/e60466a9-d91c-589d-b9ac-34ce88f68d29/scratchpad/fonts'
OUT = 'out/senador-israel-musica-v3.mp4'
V2 = f'{A}/ae508276-WhatsApp_Video_2026-11-08_at_08.51.30.mp4'   # pleno, bandera, mensaje 100% pro-Israel
VG = f'{A}/c52498f5-WhatsApp_Video_2026-11-08_at_10.51.51_2.mp4'   # como gobernador: los amigos no son de cuatro paredes
V1 = f'{A}/33d95382-WhatsApp_Video_2026-11-08_at_08.49.28.mp4'   # intervención en el Senado
os.makedirs(S, exist_ok=True)
STOP_AFTER_SEGMENTS = os.environ.get('SOLO_SEG') == '1'
W, H = 1920, 1080

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-3000:]); raise SystemExit(1)

# fotos (archivo, recorte para quitar la interfaz del celular: x, y, w, h)
P = {
    'p1': ('ac76aefc', 0, 0, 1280, 560), 'p2': ('b241a6d9', 0, 0, 1280, 560), 'p3': ('30327c7f', 200, 60, 880, 440),
    'p4': ('3651b30f', 0, 0, 1280, 560), 'p6': ('88ec1147', 0, 0, 1280, 560), 'p7': ('aa6cbf27', 40, 0, 1200, 560),
    'p8': ('34694e9c', 0, 0, 1280, 560), 'p9': ('82dfb06f', 0, 0, 1280, 560), 'p11': ('590e760f', 0, 0, 1280, 560),
    'p12': ('96c67d0f', 0, 70, 1280, 490), 'p13': ('47470f70', 20, 0, 1235, 560), 'p14': ('9ca11df6', 0, 70, 1280, 490),
    'p15': ('d75faa3f', 0, 0, 1280, 560), 'p16': ('0b12ff1f', 197, 0, 886, 560), 'p17': ('19594ebc', 197, 0, 886, 560),
    'p18': ('4cc6c223', 0, 0, 1280, 560), 'p19': ('2856a81b', 0, 0, 1280, 560),
    'n1': ('c0d17127', 0, 0, 1280, 560), 'n2': ('1a7b1594', 0, 0, 1280, 560), 'n3': ('37a59ac1', 40, 0, 1200, 560), 'n4': ('acaf21cb', 0, 70, 1280, 490),
}

def photo_filter(key, d, rev=False):
    _, x, y, w, h = P[key]
    s = max(W / w, H / h) * 1.04
    sw, sh = int(w * s) // 2 * 2, int(h * s) // 2 * 2
    ex, ey = sw - W, sh - H
    if ex >= ey:
        px = f"'{ex}*(1-t/{d})'" if rev else f"'{ex}*t/{d}'"; py = str(ey // 2)
    else:
        px = str(ex // 2); py = f"'{ey}*t/{d}'"
    return f"crop={w}:{h}:{x}:{y},scale={sw}:{sh}:flags=lanczos,unsharp=5:5:0.6,crop={W}:{H}:{px}:{py},setsar=1,fps=30,format=yuv420p"

def photo_clip(key, d, out, rev=False):
    run(['ffmpeg', '-y', '-loglevel', 'error', '-loop', '1', '-t', str(d), '-i', f"{A}/{P[key][0]}-image.jpg",
         '-vf', photo_filter(key, d, rev), '-t', str(d), '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', out])

# ---------- 1 · Pleno: él 0–4.5 s → fotos con su voz → él de nuevo 37.7–43 (amigos y aliados) ----------
D1 = 43.0
P0, P1 = 4.5, 37.7
fotos1 = ['p14', 'n1', 'p6', 'p3', 'p13', 'p9', 'p19', 'p11']
XF = 0.5
d1 = ((P1 - P0) + XF * (len(fotos1) - 1)) / len(fotos1)
for i, k in enumerate(fotos1):
    photo_clip(k, round(d1, 3), f'{S}/g{i:02d}.mkv', rev=bool(i % 2))
inp = sum([['-i', f'{S}/g{i:02d}.mkv'] for i in range(len(fotos1))], [])
fc, prev = '', '[0:v]'
for i in range(1, len(fotos1)):
    fc += f"{prev}[{i}:v]xfade=transition=fade:duration={XF}:offset={round(i * (d1 - XF), 3)}[x{i}];"; prev = f'[x{i}]'
run(['ffmpeg', '-y', '-loglevel', 'error', *inp, '-filter_complex', fc[:-1].rsplit('[', 1)[0] + '[m]', '-map', '[m]',
     '-t', str(P1 - P0), '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', f'{S}/montaje1.mkv'])
run(['ffmpeg', '-y', '-loglevel', 'error', '-t', str(D1), '-i', V2, '-i', f'{S}/montaje1.mkv', '-filter_complex',
     f"[0:v]split[a][b];[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=30:3,eq=brightness=-0.12[bg];"
     f"[b]scale=-2:{H}[fg];[bg][fg]overlay=(W-w)/2:0,fps=30,format=yuv420p,split[p1][p2];"
     f"[p1]trim=0:{P0},setpts=PTS-STARTPTS[x];[p2]trim={P1}:{D1},setpts=PTS-STARTPTS[z];[1:v]setpts=PTS-STARTPTS[y];"
     f"[x][y][z]concat=n=3:v=1:a=0[v];[0:a]aresample=48000,afade=t=out:st={D1-0.4}:d=0.4[a]",
     '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-c:a', 'pcm_s16le', f'{S}/s1.mkv'])

# ---------- 1b · Gobernador: "los amigos no son de cuatro paredes" ----------
G0, G1 = 35.8, 52.0
DB = G1 - G0
run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(G0), '-t', str(DB), '-i', VG, '-filter_complex',
     f"[0:v]scale={W}:{H}:flags=lanczos,unsharp=5:5:0.4,setsar=1,fps=30,format=yuv420p,fade=t=in:d=0.3[v];[0:a]aresample=48000,afade=t=in:d=0.2,afade=t=out:st={DB-0.4}:d=0.4[a]",
     '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-c:a', 'pcm_s16le', f'{S}/s1b.mkv'])

# ---------- 2 · Senado: él → fotos del evento con su voz → él  ----------
T0, T1 = 119.4, 180.9          # tramo del discurso
F0, F1 = 121.9, 180.9          # fotos: solo 2.5 s de él sentado y luego fotos hasta el final, con su voz
fotos = ['p7', 'n2', 'p4', 'p1', 'p18', 'p16', 'n4', 'p12', 'p8', 'p17', 'n3', 'p15', 'p2', 'p14']
XF = 0.5
d = ((F1 - F0) + XF * (len(fotos) - 1)) / len(fotos)
for i, k in enumerate(fotos):
    photo_clip(k, round(d, 3), f'{S}/f{i:02d}.mkv', rev=bool(i % 2))
inp = sum([['-i', f'{S}/f{i:02d}.mkv'] for i in range(len(fotos))], [])
fc, prev = '', '[0:v]'
for i in range(1, len(fotos)):
    off = round(i * (d - XF), 3)
    fc += f"{prev}[{i}:v]xfade=transition=fade:duration={XF}:offset={off}[x{i}];"; prev = f'[x{i}]'
run(['ffmpeg', '-y', '-loglevel', 'error', *inp, '-filter_complex', fc[:-1].rsplit('[', 1)[0] + '[m]', '-map', '[m]',
     '-t', str(F1 - F0), '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', f'{S}/montaje.mkv'])
sen = f"scale={W}:{H}:flags=lanczos,setsar=1,fps=30,format=yuv420p"
run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(T0), '-t', str(T1 - T0), '-i', V1, '-i', f'{S}/montaje.mkv', '-filter_complex',
     f"[0:v]{sen},trim=0:{F0-T0},setpts=PTS-STARTPTS[a];"
     f"[1:v]setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1:a=0[v];[0:a]aresample=48000,afade=t=in:d=0.3,afade=t=out:st={T1-T0-0.5}:d=0.5[au]",
     '-map', '[v]', '-map', '[au]', '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-c:a', 'pcm_s16le', f'{S}/s2.mkv'])

# ---------- 3 · Cierre 5 s ----------
D3 = 5.0
photo_clip('p13', D3, f'{S}/f_end.mkv')
run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{S}/f_end.mkv', '-f', 'lavfi', '-t', str(D3), '-i', 'anullsrc=r=48000:cl=stereo',
     '-filter_complex', f"[0:v]eq=brightness=-0.18,fade=t=out:st={D3-0.8}:d=0.8[v]", '-map', '[v]', '-map', '1:a',
     '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-c:a', 'pcm_s16le', f'{S}/s3.mkv'])

# ---------- subtítulos y textos (ASS) ----------
D2 = T1 - T0
O2, O3 = D1 + DB, D1 + DB + D2
def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f'{h}:{m:02d}:{s:05.2f}'
subs1 = [
    (0.2, 6.5, "Here from the Congress of the Republic of Colombia, we support opening"),
    (6.5, 12.8, "Colombia's embassy in Jerusalem. We have defended this position. We are 100% pro-Israel."),
    (13.4, 19.2, "We defend Israel not only because it has been an ally of Colombia,"),
    (19.2, 25.0, "but because there is a promise, a blessing upon that people, where God Himself said"),
    (25.3, 30.8, "He will bless those who bless them and curse those who curse them. And we bless the people"),
    (30.8, 37.4, "of Israel, as a Colombian congressman, as a senator of the Republic. I bless the people of Israel,"),
    (37.7, 42.4, "we defend them, and we will always be their friends and allies. God bless you."),
]
subs2 = [
    (119.5, 124.3, "Today, first of all, we want to lift our prayers to Almighty God"),
    (124.3, 130.1, "and to state, as a senator of the Republic, from the floor of the Senate,"),
    (130.1, 137.7, "that many of the congressmen here today stand with the people of Israel,"),
    (137.7, 144.5, "that we support Israel and disagree with the way they are being treated"),
    (144.5, 150.4, "by some countries that today back the terrorists who want to wipe them out;"),
    (150.4, 155.9, "that there are also many Colombians who pray every day, who kneel and ask God"),
    (155.9, 163.3, "for the people of Israel. Many Christians, many people of this beautiful country, Colombia,"),
    (163.5, 171.2, "tell Almighty God today that, even though some stand against this people"),
    (171.2, 177.4, "and want to see it destroyed, there are so many of us Colombians who love, respect,"),
    (177.6, 180.7, "support and bless the people of Israel."),
]
ass = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Figtree Light ExtraBold,54,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,0,0,0,0,100,100,0,0,1,3.2,1.5,2,220,220,64,1
Style: LTName,Anton,64,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,2,0,1,0,2,1,90,90,250,1
Style: LTSub,Figtree Light ExtraBold,32,&H00FFD38C,&H00FFD38C,&H00000000,&H00000000,0,0,0,0,100,100,3,0,1,0,2,1,92,90,214,1
Style: Title,Anton,150,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,6,0,1,0,4,5,80,80,0,1
Style: TitleSub,Figtree Light ExtraBold,44,&H00FFD38C,&H00FFD38C,&H00000000,&H00000000,0,0,0,0,100,100,4,0,1,0,3,5,80,80,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
ev = []
for a, b, t in subs1:
    ev.append(f"Dialogue: 1,{ts(a)},{ts(b)},Sub,,0,0,0,,{{\\fad(120,120)}}{t}")
subsG = [
    (36.0, 42.1, "We are friends of God's people. Friends are not just within four walls;"),
    (42.1, 46.7, "friends are friends in public and in private, in good times and in bad,"),
    (46.7, 51.9, "and Casanare is a friend of the people of Israel."),
]
for a, b, t in subsG:
    ev.append(f"Dialogue: 1,{ts(a - G0 + D1)},{ts(b - G0 + D1)},Sub,,0,0,0,,{{\\fad(120,120)}}{t}")
for a, b, t in subs2:
    ev.append(f"Dialogue: 1,{ts(a - T0 + O2)},{ts(b - T0 + O2)},Sub,,0,0,0,,{{\\fad(120,120)}}{t}")
# rótulo del senador (en el pleno con la bandera)
ev.append(f"Dialogue: 2,{ts(0.6)},{ts(4.4)},LTName,,0,0,0,,{{\\fad(300,300)\\move(60,830,90,830)}}SENATOR JOSUÉ ALIRIO BARRERA")
ev.append(f"Dialogue: 2,{ts(0.9)},{ts(4.4)},LTSub,,0,0,0,,{{\\fad(300,300)\\move(62,866,92,866)}}SENATE OF THE REPUBLIC OF COLOMBIA")
# rótulo del evento sobre las fotos
ev.append(f"Dialogue: 2,{ts(4.8)},{ts(10.0)},LTName,,0,0,0,,{{\\fad(300,300)}}CASANARE BLESSES ISRAEL")
ev.append(f"Dialogue: 2,{ts(5.1)},{ts(10.0)},LTSub,,0,0,0,,{{\\fad(300,300)}}CASANARE, COLOMBIA")
ev.append(f"Dialogue: 2,{ts(F0 - T0 + O2 + 0.3)},{ts(F0 - T0 + O2 + 5.5)},LTName,,0,0,0,,{{\\fad(300,300)}}CASANARE BLESSES ISRAEL")
ev.append(f"Dialogue: 2,{ts(F0 - T0 + O2 + 0.6)},{ts(F0 - T0 + O2 + 5.5)},LTSub,,0,0,0,,{{\\fad(300,300)}}CASANARE, COLOMBIA")
# cierre
ev.append(f"Dialogue: 3,{ts(O3 + 0.2)},{ts(O3 + D3 - 0.3)},Title,,0,0,0,,{{\\fad(500,600)\\pos(960,470)}}COLOMBIA STANDS WITH ISRAEL")
ev.append(f"Dialogue: 3,{ts(O3 + 0.8)},{ts(O3 + D3 - 0.3)},TitleSub,,0,0,0,,{{\\fad(500,600)\\pos(960,600)}}SENATOR JOSUÉ ALIRIO BARRERA  ·  SHALOM")
open(f'{S}/subs.ass', 'w').write(ass + '\n'.join(ev) + '\n')

# ---------- unir + subtítulos ----------
os.makedirs('out', exist_ok=True)
run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{S}/s1.mkv', '-i', f'{S}/s1b.mkv', '-i', f'{S}/s2.mkv', '-i', f'{S}/s3.mkv', '-i', 'public/media/senador-israel/mezcla-v3.wav', '-filter_complex',
     f"[0:v][0:a][1:v][1:a][2:v][2:a][3:v][3:a]concat=n=4:v=1:a=1[v][a0];[a0]anullsink;[v]subtitles={S}/subs.ass:fontsdir={FONTS}[vs];"
     f"[4:a]loudnorm=I=-14:TP=-1.5:LRA=11[ao]",
     '-map', '[vs]', '-map', '[ao]', '-shortest', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p',
     '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', OUT])
print('ok', OUT)
