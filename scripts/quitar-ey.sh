#!/bin/bash
# uso: quitar-ey.sh videoA.mp4 finA videoB.mp4 iniB cuadrosCongelados audio.(mp4|wav) salida.mp4
# Une cuadros [0,finA) de videoA + D cuadros congelados + cuadros [iniB,..] de videoB (exacto por cuadro), con el audio dado.
set -e
A=$1; FA=$2; B=$3; IB=$4; D=$5; AU=$6; OUT=$7; W=$(mktemp -d)
X="-c:v libx264 -preset fast -crf 16 -r 30 -pix_fmt yuv420p -threads 2 -an"
ffmpeg -y -loglevel error -i "$A" -vf "trim=end_frame=$FA,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop=$D" $X $W/a.mp4
ffmpeg -y -loglevel error -i "$B" -vf "trim=start_frame=$IB,setpts=PTS-STARTPTS" $X $W/b.mp4
printf "file '%s'\nfile '%s'\n" $W/a.mp4 $W/b.mp4 > $W/l.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i $W/l.txt -c copy $W/v.mp4
ffmpeg -y -loglevel error -i $W/v.mp4 -i "$AU" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
rm -rf $W
