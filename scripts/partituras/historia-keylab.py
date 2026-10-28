"""
Partitura emocional · Historia de Key Lab (voz Arconte, 202.7 s). Composición original sobre el motivo de "Órbita".
Habilidad: partitura-emocional-reels. Instrumentos reales sampleados (MuseScore General). Fa# menor → Fa# mayor.

MAPA DEL GUION COMO CANCIÓN (segundos de la voz)
   0.0  ORIGEN       "Todo empezó…" piano solo con el motivo, mucho aire; sub suave            (íntimo, curiosidad)
  19.2  CRECE        "Pronto los dos empezaron a crecer" entra chelo + contrabajo; Race = calidez
  36.5  CURIOSO      "Crypto Depto… tokenización" tics de celesta + pizzicato, cuerdas lentas
  52.5  APRENDER     "Ulises se metió de lleno…" arpa en corcheas, cuerdas que crecen, violines con el motivo
  77.2  BUILD        "Sebastián dominó…" suben las cuerdas, redoble suave hacia 89.9
  89.9  TENSIÓN      "Vulcano…" se vacía: latido de timbal + violín agudo en trémolo, menor oscuro
 104.6  DOWN         "y Vulcano desapareció del mapa" pizz que cae + caída
 107.0  VACÍO        silencio real con cola corta de reverb
 108.0  EY           golpe de entrada (timbal + taiko + sub)
 108.6  ESPERANZA    "empezaron algo propio" pasa a Fa# MAYOR: arpa + cuerdas suaves + piano
 126.4  OSTINATO     "Blockenfy…" entra el chelo corto épico en corcheas, crece de a poco
 141.8  UP           "Ellos querían algo más" trompas + taiko; el chelo sube
 151.7  ÉPICO        "Por eso… Key Lab" chelo corto en semicorcheas, coro, violines con el motivo en mayor, redoble hacia 177.5
 177.5  CLÍMAX       "Hoy Key Lab…" orquesta completa + órgano de colchón
 188.0  RESPIRO      "Key Lab no es el primero…" baja a piano + cuerdas (silencio antes del remate)
 196.7  CRECE FINAL  "Codo a codo…" swell + redoble; IV–V (Si → Do#)
 200.7  RESUELVE     "Key Lab es el futuro." I (Fa# mayor) sobre el logo y se apaga hasta 208
"""
import os, sys, subprocess, numpy as np, pretty_midi as pm
from pedalboard import Pedalboard, Reverb, Delay, Compressor, Limiter, Gain, HighpassFilter, PeakFilter, HighShelfFilter
from pedalboard.io import AudioFile
OUT=sys.argv[1] if len(sys.argv)>1 else 'public/media/historia-keylab/partitura.wav'
TMP='/tmp/part-historia'; os.makedirs(TMP,exist_ok=True)
SF='/usr/share/sounds/sf3/MuseScore_General_Full.sf3'; SR=44100; END=206.4
N=pm.note_name_to_number; stems={}
def inst(k,prog):
    if k not in stems: stems[k]=pm.Instrument(program=prog,name=k)
    return stems[k]
CUT0, CUT1 = 107.3, 108.93
def R(t):
    return t if t < CUT0 else (None if t < CUT1 else t - (CUT1 - CUT0))
def note(k,prog,p,t,d,v=70):
    t2 = R(t)
    if t2 is None: return
    if t < CUT0 and t + d > CUT0: d = CUT0 - t + 0.4
    t = t2
    inst(k,prog).notes.append(pm.Note(velocity=int(np.clip(v,1,127)),pitch=N(p) if isinstance(p,str) else int(p),start=t,end=max(t+0.05,t+d)))
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

# ORIGEN 0–19.2
motif('piano',0.3,MOT_m,0,58)
for t,d,(rt,ch) in chords(0.3,19.2,MIN):
    n('piano',N(rt)+12,t,d,44)
    for j,x in enumerate(ch): n('piano',N(x+'3'),t+Q*(0.5+j*0.5),d-Q*(0.5+j*0.5),34)
