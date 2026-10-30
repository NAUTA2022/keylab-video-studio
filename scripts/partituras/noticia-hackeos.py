"""Partitura emocional · Noticia hackeos (Binance + PHP), voz Martin Osborne 97.8 s.
Hook amarillista (trémolo + taiko + trompas) → caída en el mercado → tensión tic-tac (PHP) → apagón (tape-stop)
→ "No." golpe y silencio → explicación (piano + cuerdas) → vacío → EY → Fa# mayor esperanza (arpa, celesta)
→ bajón breve (¿y si te hackean el celular?) → verificación sube → clímax Key Lab (orquesta + coro) → IV–V–I en el CTA."""
import os, sys, subprocess, numpy as np, pretty_midi as pm
from pedalboard import Pedalboard, Reverb, Delay, Compressor, Limiter, Gain, HighpassFilter, PeakFilter, HighShelfFilter
from pedalboard.io import AudioFile
OUT=sys.argv[1] if len(sys.argv)>1 else 'public/media/noticia-hackeos/partitura.wav'
TMP='/tmp/part-hackeos'; os.makedirs(TMP,exist_ok=True)
SF='/usr/share/sounds/sf3/MuseScore_General_Full.sf3'; SR=44100; END=104.0
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

# ---------- HOOK amarillista 0–12 ----------
n('trem','F#2',0.0,12.0,70); r('trem',0.0,12.0,40,110)
n('cb','F#1',0.0,12.0,70); r('cb',0.0,12.0,50,100)
for t in [1.39,3.56,5.29]:                     # hackearon / seis mil millones / robo más grande
    n('taiko','C2',t,0.8,120); n('timbal','F#2',t,0.6,115)
    for x in ['F#3','C#4','F#4']: n('trompas',x,t,1.2,95)
for t in np.arange(1.39,7.8,Q/2): n('chcorto','F#3' if int((t-1.39)/(Q/2))%4 else 'F#4',t,Q*0.22,78)
roll(6.2,1.6,'C#2',40,110)
for t,p in [(8.03,'C#4'),(9.29,'A3'),(10.53,'F#3'),(11.53,'C#3')]:   # retiros, bitcoin, acciones en rojo: cae
    n('taiko','C2',t,0.6,105); n('trompas',p,t,0.9,92); n('cuerdas',p,t,0.9,80)
for k,p in enumerate(['C#5','A4','F#4','C#4','A3','F#3']): n('pizz',p,11.6+0.12*k,0.2,80-6*k)
# ---------- PHP 12–31.6 tensión que crece ----------
for t in np.arange(13.97,31.5,0.75): n('timbal','F#2',t,0.18,58); n('timbal','F#2',t+0.2,0.12,40)
n('trem','C#6',13.97,17.6,50); r('trem',13.97,31.5,30,100)
pad('cuerdas',13.97,31.5,MIN,44,3); r('cuerdas',13.97,31.5,30,95)
for t in np.arange(14.0,24.2,Q): n('celesta',['F#6','C#6','A5','C#6'][int((t-14)/Q)%4],t,Q*0.4,44)   # tic tac
for t in [18.5,24.73,26.81,29.34]:              # pe hache pe / gobiernos / wikipedia / millones de ataques
    n('taiko','C2',t,0.8,112); n('timbal','F#2',t,0.6,108)
    for x in ['F#2','C#3']: n('trompas',x,t,1.0,88)
n('cb','F#1',13.97,17.6,64); n('chelo','C#3',20.0,11.5,56); r('chelo',20,31.5,40,95)
roll(29.6,1.9,'C#2',40,118)
# ---------- ¿Se rompió la blockchain? No. 32–34.4 ----------
n('violines','C#6',32.06,1.6,70); n('violines','F#6',32.06,1.6,60)
n('taiko','C2',33.73,0.8,118); n('timbal','F#2',33.73,0.6,110)
# ---------- explicación 34.4–48 ----------
bass(34.4,47.9,MIN2,58); pad('cuerdas',34.4,47.9,MIN2,48,4); r('cuerdas',34.4,47.9,35,90)
motif('piano',34.6,MOT_m,0,56)
for t in [42.52,43.32,44.01]:                  # proveedores, servidores, servicios
    n('celesta','C#6',t,0.4,70); n('pizz','F#4',t,0.3,72)
