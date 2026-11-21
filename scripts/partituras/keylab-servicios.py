"""Partitura · Key Lab video institucional horizontal (184 s): gancho intriga → EY · historia íntima (piano+chelo) que se abre al nacer Key Lab ·
puente con redoble y golpe en "todo" · servicios en groove progresivo (marketing → webs → 3D asombro → ecommerce → apps) ·
blockchain golpe y orquesta en tokenizadoras · "y además" ligero · cierre inspirador con crescendo, golpes en "Tu idea / Nuestra tecnología" y acorde final sobre el logo."""
import os, sys, subprocess, numpy as np, pretty_midi as pm
from pedalboard import Pedalboard, Reverb, Delay, Compressor, Limiter, Gain, HighpassFilter, PeakFilter, HighShelfFilter
from pedalboard.io import AudioFile
OUT=sys.argv[1] if len(sys.argv)>1 else 'public/media/kl/partitura.wav'
TMP='/tmp/part-kl'; os.makedirs(TMP,exist_ok=True)
SF='/usr/share/sounds/sf3/MuseScore_General_Full.sf3'; SR=44100; END=184.0
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



# GANCHO
n('trem','F#3',0.0,3.3,40); r('trem',0.0,3.25,30,105); n('cb','F#1',0.2,3.1,50)
for k,(t,p) in enumerate([(0.0,'C#6'),(0.54,'F#5'),(1.25,'A#5'),(1.97,'C#6'),(2.87,'F#6')]): n('celesta',p,t,0.8,52+k*3)
roll(2.4,0.95,'C#2',30,100,16)
n('timbal','F#2',3.38,0.6,122); n('taiko','C2',3.38,0.6,112)
# HISTORIA íntima
for t,d,(rt,ch) in chords(4.4,23.0,MIN):
    n('piano',N(rt)+12,t,d,52); n('piano',N(ch[1]+'3'),t+Q,d-Q,44); n('piano',N(ch[2]+'4'),t+2*Q,Q*1.5,42)
    n('chelo',N(rt)+12,t,d,48)
pad('trem',11.4,23.0,MIN,30,3); r('trem',11.4,23.0,30,80)
# NACE KEY LAB (se abre a mayor)
bass(23.0,33.1,MAY,52); pad('cuerdas',23.0,33.1,MAY,46,3); r('cuerdas',23.0,33.0,40,105); arp(23.0,33.1,MAY,48)
motif('violines',27.3,MOT_M,0,58); pad('coro',31.0,33.1,MAY,44,4)
# PUENTE
roll(34.4,1.7,'C#2',30,112,24)
n('timbal','F#2',36.1,0.7,124); n('taiko','C2',36.1,0.7,116)
for x in ['F#3','A#3','C#4','F#4']: n('cuerdas',x,36.1,0.8,92); n('trompas',N(x)-12,36.1,0.8,80)
# SERVICIOS · groove progresivo
bass(36.8,123.6,MAY,56); pad('cuerdas',36.8,123.6,MAY,44,3); arp(36.8,123.6,MAY,50)
ostinato(55.9,123.6,MAY,44,64,Q/2)
for t in np.arange(55.9,76.6,BAR): n('taiko','C2',t,0.3,58)
motif('violines',58.5,MOT_M,0,54); motif('violines',67.3,MOT_M,12,56)
for t in [41.32,46.69,49.97,55.16,58.48,61.3,63.9,67.28]: n('celesta','C#7' if t>55 else 'F#6',t,0.4,52)
# 3D asombro
pad('coro',76.8,100.0,MAY,40,4); r('coro',76.8,100.0,30,95); n('arpa','F#5',84.7,0.6,56); n('arpa','A#5',90.5,0.6,56); n('arpa','C#6',93.2,0.6,56); n('arpa','F#6',97.0,0.6,56)
# ecommerce y apps
for t in np.arange(100.1,123.5,BAR/2): n('taiko','C2',t,0.3,60)
for t in [103.17,104.04,104.91,106.01,114.04,114.78,116.28,117.99,120.25]: n('pizz','F#5',t,0.12,60)
# BLOCKCHAIN
roll(124.6,1.1,'C#2',30,112,18)
n('timbal','F#2',125.71,0.8,124); n('taiko','C2',125.71,0.8,116)
bass(125.7,151.2,MAY,62); pad('cuerdas',125.7,151.2,MAY,54,4); arp(125.7,151.2,MAY,54); ostinato(125.7,151.2,MAY,48,70,Q/2)
for t in np.arange(125.7,145.5,BAR/2): n('taiko','C2',t,0.3,66)
pad('coro',135.5,145.6,MAY,50,4); motif('violines',135.6,MOT_M,12,68); motif('trompas',135.6,MOT_M,-12,56)
n('timbal','F#2',135.58,0.6,116)
for t in [142.71,143.43,143.99]: n('timbal','F#2',t,0.4,104); n('celesta','C#7',t,0.4,56)
n('trem','F#3',145.6,5.5,40); r('trem',145.6,151.0,40,90)
# Y ADEMÁS (ligero)
pad('cuerdas',151.2,160.4,MAY,40,3); arp(151.2,160.4,MAY,46)
for t in [151.75,156.3,157.32,158.25]: n('celesta','F#6',t,0.5,56); n('pizz','C#6',t,0.1,56)
# CIERRE inspirador
bass(160.4,172.0,MAY,62); pad('cuerdas',160.4,172.0,MAY,56,4); pad('coro',160.4,172.0,MAY,50,4); arp(160.4,172.0,MAY,54)
motif('violines',160.5,MOT_M,12,72); motif('trompas',165.9,MOT_M,-12,60); r('cuerdas',165.9,171.9,60,115)
for t in np.arange(165.9,171.9,BAR/2): n('taiko','C2',t,0.3,68)
roll(170.6,1.4,'C#2',30,116,22)
for t,(rt,ch) in [(172.06,('B1',['B','D#','F#'])),(172.95,('C#2',['C#','E#','G#']))]:
    for x in ch: n('cuerdas',N(x+'4'),t,0.85,92); n('coro',N(x+'4'),t,0.85,78); n('trompas',N(x+'3'),t,0.85,80)
    n('timbal','F#2',t,0.4,112); n('chelo',N(rt)+12,t,0.85,84); n('cb',rt,t,0.85,80)
n('timbal','F#2',174.55,0.9,124); n('taiko','C2',174.55,0.9,114)
for x in ['F#3','A#3','C#4','F#4']: n('cuerdas',x,174.55,4.0,94); n('coro',x,174.55,4.0,80); n('organo',N(x)-12,174.55,4.0,48)
n('cb','F#1',174.55,4.0,82); n('chelo','F#2',174.55,4.0,78); n('celesta','F#6',174.7,1.4,58); n('celesta','C#7',175.2,1.6,54)
for k in ['cuerdas','coro','organo','cb','chelo']: r(k,177.0,179.5,110,0)
SUBS=[(3.38,1.2,0.24),(36.1,1.2,0.2),(125.71,1.2,0.2),(174.55,3.0,0.22)]

def bus_fx(x):
    x=x.copy(); f=int(0.05*SR)
    for a,b,g in [(3.28,3.38,0.06),(179.5,184.0,1.0)]:
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
