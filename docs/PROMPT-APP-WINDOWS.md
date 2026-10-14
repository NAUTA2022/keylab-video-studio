# Prompt: Key Lab Video Studio Desktop (app de Windows que orquesta a Claude por MCP)

> Copia todo lo que está debajo de la línea en tu herramienta de desarrollo (Claude Code, etc.).
> Es la especificación completa del flujo de video que hoy hacemos a mano con Claude, para convertirlo en una app local.

---

## 0. Rol y objetivo

Eres un ingeniero senior full-stack. Construye **Key Lab Video Studio Desktop**: una app de escritorio para Windows (instalador `.exe`) que corre en local y produce los videos de marca de Key Lab (keylab.tech) usando a Claude como cerebro creativo. La app hace el trabajo pesado en la máquina (render, audio, capturas, archivos), y Claude decide y escribe (noticia, guion, copy, escenas, memes, revisión), llamando a las herramientas de la app de forma ordenada a través de **MCP**.

El resultado de cada corrida es: `video.mp4` 1080×1920 (9:16), `voz.mp3`, `copy-linkedin.md`, el JSON del video y una vista previa revisable antes del render final. **Nunca publica nada en redes.**

Trabaja por fases, con commits pequeños, pruebas y una demo que funcione de punta a punta antes de pulir.

## 1. Arquitectura

```
┌──────────────────────── App de escritorio (Electron + React o Tauri + React) ────────────────────────┐
│  UI: Brief · Cola de trabajos · Progreso por pasos · Sala de Revisión · Biblioteca · Ajustes        │
│                                                                                                      │
│  Orquestador (máquina de estados por trabajo, persistida en SQLite)                                  │
│      └─ lanza una sesión de Claude (Claude Agent SDK / `claude -p` en modo headless) con:            │
│           · system prompt = este documento (secciones 4 a 9)                                         │
│           · MCP "keylab-studio" (servidor local de la app, stdio)  ← herramientas de abajo           │
│           · MCP ElevenLabs (oficial) y, opcional, Playwright MCP para navegar                        │
│                                                                                                      │
│  Servidor MCP "keylab-studio" (Node/TypeScript, @modelcontextprotocol/sdk)                           │
│      envuelve: proyecto Remotion keylab-video-studio · ffmpeg · Python (sonorizar, lipsync) ·        │
│      Playwright (capturas) · git · sistema de archivos de entregas                                   │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Claude nunca toca la máquina directamente**: todo pasa por herramientas MCP con entradas validadas (zod) y salidas JSON pequeñas (rutas de archivos, no blobs).
- **Orden garantizado**: el orquestador expone en cada paso solo las herramientas de ese paso (o valida en el servidor que el trabajo esté en el estado correcto) y avanza el estado cuando la herramienta devuelve OK.
- **Puertas humanas** (configurables): aprobar noticia/guion, aprobar vista previa. En modo programado sin humano: decide, deja la previa en la Sala y hace el render final igual.
- **Programación**: tarea programada local (lunes, miércoles y viernes 7:45 a. m., zona America/Bogota) con el Programador de tareas de Windows o un scheduler interno; la app arranca minimizada en la bandeja.
- **Credenciales**: API key de Anthropic y de ElevenLabs en el Administrador de credenciales de Windows (keytar), nunca en texto plano ni en el repo.
- **Proyecto de video**: clona/actualiza `https://github.com/NAUTA2022/keylab-video-studio` (privado) en `%LOCALAPPDATA%\KeyLabStudio\repo` y hace `npm ci`. Remotion en Windows: `npx remotion browser ensure` descarga Chrome Headless Shell; ffmpeg viene con Remotion. Python 3.11 embebido para `scripts/sonorizar.py` y `scripts/lipsync.py` (o pórtalos a Node).

## 2. Herramientas MCP del servidor "keylab-studio"

Cada una devuelve `{ ok, ... }` o `{ ok:false, error, hint }`. Todas registran en el log del trabajo.