n('trem','F#5',45.56,2.4,60); r('trem',45.56,47.9,40,110)
roll(46.0,1.9,'C#2',45,124)
# ---------- EY 48.27 ----------
n('timbal','F#2',48.27,0.7,127); n('taiko','C2',48.27,0.7,115)
# ---------- ESPERANZA en mayor 49–71.3 ----------
bass(49.0,71.3,MAY,64); pad('cuerdas',49.0,71.3,MAY,50,4); r('cuerdas',49,71.3,40,92)
arp(49.0,71.3,MAY,52); r('arpa',49,56,40,90)
motif('piano',49.1,MOT_M,0,60); motif('violines',59.5,MOT_M,0,66); r('violines',59.5,71.3,50,95)
for t in [55.31,57.2,62.4]: n('celesta','F#6',t,0.5,58); n('celesta','C#6',t+Q,0.5,52)    # autocustodia, token
pad('coro',65.0,71.3,MAY,40,4); r('coro',65,71.3,20,80)
for t in [67.87,69.43,70.2]: n('celesta','A#6',t,0.4,60)                                  # contrato que reparte
# ---------- ¿Y si te hackean el celular? 71.6–73.9 (bajón breve) ----------
for k,p in enumerate(['A#4','F#4','C#4','A#3']): n('pizz',p,71.68+0.15*k,0.22,72-6*k)
n('cb','F#1',71.68,2.2,62); n('timbal','F#2',72.4,0.2,60); n('timbal','F#2',73.1,0.2,60)
# ---------- verificación 73.9–80.6: vuelve a subir ----------
bass(73.9,80.6,MAY,70); pad('cuerdas',73.9,80.6,MAY,60,4); arp(73.9,80.6,MAY,58)
for t in [77.61,78.75]: n('taiko','C2',t,0.6,95); n('celesta','F#6',t,0.5,70); n('celesta','C#7',t+0.12,0.5,62)
# ---------- KEY LAB clímax 80.6–92.2 ----------
PE=MAY+MAY
bass(80.6,92.2,PE,84); pad('cuerdas',80.6,92.2,PE,72,4); pad('coro',80.6,92.2,PE,62,4); arp(80.6,92.2,PE,62)
ostinato(80.6,92.2,PE,80,112,Q/4)
motif('violines',80.8,MOT_M,12,92); motif('trompas',80.8,MOT_M,-12,78)
r('coro',80.6,92.2,50,110); r('cuerdas',80.6,92.2,70,115)
roll(85.6,1.8,'C#2',45,125)
for t in [87.43,90.02,91.17]:                   # revolución / te actualizas / te hackean
    n('taiko','C2',t,0.8,124); n('timbal','F#2',t,0.6,120)
    for x in ['F#2','C#3','F#3']: n('trompas',x,t,1.4,100)
# ---------- CTA IV–V–I 92.2–104 ----------
for t,d,(rt,ch) in [(92.2,1.9,('B1',['B','D#','F#'])),(94.1,1.95,('C#2',['C#','E#','G#']))]:
    for x in ch: n('cuerdas',N(x+'4'),t,d,100); n('coro',N(x+'4'),t,d,90); n('trompas',N(x+'3'),t,d,90); n('organo',N(x+'3'),t,d,50)
    n('chelo',N(rt)+12,t,d,100); n('cb',rt,t,d,95)
roll(94.6,1.4,'C#2',50,124,20)
I=['F#3','A#3','C#4','F#4']
n('timbal','F#2',96.05,0.8,122); n('taiko','C2',96.05,0.8,110)
for x in I: n('cuerdas',x,96.05,7.5,105); n('coro',x,96.05,7.0,92); n('organo',N(x)-12,96.05,7.5,55)
for x in ['F#2','C#3','F#3']: n('trompas',x,96.05,4.0,95)
n('cb','F#1',96.05,7.5,95); n('chelo','F#2',96.05,7.5,90)
n('piano','C#5',96.4,1.0,58); n('piano','F#5',97.2,5.0,56)
for k in ['cuerdas','coro','organo','cb','chelo']: r(k,98.5,103.5,110,0)
SUBS=[(1.39,2,0.22),(3.56,2,0.2),(18.5,1.5,0.16),(33.73,2,0.22),(48.27,2.5,0.3),(87.43,3,0.28),(96.05,6,0.3)]

def bus_fx(x):
    x=x.copy()
    # apagón (tape-stop) cuando "gobiernos apagaron sus sitios"
    a=int(26.25*SR); L=int(0.55*SR); seg=x[:,a:a+L]
    sp=np.linspace(1,0.05,L); pos=np.cumsum(sp); pos=np.clip(pos,0,L-1)
    for c in range(2): x[c,a:a+L]=np.interp(pos,np.arange(L),seg[c])*np.linspace(1,0,L)**0.5
    x[:,a+L:int(26.75*SR)]=0
    # vacío antes del Ey: caída de 70 ms y silencio
    v0=int(47.9*SR); f=int(0.07*SR); x[:,v0:v0+f]*=np.linspace(1,0,f); x[:,v0+f:int(48.25*SR)]*=0.04
    # silencio corto después de "No."
    s0=int(34.05*SR); x[:,s0:s0+f]*=np.linspace(1,0.15,f); x[:,s0+f:int(34.35*SR)]*=0.15
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
