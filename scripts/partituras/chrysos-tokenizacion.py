"""Partitura · Key Lab x Chrysós: piloto de tokenización de oro laminado (voz 64.7 s + cierre).
Hook curioso/cómico → vacío → EY → construcción luminosa en mayor (Chrysós = brillo) → honesto (piloto) →
proceso en tres pasos (ostinato que crece) → cifras (ups) → referido juguetón → clímax hermoso → CTA IV–V–I."""
import os, sys, subprocess, numpy as np, pretty_midi as pm
from pedalboard import Pedalboard, Reverb, Delay, Compressor, Limiter, Gain, HighpassFilter, PeakFilter, HighShelfFilter
from pedalboard.io import AudioFile
OUT=sys.argv[1] if len(sys.argv)>1 else 'public/media/chrysos-video/partitura.wav'
TMP='/tmp/part-chrysos'; os.makedirs(TMP,exist_ok=True)
SF='/usr/share/sounds/sf3/MuseScore_General_Full.sf3'; SR=44100; END=69.0
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


# ---------- HOOK 0–5.85: curioso y burlón (pizz que se enreda) → vacío → EY ----------
n('cb','F#1',0.0,5.6,58); r('cb',0.0,5.6,40,90)
for k,t in enumerate(np.arange(0.2,3.9,Q/2)): n('pizz',['F#4','A4','C#5','A4','G#4','B4','D5','B4'][k%8],t,Q*0.3,62+k)
for t in [1.98,2.25,2.53]: n('pizz','C#5',t,0.12,88)                 # tres pe de efes
n('trompas','F#2',3.24,0.6,80); n('trompas','G2',3.5,0.5,70)           # una flecha (wah)
n('trem','C#4',4.28,1.4,50); r('trem',4.28,5.6,30,110); n('violines','F#5',4.9,0.7,70)
roll(4.3,1.25,'C#2',35,112,18)
# ---------- EY 5.85 ----------
n('timbal','F#2',5.85,0.7,127); n('taiko','C2',5.85,0.7,115)
# ---------- KEY LAB + oro 6.9–16.8: mayor luminoso, crece hacia Chrysós ----------
bass(6.9,16.8,MAY,58); pad('cuerdas',6.9,16.8,MAY,46,4); r('cuerdas',6.9,16.8,30,92)
motif('piano',6.95,MOT_M,0,58)
for t in [8.47,10.75]: n('celesta','F#6',t,0.5,60); n('celesta','C#7',t+0.12,0.5,52)    # tres mil dólares / oro laminado
n('trem','F#5',12.2,2.3,50); r('trem',12.2,14.45,30,110); roll(12.6,1.85,'C#2',35,118,22)
n('timbal','F#2',14.47,0.7,120); n('taiko','C2',14.47,0.7,105)                          # CHRYSÓS
for x in ['F#3','A#3','C#4','F#4']: n('coro',x,14.47,2.3,80)
for x in ['F#2','C#3','F#3']: n('trompas',x,14.47,1.6,92)
for k,p in enumerate(['C#6','F#6','A#6','C#7']): n('celesta',p,14.5+0.1*k,0.8,62)
arp(14.47,16.8,MAY,55)
# ---------- honesto: piloto 16.8–26.0 (down, íntimo) ----------
n('piano','F#4',16.85,2.4,54); n('piano','A#4',16.85,2.4,48); n('piano','C#5',17.6,1.8,50)
n('chelo','F#2',16.85,9.0,52); r('chelo',16.85,26.0,40,80)
pad('cuerdas',18.6,26.0,MAY,40,4); r('cuerdas',18.6,26.0,25,70)
for t in [19.05,21.99,24.9]: n('celesta','A#6',t,0.4,48)                                 # piloto / comunidad / tokenización
# ---------- proceso 26–37.65: ostinato que crece, golpe en cada paso ----------
ostinato(26.0,37.65,MAY,55,95,Q/4); bass(26.0,37.65,MAY,62); pad('cuerdas',26.0,37.65,MAY,50,4); r('cuerdas',26,37.65,40,100)
for t in [27.95,32.65,35.86]:                                                              # diciembre / compramos / enero
    n('taiko','C2',t,0.7,100); n('timbal','F#2',t,0.5,96)
    for x in ['F#3','C#4']: n('trompas',x,t,1.0,82)
