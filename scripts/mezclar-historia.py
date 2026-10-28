import numpy as np, subprocess
from pedalboard import Pedalboard, Compressor, HighpassFilter, PeakFilter, HighShelfFilter, Limiter
from pedalboard.io import AudioFile
SR=44100; D='public/media/historia-keylab/'
def load(p):
    with AudioFile(p).resampled_to(SR) as f: a=f.read(f.frames)
    return np.vstack([a,a]) if a.shape[0]==1 else a
v=load(D+'voz-sin-ey.mp3'); m=load(D+'partitura.wav')
n=max(v.shape[1],m.shape[1]); v=np.pad(v,((0,0),(0,n-v.shape[1]))); m=np.pad(m,((0,0),(0,n-m.shape[1])))
v=Pedalboard([HighpassFilter(85),PeakFilter(3200,3,1.0),HighShelfFilter(8000,2),Compressor(threshold_db=-20,ratio=3,attack_ms=5,release_ms=120)])(v.astype(np.float32),SR)
m=Pedalboard([HighpassFilter(45),PeakFilter(2400,-5.5,1.0),PeakFilter(900,-2,1.0)])(m.astype(np.float32),SR)
def rms(x): return np.sqrt((x**2).mean()+1e-12)
# niveles: voz a RMS objetivo; música 11 dB por debajo (medida en su conjunto)
v*=0.12/rms(v[:, v[0]!=0] if False else v); m*=(0.12*10**(-11/20))/rms(m)
# ducking por RMS de la voz (ataque 30 ms, release 350 ms)
e=np.abs(v[0]); win=int(0.05*SR); env=np.convolve(e,np.ones(win)/win,'same')
duck=np.clip(env/ (np.percentile(env[env>0],70)+1e-9),0,1)
sm=np.zeros_like(duck); a_at=np.exp(-1/(0.03*SR)); a_rl=np.exp(-1/(0.35*SR)); y=0.0
for i in range(0,len(duck),32):
    x=duck[i]; c=a_at if x>y else a_rl**32; y=c*y+(1-c)*x if x>y else y*(a_rl**32)+(1-a_rl**32)*x; sm[i:i+32]=y
t=np.arange(n)/SR
depth=np.where(((t>175.87)&(t<186.37))|(t>195.07),0.45,0.6)   # menos ducking en el clímax
g=1-depth*sm
lift=np.interp(t,[0,48,56,88,92,107,107.4,145.4,153.4,207],[8,8,5,5,7,7,5,5,2,2]); g=g*10**(lift/20)
out=v+m*g
out=Pedalboard([Limiter(threshold_db=-1)])(out.astype(np.float32),SR)
with AudioFile(D+'mezcla.wav','w',SR,2) as f: f.write(out)
