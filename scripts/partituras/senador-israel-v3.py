"""Partitura · Senador Josué Alirio Barrera · Casanare Bendice a Israel (109.6 s, bajo su voz).
MAPA (tiempo del video):
 0.0– 6.5  pleno, "apoyamos la embajada en Jerusalén"   → INTRO solemne: trémolo grave + contrabajo, piano lento (menor)
 6.5–12.8  "Somos 100 % pro-Israel" (≈11.3)             → UP: timbal + trompas en "100 %"
13.4–25.0  aliado / promesa / bendición                  → INSPIRADOR: pasa a mayor, arpa + violines que crecen
25.3–30.8  "bendecirá a los que lo bendijeren"          → coro entra (up suave)
30.8–42.0  "Bendigo al pueblo de Israel… amigos y aliados. Dios los bendiga" → crece; golpe en 37.7, cadencia y reposo a 43
43.0–50.6  Senado: "elevar plegarias al Dios todopoderoso" → íntimo: piano + chelo, órgano suave
50.6       fotos del evento ("Casanare Blesses Israel") → arpa + violines, ostinato que entra
53.7–61.3  "muchos congresistas… del lado del pueblo de Israel" → UP en 59
61.3–74.0  "no estamos de acuerdo… terroristas"         → TENSIÓN: vaciar a latido + violín agudo en trémolo
74.0–86.9  "colombianos que oran… país hermoso, Colombia" → INSPIRADOR en mayor, crece
87.1–94.8  "aunque algunos se ponen en contra"           → leve tensión (menor), redoble desde 92.8
94.8–104.3 "amamos, respetamos, respaldamos y bendecimos" → CLÍMAX: orquesta completa IV–V (100.8, 102.6)
104.5–109.6 cierre "COLOMBIA STANDS WITH ISRAEL"         → RESUELVE en I con coro y órgano y se apaga"""
import os, sys, subprocess, numpy as np, pretty_midi as pm
from pedalboard import Pedalboard, Reverb, Delay, Compressor, Limiter, Gain, HighpassFilter, PeakFilter, HighShelfFilter
from pedalboard.io import AudioFile
OUT=sys.argv[1] if len(sys.argv)>1 else 'public/media/senador-israel/partitura-v3.wav'
TMP='/tmp/part-senador-v3'; os.makedirs(TMP,exist_ok=True)
SF='/usr/share/sounds/sf3/MuseScore_General_Full.sf3'; SR=44100; END=125.8
N=pm.note_name_to_number; stems={}
def inst(k,prog):
    if k not in stems: stems[k]=pm.Instrument(program=prog,name=k)
    return stems[k]
CUT, DB = 43.0, 16.2   # se inserta el clip del gobernador (amigos en todo tiempo) en 43 s
def R(t): return t - 1000 if t >= 1000 else (t if t < CUT else t + DB)
def note(k,prog,p,t,d,v=70):
    inst(k,prog).notes.append(pm.Note(velocity=int(np.clip(v,1,127)),pitch=N(p) if isinstance(p,str) else int(p),start=R(t),end=R(t)+max(0.05,d)))
def ramp(k,prog,t0,t1,v0,v1):
    i=inst(k,prog)
    for s in range(25):
        a=s/24; tt=R(t0+(t1-t0)*a)
        if tt is not None: i.control_changes.append(pm.ControlChange(11,int(v0+(v1-v0)*a),tt))
P={'piano':0,'celesta':8,'violines':40,'chelo':42,'cb':43,'trem':44,'pizz':45,'arpa':46,'timbal':47,'cuerdas':49,'coro':52,'trompas':60,'organo':19,'taiko':116,'chcorto':42,'cbcorto':43}
def n(k,p,t,d,v): note(k,P[k],p,t,d,v)
def r(k,t0,t1,v0,v1): ramp(k,P[k],t0,t1,v0,v1)

BAR=2.6; Q=BAR/4
MIN=[('F#2',['F#','A','C#']),('D2',['D','F#','A']),('B1',['B','D','F#']),('C#2',['C#','E#','G#'])]
MIN2=[('F#2',['F#','A','C#']),('A1',['A','C#','E']),('E2',['E','G#','B']),('C#2',['C#','E#','G#'])]
MAY=[('F#2',['F#','A#','C#']),('B1',['B','D#','F#']),('D#2',['D#','F#','A#']),('C#2',['C#','E#','G#'])]
MOT_m=[[(0,'C#5',1.5),(1.5,'F#5',0.5),(2,'E5',1),(3,'C#5',1)],[(0,'D5',2),(2,'A4',1),(3,'B4',1)],[(0,'B4',1.5),(1.5,'D5',0.5),(2,'C#5',1),(3,'B4',1)],[(0,'G#4',3),(3,'E#4',1)]]
MOT_M=[[(0,'C#5',1.5),(1.5,'F#5',0.5),(2,'G#5',1),(3,'A#5',1)],[(0,'F#5',2),(2,'D#5',1),(3,'F#5',1)],[(0,'D#5',1.5),(1.5,'F#5',0.5),(2,'E#5',1),(3,'D#5',1)],[(0,'C#5',3),(3,'E#5',1)]]
def motif(k,t0,mot,shift=0,vel=70):
    for bi,bar in enumerate(mot):
        for (b,p,d) in bar: n(k,N(p)+shift,t0+(bi*4+b)*Q,d*Q*0.97,vel)