motif('piano',10.7,MOT_m[:2],0,52)
# CRECE 19.2–36.5
bass(19.2,36.5,MIN2,60); r('chelo',19.2,24,30,90); r('cb',19.2,24,30,85)
pad('cuerdas',24.4,36.5,MIN2,46,4); r('cuerdas',24.4,30,20,75)
motif('piano',19.4,MOT_m,0,55)
# CURIOSO 36.5–52.5
bass(36.5,52.5,MIN,62); pad('cuerdas',36.5,52.5,MIN,50,4)
for t in [37.0,39.6,42.2,44.8,47.4,50.0]:
    for j,p in enumerate(['C#6','F#6','E6']): n('celesta',p,t+j*Q,Q*0.9,56)
for t in np.arange(43.0,52.4,Q): n('pizz',['F#3','C#4','A3','C#4'][int((t-43)/Q)%4],t,Q*0.5,48)
# APRENDER 52.5–89.9
bass(52.5,89.9,MIN2+MIN,68); pad('cuerdas',52.5,89.9,MIN2+MIN,56,4); arp(52.5,89.9,MIN2+MIN,52)
r('cuerdas',52.5,89.9,45,105); r('arpa',52.5,60,40,95)
motif('violines',62.9,MOT_m,0,66); motif('violines',77.2,MOT_m,12,74); r('violines',62.9,89.9,55,105)
pad('coro',77.2,89.9,MIN,40,4); r('coro',77.2,89.9,20,80)
roll(87.4,2.4,'C#2',30,95)
# TENSIÓN 89.9–107
for t in np.arange(89.9,104.6,0.9): n('timbal','F#2',t,0.2,62); n('timbal','F#2',t+0.22,0.15,44)
n('trem','F#5',89.9,14.7,55); r('trem',89.9,104.6,30,95)
n('cb','F#1',89.9,14.7,58); n('chelo','C#3',95.0,9.6,48); r('chelo',95,104.6,40,85)
for k,p in enumerate(['C#5','A4','F#4','C#4','F#3']): n('pizz',p,104.7+0.18*k,0.25,72-8*k)
n('cuerdas','F#3',104.7,2.55,46); n('cuerdas','A3',104.7,2.55,46); n('cuerdas','C#4',104.7,2.55,46); r('cuerdas',104.7,107.2,60,70)
roll(106.2,1.0,'C#2',25,85,16)  # puente sin vacío hacia la parte mayor
n('cb','C#1',106.0,1.2,60)
# EY 108.0
n('timbal','F#2',108.0,0.7,127); n('taiko','C2',108.0,0.7,112)
# ESPERANZA 108.6–126.4 (mayor)
bass(108.6,126.4,MAY,64); pad('cuerdas',108.6,126.4,MAY,52,4); arp(108.93,126.4,MAY,50); r('cuerdas',108.6,126.4,40,85)
motif('piano',108.93,MOT_M,0,58); motif('piano',119.6,MOT_M[:2],0,54)
# OSTINATO 126.4–151.7
bass(126.4,151.7,MAY+MAY[:2]+MIN2[2:],70); pad('cuerdas',126.4,151.7,MAY+MAY[:2]+MIN2[2:],58,4)
ostinato(126.4,151.7,MAY+MAY[:2]+MIN2[2:],45,80,Q/2)
motif('violines',131.6,MOT_M,0,70); r('violines',131.6,151.7,60,100)
for t,(rt,ch) in [(141.8,MAY[0])]:
    n('taiko','C2',t,0.8,110); n('timbal','F#2',t,0.6,110)
    for x in ch: n('trompas',N(x+'3'),t,2.4,90)
