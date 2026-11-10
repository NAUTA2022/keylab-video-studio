#!/bin/bash
set -e; cd /home/claude/keylab-video-studio
B=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
for n in tu-idea-da-frutos momento-de-entrar no-llegues-tarde; do ffmpeg -y -loglevel error -i out/sin-ey/$n.mp4 -vn -c:a pcm_s16le /tmp/au-$n.wav; done
npx remotion render Frutos out/frutos/hook-naranjo.mp4 --frames=0-130 --browser-executable=$B --concurrency=2 --gl=swangle --muted --crf=16 >/dev/null 2>&1
echo render_ok
scripts/quitar-ey.sh out/frutos/hook-naranjo.mp4 131 out/tu-idea-da-frutos.mp4 156 0 /tmp/au-tu-idea-da-frutos.wav out/sin-ey/tu-idea-da-frutos.mp4; echo "listo frutos"
scripts/quitar-ey.sh out/momento-de-entrar.mp4 215 out/momento-de-entrar.mp4 245 6 /tmp/au-momento-de-entrar.wav out/sin-ey/momento-de-entrar.mp4; echo "listo momento"
scripts/quitar-ey.sh out/no-llegues-tarde.mp4 194 out/no-llegues-tarde.mp4 224 6 /tmp/au-no-llegues-tarde.wav out/sin-ey/no-llegues-tarde.mp4; echo "listo posicion"
echo TODO_OK