n('violines','C#6',35.86,1.8,72)
# ---------- cifras 37.85–49.73: ups ----------
bass(37.85,49.73,MAY,70); pad('cuerdas',37.85,49.73,MAY,60,4); arp(37.85,49.73,MAY,58)
motif('violines',37.9,MOT_M,0,70); r('violines',37.9,49.7,55,100)
for t in [38.9,43.7,48.85]:                                                                # 30 % / 20 % / sin vencimiento
    n('taiko','C2',t,0.8,112); n('timbal','F#2',t,0.6,110)
    for x in ['F#2','C#3','F#3','A#3']: n('trompas',x,t,1.6,96)
pad('coro',43.7,49.73,MAY,44,4); r('coro',43.7,49.73,30,92)
# ---------- referido 49.9–56.6: juguetón ----------
for k,t in enumerate(np.arange(49.95,53.6,Q/2)): n('pizz',['F#4','C#5','A#4','C#5','D#5','C#5','A#4','F#4'][k%8],t,Q*0.3,70)
bass(49.9,56.6,MAY,58); n('cuerdas','F#4',49.9,6.6,44)
n('timbal','F#2',54.33,0.6,118); n('taiko','C2',54.33,0.6,108)                            # +5 %
for k,p in enumerate(['F#6','A#6','C#7']): n('celesta',p,54.35+0.09*k,0.6,66)
# ---------- clímax 56.75–61.7: Tu token. Tu parte del oro. Cada paso a la vista ----------
PE=MAY+MAY
bass(56.75,61.7,PE,84); pad('cuerdas',56.75,61.7,PE,74,4); pad('coro',56.75,61.7,PE,64,4); arp(56.75,61.7,PE,62)
motif('violines',56.8,MOT_M,12,90); motif('trompas',56.8,MOT_M,-12,76)
for t in [56.75,58.03,59.9]: n('taiko','C2',t,0.8,122); n('timbal','F#2',t,0.6,118)
# ---------- CTA IV–V–I 61.78–69 ----------
for t,d,(rt,ch) in [(61.78,1.4,('B1',['B','D#','F#'])),(63.18,1.35,('C#2',['C#','E#','G#']))]:
    for x in ch: n('cuerdas',N(x+'4'),t,d,96); n('coro',N(x+'4'),t,d,86); n('trompas',N(x+'3'),t,d,86)
    n('chelo',N(rt)+12,t,d,96); n('cb',rt,t,d,92)
I=['F#3','A#3','C#4','F#4']
n('timbal','F#2',64.55,0.8,122); n('taiko','C2',64.55,0.8,110)
for x in I: n('cuerdas',x,64.55,4.4,104); n('coro',x,64.55,4.2,90); n('organo',N(x)-12,64.55,4.4,55)
for x in ['F#2','C#3','F#3']: n('trompas',x,64.55,3.2,92)
n('cb','F#1',64.55,4.4,95); n('chelo','F#2',64.55,4.4,90); n('piano','F#5',65.0,3.5,56)
for k in ['cuerdas','coro','organo','cb','chelo','trompas']: r(k,66.3,68.9,110,0)
SUBS=[(5.85,2.5,0.3),(14.47,2.5,0.26),(38.9,1.6,0.18),(43.7,1.6,0.18),(56.75,2,0.22),(64.55,4,0.28)]

def bus_fx(x):
    x=x.copy()
    v0=int(5.62*SR); f=int(0.07*SR); x[:,v0:v0+f]*=np.linspace(1,0,f); x[:,v0+f:int(5.84*SR)]*=0.04   # vacío antes del Ey
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