| Herramienta | Entrada | Qué hace |
|---|---|---|
| `job_start` | `{type: "noticia" \| "historia", brief?}` | Crea el trabajo y su clave (`noticia-AAAA-MM-DD`), carpeta `public/media/<clave>/` |
| `deliveries_list` | — | Lista entregas previas (tema, noticia usada, memes usados) para no repetir |
| `news_fetch` | `{url}` | Descarga y limpia el texto de una nota (Cointelegraph u otra) |
| `web_search` | `{query}` | Búsqueda web (o deja que Claude use su búsqueda propia) |
| `capture_page` | `{url, region?, rejectCookies:true, out}` | Playwright: abre, rechaza cookies no esenciales, captura la región (titular + fecha + imagen principal, sin anuncios ni fotos de autor) |
| `tts_generate` | `{text, voiceId, modelId}` | ElevenLabs API directo, guarda `voz-raw.mp3` |
| `audio_silences` | `{file}` | `ffmpeg silencedetect=noise=-35dB:d=0.2` → lista de frases con inicio/fin |
| `audio_trim` | `{file, keep:[[a,b],...], tempo≤1.04}` | Recorta pausas largas y acelera; devuelve duración final |
| `lipsync_curve` | `{voice}` | `scripts/lipsync.py` → `<voz>.labios.json` |
| `memes_catalog` | — | Lee `public/memes/zorro/catalogo.json` + sonidos de `public/sfx/` |
| `video_write_json` | `{json}` | Valida contra `src/schema.ts` (zod) y guarda `src/data/<clave>.json` |
| `soundtrack_build` | — | `python scripts/sonorizar.py` → `banda.mp3`; devuelve avisos (p. ej. memes muy juntos) |
| `bake_3d` | `{force?, scene?, reuse?}` | `node scripts/hornear3d.mjs KeyLabReel <json>` |
| `render_stills` | `{frames:[...]}` | `npx remotion still` → PNGs + una hoja de contacto para que Claude la mire |
| `render_preview` | — | `node scripts/vista-previa.mjs` (540×960) |
| `review_get_notes` / `review_reply` | `{noteId, reply, resolved}` | Notas por segundo de la Sala de Revisión local |
| `render_final` | — | `npx remotion render KeyLabReel out/<clave>.mp4 --props=<json> --concurrency=<núcleos>` + verificación ffprobe (duración y pista de audio) |
| `copy_write` | `{markdown}` | Guarda `copy-linkedin.md` |
| `delivery_save` | — | Copia a `KeyLab Automatizaciones\AAAA-MM-DD-<tema>\` (video, voz, copy, JSON) |
| `repo_commit_push` | `{message}` | `git add src/data/<clave>.json public/media/<clave>/` (nunca renders ni 3D horneado) + push |

Recursos MCP de solo lectura: `brand://guia` (GUIA-MARCA.md), `docs://flujo-render`, `docs://personajes`, `catalog://memes`, `catalog://emojis`.

## 3. Pasos del trabajo "noticia" (máquina de estados)

`INIT → RESEARCH → CAPTURE → SCRIPT → VOICE → TIMING → SCENES → SOUND → BAKE → QA_STILLS → PREVIEW → (REVIEW) → FINAL → DELIVER → DONE`
Cualquier paso puede ir a `FAILED` con motivo y reintento manual desde ese paso.

1. **RESEARCH**: noticias de los últimos 3 días sobre tokenización RWA o IA aplicada a finanzas/blockchain (Cointelegraph `https://cointelegraph.com/tags/rwa-tokenization` + búsqueda). Elige LA mejor para vender algo que Key Lab puede construir. No repetir noticias ya usadas (`deliveries_list`). Investiga más allá de la nota: qué hace la empresa en concreto, con qué producto, y qué resultados o cifras tiene, con fuente.
2. **CAPTURE**: captura de la nota (titular + fecha + imagen) y de la web oficial de la empresa/producto, idealmente donde anuncia lo de la noticia → `nota.png`, `web-empresa.png`. Nunca logos de terceros sueltos como si fueran socios.
3. **SCRIPT** (guion de voz, 75-90 palabras, ≤36 s, español neutro con tú):
   hook **"Noticia del día:" + titular en español simple** → roast cómico → **la noticia explicada con contexto** (qué hace, producto, cifras, fuente; nunca solo la premisa) → **"Ey."** → "si se puede con eso, se puede con lo tuyo" → "En Key Lab construimos…" → "Agenda una reunión."
   Pronunciación en la voz: "inteligencia artificial" (nunca IA), "erre doble be a" (nunca RWA), números en letras, sin abreviaturas. En pantalla sí: IA, RWA, 41%.
   Tono: agresivo, cómico, referencias del día a día, paisas o argentinas.
