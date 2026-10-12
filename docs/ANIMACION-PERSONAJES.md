# Animación de personajes (estilo anime vectorizado)

Flujo probado y funcionando para que los personajes no sean una imagen que rebota,
sino una marioneta articulada que parpadea, habla con la voz real y gesticula.

## 1. Personaje base
- Ilustración plana estilo anime vectorizado (sin contornos, ojos grandes, cachetes, sombras planas)
  sobre fondo verde → recorte con chroma key → `public/personajes/<nombre>.png`.

## 2. Rig por capas (cutout)
- `python3 scripts/rig_don.py` corta el PNG en capas: cuerpo, antebrazo (gira en el codo) y bigote,
  y guarda los puntos de control (codo, ojos, boca, color de piel) en `public/personajes/rig/don.json`.
- Para otro personaje: copiar el script, ajustar el polígono del brazo y los puntos de ojos y boca
  (se miden sobre una grilla de la imagen).
- Componente: `src/svg/DonRig.tsx` → `<DonRig height talk arm seed />`.

## 3. Sincronía labial
- `python3 scripts/lipsync.py public/media/<video>/voz.mp3` → `voz.labios.json` (apertura de boca por cuadro).
- En la escena: `const talk = useLipSync(labios, segundoDeLaVozEnElCuadro0)`.

## 4. Primitivas de movimiento (`src/motion/primitives.ts`)
Calculadas por cuadro (las animaciones CSS no se sincronizan con el render de Remotion):
- `blink` parpadeo natural (2–4,5 s, a veces doble)
- `breathe` respiración del torso · `bob` balanceo
- `gesture` gesto con anticipación, sobrepaso y asentamiento
- `handTalk` gesticulación secundaria mientras habla

## 5. Vectorizar a SVG real (opcional)
- `vtracer` (MIT, local, gratis) convierte el PNG en SVG de trazados planos; `svgo` lo optimiza.
- Sirve para escalar sin pérdida o editar colores. Pierde detalles finos (brillos de ojos), por eso
  en video se usa el PNG con rig y el SVG queda como fuente editable. Ver `vectorizado-comparacion.jpg`.

## Evaluación de los repositorios sugeridos (todos licencia MIT)
| Repositorio | Qué aporta | Uso aquí |
|---|---|---|
| ChanMeng666/svg-animation-studio | Primitivas (blink, talk, wave-arm, bob), presets SVG en bucle CSS | Se tomaron las ideas y se reescribieron por cuadro; su sistema genera SVG para web, no video |
| iart-ai/web-animation-skills | Skills de GSAP, Lottie, SVG, 60 fps, accesibilidad | Referencia; GSAP/Lottie solo sirven en Remotion si se controlan por cuadro (`@remotion/lottie`, timeline.seek) |
| LottieFiles/motion-design-skill | Principios: anticipación, sobrepaso, timing, coreografía | Aplicados en `gesture` y en los tiempos del parpadeo |

## Prueba
- Composición `TestRig` (6 s): antes (imagen que rebota) vs. ahora (rig con labios). `out/prueba-personaje-articulado.mp4`.
