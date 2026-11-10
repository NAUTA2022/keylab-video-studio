"""Partitura · Key Lab "No llegues tarde a la próxima transformación financiera" (vertical, ~73 s).
MAPA: 0–2.8 "los que esperan" (dron quieto + reloj) · 3.6–6.2 "los que construyen" (sube, golpes) · 6.25 VACÍO · 6.46 EY ·
7.5 Internet / 9.6 Bitcoin / 13.2 tokenización UP · 17.7 "no solo tecnología" DOWN → 20.7/22.2/24.4 golpes que suben ·
25.8 "Imagina" inspirador (arpa, celesta) → construye (ostinato) · 37.6 "Pero" tensión · 41.4 "ejecutar" ·
42.2 PROPUESTA épica (marca blanca 44.8, GRAN golpe en 30.000 45.5) · 53.3 CIERRE tensión · 61.2 la pregunta (casi silencio) ·
64.6 "qué POSICIÓN" CLÍMAX · IV–V en el CTA · I 69.4 + muejeje."""
import os, sys, subprocess, numpy as np, pretty_midi as pm
from pedalboard import Pedalboard, Reverb, Delay, Compressor, Limiter, Gain, HighpassFilter, PeakFilter, HighShelfFilter
from pedalboard.io import AudioFile
OUT=sys.argv[1] if len(sys.argv)>1 else 'public/media/posicion/partitura.wav'
TMP='/tmp/part-posicion'; os.makedirs(TMP,exist_ok=True)
SF='/usr/share/sounds/sf3/MuseScore_General_Full.sf3'; SR=44100; END=73.4
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