4. **VOICE**: ElevenLabs, voz Martin Osborne 5 (`D7dkYvH17OKLgp4SLulf`), modelo `eleven_multilingual_v2`, 1 generación. No usar transcripción de ElevenLabs (cara). Medir silencios, recortar pausas > 0,6 s, `atempo ≤ 1.04` si hace falta. Video final ≤ 38 s.
5. **TIMING**: con las frases medidas, Claude asigna duración de cada escena y escribe subtítulos (segundos absolutos).
6. **SCENES**: copiar `src/data/plantilla-noticia.json`, poner `"bakeKey": "<clave>"`, llenar:
   - `hook` (kicker "Noticia del día", title = titular, highlight = palabra clave)
   - `roast` (líneas + sello)
   - `news` (source, date, headline, articleShot, siteUrl, siteShot, chip)
   - 1–2 `stat` con las cifras (value, prefix/suffix, label, fuente en note)
   - `ey` → `pivot` (palabras + íconos react-icons) → `solution` (3 ítems) → `close`
   - `gags`: 1 a 3 memes del zorro (ver reglas) y `subtitles`.
7. **SOUND**: `sonorizar.py` arma música (120 BPM, silencio real en el Ey, drop en el pivote), ducking bajo la voz, efectos sincronizados y master −14 LUFS. Si avisa memes muy juntos, Claude los mueve.
8. **BAKE**: 3D horneado una sola vez como PNG con transparencia; solo se rehace si cambió la escena o `src/three/`.
9. **QA_STILLS**: stills de cada escena en una hoja de contacto; Claude revisa con la checklist (sección 7) y corrige el JSON hasta que pase.
10. **PREVIEW**: previa 540×960 a la Sala de Revisión.
11. **REVIEW**: si hay humano, espera notas; Claude las lee, corrige y sube previa N+1. Sin humano: continúa.
12. **FINAL**: render 1080×1920 + ffprobe.
13. **DELIVER**: copy LinkedIn corto (hook primera línea, noticia simple con fuente y link, giro, cómo lo hace Key Lab, CTA "Agenda una reunión" + keylab.tech/es/agendar, 3–5 hashtags, atribución de emojis si se usaron) + carpeta de entrega + commit/push + notificación de Windows con el video.

### Trabajo "historia" (videos de concepto como "La bóveda")
Estructura: **Hook** (meme/3D llamativo) → **mini historia** con personaje → **Ey.** (corta un momento de rabia o clímax) → **nuestra solución** explicada (animación de plataforma) → **cierre** con remate. Mismas puertas, mismas reglas de marca.

## 4. Reglas de marca (obligatorias)

- Colores: hueso `#F1EFEA` (fondo), tinta `#141519`, **un solo acento** cobalto `#2D52FF`, gris `#8F8B83`, líneas `#DEDAD1`, noche `#0D0E11` (cierre), `#8CA0FF` (keylab.tech en el cierre).
- Tipografía: Anton para palabras gigantes, Figtree 600–900 para el resto. **Letras siempre en color sólido, nunca degradados.**
- Layout 9:16: columna centrada, logo arriba a la izquierda, etiqueta de sección arriba a la derecha, barra de progreso y subtítulos abajo; nada en la zona de UI inferior de Reels/TikTok.
- Íconos: react-icons (Phosphor), nunca dibujados a mano.
- Logos de Key Lab: solo los oficiales de `public/brand/`; si falta uno, se deja el espacio vacío, nunca se dibuja uno de reemplazo.
- Datos inventados se marcan "Ejemplo ilustrativo".
- **"Ey." fijo**: pantalla cobalto, "Ey." en Anton blanco, zorro de la ceja levantada **recortado sin fondo, abajo**, con vine boom. Siempre igual.
- **Cierre fijo**: fondo noche, isotipo 3D flotando con barrido de luz, wordmark, "Agenda una reunión", keylab.tech, zorro **muejeje abajo, sin tapar nada**, con la risa. Siempre igual.

## 5. Memes, humor y sonido

- 1 a 3 memes del zorro (Fokey) por video, de `public/memes/zorro/catalogo.json`, elegidos según lo que dice la voz, **variando entre videos** (no repetir los del video anterior). Nunca zorro-ceja ni zorro-muejeje como meme suelto.
- Separados al menos 4 s entre sí y del Ey.; que **no tapen textos, capturas ni subtítulos**.
- `cutout` con el `.png` sin fondo, `sticker` con el `-fondo.jpg`; caption en letra de meme; cada uno con su sonido viral (`scratch`, `boing`, `bruh`, `trombon`, `grillos`, `boom`).
- Emojis en captions y memes se vuelven animados solos (Lottie, Noto Emoji Animation, CC BY 4.0 → atribución en el copy).
- **Edición rítmica**: cortes y entradas al ritmo de la música (120 BPM); flash/zoom-punch en los cortes.

