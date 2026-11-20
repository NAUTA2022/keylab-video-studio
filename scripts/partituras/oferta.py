"""Partitura · Key Lab "Oferta tokenizadora US$5.000" (vertical, ~46 s), sigue el guion:
0–2.0 HOOK alarma: trémolo + redoble que crece hasta "¡Nunca!" → vacío → EY (golpe) ·
3.0–9.2 PROBLEMA: pulso tenso en menor, UP en 15 mil y 30 mil, DOWN cómico en "paneles confusos" ·
9.4–12.2 PROPUESTA sube a mayor → golpe grande en "cinco mil" · 13.4–15.1 "Sí, escuchaste bien" vacío → golpe en "¡Cinco!" ·
15.2–16.5 "se pone mejor" redoble · 16.8–26.4 OFERTAS groove con golpes en 4.500, 4 cuotas y 4.000 · 27–33.6 URGENCIA reloj (pizz) + trémolo, golpe en "enero sube", corte en "no vuelve" ·
34.3–40.3 CONTRASTE orquesta inspiradora · 41–43.1 CTA cadencia IV–V → I en "cupo" sobre el logo y cola."""
import os, sys, subprocess, numpy as np, pretty_midi as pm
from pedalboard import Pedalboard, Reverb, Delay, Compressor, Limiter, Gain, HighpassFilter, PeakFilter, HighShelfFilter
from pedalboard.io import AudioFile
OUT=sys.argv[1] if len(sys.argv)>1 else 'public/media/oferta/partitura.wav'
TMP='/tmp/part-oferta'; os.makedirs(TMP,exist_ok=True)
SF='/usr/share/sounds/sf3/MuseScore_General_Full.sf3'; SR=44100; END=46.5
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



