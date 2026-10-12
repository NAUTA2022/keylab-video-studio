# Key Lab Video Studio

App de React (Remotion) que convierte un JSON en un video de marca Key Lab, con efectos de React Bits adaptados para que cada cuadro salga perfecto.

- **9:16** (reels) → composición `KeyLabReel`, 1080×1920
- **16:9** (YouTube, LinkedIn horizontal) → composición `KeyLabWide`, 1920×1080
- 30 fps, H.264

## Primeros pasos

```bash
npm install
npm run studio      # abre el editor en el navegador para ver y ajustar
npm run render      # out/reel.mp4 (usa --concurrency=1)
npm run render:wide # out/wide.mp4
```

Requiere Node 18 o superior.

## Logos

Los logos oficiales de Key Lab ya están en `public/brand/`, tomados de keylab.tech:

| Archivo | Uso |
|---|---|
| `logo-horizontal-ink.png` | Arriba a la izquierda en escenas claras |
| `logo-horizontal.png` | Escenas oscuras y wordmark "K.LAB" del cierre |
| `isotipo-3d.png` | Isotipo cromado 3D que flota en el cierre, dentro de la Crystalized Ball |

Si alguno falta, el video deja ese espacio vacío. Nunca dibuja un logo de reemplazo.

## Hacer un video nuevo

1. Duplica `src/data/plantilla-noticia.json` y cambia cada `CAMBIA`.
2. Pon la voz, la música y las capturas en `public/media/`.
3. En `src/Root.tsx`, importa tu JSON en lugar de `demo-tokenizacion.json`.
   También puedes pasarlo al renderizar sin tocar código:
   `npx remotion render KeyLabReel out/mi-video.mp4 --props=src/data/mi-video.json`

### Escenas disponibles (`type`)

| Escena | Qué hace | Efectos |
|---|---|---|
| `hook` | Gancho gigante en Anton, con la palabra clave en bloque cobalto | DecryptedText, SplitText, reveal con máscara |
| `roast` | El chiste del día a día, línea por línea, y un sello al final | BlurText, Stamp |
| `news` | Captura de la nota con "FUENTE · MEDIO · FECHA" y luego la web de la empresa dentro de una ventana de navegador | TextType, slide, chip |
| `stat` | Cifra que cuenta hasta su valor final | CountUp |
| `ey` | "Ey." a pantalla completa en cobalto | Zoom-punch |
| `pivot` | El drop: "si se puede con eso, se puede con…" | Aurora, LightRays, RotatingText |
| `solution` | Cómo lo construye Key Lab, en tarjetas | SplitText, tarjetas apiladas, iconos planos |
| `close` | Isotipo 3D flotando, wordmark, "Agenda una reunión" y keylab.tech | Particles, barrido de luz |

Cada escena lleva `dur` en segundos y un `tag` opcional (la etiqueta de arriba a la derecha).
Los `subtitles` van en segundos absolutos del video.

Fondo de las escenas claras (`background`): `dots` (rejilla con onda), `aurora`, `silk` o `none`.

## Assets 3D y SVG sincronizados con la voz

Cuando la voz nombra algo, aparece un asset animado. Se activan con `asset` y se sincronizan con `cues`, que son los segundos dentro de la escena:

| Escena | `asset` | Qué hace | `cues` |
|---|---|---|---|
| `hook` | `building3d` | Edificio 3D (Three.js) que se construye piso por piso y luego se desarma en tokens-moneda | `building`, `tokens` |
| `hook` | `taxi-leech` | "La sanguijuela argentina": personaje 3D original estilo caricatura (`src/three/Leech3D.tsx`) con la camiseta celeste y blanca del 10, sobre el techo de un taxi 3D de Kenney en una ciudad 3D (hay también una versión 2D en `src/svg/Leech2D.tsx`). Gira a cámara, entrecierra los ojos y mueve la boca en sus frases (`quotes`, en letra de meme); la cámara se abre, se pega al techo y el taxi arranca. | `turn`, `title`, `pega`, `boom` (resaltado) |
| `roast` | `excel-chat` | Hoja de cálculo caótica con `#¡REF!`, mensajes de chat de las 11 p. m. y una luna (SVG) | `excel`, `chat`, `night`, `line0..n`, `punch` |
| `stat` | `phone3d` | Celular 3D con una app de inversión con tu marca. Cae un token y se presiona "Invertir" | `invest` |
| `pivot` | `icons: ["lote","hotel","proyecto"]` | Íconos de react-icons (Phosphor) dentro de un círculo cobalto que entra con rebote, uno por palabra | `edificio`, más `wordsAt` |

