#!/bin/bash
# uso: quitar-ey.sh in.mp4 out.mp4 va vb aa ab
# Video: corta [va,vb) congelando el cuadro previo d=aa-va-ab+vb; audio: corta [aa,ab) con micro-fundidos. Por partes para no gastar RAM.
set -e
IN=$1; OUT=$2; VA=$3; VB=$4; AA=$5; AB=$6
D=$(python3 -c "print(max(0,round($AA-$VA-$AB+$VB,4)))")
W=$(mktemp -d)
X="-c:v libx264 -preset fast -crf 16 -r 30 -pix_fmt yuv420p -threads 2 -an"
ffmpeg -y -loglevel error -i "$IN" -t $VA -vf "tpad=stop_mode=clone:stop_duration=$D" $X $W/a.mp4
ffmpeg -y -loglevel error -ss $VB -i "$IN" $X $W/b.mp4
printf "file '%s'\nfile '%s'\n" $W/a.mp4 $W/b.mp4 > $W/l.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i $W/l.txt -c copy $W/v.mp4
ffmpeg -y -loglevel error -i "$IN" -filter_complex "[0:a]atrim=0:$AA,asetpts=PTS-STARTPTS,afade=t=out:st=$(python3 -c "print($AA-0.03)"):d=0.03[a0];[0:a]atrim=start=$AB,asetpts=PTS-STARTPTS,afade=t=in:d=0.03[a1];[a0][a1]concat=n=2:v=0:a=1[a]" -map "[a]" -c:a pcm_s16le $W/a.wav
ffmpeg -y -loglevel error -i $W/v.mp4 -i $W/a.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
rm -rf $W
