"""Arma la voz final de la historia (voz-v3.mp3) a partir de la grabación original y los arreglos,
y escribe mapa-tiempo.json (tiempo de la voz original -> tiempo de la voz final)."""
import subprocess, json
D='public/media/historia-keylab/'
def dur(f): return float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout)
END_O=dur(D+'voz.mp3')
src={'voz':D+'voz.mp3','depto':D+'fix-depto.mp3','blk':D+'fix-blockenfy.mp3','cons':D+'fix-conseguirlo.mp3','rep':D+'fix-representaba.mp3'}
# (fuente, inicio, fin, rango de la voz original que reemplaza o None si es inserción)
P=[('voz',0,39.77),('depto',3.70,6.47,(39.77,42.30)),('voz',42.30,107.3),
   ('voz',108.93,126.39),('blk',0,7.03,(126.39,133.63)),('sil',0,0.3,(133.63,133.93)),
   ('voz',133.93,141.79),('rep',3.44,5.95,(141.79,143.04)),('voz',143.04,151.01),
   ('cons',3.06,6.12,None),('sil',0,0.45,None),('voz',151.01,END_O)]
inputs=[];filt=[]
for k,pc in enumerate(P):
    s,a,b=pc[0],pc[1],pc[2]
    if s=='sil': filt.append(f"aevalsrc=0:d={b-a}:s=44100:c=mono[s{k}]")
    else:
        inputs+=['-i',src[s]]; idx=len(inputs)//2-1
        filt.append(f"[{idx}]atrim={a}:{b},asetpts=N/SR/TB,aresample=44100,aformat=channel_layouts=mono,afade=t=in:d=0.015,afade=t=out:st={b-a-0.02:.3f}:d=0.02[s{k}]")
filt.append(''.join(f'[s{i}]' for i in range(len(P)))+f"concat=n={len(P)}:v=0:a=1[o]")
subprocess.run(['ffmpeg','-y','-v','error',*inputs,'-filter_complex',';'.join(filt),'-map','[o]','-b:a','192k',D+'voz-v3.mp3'],check=True)
# mapa O -> N (puntos fijos de los cortes, el reemplazo y la inserción)
pts=[[0,0],[39.77,39.77],[42.30,42.54],[107.3,107.54],[108.93,107.54],[126.39,125.0],[133.93,132.33],
     [141.79,140.19],[143.04,142.70],[151.01,150.67],[151.0101,154.18],[END_O,154.18+END_O-151.0101]]
json.dump({'pts':pts,'cut':[107.3,108.93]},open(D+'mapa-tiempo.json','w'))
print(dur(D+'voz-v3.mp3'))