**Modelos de la comunidad.** Los carros, edificios, calles y monedas son modelos glTF libres de Kenney (CC0), en `public/3d/` (ver `public/3d/LICENCIAS.md`). Se cargan con `useGltfs()` de `src/three/loaders.ts`, que hace esperar al render hasta que el modelo está montado. Para sumar más, baja el kit de kenney.nl (o Poly Pizza, Quaternius) y copia los `.glb` con su carpeta `Textures/`.

**Calidad de imagen.** `FullFrame3D` usa tone mapping ACES, color sRGB, sombras suaves e iluminación HDRI (`hdri`: city, sunset, dawn, studio, night; CC0 de Poly Haven), así los modelos tienen luz y reflejos reales en vez de verse oscuros y planos.

Los modelos 3D están en `src/three/` y siempre se renderizan a cuadro completo con `FullFrame3D`: se define `region` y la cámara encuadra el objeto ahí, así nada se recorta. Usan `@remotion/three`, `@react-three/fiber` y `three`. Los SVG están en `src/svg/assets.tsx`.
Todo depende del número de cuadro, así que el render siempre sale igual. `scripts/sonorizar.py` lee los mismos `cues` y pone un sonido en cada momento: pisos, lluvia de monedas, pops del chat y cha-ching.

**Para sacar los tiempos de la voz:** mide las pausas con `ffmpeg -i public/media/voz.mp3 -af silencedetect=noise=-35dB:d=0.25 -f null -` y ubica cada palabra dentro de su frase.

## Explicaciones y demos de plataforma (animation-studio)

Las partes que explican algo o muestran una plataforma se dibujan con **animation-studio**. Es canvas dibujado en código, con líneas a mano que "hierven" y un kit de interfaz (teléfonos, tarjetas, botones, anillos), y cada cuadro sale exacto.

- **Proyecto:** `explicaciones/demo-plataforma/`.
  - `score.js` define los tiempos clave, que son los mismos `cues` de la escena.
  - `film.js` hace el dibujo: el wireframe a mano se vuelve la interfaz real del panel de la tokenizadora, entra el celular del inversionista con "Invertir 100 USD" y en "con tu marca" todo cambia al color y logo del cliente.
- **Render** (Node 22+, ffmpeg y Chrome; el motor está probado en macOS y Linux): `cd explicaciones/demo-plataforma && node engine/render.js video`. Luego copia `out/video.mp4` a `public/clips/demo-plataforma.mp4`.
- **En el JSON:** en la escena `solution` va `"clip": "clips/demo-plataforma.mp4"` y `cues` con `sketch`, `materialize`, `phone`, `tap` y `brand`. `sonorizar.py` pone el garabato del boceto, el pop, el tap con moneda y el ding del cambio de marca.

## Humor: memes del zorro de plata

La mascota de Key Lab es un zorro de plata. Sus memes están en `public/memes/`:

