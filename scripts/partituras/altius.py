"""Partitura · Altius VSL horizontal (~116.5 s), sigue el guion por función:
0–11.9 GANCHO intriga (trémolo, celesta por piso, pizz por ciudad) · 12.4–17 AUTORIDAD piano firme + bajo ·
17–23.3 HISTORIA piano y chelo íntimo · 23.5–34.5 DOLOR piano solo menor · 34.5–37.3 DIFERENCIA entran cuerdas, golpe en "third way" ·
37.3–61 AGENCIA capas por servicio → orquesta · 61.5–75 REAL ESTATE orquesta completa · 75–88 TOKENIZACIÓN · 88.8–97 PROMESA vacío y golpe en 39.900 ·
97.3–113 CIERRE crescendo → "highest standard" → CTA cálido → acorde final y cola con reverb."""
import os, sys, subprocess, numpy as np, pretty_midi as pm
from pedalboard import Pedalboard, Reverb, Delay, Compressor, Limiter, Gain, HighpassFilter, PeakFilter, HighShelfFilter
from pedalboard.io import AudioFile
OUT=sys.argv[1] if len(sys.argv)>1 else 'public/media/altius/partitura.wav'
TMP='/tmp/part-altius'; os.makedirs(TMP,exist_ok=True)
SF='/usr/share/sounds/sf3/MuseScore_General_Full.sf3'; SR=44100; END=117.0
N=pm.note_name_to_number; stems={}
def inst(k,prog):
    if k not in stems: stems[k]=pm.Instrument(program=prog,name=k)
    return stems[k]
def R(t): return t
def note(k,prog,p,t,d,v=70):
    inst(k,prog).notes.append(pm.Note(velocity=int(np.clip(v,1,127)),pitch=N(p) if isinstance(p,str) else int(p),start=t,end=t+max(0.05,d)))
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