# ---------- HOOK 0–2.0 (alarma que crece) ----------
n('trem','F#3',0.0,1.9,50); r('trem',0.0,1.85,40,120); n('trem','C#4',0.0,1.9,46)
n('cb','F#1',0.0,1.9,60); r('cb',0.0,1.85,50,115)
for k,t in enumerate(np.arange(0.0,1.5,Q/2)): n('pizz',['F#5','C#5'][k%2],t,0.08,60+k*2)
roll(0.6,0.95,'C#2',30,110,18)
n('timbal','F#2',1.55,0.4,110); n('taiko','C2',1.55,0.4,100)
for x in ['F#3','A3','C#4']: n('cuerdas',x,1.55,0.35,96)
# ---------- EY 2.0 ----------
n('timbal','F#2',2.0,0.6,124); n('taiko','C2',2.0,0.6,116)
# ---------- PROBLEMA 3.0–9.2 (tenso, menor) ----------
for t in np.arange(3.0,7.2,Q): n('cb','F#1',t,Q*0.6,62); n('timbal','F#2',t,0.12,44)
pad('trem',3.0,7.2,[('F#2',['F#','A','C#'])],40,3)
n('timbal','F#2',3.75,0.4,100); n('trompas','F#3',3.75,0.7,74)
n('timbal','F#2',4.39,0.4,110); n('trompas','A3',4.39,0.9,80); n('taiko','C2',4.39,0.4,96)
for k,p in enumerate(['C6','A5','F#5','D5','B4','G#4','F4']): n('pizz',p,7.25+k*0.18,0.1,62)   # DOWN cómico
n('chelo','F2',7.3,1.6,50); n('chelo','E2',8.6,0.8,46)
# ---------- PROPUESTA 9.4–12.2 (sube a mayor) ----------
bass(9.36,12.2,MAY,54); pad('cuerdas',9.36,12.2,MAY,46,3); r('cuerdas',9.36,12.1,40,105); arp(9.36,12.2,MAY,52)
roll(11.2,1.0,'C#2',30,112,20)
n('timbal','F#2',12.22,0.7,124); n('taiko','C2',12.22,0.7,116)
for x in ['F#3','A#3','C#4','F#4']: n('cuerdas',x,12.22,1.1,92); n('coro',x,12.22,1.1,76); n('trompas',N(x)-12,12.22,1.1,80)
n('cb','F#1',12.22,1.1,80)
# ---------- "Sí, escuchaste bien" → ¡Cinco! ----------
n('celesta','C#6',13.43,0.5,50); n('celesta','F#6',13.91,0.5,50)
n('timbal','F#2',14.86,0.6,120); n('taiko','C2',14.86,0.6,110)
for x in ['F#3','A#3','C#4']: n('trompas',x,14.86,0.7,82); n('cuerdas',N(x)+12,14.86,0.7,86)
# ---------- "Y se pone mejor" ----------
roll(15.3,1.4,'C#2',30,110,22); n('violines','C#6',15.4,1.3,50); r('violines',15.4,16.6,40,110)
# ---------- OFERTAS 16.8–26.4 (groove) ----------
bass(16.76,26.4,MAY,60); pad('cuerdas',16.76,26.4,MAY,50,3); arp(16.76,26.4,MAY,56); ostinato(16.76,26.4,MAY,46,66,Q/2)
for t in np.arange(16.76,26.3,BAR/2): n('taiko','C2',t,0.3,64)
for t in [18.78,20.78,23.55]: n('timbal','F#2',t,0.5,112); n('trompas','C#4',t,0.8,78); n('trompas','F#3',t,0.8,74)
for k,p in enumerate(['F#6','A#6','C#7']): n('celesta',p,24.86+k*0.09,0.4,58)
motif('violines',21.6,MOT_M,0,60)
# ---------- URGENCIA 27–33.6 (reloj) ----------
for k,t in enumerate(np.arange(26.99,32.2,Q/2)): n('pizz','C#6' if k%2==0 else 'G#5',t,0.07,52+k*0.6)
n('trem','F#3',27.0,5.2,40); r('trem',27.0,32.2,40,115); n('trem','A3',27.0,5.2,38); n('cb','F#1',27.0,5.2,56); r('cb',27.0,32.2,50,105)
roll(31.2,1.05,'C#2',30,112,20)
n('timbal','F#2',32.28,0.5,124); n('taiko','C2',32.28,0.5,112)
for x in ['F#3','A3','C#4']: n('cuerdas',x,32.28,1.2,90); n('trompas',N(x)-12,32.28,1.2,82)
n('piano','F#2',33.55,1.2,70); n('piano','C#3',33.55,1.2,60)
# ---------- CONTRASTE 34.3–40.3 (inspira) ----------
bass(34.3,40.4,MAY,58); pad('cuerdas',34.3,40.4,MAY,52,4); pad('coro',35.6,40.4,MAY,44,4); r('coro',35.6,40.4,30,100)
arp(34.3,40.4,MAY,54); motif('violines',34.3,MOT_M,12,66); r('violines',34.3,40.3,50,110)
for t in np.arange(36.2,40.3,BAR/2): n('taiko','C2',t,0.3,66)
n('timbal','F#2',36.9,0.5,104)
# ---------- CTA 41–43.1 IV–V–I y cola ----------
for t,d,(rt,ch) in [(41.0,0.72,('B1',['B','D#','F#'])),(41.72,0.71,('C#2',['C#','E#','G#']))]:
    for x in ch: n('cuerdas',N(x+'4'),t,d,90); n('coro',N(x+'4'),t,d,76); n('trompas',N(x+'3'),t,d,76)
    n('chelo',N(rt)+12,t,d,84); n('cb',rt,t,d,80)
n('timbal','F#2',42.43,0.9,118); n('taiko','C2',42.43,0.9,106)
for x in ['F#3','A#3','C#4','F#4']: n('cuerdas',x,42.43,2.6,92); n('coro',x,42.43,2.6,78); n('organo',N(x)-12,42.43,2.6,46)
n('cb','F#1',42.43,2.6,80); n('chelo','F#2',42.43,2.6,76); n('celesta','F#6',42.5,1.2,56); n('celesta','C#7',42.9,1.4,52)
for k in ['cuerdas','coro','organo','cb','chelo']: r(k,43.4,44.6,110,0)
SUBS=[(2.0,1.2,0.26),(4.39,0.9,0.14),(12.22,1.5,0.24),(14.86,1.0,0.18),(32.28,1.0,0.18),(42.43,2.4,0.2)]

def bus_fx(x):
    x=x.copy(); f=int(0.05*SR)
    for a,b,g in [(1.88,2.0,0.06),(13.3,13.42,0.4),(33.45,33.55,0.25),(44.6,46.5,1.0)]:
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
