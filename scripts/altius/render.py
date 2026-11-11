import json,subprocess,os
K=json.load(open('keep.json')); os.makedirs('seg',exist_ok=True)
L=open('seg/l.txt','w')
for i,(s,e) in enumerate(K):
    d=e-s
    subprocess.run(['ffmpeg','-y','-loglevel','error','-ss',f'{s:.3f}','-i','raw.mp4','-t',f'{d:.3f}','-af',f'afade=t=in:d=0.012,afade=t=out:st={max(0,d-0.015):.3f}:d=0.015','-c:v','libx264','-preset','medium','-crf','16','-r','25','-pix_fmt','yuv420p','-c:a','pcm_s16le','-ar','48000',f'seg/{i:03d}.mov'],check=True)
    L.write(f"file '{i:03d}.mov'\n")
L.close()
subprocess.run(['ffmpeg','-y','-loglevel','error','-f','concat','-safe','0','-i','seg/l.txt','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart','altius-vsl-corte.mp4'],check=True)
print('ok')