| Archivo | Para qué sirve |
|---|---|
| `zorro-ceja.png` (sin fondo) | **Fijo en el "Ey."**: ceja levantada. No se usa en `gags` |
| `zorro-pulgar.png` (sin fondo) | Aprobación: "en Key Lab te lo construimos" |
| `zorro-muejeje.jpg` | **Fijo en el cierre**, con la risa muejeje. No se usa en `gags` |
| `zorro-grunon.jpg` | Algo viejo o malo ("Eso es 2010") |
| `zorro-cansado.jpg` | Trasnocho, desorden ("las 11 p. m.") |
| `zorro-de-reojo.jpg` | Incredulidad ("Sí, en serio") |
| `zorro-silla.jpg` | Serio y formal, disponible |

El Ey y el cierre ya traen su zorro y su sonido, siempre iguales. También están como clips sueltos: `KL-Ey` y `KL-Cierre`, y los archivos `assets/ey.mp4` y `assets/cierre.mp4`.

Los memes de contenido se programan en el JSON con `gags`. Van entre 1 y 3 por video, separados al menos 4 s, y se rotan entre videos (ver `GUIA-MARCA.md` › Reglas de producción):

```json
{ "at": 7.75, "dur": 1.45, "image": "memes/zorro-grunon.jpg", "style": "sticker",
  "x": 0.68, "y": 0.52, "size": 0.48, "caption": "2010", "sfx": "sfx/scratch.mp3" }
```

- `style: "sticker"`: la foto entra con borde blanco, inclinada y con rebote. Puede llevar `caption` en letra de meme.
- `style: "cutout"`: un PNG sin fondo que entra desde un borde.
- `at` y `dur` son segundos absolutos del video. `x`, `y` y `size` son proporciones de la pantalla.
- `duck: true` baja la música mientras suena el efecto. Sirve para risas como el muejeje.

**Sonidos de YouTube** (`public/sfx/`, de myinstants.com):

| Archivo | Sonido |
|---|---|
| `muejeje-corto.mp3` | La risa muejeje, recortada a 2 s |
| `boom.mp3` | Vine boom |
| `scratch.mp3` | Scratch de disco |
| `boing.mp3` | Boing |
| `trombon.mp3` | Trombón triste |
| `bruh.mp3` | Bruh |

`scripts/sonorizar.py` los mete en la banda en el segundo exacto de cada meme.
Son sonidos meme que suben los usuarios: sirven para redes, pero no tienen licencia comercial formal. Para anuncios pagados conviene cambiarlos por efectos generados en ElevenLabs.

## Marca

Todo está en `src/brand/brand.ts`. Ver `GUIA-MARCA.md`.

## Efectos de React Bits

Hay dos tipos:

**1. Componentes originales** (`src/reactbits/`), tal cual vienen de reactbits.dev: Crystalized Ball, Pattern Waves, Micro Slats, Electric Logo, Tech Text, Dither Veil y Liquid Chrome.
Se importan con un script que redirige su reloj (`requestAnimationFrame` y `performance.now`) al reloj del video (`src/reactbits/vclock.ts` + `src/clock/ClockDriver.tsx`). Así cada cuadro sale exacto, sin saltos.

```bash
git clone --depth 1 https://github.com/DavidHDev/react-bits.git ../react-bits
node scripts/import-reactbits.mjs ../react-bits Backgrounds/Hyperspeed Animations/MetallicPaint
```

Luego lo usas como cualquier componente. Si es pesado, envuélvelo en `<LowRes scale={0.5}>`.
La composición `GaleriaReactBits` del editor muestra varios de estos componentes uno tras otro.

**2. Versiones ligeras** (`src/bits/`): SplitText, BlurText, DecryptedText, CountUp, RotatingText, TextType, Aurora, Silk, LightRays, Particles y DotGrid, reescritas para depender solo del número de cuadro.

> Los efectos originales tienen estado (partículas, fluidos). Renderiza con `--concurrency=1` para que avancen en orden. En un PC con tarjeta gráfica el render es mucho más rápido que en la nube.

## Voz, música y sonorización