def chords(t0,t1,prog):
    out=[]; t=t0; i=0
    while t<t1-0.3: out.append((t,min(BAR,t1-t),prog[i%len(prog)])); t+=BAR; i+=1
    return out
def pad(k,t0,t1,prog,v,octv=3):
    for t,d,(rt,ch) in chords(t0,t1,prog):
        for x in ch: n(k,N(x+str(octv)),t,d,v)
def bass(t0,t1,prog,v,cello=True,cb=True):
    for t,d,(rt,ch) in chords(t0,t1,prog):
        if cello: n('chelo',N(rt)+12,t,d,v)
        if cb: n('cb',rt,t,d,v-6)
def arp(t0,t1,prog,v):
    for t,d,(rt,ch) in chords(t0,t1,prog):
        a=[N(x+'4') for x in ch]+[N(ch[0]+'5')]
        for e in range(int(d/(Q/2))): n('arpa',a[[0,1,2,3,2,1,2,3][e%8]],t+e*Q/2,Q/2*0.9,v)
def roll(t0,dur,pitch,v0,v1,hits=26):
    for k in range(hits): n('timbal',pitch,t0+(1-(1-k/hits)**1.7)*dur,0.1,int(v0+(v1-v0)*k/hits))
def ostinato(t0,t1,prog,v0,v1,step):
    PAT=[0,0,12,0,7,0,12,7]; k=0; t=t0
    for tt,d,(rt,ch) in chords(t0,t1,prog):
        t=tt
        while t<tt+d-0.02:
            a=(t-t0)/max(1e-6,t1-t0); acc=12 if k%4==0 else 0
            n('chcorto',N(rt)+12+PAT[k%8],t,step*0.45,int(v0+(v1-v0)*a+acc))
            if k%2==0: n('cbcorto',rt,t,step*0.5,int(v0-5+(v1-v0)*a+acc))
            t+=step; k+=1



# ---------- INTRO 0–13.4 (menor, solemne) ----------
n('trem','F#2',0.0,6.6,40); r('trem',0.0,6.6,30,80); n('cb','F#1',0.0,13.2,52); r('cb',0.0,13.2,40,85)
motif('piano',0.6,MOT_m,0,52)
pad('cuerdas',5.0,13.3,MIN,40,3); r('cuerdas',5.0,13.3,30,90)
roll(9.6,1.7,'C#2',35,105,18)
n('timbal','F#2',11.3,0.7,112); n('taiko','C2',11.3,0.7,96)                            # 100 % pro-Israel
for x in ['F#2','C#3','F#3']: n('trompas',x,11.3,1.9,84)
# ---------- INSPIRADOR 13.4–43 (mayor) ----------
bass(13.4,43.0,MAY,56); pad('cuerdas',13.4,43.0,MAY,48,4); r('cuerdas',13.4,43.0,40,105)
arp(13.4,43.0,MAY,50); motif('violines',19.2,MOT_M,0,62); r('violines',19.2,43.0,45,105)
pad('coro',25.3,43.0,MAY,46,4); r('coro',25.3,43.0,30,95)
for t in [19.2,25.3]: n('celesta','F#6',t,0.6,58); n('celesta','C#7',t+0.15,0.6,50)
motif('trompas',30.8,MOT_M,-12,62)
n('timbal','F#2',37.7,0.7,116); n('taiko','C2',37.7,0.7,104)                            # amigos y aliados
for x in ['F#2','C#3','F#3','A#3']: n('trompas',x,37.7,2.4,90)
for k in ['cuerdas','coro','violines','cb','chelo','arpa']: r(k,41.5,43.3,110,35)