## 6. Personajes, 3D y explicaciones

- Personajes humanos: estilo **anime vectorizado** (plano, sin contornos, ojos grandes, cachetes, sombras planas, paleta apagada), generados sobre verde y recortados con chroma key. **Siempre articulados**: boca con sincronía labial (`lipsync.py`), ojos que parpadean, cabeza, brazos y piernas (rig por capas, `scripts/rig_don.py` como base). Nunca ligar un villano a una nacionalidad real.
- 3D (React Three Fiber): lienzo a cuadro completo 1080×1920 con la cámara encuadrando el objeto en su zona; modelos de la comunidad (Kenney CC0) con texturas, HDRI y sombras; **nada oscuro ni de baja calidad**. La sanguijuela va en 3D.
- Explicaciones y demos de plataforma: animation-studio (canvas dibujado en código) o Motion, renderizadas como clip e insertadas como escena.
- Globos de diálogo: siempre con Comical-JS (forma calculada a tamaño fijo, la animación va por fuera), nunca dibujados a mano.

## 7. Checklist de QA (Claude la aplica sobre la hoja de stills)

1. Todo centrado en la columna; nada se sale del cuadro ni se recorta.
2. Ningún meme, globo o personaje tapa textos, capturas o subtítulos.
3. Capturas legibles; titular y fecha visibles.
4. Letras en color sólido, sin degradados; un solo acento.
5. Ey. y cierre idénticos a la versión fija.
6. Memes separados ≥ 4 s y del Ey.
7. Subtítulos sincronizados con la voz.
8. Duración ≤ 38 s y pista de audio presente.

## 8. Lecciones técnicas que la app debe respetar

- Todo depende del número de cuadro (deterministas): nada de animaciones CSS por tiempo ni `Math.random()` sin semilla.
- Al pasar un JSON con `--props`, aplicar los valores por defecto del esquema (`videoSchema.parse`) antes de renderizar.
- **No re-renderizar el 3D** si el cambio es 2D/UI: hornear una vez (`hornear3d.mjs`), usar `--reusar` cuando cambie infraestructura que no altera la imagen.
- Renders largos en segundo plano con progreso real en la UI; nunca estimar "90 minutos" a partir de los primeros cuadros 3D.
- `delayRender` siempre con su `continueRender`, incluido cuando el componente usa contenido horneado.
- No borrar el horneado viejo hasta que el nuevo termine bien.
- Concurrencia de render = núcleos físicos − 1 (en un PC con GPU, el 3D es mucho más rápido que en la nube).

## 9. Interfaz (UI)

- **Inicio**: botón "Noticia del día ahora", próximas corridas programadas, últimas entregas con miniatura.
- **Brief**: catálogo marcable (ganchos, memes, sonidos con preescucha, escenas, explicaciones, modelos 3D, efectos, voces, cierre) + idea o guion libre; presets guardados.
- **Trabajo en curso**: línea de pasos con estado, log legible, hoja de stills, botón para reintentar desde un paso.
- **Sala de Revisión**: reproductor vertical, notas en el segundo exacto con marcador en la línea de tiempo, estados pendiente/resuelta y respuesta de Claude; versiones previa 1, 2, …
- **Biblioteca**: memes (con/sin fondo), emojis animados, sonidos, personajes y rigs, modelos 3D.
- **Ajustes**: claves (credenciales de Windows), carpeta de entregas, horario, puertas humanas sí/no, modelo de Claude.
- Estilo de la app: oscuro moderno con el cobalto de la marca, tipografías Anton/Figtree.

## 10. Entregables del desarrollo

1. Monorepo `keylab-studio-desktop/` con `apps/desktop` (Electron o Tauri + React), `packages/mcp-server` (servidor MCP keylab-studio) y `packages/orchestrator`.
2. Instalador `.exe` (electron-builder NSIS o Tauri bundler) que instala app, Node runtime, Python embebido y descarga Chrome Headless Shell en el primer arranque.
3. Pruebas: unitarias del servidor MCP (validación de entradas, rutas), prueba de punta a punta con una noticia fija que produzca un video de 10 s.
4. README con instalación, configuración de claves y cómo agregar memes, personajes y escenas.

Empieza por el servidor MCP y una corrida de punta a punta desde la línea de comandos; luego la UI.
