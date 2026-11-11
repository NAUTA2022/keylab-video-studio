"""Mezcla Altius VSL: voz (−14 LUFS), partitura con ducking y EQ, efectos sintetizados (whoosh, pop, clic, riser, impacto)."""
import numpy as np, subprocess, json
from pedalboard import Pedalboard, Compressor, HighpassFilter, LowpassFilter, PeakFilter, HighShelfFilter, Limiter, Reverb, Gain
from pedalboard.io import AudioFile
SR=44100; D='public/media/altius/'; END=116.6
rng=np.random.default_rng(3)
def load(p):
    with AudioFile(p).resampled_to(SR) as f: a=f.read(f.frames)
    return np.vstack([a,a]) if a.shape[0]==1 else a
n=int(END*SR)
def fit(x): return np.pad(x,((0,0),(0,max(0,n-x.shape[1]))))[:,:n].astype(np.float32)
v=fit(load(D+'voz.wav')); m=fit(load(D+'partitura.wav'))
v=Pedalboard([HighpassFilter(80),PeakFilter(250,-2,1.0),PeakFilter(3000,2.5,1.0),HighShelfFilter(9000,2),Compressor(threshold_db=-24,ratio=3,attack_ms=5,release_ms=120),Gain(4)])(v,SR)
m=Pedalboard([HighpassFilter(55),PeakFilter(3000,-3.5,0.8),PeakFilter(250,-1.5,1.0)])(m,SR)
def rms(x): return np.sqrt((x**2).mean()+1e-12)
vact=v[:,np.abs(v[0])>1e-3]
v*=0.14/rms(vact); m*=(0.14*10**(-5/20))/rms(m)
# ducking: la música sube 3–4 dB en vacíos sin voz
e=np.abs(v[0]); win=int(0.08*SR); env=np.convolve(e,np.ones(win)/win,'same'); env=np.convolve(env,np.ones(int(0.4*SR))/int(0.4*SR),'same')
act=np.clip(env/(np.percentile(env[env>1e-4],50)+1e-9),0,1)
g=10**((-6.0*act)/20)   # 0 dB en vacíos, −6 dB bajo la voz
t=np.arange(n)/SR
lift=np.interp(t,[0,11.8,12.0,93.3,93.5,94.2,94.6,113.0,113.4,END],[0,0,-2,-2,-6,-6,0,0,4,4])
m*=g*10**(lift/20)
# ---------------- efectos ----------------
def env_ad(N,a,d): x=np.arange(N)/SR; return np.clip(x/a,0,1)*np.exp(-np.maximum(0,x-a)/d)
def whoosh(dur=0.5):
    N=int(dur*SR); x=rng.standard_normal(N); out=np.zeros(N); f=np.linspace(400,3500,N)**1; y=0
    # filtro paso banda móvil sencillo
    from scipy.signal import butter, sosfilt
    segs=8; L=N//segs
    for k in range(segs):
        sos=butter(2,[max(80,f[k*L]*0.5),min(9000,f[k*L]*1.6)],btype='band',fs=SR,output='sos'); out[k*L:(k+1)*L]=sosfilt(sos,x[k*L:(k+1)*L])
    w=np.sin(np.linspace(0,np.pi,N))**1.5; return out*w
def pop():
    N=int(0.12*SR); x=np.arange(N)/SR; f=900*np.exp(-x*30)+380; return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-x*38)
def click():
    N=int(0.03*SR); x=np.arange(N)/SR; return (rng.standard_normal(N)*0.5+np.sin(2*np.pi*2600*x))*np.exp(-x*400)
def riser(dur=1.0):
    N=int(dur*SR); x=np.arange(N)/SR; f=200+1800*(x/dur)**2
    tone=np.sin(2*np.pi*np.cumsum(f)/SR)*0.4+rng.standard_normal(N)*0.6*(x/dur)
    from scipy.signal import butter, sosfilt
    tone=sosfilt(butter(2,300,btype='high',fs=SR,output='sos'),tone); return tone*(x/dur)**2.2
def impact(big=True):
    N=int(2.2*SR); x=np.arange(N)/SR; f=45+80*np.exp(-x*12)
    sub=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-x*(1.6 if big else 3))
    hit=rng.standard_normal(N)*np.exp(-x*(18 if big else 30))
    from scipy.signal import butter, sosfilt
    hit=sosfilt(butter(2,2500,btype='low',fs=SR,output='sos'),hit)
    return sub*1.0+hit*0.6
def crash():
    N=int(0.6*SR); x=np.arange(N)/SR; return rng.standard_normal(N)*np.exp(-x*7)*0.6+np.sin(2*np.pi*140*x)*np.exp(-x*12)*0.5
fx=np.zeros((2,n),np.float32)
def put(sig,t0,db,pan=0.0,rev=False,anchor_end=False):
    s=sig/ (np.max(np.abs(sig))+1e-9) * 10**(db/20)
    a=np.vstack([s*(1-max(0,pan)),s*(1+min(0,pan))]).astype(np.float32)
    if rev: a=Pedalboard([Reverb(room_size=0.85,wet_level=0.35,dry_level=0.8)])(a,SR)
    i=int((t0-(a.shape[1]/SR if anchor_end else 0))*SR); j=min(n,i+a.shape[1])
    if i<0: a=a[:,-i:]; i=0
    fx[:,i:j]+=a[:,:j-i]
W=[4.1,7.85,29.55,34.45,40.0,52.05,55.7,56.5,61.2,66.15,71.9,74.95,76.45,80.5,88.55,92.9,93.85,97.2,113.0]
for k,tt in enumerate(W): put(whoosh(0.45),tt-0.2,-17,pan=(0.25 if k%2 else -0.25))
P=[8.3,9.4,10.3,11.38,17.28,19.84,22.6,29.75,30.6,31.9,41.92,42.82,43.5,44.74,47.16,48.48,51.26,55.4,70.02,70.3,70.96,72.4,74.12,81.34,83.66,85.14,86.76,104.16,106.42]
for tt in P: put(pop(),tt,-20)
for tt in [69.12,70.02,70.96]: put(click(),tt,-16)
put(crash(),33.1,-19,rev=True)
put(riser(1.0),94.2,-16,anchor_end=True); put(riser(0.8),102.4,-17,anchor_end=True); put(riser(0.6),75.0,-19,anchor_end=True)
put(impact(True),94.2,-12,rev=True); put(impact(True),102.4,-12,rev=True)
for tt in [36.5,75.0,111.5]: put(impact(False),tt,-17,rev=True)
out=v+m+fx
out=Pedalboard([Limiter(threshold_db=-1.5)])(out,SR)
with AudioFile('/tmp/altius-mezcla.wav','w',SR,2) as f: f.write(out)
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','/tmp/altius-mezcla.wav','-af','loudnorm=I=-14:TP=-1.0:LRA=11','-ar','48000','-c:a','pcm_s16le',D+'mezcla.wav'],check=True)
print('ok')