# ---------- HOOK ----------
n('cb','F#1',0.0,3.0,52); n('trem','C#3',0.0,3.0,38)
for k,t in enumerate(np.arange(0.0,3.0,Q)): n('pizz','C#6' if k%2==0 else 'G#5',t,0.07,48)     # los que esperan: reloj
for t in [3.62,4.43,5.32]: n('timbal','F#2',t,0.4,96); n('trompas','F#2',t,0.5,84)            # los que construyen
pad('cuerdas',3.6,6.25,MAY,48,3); r('cuerdas',3.6,6.25,40,115); roll(5.0,1.2,'C#2',35,112,16)
n('timbal','F#2',6.46,0.7,127); n('taiko','C2',6.46,0.7,116)                                    # EY
# ---------- CONTEXTO ----------
motif('piano',7.5,MOT_M,0,56); n('celesta','F#6',7.46,0.7,60); n('celesta','C#7',7.6,0.7,56)
n('cb','F#1',7.46,10.2,54); n('chelo','F#2',9.62,8.0,52)
for x in ['F#3','A#3','C#4']: n('coro',x,9.62,3.4,56)
n('timbal','F#2',9.62,0.5,98)
pad('cuerdas',12.3,17.6,MAY,50,4); r('cuerdas',12.3,17.6,40,105); arp(13.1,17.6,MAY,54); roll(12.3,0.85,'C#2',35,110,12)
n('timbal','F#2',13.15,0.8,120); n('taiko','C2',13.15,0.8,108)
for x in ['F#2','C#3','F#3','A#3']: n('trompas',x,13.15,1.8,90)
for k in ['cuerdas','arpa','cb','chelo']: r(k,16.9,17.7,100,40)
n('piano','F#4',17.73,2.0,54); n('piano','A#4',17.73,2.0,48)                                   # no solo tecnología
bass(19.8,25.2,MAY,58); pad('cuerdas',19.8,25.2,MAY,48,4); r('cuerdas',19.8,25.2,40,105)
for k,t in enumerate([20.66,22.19,24.36]): n('timbal','F#2',t,0.5,96+8*k); n('trompas',['F#3','A#3','C#4'][k],t,1.0,80+6*k)
# ---------- OPORTUNIDAD ----------
bass(25.76,37.5,MAY,58); pad('cuerdas',25.76,37.5,MAY,52,4); arp(25.76,37.5,MAY,56); r('cuerdas',25.76,37.5,45,108)
for k,t in enumerate([28.36,29.33,30.06]): n('celesta',['F#6','A#6','C#7'][k],t,0.6,62); n('arpa',['F#4','A#4','C#5'][k],t,1.2,60)
motif('violines',25.8,MOT_M,0,64); ostinato(30.83,37.5,MAY,50,92,Q/2); pad('coro',32.47,37.5,MAY,46,4); r('coro',32.47,37.5,40,100)
for t in [32.47,33.19,35.05]: n('timbal','F#2',t,0.4,92)
for k in ['cuerdas','coro','violines','arpa','cb','chelo']: r(k,36.9,37.6,100,35)
for k,t in enumerate(np.arange(37.59,41.4,Q*2)): n('cbcorto','F#1',t,0.25,72); n('chcorto','F#2',t+Q*0.5,0.2,56)   # pero… tensión
n('trem','C#5',37.6,3.8,46); r('trem',37.6,41.4,35,110); roll(40.7,1.45,'C#2',35,120,20)
# ---------- PROPUESTA ----------
bass(42.21,52.5,MAY,66); pad('cuerdas',42.21,52.5,MAY,58,4); pad('coro',44.0,52.5,MAY,48,4); arp(42.21,52.5,MAY,58)
r('cuerdas',42.21,52.5,55,110); r('coro',44.0,52.5,40,105)
n('timbal','F#2',42.21,0.8,118); n('taiko','C2',42.21,0.8,106)
motif('violines',42.3,MOT_M,0,70); motif('trompas',46.8,MOT_M,-12,68)
n('timbal','F#2',44.79,0.5,108)                                                                 # marca blanca
n('timbal','F#2',45.54,0.9,127); n('taiko','C2',45.54,0.9,122)                                  # 30.000
for x in ['F#2','C#3','F#3','A#3']: n('trompas',x,45.54,1.4,100)
for x in ['F#3','A#3','C#4','F#4']: n('coro',x,45.54,1.4,88)
for k in ['cuerdas','coro','violines','trompas','arpa','cb','chelo']: r(k,52.0,53.2,105,40)
# ---------- CIERRE ----------
for k,t in enumerate(np.arange(53.29,61.1,Q)): n('pizz','C#6' if k%2==0 else 'G#5',t,0.07,54)
n('cb','F#1',53.29,7.9,56); pad('cuerdas',53.29,56.5,MIN,42,3)
n('piano','F#4',56.54,2.1,50); n('piano','A4',56.54,2.1,46)                                     # algunos siguen estudiando
bass(58.75,61.1,MAY,60); pad('cuerdas',58.75,61.1,MAY,52,4); n('timbal','F#2',58.75,0.5,104)   # otros ya están desarrollando
n('trem','C#5',61.19,3.2,36); r('trem',61.19,64.4,25,120)                                       # la pregunta…
roll(62.9,1.7,'C#2',30,124,26)
PE=MAY+MAY
n('timbal','F#2',64.63,0.9,127); n('taiko','C2',64.63,0.9,122)                                  # POSICIÓN
bass(64.63,67.1,PE,84); pad('cuerdas',64.63,67.1,PE,78,4); pad('coro',64.63,67.1,PE,70,4); arp(64.63,67.1,PE,64)
motif('violines',64.65,MOT_M,12,92); motif('trompas',64.65,MOT_M,-12,80)
for t,d,(rt,ch) in [(67.17,1.0,('B1',['B','D#','F#'])),(68.2,1.2,('C#2',['C#','E#','G#']))]:
    for x in ch: n('cuerdas',N(x+'4'),t,d,98); n('coro',N(x+'4'),t,d,88); n('trompas',N(x+'3'),t,d,88)
    n('chelo',N(rt)+12,t,d,98); n('cb',rt,t,d,94)
I=['F#3','A#3','C#4','F#4']
n('timbal','F#2',69.4,0.8,124); n('taiko','C2',69.4,0.8,112)
for x in I: n('cuerdas',x,69.4,3.6,104); n('coro',x,69.4,3.4,90); n('organo',N(x)-12,69.4,3.6,55)
n('cb','F#1',69.4,3.6,95); n('chelo','F#2',69.4,3.6,90)
for k in ['cuerdas','coro','organo','cb','chelo']: r(k,71.0,73.3,110,0)
SUBS=[(6.46,2.0,0.3),(13.15,1.6,0.2),(42.21,1.5,0.18),(45.54,2.0,0.26),(64.63,2.5,0.28),(69.4,3.0,0.26)]

def bus_fx(x):
    x=x.copy(); v0=int(6.22*SR); f=int(0.06*SR); x[:,v0:v0+f]*=np.linspace(1,0,f); x[:,v0+f:int(6.45*SR)]*=0.04
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
