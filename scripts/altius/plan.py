import numpy as np, json
a=np.fromfile('a.f32',np.float32); h=160; fr=100  # 10ms
n=len(a)//h; r=20*np.log10(np.sqrt((a[:n*h].reshape(n,h)**2).mean(1))+1e-9)
W=json.load(open('words.json'))
EXCL=[(103.4,111.2),(167.3,181.2)]   # tomas repetidas: se queda la última
sp=r>-36
# cerrar huecos cortos dentro de palabras
idx=np.where(sp)[0]
reg=[]
for i in idx:
    if reg and i-reg[-1][1]<=12: reg[-1][1]=i
    else: reg.append([i,i])
reg=[(s/fr,(e+1)/fr) for s,e in reg]
def words_in(s,e): return [w for w in W if w[1]>s-0.05 and w[0]<e+0.05]
keep=[]
for s,e in reg:
    if any(s<b and e>a0 for a0,b in EXCL): 
        # recorta contra exclusión
        for a0,b in EXCL:
            if s<b and e>a0:
                if s<a0: e=a0
                else: s=max(s,b)
        if e-s<0.12: continue
    ws=words_in(s,e)
    if not ws and e-s<0.6: continue   # respiración / ruido sin palabra
    if e-s<0.09: continue
    keep.append([s,e,ws[-1][2] if ws else ''])
# unir y fijar pausas
out=[]
for s,e,last in keep:
    s0=max(0,s-0.06); e0=e+0.15
    if out:
        gap=s0-out[-1][1]
        prev=out[-1][2]
        tgt=0.42 if prev[-1:] in '.?!' else 0.24 if prev[-1:]==',' else 0.14
        if gap<=tgt: out[-1][1]=e0; out[-1][2]=last or prev; continue
        out[-1][1]+=max(0,tgt-0.21)
    out.append([s0,e0,last])
out[-1][1]=min(out[-1][1]+1.3,195.5)  # cierre: queda quieta mirando a cámara
json.dump([[round(s,3),round(e,3)] for s,e,_ in out],open('keep.json','w'))
tot=sum(e-s for s,e,_ in out)
print(len(out),'segmentos, duración',round(tot,2))
for s,e,l in out: print(f'{s:.2f}-{e:.2f} {l}')