# ---------- GANCHO 0–11.9 (intriga) ----------
n('trem','F#3',0.0,11.6,52); r('trem',0.0,11.6,45,100); n('cb','F#1',0.3,11.3,60); r('cb',0.3,11.3,50,95); n('chelo','F#2',0.3,7.3,48); r('chelo',0.3,7.3,40,90)
for k,(t,p) in enumerate([(4.18,'C#5'),(5.14,'F#5'),(5.86,'E5'),(7.6,'C#5'),(8.44,'F#4'),(9.4,'A4'),(10.3,'C#5'),(11.38,'F#5')]): n('piano',p,t,1.2,54)
for k,t in enumerate([0.0,1.14,2.32,3.7]): n('celesta',['C#6','F#5','A5','C#6'][k],t,0.9,46)
for k,t in enumerate([5.86,6.3,6.84,7.2,7.6]): n('celesta',['F#5','A#5','C#6','F#6','A#6'][k],t,0.7,50+3*k); n('arpa',['F#4','A#4','C#5','F#5','A#5'][k],t,1.1,52)
pad('cuerdas',4.1,11.8,[('F#2',['F#','A','C#']),('D2',['D','F#','A']),('B1',['B','D#','F#'])],44,3); r('cuerdas',4.1,11.6,35,110)
roll(10.6,1.2,'C#2',30,90,14)
for t,p in [(9.4,'C#5'),(10.3,'F#5'),(11.38,'A#5')]: n('pizz',p,t,0.2,62); n('celesta',N(p)+12,t,0.6,52)
# ---------- AUTORIDAD 12.4–17 (piano firme, bajo discreto, tensión que sube) ----------
for k,t in enumerate(np.arange(12.45,17.0,Q)):
    rt,ch=MAY[(k//4)%4]; n('piano',N(ch[0]+'3'),t,Q*0.9,48+k); n('piano',N(ch[2]+'3'),t,Q*0.9,42+k)
bass(12.45,17.0,MAY,46,cello=False)
# ---------- HISTORIA 17–23.3 (piano y chelo, íntimo) ----------
for t,d,(rt,ch) in chords(17.1,23.3,MAY):
    n('chelo',N(rt)+12,t,d,52)
    for e,x in enumerate([ch[0]+'4',ch[1]+'4',ch[2]+'4',ch[1]+'4']): n('piano',x,t+e*Q,Q*1.6,44)
n('piano','A#5',20.58,1.0,50); n('piano','C#6',22.82,1.2,50)          # Doha · Dubái
# ---------- DOLOR 23.5–34.5 (piano solo, menor, oscuro) ----------
for t,d,(rt,ch) in chords(23.5,34.4,MIN):
    n('piano',N(rt)+12,t,d,58); n('piano',N(ch[1]+'3'),t+Q,d-Q,50); n('piano',N(ch[2]+'4'),t+2*Q,Q*1.5,48)
    n('chelo',N(rt)+12,t,d,50); n('cb',rt,t,d,46)
pad('trem',23.5,34.4,MIN,30,4); r('trem',23.5,34.4,40,85)
n('piano','A4',30.6,1.4,46); n('piano','F#4',32.08,1.0,40); n('piano','D4',34.04,1.0,38)
# ---------- DIFERENCIA 34.5–37.3 (entran las cuerdas) ----------
pad('cuerdas',34.6,37.4,[('D2',['D','F#','A']),('C#2',['C#','E#','G#'])],40,3); r('cuerdas',34.6,36.4,30,105)
n('violines','C#6',35.3,1.3,50); r('violines',35.3,36.4,40,100)
n('timbal','F#2',36.5,0.6,96)
for x in ['F#3','A#3','C#4']: n('cuerdas',x,36.5,1.2,70); n('coro',x,36.5,1.4,58)
# ---------- AGENCIA 37.3–61 (capas por servicio) ----------
bass(37.4,61.4,MAY,54); pad('cuerdas',37.4,61.4,MAY,44,3); r('cuerdas',37.4,61.4,50,100)
for k,t in enumerate([41.92,42.82,43.5,44.74,47.16,48.48,51.26]): n('celesta',['F#5','A#5','C#6','F#6','A#6','C#7','F#7'][k],t,0.6,54); n('pizz',['F#4','A#4','C#5','F#5','A#5','C#6','F#6'][k],t,0.15,56)
arp(44.7,61.4,MAY,50)
ostinato(52.0,61.4,MAY,44,70,Q/2)
motif('violines',52.0,MOT_M,0,58); r('violines',52.0,61.4,50,100)
pad('coro',56.5,61.4,MAY,44,4); r('coro',56.5,61.4,30,100)
n('timbal','F#2',58.76,0.5,90)
# ---------- REAL ESTATE 61.5–75 (orquesta completa) ----------
for k in ['cuerdas','violines','coro']: r(k,61.0,61.6,100,60)
n('piano','F#4',61.6,2.5,52); n('piano','A#4',61.6,2.5,46)
n('timbal','F#2',64.6,0.5,98); n('trompas','F#3',64.6,1.2,70); n('trompas','C#4',64.6,1.2,66)
PE=MAY
bass(66.2,75.2,PE,64); pad('cuerdas',66.2,75.2,PE,56,4); pad('coro',66.2,75.2,PE,46,4); arp(66.2,75.2,PE,56)
motif('violines',66.3,MOT_M,12,70); motif('trompas',66.3,MOT_M,-12,58)
for t in np.arange(66.3,75.0,BAR/2): n('taiko','C2',t,0.4,70); n('timbal','F#2',t+Q,0.3,58)
for t in [69.12,70.02,70.96]: n('celesta','C#7',t,0.5,58)
# ---------- TOKENIZACIÓN 75–88 ----------
n('timbal','F#2',75.0,0.8,100); n('taiko','C2',75.0,0.8,96)
bass(76.0,83.6,MAY,58); pad('cuerdas',76.0,83.6,MAY,50,3); arp(76.0,83.6,MAY,52); ostinato(76.0,83.6,MAY,48,66,Q/2)
for k,t in enumerate(np.arange(77.7,80.4,Q/2)): n('celesta',['F#6','C#6','A#5','C#6'][k%4],t,0.15,46)
pad('cuerdas',83.6,88.6,[('D#2',['D#','F#','A#']),('C#2',['C#','E#','G#'])],48,3); n('chelo','D#3',83.6,2.5,54); n('chelo','C#3',86.2,2.4,54)
n('violines','A#5',85.36,1.2,52); n('violines','C#6',86.88,1.4,56)          # licencia · tecnología
# ---------- PROMESA 88.8–97 (tensión, vacío, golpe en 39.900) ----------
n('trem','F#3',88.8,4.5,40); r('trem',88.8,93.3,40,110); n('cb','F#1',88.8,4.5,52)
for k,t in enumerate(np.arange(88.9,93.3,Q/2)): n('pizz','F#5' if k%2==0 else 'C#5',t,0.08,46+k)
n('piano','A4',90.94,0.8,46)
roll(92.3,1.05,'C#2',30,100,16)
n('timbal','F#2',94.2,0.9,124); n('taiko','C2',94.2,0.9,112)
for x in ['F#3','A#3','C#4','F#4']: n('cuerdas',x,94.2,2.9,82); n('coro',x,94.2,2.9,70); n('trompas',N(x)-12,94.2,2.4,74)
for k,p in enumerate(['C#6','F#6','A#6','C#7']): n('celesta',p,94.25+0.09*k,0.6,60)
n('cb','F#1',94.2,2.9,70); n('chelo','F#2',94.2,2.9,66)
# ---------- CIERRE 97.3–113 ----------
bass(97.3,102.4,MAY,56); pad('cuerdas',97.3,102.4,MAY,48,3); r('cuerdas',97.3,102.3,50,110)
for t in [97.34,98.7,99.7]: n('celesta','F#6',t,0.5,56); n('piano','F#4',t,0.8,52)
roll(100.9,1.5,'C#2',30,112,20)
n('timbal','F#2',102.4,0.9,122); n('taiko','C2',102.4,0.9,110)
bass(102.4,110.4,MAY,64); pad('cuerdas',102.4,110.4,MAY,56,4); pad('coro',102.4,110.4,MAY,50,4); arp(102.4,110.4,MAY,54)
motif('violines',102.4,MOT_M,12,68)
for t,d,(rt,ch) in [(108.5,0.95,('B1',['B','D#','F#'])),(109.45,0.95,('C#2',['C#','E#','G#']))]:
    for x in ch: n('cuerdas',N(x+'4'),t,d,84); n('coro',N(x+'4'),t,d,72); n('trompas',N(x+'3'),t,d,70)
    n('chelo',N(rt)+12,t,d,80); n('cb',rt,t,d,76)
n('piano','C#5',110.5,0.8,48)
I=['F#3','A#3','C#4','F#4']
n('timbal','F#2',111.5,0.9,110); n('taiko','C2',111.5,0.9,98)
for x in I: n('cuerdas',x,111.5,2.6,90); n('coro',x,111.5,2.6,76); n('organo',N(x)-12,111.5,2.6,46)
n('cb','F#1',111.5,2.6,80); n('chelo','F#2',111.5,2.6,76); n('celesta','F#6',111.6,1.2,54); n('celesta','C#7',112.0,1.4,50)
for k in ['cuerdas','coro','organo','cb','chelo']: r(k,113.0,114.1,110,0)
SUBS=[(36.5,1.4,0.16),(64.6,1.1,0.12),(94.2,2.2,0.26),(102.4,2.2,0.24),(111.5,3.0,0.2)]

def bus_fx(x):
    x=x.copy(); f=int(0.05*SR)
    for a,b,g in [(11.85,12.35,0.3),(93.35,94.18,0.05),(114.1,117.9,1.0)]:
        v0=int(a*SR); x[:,v0:v0+f]*=np.linspace(1,g,f); x[:,v0+f:int(b*SR)]*=g
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
