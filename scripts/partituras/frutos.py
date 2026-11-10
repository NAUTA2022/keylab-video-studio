"""Partitura · Key Lab "Así tu idea de tokenizar da frutos" (vertical, ~61.5 s).
MAPA: 0–4.1 HOOK semilla→árbol (celesta/arpa que crecen) · 4.1–4.35 VACÍO · 4.35 EY ·
5.2–17.6 PROBLEMA (latido + tic-tac; golpes en 15.000 y 30.000; pregunta en suspenso, golpe en "obstáculo", silencio) ·
17.6–29.7 PROPUESTA en mayor (impacto grande en "5.000" 21.8; crece hermosa) · 29.9–43.3 DIFERENCIADOR (baja a piano, celesta en cada destino, construye) ·
43.7–56.1 CIERRE con urgencia (golpes en 7 días / 10 % / 4 pagos, redoble) → CLÍMAX "Tu tokenizadora por 5.000" 52.2 · IV–V–I en el CTA y muejeje."""
import os, sys, subprocess, numpy as np, pretty_midi as pm
from pedalboard import Pedalboard, Reverb, Delay, Compressor, Limiter, Gain, HighpassFilter, PeakFilter, HighShelfFilter
from pedalboard.io import AudioFile
OUT=sys.argv[1] if len(sys.argv)>1 else 'public/media/frutos/partitura.wav'
TMP='/tmp/part-frutos'; os.makedirs(TMP,exist_ok=True)
SF='/usr/share/sounds/sf3/MuseScore_General_Full.sf3'; SR=44100; END=62.0
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



# ---------- HOOK 0–4.35 ----------
n('trem','F#3',0.0,4.1,40); r('trem',0.0,4.1,20,110); n('cb','F#1',0.0,4.1,55); r('cb',0.0,4.1,40,100)
for k,p in enumerate(['F#5','A#5','C#6','F#6','A#6','C#7','F#7']): n('celesta',p,0.2+0.5*k,0.6,50+4*k)
for k,p in enumerate(['F#4','A#4','C#5','F#5','A#5','C#6']): n('arpa',p,1.55+0.07*k,1.4,62)
roll(2.9,1.15,'C#2',30,110,18)
n('timbal','F#2',4.35,0.7,127); n('taiko','C2',4.35,0.7,115)
# ---------- PROBLEMA 5.2–17.6 (menor, latido) ----------
for k,t in enumerate(np.arange(5.2,12.6,Q*2)): n('cbcorto','F#1',t,0.25,72); n('chcorto','F#2',t+Q*0.5,0.2,56)
for k,t in enumerate(np.arange(5.2,12.6,Q)): n('pizz','C#6',t,0.08,44)
pad('cuerdas',5.2,12.6,MIN,40,3)
for t,p in [(6.75,'F#2'),(7.42,'A2')]:
    n('trompas',p,t,0.5,96); n('trompas',N(p)+7,t,0.5,90); n('timbal','F#2',t,0.4,100)