# ---------- NUEVO 43–59.2 (abs, +1000): "los amigos no son de cuatro paredes… Casanare es amigo del pueblo de Israel" ----------
X=1000
bass(X+43.2,X+59.2,MAY,58); pad('cuerdas',X+43.2,X+59.2,MAY,50,4); r('cuerdas',X+43.2,X+59.2,40,100); arp(X+43.2,X+59.2,MAY,56)
motif('piano',X+43.3,MOT_M,0,58); motif('violines',X+48.5,MOT_M,0,64); r('violines',X+48.5,X+59.2,45,100)
roll(X+52.2,1.6,'C#2',35,112,18)
n('timbal','F#2',X+53.9,0.7,118); n('taiko','C2',X+53.9,0.7,106)
for x in ['F#2','C#3','F#3','A#3']: n('trompas',x,X+53.9,2.6,92)
for x in ['F#3','A#3','C#4','F#4']: n('coro',x,X+53.9,4.0,80)
for k in ['cuerdas','coro','violines','cb','chelo','arpa','trompas']: r(k,X+57.6,X+59.3,110,30)
# ---------- SENADO íntimo 43–50.6 ----------
n('piano','F#4',43.2,3.6,50); n('piano','A#4',43.2,3.6,44); n('piano','C#5',45.0,2.5,46); n('piano','B4',47.0,3.6,46); n('piano','D#5',47.0,3.6,42)
n('chelo','F#2',43.0,7.8,50); n('organo','F#2',43.0,7.6,60); r('organo',43.0,50.6,30,80)
# ---------- fotos del evento 50.6–61.3 ----------
bass(50.6,61.3,MAY,58); pad('cuerdas',50.6,61.3,MAY,50,4); arp(50.6,61.3,MAY,56); ostinato(50.6,61.3,MAY,45,80,Q/2)
n('celesta','C#6',50.7,0.6,62); n('celesta','F#6',50.9,0.6,60); n('celesta','A#6',51.1,1.2,58)
roll(57.4,1.6,'C#2',35,108,18)
n('timbal','F#2',59.0,0.7,114); n('taiko','C2',59.0,0.7,100)                            # del lado de Israel
for x in ['F#2','C#3','F#3']: n('trompas',x,59.0,2.0,88)
# ---------- TENSIÓN 61.3–74 ----------
for k,t in enumerate(np.arange(61.3,73.9,Q*2)): n('cbcorto','F#1',t,0.25,70+k); n('chcorto','F#2',t+Q,0.2,58+k)
n('trem','C#5',64.0,10.0,45); r('trem',64.0,74.0,35,95); n('violines','F#6',68.0,6.0,50)
pad('cuerdas',61.3,74.0,MIN,38,3)
# ---------- INSPIRADOR 74–87 ----------
bass(74.0,87.0,MAY,62); pad('cuerdas',74.0,87.0,MAY,56,4); arp(74.0,87.0,MAY,58); r('cuerdas',74.0,87.0,50,105)
motif('violines',74.1,MOT_M,0,70); pad('coro',79.5,87.0,MAY,50,4); r('coro',79.5,87.0,40,100)
n('celesta','F#6',74.0,0.6,60); n('arpa','F#5',79.5,1.5,62); n('arpa','C#6',79.7,1.5,62)
n('timbal','F#2',85.0,0.6,104)                                                           # Colombia
# ---------- leve tensión 87–94.8 ----------
bass(87.0,94.8,MIN,60); pad('cuerdas',87.0,94.8,MIN,50,3); n('trem','C#4',89.0,5.8,50); r('trem',89.0,94.8,40,110)
roll(92.8,2.0,'C#2',35,118,24)
# ---------- CLÍMAX 94.8–104.5: IV–V ----------
PE=MAY+MAY
bass(94.8,100.8,PE,84); pad('cuerdas',94.8,100.8,PE,76,4); pad('coro',94.8,100.8,PE,66,4); arp(94.8,100.8,PE,64)
motif('violines',94.9,MOT_M,12,90); motif('trompas',94.9,MOT_M,-12,78)
for t in [94.8,97.8]: n('taiko','C2',t,0.8,120); n('timbal','F#2',t,0.6,116)
for t,d,(rt,ch) in [(100.8,1.8,('B1',['B','D#','F#'])),(102.6,1.9,('C#2',['C#','E#','G#']))]:
    for x in ch: n('cuerdas',N(x+'4'),t,d,100); n('coro',N(x+'4'),t,d,90); n('trompas',N(x+'3'),t,d,90)
    n('chelo',N(rt)+12,t,d,100); n('cb',rt,t,d,96); n('timbal','F#2',t,0.5,110)
roll(103.3,1.2,'C#2',50,120,16)
# ---------- RESUELVE en I 104.5–109.6 ----------
I=['F#3','A#3','C#4','F#4']
n('timbal','F#2',104.5,0.8,124); n('taiko','C2',104.5,0.8,112)
for x in I: n('cuerdas',x,104.5,5.0,106); n('coro',x,104.5,4.8,92); n('organo',N(x)-12,104.5,5.0,58)
for x in ['F#2','C#3','F#3']: n('trompas',x,104.5,3.6,94)
n('cb','F#1',104.5,5.0,96); n('chelo','F#2',104.5,5.0,92); n('celesta','F#6',105.0,1.0,60); n('celesta','C#7',105.2,1.0,56); n('piano','F#5',105.4,4.0,58)
for k in ['cuerdas','coro','organo','cb','chelo','trompas']: r(k,107.0,109.5,110,0)
SUBS=[(R(a),b,c) for a,b,c in [(11.3,1.8,0.18),(37.7,2.0,0.2),(59.0,1.8,0.18),(94.8,2.0,0.2),(104.5,4.0,0.28),(1053.9,1.8,0.2)]]

