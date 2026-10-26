"""Alineación aproximada palabra→tiempo usando silencios (ffmpeg silencedetect) y sílabas.
uso: python3 scripts/alinear.py voz.mp3 "guion..." """
import sys, re, subprocess
voz, texto = sys.argv[1], sys.argv[2]
out = subprocess.run(['ffmpeg','-i',voz,'-af','silencedetect=n=-32dB:d=0.12','-f','null','-'],capture_output=True,text=True).stderr
dur = float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',voz],capture_output=True,text=True).stdout)
ss=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',out)]; se=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',out)]
sil=list(zip(ss,se)); segs=[]; t=0
for a,b in sil:
    if a>t: segs.append((t,a))
    t=b
if t<dur-0.05: segs.append((t,dur))
def syl(w):
    w=w.lower(); n=len(re.findall(r'[aeiouáéíóúü]+',w)); return max(1,n)
words=texto.split(); sy=[syl(w)+ (0.6 if re.search(r'[,.:?;]$',w) else 0) for w in words]
# asignación: palabras a segmentos de forma que el ritmo sea parejo (DP)
import math
S=len(segs); W=len(words); cum=[0]
for s in sy: cum.append(cum[-1]+s)
rate=cum[-1]/sum(b-a for a,b in segs)
INF=1e18; dp=[[INF]*(W+1) for _ in range(S+1)]; bk=[[0]*(W+1) for _ in range(S+1)]; dp[0][0]=0
for i in range(1,S+1):
    d=segs[i-1][1]-segs[i-1][0]
    for j in range(1,W+1):
        for k in range(max(0,j-25),j):
            if dp[i-1][k]>=INF: continue
            c=dp[i-1][k]+((cum[j]-cum[k])/rate-d)**2
            if k>0 and not re.search(r'[,.:?;]$',words[k-1]): c+=0.15
            if c<dp[i][j]: dp[i][j]=c; bk[i][j]=k
j=W; cuts=[]
for i in range(S,0,-1): k=bk[i][j]; cuts.append((k,j)); j=k
cuts.reverse()
for (k,j),(a,b) in zip(cuts,segs):
    print(f'{a:6.2f}-{b:6.2f}  {" ".join(words[k:j])}')
