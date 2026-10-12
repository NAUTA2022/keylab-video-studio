# Flujo de render por capas y revisión

## 1. 3D horneado (una sola vez por escena)
`node scripts/hornear3d.mjs <Composición> src/data/<video>.json`
- Renderiza solo el 3D de cada escena (PNG con transparencia) en `public/baked/<bakeKey>/<escena>-<huella>/`.
- La huella cambia si cambia el JSON de la escena, su posición/duración o algo en `src/three/` o `public/3d/`; si no, se reutiliza.
- Si cambias en `src/scenes/` lo que la escena le pasa al 3D (región, tiempos): `--escena=N` o `--force`.
- Con el 3D horneado, `FullFrame3D` muestra las imágenes y el render solo calcula el 2D encima.

## 2. Vista previa
`node scripts/vista-previa.mjs <Composición> src/data/<video>.json`
- Hornea lo que falte y renderiza a 540×960 en `out/previa/`.
- Claude la sube a la **Sala de Revisión** (artefacto): se reproduce, se pausa y se deja una nota en el segundo exacto.
- Claude lee las notas, corrige, marca cada una como resuelta con su respuesta y sube la siguiente versión.

## 3. Render final
Solo cuando la previa está aprobada:
`npx remotion render <Composición> out/<video>.mp4 --browser-executable=… --concurrency=2`

## Emojis animados (Lottie)
- 29 emojis de Noto Emoji Animation (Google, CC BY 4.0) en `public/lottie/emoji/`.
- `<LottieEmoji name="enojado" size={120} />` o `withEmojis(texto, tamaño)` para cambiar los emojis de un texto por su versión animada (ya activo en los memes de La bóveda).
- Galería: composición `GaleriaEmojis`.
- Para más animaciones Lottie: `@remotion/lottie` reproduce cualquier JSON de LottieFiles sincronizado con el cuadro.
