#!/usr/bin/env bash
# Empaqueta el proyecto (sin node_modules, renders ni 3D horneado) en dos zips
# de menos de 30 MB cada uno, para que la automatización programada lo baje
# del computador y lo arme en la nube:
#   _kit/kit-1.zip  código, scripts, docs, assets, 3D, fuentes, sonidos, personajes, emojis
#   _kit/kit-2.zip  memes, clips de ejemplo y audios base
# Uso: bash scripts/empaquetar-kit.sh   (desde la raíz del proyecto)
set -e
mkdir -p _kit && rm -f _kit/kit-1.zip _kit/kit-2.zip
EXC=( -x "node_modules/*" "*/node_modules/*" "out/*" "_kit/*" "public/baked/*" "public/media/*/*" "explicaciones/*/out/*" "explicaciones/*/frames/*" )
zip -qr -9 _kit/kit-1.zip . "${EXC[@]}" "public/memes/*" "public/clips/*" "public/media/*"
zip -qr -9 _kit/kit-2.zip public/memes public/clips public/media -x "public/media/*/*"
# curvas de labios (las importan las escenas)
zip -q -g _kit/kit-1.zip public/media/*/*.labios.json
# manifest vacío del 3D horneado (el horneado se regenera en cada máquina)
TMP=$(mktemp -d) && mkdir -p "$TMP/public/baked" && echo "{}" > "$TMP/public/baked/manifest.json"
(cd "$TMP" && zip -q ../kit-tmp.zip public/baked/manifest.json && mv ../kit-tmp.zip ./m.zip)
(cd "$TMP" && zip -q -g "$OLDPWD/_kit/kit-1.zip" public/baked/manifest.json)
rm -rf "$TMP"
ls -la _kit
