#!/bin/bash
set -e
cd /home/claude/keylab-video-studio
for x in frutos:tu-idea-da-frutos:4.34:5.16 momento:momento-de-entrar:7.34:8.13 posicion:no-llegues-tarde:6.64:7.43; do
  IFS=: read n o aa ab <<<"$x"; D=public/media/$n
  python3 scripts/sin-ey/partitura-$n.py $D/partitura-sinEy.wav | tail -1
  python3 scripts/sin-ey/mezclar-$n.py
  ffmpeg -y -loglevel error -i $D/mezcla-sinEy.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 44100 -c:a libmp3lame -b:a 256k $D/voz-musica-sinEy.mp3
  ffmpeg -y -loglevel error -i $D/voz-musica-sinEy.mp3 -filter_complex "[0:a]atrim=0:$aa,asetpts=PTS-STARTPTS,afade=t=out:st=$(python3 -c "print($aa-0.03)"):d=0.03[a0];[0:a]atrim=start=$ab,asetpts=PTS-STARTPTS,afade=t=in:d=0.03[a1];[a0][a1]concat=n=2:v=0:a=1[a]" -map "[a]" -c:a pcm_s16le /tmp/a-$n.wav
  ffmpeg -y -loglevel error -i out/sin-ey/$o.mp4 -i /tmp/a-$n.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart out/sin-ey/$o-v2.mp4
  mv out/sin-ey/$o-v2.mp4 out/sin-ey/$o.mp4; echo "listo $o"
done
echo TODO_OK