roll(149.2,2.4,'C#2',35,110)
# ÉPICO 151.7–177.5
PE=MAY+MAY
bass(151.7,177.5,PE,84); pad('cuerdas',151.7,177.5,PE,72,4); pad('coro',151.7,177.5,PE,62,4); arp(151.7,177.5,PE,62)
ostinato(151.7,177.5,PE,80,112,Q/4)
motif('violines',151.9,MOT_M,12,92); motif('violines',162.3,MOT_M,12,98); motif('trompas',162.3,MOT_M,-12,80)
r('coro',151.7,177.5,50,110); r('cuerdas',151.7,177.5,70,115)
for t in np.arange(151.7,177.4,BAR): n('timbal','F#2',t,0.3,82)
roll(175.0,2.5,'C#2',45,125)
# CLÍMAX 177.5–188
for t,d,(rt,ch) in chords(177.5,188.0,MAY):
    for x in ch:
        n('cuerdas',N(x+'4'),t,d,100); n('coro',N(x+'4'),t,d,90); n('trompas',N(x+'3'),t,d,85); n('organo',N(x+'3'),t,d,50)
    n('chelo',N(rt)+12,t,d,100); n('cb',rt,t,d,95); n('timbal','F#2',t,0.4,105)
motif('violines',177.5,MOT_M,12,105)
ostinato(177.5,187.6,MAY,110,118,Q/4)
# RESPIRO 188–196.7
motif('piano',189.2,MOT_M[:2],0,60)
pad('cuerdas',188.6,196.7,MAY[:3],50,4); r('cuerdas',188.6,196.7,40,80); n('cb','F#1',188.6,8.0,52)
# CRECE FINAL 196.7–200.7: IV–V con orquesta + redoble
roll(197.0,3.6,'C#2',40,124,32)
for t,d,(rt,ch) in [(196.7,2.0,('B1',['B','D#','F#'])),(198.7,2.0,('C#2',['C#','E#','G#']))]:
    for x in ch: n('cuerdas',N(x+'4'),t,d,105); n('coro',N(x+'4'),t,d,95); n('trompas',N(x+'3'),t,d,95); n('organo',N(x+'3'),t,d,55)
    n('chelo',N(rt)+12,t,d,105); n('cb',rt,t,d,100)
ostinato(196.7,200.7,[('B1',['B','D#','F#']),('C#2',['C#','E#','G#'])],95,124,Q/4)
# RESUELVE 200.7
I=['F#3','A#3','C#4','F#4']
n('timbal','F#2',200.7,0.8,120); n('taiko','C2',200.7,0.8,105)
for x in I: n('cuerdas',x,200.7,7.0,105); n('coro',x,200.7,6.5,92); n('organo',N(x)-12,200.7,7.0,55)
for x in ['F#2','C#3','F#3']: n('trompas',x,200.7,4.0,95)
n('cb','F#1',200.7,7.0,95); n('chelo','F#2',200.7,7.0,90)
n('piano','C#5',201.0,1.0,58); n('piano','F#5',201.8,5.0,56)
for k in ['cuerdas','coro','organo','cb','chelo']: r(k,202.3,208.0,110,0)

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
s=sum(sub(a,b,70,46.25,c) for a,b,c in [(0.3,4,0.06),(141.8-1.63,2,0.22),(151.7-1.63,2,0.22),(177.5-1.63,3,0.28),(200.7-1.63,6,0.3)])
hits+=s.astype(np.float32)
# VACÍO 107.0→108.0
np.save(f'{TMP}/hits.npy',hits)
music=mix+hits
music=Pedalboard([Compressor(threshold_db=-18,ratio=2.5),Limiter(threshold_db=-1)])(music,SR)
with AudioFile(OUT,'w',SR,2) as f: f.write(music)
with AudioFile(OUT.replace('.wav','-sinhits.wav'),'w',SR,2) as f: f.write(mix)
print('ok',OUT, ' '.join(f'{s}:{20*np.log10(np.sqrt((music[:,int(s*SR):int((s+1)*SR)]**2).mean())+1e-9):.0f}' for s in range(0,int(END),4)))