1. **Voz:** se genera en ElevenLabs con la voz Martin Osborne 5 y se guarda en `public/media/voz.mp3`.
2. **Sonorización:** un solo comando arma la banda completa a partir del JSON del video:

   ```bash
   pip install numpy scipy
   python scripts/sonorizar.py src/data/mi-video.json public/media/banda.mp3
   ```

   - Música original de 120 BPM en La menor, que sigue la estructura del video: groove, riser, silencio real en el "Ey.", drop y cierre.
   - Ducking: la música baja sola cuando habla la voz y sube en los huecos.
   - Efectos sincronizados con cada animación:
     - whoosh en cada corte
     - ticks del texto que se descifra
     - golpe del sello
     - tic-tic del contador
     - swish de cada palabra que rota
     - slides de las tarjetas
     - impacto en el "Ey."
     - shimmer del cierre
   - Master a -14 LUFS, el estándar de Instagram, TikTok y YouTube.
3. En el JSON pones `"soundtrack": "media/banda.mp3"`. Si cambias duraciones de escenas, vuelve a correr el script.

`scripts/musica.py` sigue disponible si quieres solo la música, sin voz ni efectos.

## Licencias

- **React Bits:** MIT + Commons Clause, © David Haz. Se puede usar en videos comerciales, pero los componentes portados no se pueden vender ni redistribuir como paquete. Esta app es de uso interno.
- **Remotion:** gratis para personas y empresas de hasta 3 empleados. Si Key Lab crece, revisa remotion.dev/license.
- **Fuentes:** Anton y Figtree (SIL Open Font License).

### Explicaciones del video "Señor C"
- `explicaciones/notas-celular/`: "¿Y tú qué?". El celular muestra la nota "negocio millonario 💡" entre los huevos y el papel higiénico, con la anotación "aquí murió la idea".
- `explicaciones/plataforma-marca/`: "TU PLATAFORMA · TU MARCA". El panel de la flota se esboza, se vuelve real y cambia tres veces de marca (AUTOFLOTA, CAFÉ ORIGEN, GANADO+, todas ficticias).
- Gancho: `taxi-leech` con la voz de personaje diseñada en ElevenLabs (`media/senor-c/sanguijuela/`), unida a la narración en `voz-v2.mp3`. El personaje es original: sin escudos, marcas ni imitación de voces de personas reales.
- Para renderizarlas, copia la carpeta `engine/` de `explicaciones/demo-plataforma/` a cada proyecto. El motor es el mismo.

## Brief del próximo video (panel)

Hay un panel web privado ("Key Lab Video Brief", en tus artefactos de claude.ai) con todo el catálogo: ganchos, memes, sonidos con vista previa, escenas, explicaciones, modelos 3D, luz, efectos de React Bits, fondo, voces y cierre. Marcas lo que quieres, escribes el guion o la idea y guardas el brief, o partes de un preset. Claude lee los briefs guardados antes de producir el siguiente video. Cuando la app sume assets nuevos, se agregan al catálogo del panel.

### Video "La bóveda" (trazabilidad + desembolso por hitos)
- Composición `Boveda`, datos en `src/data/boveda.json`, voz en `public/media/boveda/` (narrador + voz diseñada del inversionista paisa en `inversor/`).
- Escenas propias en `src/scenes/Boveda.tsx`: `boveda-hook` (tremenda Hilux vs. lote con maleza, 3D), `boveda-story` (Don Excusas, excusómetro, el render, la rabia que corta el Ey) y `boveda-vault` (`mode: store` la plata entra a la bóveda; `mode: run` Don Excusas se estampa contra la puerta).
- Personaje 2D: `src/svg/DonExcusas.tsx` (constructor inventado, sin nacionalidad). Poses `stand` y `run`, boca que habla, ojos de mareo.
- 3D: `src/three/PickupLot3D.tsx` (camioneta + lote, Kenney) y `src/three/Vault3D.tsx` (bóveda de metal con luces de hito H1–H3).
- Explicación: `explicaciones/boveda-hitos/` (animation-studio). Un solo clip de 15 s que se usa en dos escenas `clip` con `from` (0 y 9,2 s).
