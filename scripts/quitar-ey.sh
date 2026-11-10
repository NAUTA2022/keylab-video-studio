#!/bin/bash
# uso: quitar-ey.sh in.mp4 out.mp4 va vb aa ab  (video corta [va,vb), audio corta [aa,ab); congela el cuadro previo d=aa-va-ab+vb)
set -e
IN=$1; OUT=$2; VA=$3; VB=$4; AA=$5; AB=$6
D=$(python3 -c "print(max(0,round($AA-$VA-$AB+$VB,4)))")
ffmpeg -y -loglevel error -i "$IN" -filter_complex "
[0:v]trim=0:$VA,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=$D[v0];
[0:v]trim=start=$VB,setpts=PTS-STARTPTS[v1];
[v0][v1]concat=n=2:v=1:a=0,format=yuv420p[v];
[0:a]atrim=0:$AA,asetpts=PTS-STARTPTS,afade=t=out:st=$(python3 -c "print($AA-0.03)"):d=0.03[a0];
[0:a]atrim=start=$AB,asetpts=PTS-STARTPTS,afade=t=in:d=0.03[a1];
[a0][a1]concat=n=2:v=0:a=1[a]" -map "[v]" -map "[a]" -c:v libx264 -preset fast -crf 16 -r 30 -c:a aac -b:a 192k -movflags +faststart "$OUT"