n('trem','C#5',12.7,4.6,48); r('trem',12.7,14.9,40,115); n('violines','F#6',13.5,1.5,56); roll(13.6,1.25,'C#2',30,112,16)
n('timbal','F#2',14.88,0.6,118); n('taiko','C2',14.88,0.6,104); n('trompas','F#2',14.88,1.2,96); n('trompas','C3',14.88,1.2,92)
n('chelo','F#2',15.4,1.9,55); n('cb','F#1',15.4,1.9,55)
# ---------- PROPUESTA 17.6–29.7 (mayor) ----------
bass(17.65,29.7,MAY,58); pad('cuerdas',17.65,29.7,MAY,50,4); arp(17.65,29.7,MAY,56); r('cuerdas',17.65,29.7,45,100)
motif('piano',17.7,MOT_M,0,58)
roll(20.6,1.2,'C#2',35,116,18)
n('timbal','F#2',21.81,0.8,124); n('taiko','C2',21.81,0.8,114)                     # 5.000
for x in ['F#2','C#3','F#3','A#3']: n('trompas',x,21.81,1.8,98)
for x in ['F#3','A#3','C#4','F#4']: n('coro',x,21.81,2.4,82)
for k,p in enumerate(['C#6','F#6','A#6','C#7']): n('celesta',p,21.85+0.09*k,0.6,64)
motif('violines',23.6,MOT_M,0,66); r('violines',23.6,29.7,50,100)
for k in ['cuerdas','violines','cb','chelo','arpa']: r(k,28.9,29.8,100,40)
# ---------- DIFERENCIADOR 29.9–43.3 ----------
n('piano','F#4',29.9,3.0,56); n('piano','A#4',29.9,3.0,50); n('piano','C#5',31.4,2.0,50); n('chelo','F#2',29.9,4.0,48)
for k,t in enumerate([34.13,35.18,35.84,36.89]): n('celesta',['F#6','A#6','C#7','F#7'][k],t,0.6,64); n('arpa',['F#4','A#4','C#5','F#5'][k],t,1.2,60)
bass(34.0,43.3,MAY,58); pad('cuerdas',34.0,43.3,MAY,48,4); r('cuerdas',34.0,43.3,40,105)
ostinato(38.2,43.3,MAY,50,90,Q/2); motif('violines',38.2,MOT_M,0,66); pad('coro',40.9,43.3,MAY,48,4); r('coro',40.9,43.3,40,100)
n('timbal','F#2',43.02,0.6,108)
# ---------- CIERRE con urgencia 43.7–56.1 ----------
for k,t in enumerate(np.arange(43.7,50.9,Q/2)): n('pizz',['F#5','C#5','A#4','C#5'][k%4],t,0.08,60+k//2)
bass(43.7,50.9,MAY,62); pad('cuerdas',43.7,50.9,MAY,52,4); r('cuerdas',43.7,50.9,45,110)
for t in [46.3,47.5,49.5]:                                                          # 7 días / 10 % / 4 pagos
    n('taiko','C2',t,0.6,108); n('timbal','F#2',t,0.5,104); n('trompas','F#3',t,0.6,84); n('trompas','C#4',t,0.6,80)
roll(50.2,1.95,'C#2',35,124,26)
PE=MAY+MAY
n('timbal','F#2',52.18,0.9,127); n('taiko','C2',52.18,0.9,120)                    # TU TOKENIZADORA POR 5.000
bass(52.18,56.4,PE,84); pad('cuerdas',52.18,56.4,PE,76,4); pad('coro',52.18,56.4,PE,68,4); arp(52.18,56.4,PE,62)
motif('violines',52.2,MOT_M,12,90); motif('trompas',52.2,MOT_M,-12,78)
# ---------- CTA IV–V–I + muejeje ----------
for t,d,(rt,ch) in [(56.55,0.95,('B1',['B','D#','F#'])),(57.5,0.95,('C#2',['C#','E#','G#']))]:
    for x in ch: n('cuerdas',N(x+'4'),t,d,98); n('coro',N(x+'4'),t,d,88); n('trompas',N(x+'3'),t,d,88)
    n('chelo',N(rt)+12,t,d,98); n('cb',rt,t,d,94)
I=['F#3','A#3','C#4','F#4']
n('timbal','F#2',58.45,0.8,124); n('taiko','C2',58.45,0.8,112)
for x in I: n('cuerdas',x,58.45,3.3,104); n('coro',x,58.45,3.1,90); n('organo',N(x)-12,58.45,3.3,55)
n('cb','F#1',58.45,3.3,95); n('chelo','F#2',58.45,3.3,90)
for k in ['cuerdas','coro','organo','cb','chelo']: r(k,59.8,61.9,110,0)
SUBS=[(4.35,2.0,0.3),(14.88,1.5,0.18),(21.81,2.0,0.24),(52.18,2.5,0.26),(58.45,3.0,0.26)]

def bus_fx(x):
    x=x.copy(); v0=int(4.1*SR); f=int(0.06*SR); x[:,v0:v0+f]*=np.linspace(1,0,f); x[:,v0+f:int(4.34*SR)]*=0.04
    v1=int(17.25*SR); x[:,v1:v1+f]*=np.linspace(1,0.15,f); x[:,v1+f:int(17.62*SR)]*=0.15                # silencio tras la pregunta
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