def bus_fx(x):
    return x

FX={'piano':[Reverb(room_size=0.85,wet_level=0.35,dry_level=0.7),Delay(delay_seconds=Q*0.75,feedback=0.35,mix=0.16)],
 'celesta':[Reverb(room_size=0.9,wet_level=0.45,dry_level=0.6),Delay(delay_seconds=Q*0.75,feedback=0.35,mix=0.25),Gain(-2)],
 'cuerdas':[Reverb(room_size=0.95,wet_level=0.45,dry_level=0.6)],'violines':[Reverb(room_size=0.9,wet_level=0.4,dry_level=0.65)],
 'coro':[Reverb(room_size=0.95,wet_level=0.5,dry_level=0.5)],'organo':[HighpassFilter(120),Reverb(room_size=0.95,wet_level=0.5,dry_level=0.5),Gain(-7)],
 'trompas':[Reverb(room_size=0.85,wet_level=0.35,dry_level=0.7)],'arpa':[Reverb(room_size=0.8,wet_level=0.35,dry_level=0.7),Gain(-3)],
 'chelo':[Reverb(room_size=0.8,wet_level=0.3,dry_level=0.75)],'cb':[Reverb(room_size=0.7,wet_level=0.2,dry_level=0.8)],
 'trem':[Reverb(room_size=0.9,wet_level=0.4,dry_level=0.7),Gain(-3)],'pizz':[Reverb(room_size=0.8,wet_level=0.35,dry_level=0.7)],
 'chcorto':[HighpassFilter(60),Compressor(threshold_db=-20,ratio=3),Reverb(room_size=0.75,wet_level=0.28,dry_level=0.8),Gain(8)],
 'cbcorto':[Reverb(room_size=0.7,wet_level=0.2,dry_level=0.8),Gain(4)],
 'timbal':[Reverb(room_size=0.9,wet_level=0.4,dry_level=0.7),Delay(delay_seconds=Q*0.75,feedback=0.35,mix=0.2)],
 'taiko':[Reverb(room_size=0.9,wet_level=0.4,dry_level=0.7),Delay(delay_seconds=Q*0.75,feedback=0.35,mix=0.2)]}
nS=int((END+1)*SR); mix=np.zeros((2,nS),np.float32); hits=np.zeros((2,nS),np.float32)
for k,i in stems.items():
    m=pm.PrettyMIDI(); m.instruments.append(i); mid=f'{TMP}/{k}.mid'; wav=f'{TMP}/{k}.wav'; m.write(mid)
    subprocess.run(['fluidsynth','-ni','-g','0.7','-r',str(SR),'-F',wav,SF,mid],capture_output=True)
    with AudioFile(wav) as f: a=f.read(f.frames)
    if a.shape[0]==1: a=np.vstack([a,a])
    a=Pedalboard(FX[k])(a,SR); a=np.pad(a,((0,0),(0,max(0,nS-a.shape[1]))))[:,:nS]
    if k in ('timbal','taiko'): hits+=a
    else: mix+=a
t=np.arange(nS)/SR
def sub(t0,dur,f0,f1,amp):
    m=(t>=t0)&(t<t0+dur); tt=t[m]-t0; f=f1+(f0-f1)*np.exp(-tt*8); ph=2*np.pi*np.cumsum(f)/SR
    o=np.zeros(nS); o[m]=amp*np.sin(ph)*np.exp(-tt*1.4)*np.clip(tt/0.01,0,1); return o
s=sum(sub(a,b,70,46.25,c) for a,b,c in SUBS)
hits+=s.astype(np.float32)
np.save(f'{TMP}/hits.npy',hits)
music=mix+hits
music=bus_fx(music)
music=Pedalboard([Compressor(threshold_db=-18,ratio=2.5),Limiter(threshold_db=-1)])(music,SR)
with AudioFile(OUT,'w',SR,2) as f: f.write(music)
with AudioFile(OUT.replace('.wav','-sinhits.wav'),'w',SR,2) as f: f.write(mix)
print('ok',OUT, ' '.join(f'{s}:{20*np.log10(np.sqrt((music[:,int(s*SR):int((s+1)*SR)]**2).mean())+1e-9):.0f}' for s in range(0,int(END),4)))
